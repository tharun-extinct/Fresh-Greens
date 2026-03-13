package com.freshgreens.app.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AdminOrderResponse {

    private Long orderId;
    private String orderNumber;
    private String buyerName;
    private String buyerEmail;
    private BigDecimal grandTotal;
    private String paymentStatus;
    private String orderStatus;
    private String deliveryAddress;
    private String city;
    private String createdAt;
}
