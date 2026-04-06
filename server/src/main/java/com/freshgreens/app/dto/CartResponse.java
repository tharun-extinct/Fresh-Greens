package com.freshgreens.app.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CartResponse {

    private Long cartId;
    private List<CartItemResponse> items;
    private BigDecimal totalAmount;
    private int totalItems;

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class CartItemResponse {
        private Long cartItemId;
        private Long productId;
        private String productTitle;
        private String imageUrl;
        private BigDecimal unitPrice;
        private String unit;
        private Integer quantity;
        private BigDecimal totalPrice;
        private String sellerName;
    }
}
