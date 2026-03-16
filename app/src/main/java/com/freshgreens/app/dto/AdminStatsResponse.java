package com.freshgreens.app.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AdminStatsResponse {

    private long totalUsers;
    private long totalSellers;
    private long totalProducts;
    private long activeProducts;
    private long totalOrders;
    private long pendingOrders;
    private BigDecimal totalRevenue;
}
