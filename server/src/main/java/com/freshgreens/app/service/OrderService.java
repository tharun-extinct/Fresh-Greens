package com.freshgreens.app.service;

import com.freshgreens.app.dto.OrderRequest;
import com.freshgreens.app.dto.OrderResponse;
import com.freshgreens.app.dto.PaymentVerifyRequest;
import com.freshgreens.app.model.*;
import com.freshgreens.app.repository.CartRepository;
import com.freshgreens.app.repository.OrderRepository;
import com.freshgreens.app.repository.ProductRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final RazorpayClient razorpayClient;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    public OrderService(OrderRepository orderRepository,
                        CartRepository cartRepository,
                        ProductRepository productRepository,
                        RazorpayClient razorpayClient) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
        this.razorpayClient = razorpayClient;
    }

    /**
     * Creates an order from the user's cart and initiates a Razorpay payment order.
     */
    @Transactional
    public OrderResponse createOrder(User buyer, OrderRequest request) throws RazorpayException {
        Cart cart = cartRepository.findByUserIdWithItems(buyer.getId())
                .orElseThrow(() -> new RuntimeException("Cart is empty"));

        if (cart.getItems().isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }

        // Calculate totals
        BigDecimal totalAmount = cart.getItems().stream()
                .map(CartItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal deliveryCharge = BigDecimal.ZERO; // Free delivery for now
        BigDecimal grandTotal = totalAmount.add(deliveryCharge);

        // Generate order number
        String orderNumber = "FG-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        // Create Razorpay order
        JSONObject rzpOrderRequest = new JSONObject();
        rzpOrderRequest.put("amount", grandTotal.multiply(BigDecimal.valueOf(100)).longValue()); // Razorpay expects paise
        rzpOrderRequest.put("currency", "INR");
        rzpOrderRequest.put("receipt", orderNumber);

        com.razorpay.Order rzpOrder = razorpayClient.orders.create(rzpOrderRequest);
        String razorpayOrderId = rzpOrder.get("id");

        // Build order entity
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .buyer(buyer)
                .totalAmount(totalAmount)
                .deliveryCharge(deliveryCharge)
                .grandTotal(grandTotal)
                .razorpayOrderId(razorpayOrderId)
                .paymentStatus(Order.PaymentStatus.PENDING)
                .status(Order.OrderStatus.CREATED)
                .deliveryAddress(request.getDeliveryAddress())
                .city(request.getCity())
                .pincode(request.getPincode())
                .build();

        // Convert cart items to order items
        for (CartItem cartItem : cart.getItems()) {
            OrderItem orderItem = OrderItem.builder()
                    .product(cartItem.getProduct())
                    .productTitle(cartItem.getProduct().getTitle())
                    .quantity(cartItem.getQuantity())
                    .unitPrice(cartItem.getUnitPrice())
                    .totalPrice(cartItem.getTotalPrice())
                    .sellerName(cartItem.getProduct().getSeller().getDisplayName())
                    .build();
            order.addItem(orderItem);
        }

        order = orderRepository.save(order);
        log.info("Order created: {} for user {} | Razorpay: {}",
                orderNumber, buyer.getDisplayName(), razorpayOrderId);

        return toResponse(order);
    }

    /**
     * Verify Razorpay payment signature and confirm the order.
     */
    @Transactional
    public OrderResponse verifyPayment(User buyer, PaymentVerifyRequest request) {
        Order order = orderRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getBuyer().getId().equals(buyer.getId())) {
            throw new RuntimeException("Not authorized");
        }

        // Verify Razorpay signature
        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", request.getRazorpayOrderId());
            attributes.put("razorpay_payment_id", request.getRazorpayPaymentId());
            attributes.put("razorpay_signature", request.getRazorpaySignature());

            boolean isValid = Utils.verifyPaymentSignature(attributes, razorpayKeySecret);
            if (!isValid) {
                order.setPaymentStatus(Order.PaymentStatus.FAILED);
                orderRepository.save(order);
                throw new RuntimeException("Payment signature verification failed");
            }
        } catch (RazorpayException e) {
            order.setPaymentStatus(Order.PaymentStatus.FAILED);
            orderRepository.save(order);
            throw new RuntimeException("Payment verification error: " + e.getMessage());
        }

        // Payment verified — update order
        order.setRazorpayPaymentId(request.getRazorpayPaymentId());
        order.setRazorpaySignature(request.getRazorpaySignature());
        order.setPaymentStatus(Order.PaymentStatus.PAID);
        order.setStatus(Order.OrderStatus.CONFIRMED);

        // Reduce stock for each product
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            int newStock = product.getStockQuantity() - item.getQuantity();
            product.setStockQuantity(Math.max(0, newStock));
            if (newStock <= 0) {
                product.setStatus(Product.Status.SOLD_OUT);
            }
            productRepository.save(product);
        }

        order = orderRepository.save(order);

        // Clear user's cart after successful payment
        cartRepository.findByUserIdWithItems(buyer.getId()).ifPresent(cart -> {
            cart.clearItems();
            cartRepository.save(cart);
        });

        log.info("Payment verified for order: {} | Payment ID: {}",
                order.getOrderNumber(), request.getRazorpayPaymentId());

        return toResponse(order);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getUserOrders(Long buyerId, int page, int size) {
        return orderRepository
                .findByBuyerIdOrderByCreatedAtDesc(buyerId, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderDetail(Long orderId, Long buyerId) {
        Order order = orderRepository.findByIdAndBuyerIdWithItems(orderId, buyerId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        return toResponse(order);
    }

    private OrderResponse toResponse(Order order) {
        var items = order.getItems().stream().map(item -> OrderResponse.OrderItemResponse.builder()
                .productId(item.getProduct().getId())
                .productTitle(item.getProductTitle())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .totalPrice(item.getTotalPrice())
                .sellerName(item.getSellerName())
                .build()
        ).collect(Collectors.toList());

        return OrderResponse.builder()
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .totalAmount(order.getTotalAmount())
                .deliveryCharge(order.getDeliveryCharge())
                .grandTotal(order.getGrandTotal())
                .paymentStatus(order.getPaymentStatus().name())
                .orderStatus(order.getStatus().name())
                .razorpayOrderId(order.getRazorpayOrderId())
                .deliveryAddress(order.getDeliveryAddress())
                .city(order.getCity())
                .pincode(order.getPincode())
                .createdAt(order.getCreatedAt() != null ? order.getCreatedAt().toString() : null)
                .items(items)
                .build();
    }
}
