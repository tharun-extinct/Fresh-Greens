package com.freshgreens.app.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class OrderResponse {

    private Long orderId;
    private String orderNumber;
    private BigDecimal totalAmount;
    private BigDecimal deliveryCharge;
    private BigDecimal grandTotal;
    private String paymentStatus;
    private String orderStatus;
    private String razorpayOrderId;
    private String deliveryAddress;
    private String city;
    private String pincode;
    private String createdAt;
    private List<OrderItemResponse> items;

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class OrderItemResponse {
        private Long productId;
        private String productTitle;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
        private String sellerName;
    }
}
