package com.freshgreens.app.repository;

import com.freshgreens.app.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Page<Order> findByBuyerIdOrderByCreatedAtDesc(Long buyerId, Pageable pageable);

    Optional<Order> findByOrderNumber(String orderNumber);

    Optional<Order> findByRazorpayOrderId(String razorpayOrderId);

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.items WHERE o.id = :orderId AND o.buyer.id = :buyerId")
    Optional<Order> findByIdAndBuyerIdWithItems(@Param("orderId") Long orderId, @Param("buyerId") Long buyerId);

    // ---- Admin queries ----

    long countByStatus(Order.OrderStatus status);

    long countByPaymentStatus(Order.PaymentStatus paymentStatus);

    @Query("SELECT SUM(o.grandTotal) FROM Order o WHERE o.paymentStatus = :status")
    BigDecimal sumGrandTotalByPaymentStatus(@Param("status") Order.PaymentStatus status);
}
