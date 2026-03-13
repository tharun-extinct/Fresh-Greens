package com.freshgreens.app.service;

import com.freshgreens.app.dto.*;
import com.freshgreens.app.model.*;
import com.freshgreens.app.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Admin service — business logic for platform management.
 * All methods are guarded at the controller layer by ROLE_ADMIN.
 */
@Service
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    public AdminService(UserRepository userRepository,
                        ProductRepository productRepository,
                        OrderRepository orderRepository) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
    }

    // ── Stats ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        long totalUsers     = userRepository.count();
        long totalSellers   = userRepository.countByRole(User.Role.SELLER);
        long totalProducts  = productRepository.count();
        long activeProducts = productRepository.countByStatus(Product.Status.ACTIVE);
        long totalOrders    = orderRepository.count();
        long pendingOrders  = orderRepository.countByPaymentStatus(Order.PaymentStatus.PENDING);
        BigDecimal revenue  = orderRepository.sumGrandTotalByPaymentStatus(Order.PaymentStatus.PAID);

        return AdminStatsResponse.builder()
                .totalUsers(totalUsers)
                .totalSellers(totalSellers)
                .totalProducts(totalProducts)
                .activeProducts(activeProducts)
                .totalOrders(totalOrders)
                .pendingOrders(pendingOrders)
                .totalRevenue(revenue != null ? revenue : BigDecimal.ZERO)
                .build();
    }

    // ── Users ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<AdminUserResponse> getUsers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return userRepository.findAll(pageable).map(this::toAdminUserResponse);
    }

    @Transactional
    public void updateUserRole(Long userId, String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        user.setRole(User.Role.valueOf(role.toUpperCase()));
        userRepository.save(user);
        log.info("Admin updated user {} role to {}", userId, role);
    }

    @Transactional
    public void updateUserStatus(Long userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        user.setActive(active);
        userRepository.save(user);
        log.info("Admin {} user {}", active ? "activated" : "deactivated", userId);
    }

    // ── Products ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ProductResponse> getProducts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return productRepository.findAll(pageable).map(this::toProductResponse);
    }

    @Transactional
    public void updateProductStatus(Long productId, String status) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found: " + productId));
        product.setStatus(Product.Status.valueOf(status.toUpperCase()));
        productRepository.save(product);
        log.info("Admin updated product {} status to {}", productId, status);
    }

    // ── Orders ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<AdminOrderResponse> getOrders(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        // Within @Transactional, lazy loading of order.buyer is safe
        return orderRepository.findAll(pageable).map(this::toAdminOrderResponse);
    }

    @Transactional
    public void updateOrderStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        order.setStatus(Order.OrderStatus.valueOf(status.toUpperCase()));
        orderRepository.save(order);
        log.info("Admin updated order {} status to {}", orderId, status);
    }

    // ── Mappers ────────────────────────────────────────────────────────────────

    private AdminUserResponse toAdminUserResponse(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .displayName(user.getDisplayName() != null ? user.getDisplayName() : "")
                .email(user.getEmail() != null ? user.getEmail() : "")
                .phone(user.getPhone() != null ? user.getPhone() : "")
                .role(user.getRole().name())
                .active(user.isActive())
                .phoneVerified(user.isPhoneVerified())
                .emailVerified(user.isEmailVerified())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toLocalDate().toString() : "")
                .build();
    }

    private ProductResponse toProductResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .title(product.getTitle())
                .description(product.getDescription())
                .price(product.getPrice())
                .unit(product.getUnit())
                .stockQuantity(product.getStockQuantity())
                .imageUrl(product.getImageUrl())
                .city(product.getCity())
                .pincode(product.getPincode())
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : "")
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .sellerName(product.getSeller() != null ? product.getSeller().getDisplayName() : "")
                .sellerId(product.getSeller() != null ? product.getSeller().getId() : null)
                .status(product.getStatus().name())
                .createdAt(product.getCreatedAt() != null ? product.getCreatedAt().toLocalDate().toString() : "")
                .build();
    }

    private AdminOrderResponse toAdminOrderResponse(Order order) {
        User buyer = order.getBuyer(); // safe — called within @Transactional
        return AdminOrderResponse.builder()
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .buyerName(buyer != null && buyer.getDisplayName() != null ? buyer.getDisplayName() : "")
                .buyerEmail(buyer != null && buyer.getEmail() != null ? buyer.getEmail() : "")
                .grandTotal(order.getGrandTotal())
                .paymentStatus(order.getPaymentStatus().name())
                .orderStatus(order.getStatus().name())
                .deliveryAddress(order.getDeliveryAddress())
                .city(order.getCity())
                .createdAt(order.getCreatedAt() != null ? order.getCreatedAt().toLocalDate().toString() : "")
                .build();
    }
}
