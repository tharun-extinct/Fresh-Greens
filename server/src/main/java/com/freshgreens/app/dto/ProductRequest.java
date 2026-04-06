package com.freshgreens.app.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ProductRequest {

    @NotBlank(message = "Product title is required")
    @Size(max = 150, message = "Title must be under 150 characters")
    private String title;

    @Size(max = 2000, message = "Description must be under 2000 characters")
    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal price;

    @NotBlank(message = "Unit is required")
    private String unit;

    @NotNull(message = "Stock quantity is required")
    @Min(value = 0, message = "Stock cannot be negative")
    private Integer stockQuantity;

    private Long categoryId;

    @Size(max = 200, message = "City must be under 200 characters")
    private String city;

    @Size(max = 10, message = "Pincode must be under 10 characters")
    private String pincode;
}
