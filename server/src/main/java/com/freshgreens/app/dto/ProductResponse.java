package com.freshgreens.app.dto;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ProductResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private String title;
    private String description;
    private BigDecimal price;
    private String unit;
    private Integer stockQuantity;
    private String imageUrl;
    private String city;
    private String pincode;
    private String categoryName;
    private Long categoryId;
    private String sellerName;
    private Long sellerId;
    private String status;
    private String createdAt;
}
