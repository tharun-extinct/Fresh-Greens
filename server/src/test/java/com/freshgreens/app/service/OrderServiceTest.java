package test.java.com.freshgreens.app.service;

import com.freshgreens.app.dto.OrderResponse;
import com.freshgreens.app.model.*;
import com.freshgreens.app.service.OrderService;
import com.freshgreens.app.repository.CartRepository;
import com.freshgreens.app.repository.OrderRepository;
import com.freshgreens.app.repository.ProductRepository;
import com.razorpay.RazorpayClient;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private RazorpayClient razorpayClient; // Mock external client

    @InjectMocks
    private OrderService orderService;

    @Test
    void testGetOrderDetail_Success() {
        User buyer = new User();
        buyer.setId(1L);

        User seller = new User();
        seller.setId(2L);
        seller.setDisplayName("Vegetable Vendor");

        Product mockProduct = new Product();
        mockProduct.setId(10L);
        mockProduct.setTitle("Tomato");
        mockProduct.setPrice(new BigDecimal("50.00"));
        mockProduct.setSeller(seller);

        OrderItem mockItem = new OrderItem();
        mockItem.setId(100L);
        mockItem.setProduct(mockProduct);
        mockItem.setProductTitle("Tomato");
        mockItem.setQuantity(2);
        mockItem.setUnitPrice(new BigDecimal("50.00"));
        mockItem.setTotalPrice(new BigDecimal("100.00"));
        mockItem.setSellerName("Vegetable Vendor");

        Order mockOrder = new Order();
        mockOrder.setId(1000L);
        mockOrder.setOrderNumber("FG-TEST-123");
        mockOrder.setBuyer(buyer);
        mockOrder.setTotalAmount(new BigDecimal("100.00"));
        mockOrder.setDeliveryCharge(BigDecimal.ZERO);
        mockOrder.setGrandTotal(new BigDecimal("100.00"));
        mockOrder.setPaymentStatus(Order.PaymentStatus.PAID);
        mockOrder.setStatus(Order.OrderStatus.CONFIRMED);
        mockOrder.setRazorpayOrderId("rzp_test_123");
        mockOrder.addItem(mockItem);

        when(orderRepository.findByIdAndBuyerIdWithItems(1000L, 1L))
                .thenReturn(Optional.of(mockOrder));

        OrderResponse response = orderService.getOrderDetail(1000L, 1L);

        assertNotNull(response);
        assertEquals("FG-TEST-123", response.getOrderNumber());
        assertEquals(Order.PaymentStatus.PAID.name(), response.getPaymentStatus());
        assertEquals(Order.OrderStatus.CONFIRMED.name(), response.getOrderStatus());
        assertEquals(1, response.getItems().size());
        assertEquals("Tomato", response.getItems().get(0).getProductTitle());
    }

    @Test
    void testGetUserOrders_Empty() {
        when(orderRepository.findByBuyerIdOrderByCreatedAtDesc(eq(1L), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        Page<OrderResponse> resultPage = orderService.getUserOrders(1L, 0, 10);

        assertNotNull(resultPage);
        assertTrue(resultPage.isEmpty());
        verify(orderRepository, times(1)).findByBuyerIdOrderByCreatedAtDesc(eq(1L), any(PageRequest.class));
    }
}
