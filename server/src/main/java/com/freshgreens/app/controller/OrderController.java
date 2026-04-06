package com.freshgreens.app.controller;

import com.freshgreens.app.dto.*;
import com.freshgreens.app.model.User;
import com.freshgreens.app.service.OrderService;
import com.razorpay.RazorpayException;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private static final Logger log = LoggerFactory.getLogger(OrderController.class);

    private final OrderService orderService;

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * POST /api/orders — Create order from cart + Razorpay order
     */
    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @Valid @RequestBody OrderRequest request,
            @AuthenticationPrincipal User user) {

        // Phone must be verified before initiating payment
        if (!user.isPhoneVerified()) {
            return ResponseEntity.status(403).body(
                    ApiResponse.error("Please verify your phone number in Settings before placing an order."));
        }

        try {
            OrderResponse order = orderService.createOrder(user, request);
            return ResponseEntity.ok(ApiResponse.success("Order created", order));
        } catch (RazorpayException e) {
            log.error("Razorpay order creation failed: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Payment initiation failed: " + e.getMessage()));
        }
    }

    /**
     * POST /api/orders/verify-payment — Verify Razorpay payment after checkout
     */
    @PostMapping("/verify-payment")
    public ResponseEntity<ApiResponse<OrderResponse>> verifyPayment(
            @RequestBody PaymentVerifyRequest request,
            @AuthenticationPrincipal User user) {
        try {
            OrderResponse order = orderService.verifyPayment(user, request);
            return ResponseEntity.ok(ApiResponse.success("Payment verified", order));
        } catch (RuntimeException e) {
            log.error("Payment verification failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * GET /api/orders — User's order history
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getMyOrders(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.getUserOrders(user.getId(), page, size)));
    }

    /**
     * GET /api/orders/{id} — Order detail
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.getOrderDetail(id, user.getId())));
    }

    /**
     * GET /api/orders/razorpay-key — Returns the Razorpay key ID for frontend
     */
    @GetMapping("/razorpay-key")
    public ResponseEntity<ApiResponse<String>> getRazorpayKey() {
        return ResponseEntity.ok(ApiResponse.success(razorpayKeyId));
    }
}
