package com.freshgreens.app.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CartResponse {

    private Long id;
    private List<CartItemResponse> items;
    private BigDecimal totalAmount;
    private int totalItems;

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class CartItemResponse {
        private Long id;
        private Long productId;
        private String productTitle;
        private String productImage;
        private BigDecimal price;
        private String unit;
        private Integer quantity;
        private BigDecimal subtotal;
        private Integer stockAvailable;
        private String sellerName;
    }
}
