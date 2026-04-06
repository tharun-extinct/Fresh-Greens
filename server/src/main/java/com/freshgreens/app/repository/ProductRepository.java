package com.freshgreens.app.repository;

import com.freshgreens.app.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByStatusOrderByCreatedAtDesc(Product.Status status, Pageable pageable);

    Page<Product> findByCategoryIdAndStatus(Long categoryId, Product.Status status, Pageable pageable);

    Page<Product> findBySellerIdAndStatus(Long sellerId, Product.Status status, Pageable pageable);

    List<Product> findBySellerId(Long sellerId);

    @Query("SELECT p FROM Product p WHERE p.status = :status AND " +
           "(LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Product> searchByQuery(@Param("query") String query,
                                @Param("status") Product.Status status,
                                Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.status = :status AND " +
           "(LOWER(p.city) LIKE LOWER(CONCAT('%', :city, '%')) OR p.pincode = :pincode)")
    Page<Product> findByLocation(@Param("city") String city,
                                 @Param("pincode") String pincode,
                                 @Param("status") Product.Status status,
                                 Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.status = :status AND " +
           "(LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(LOWER(p.city) LIKE LOWER(CONCAT('%', :city, '%')) OR p.pincode = :pincode)")
    Page<Product> searchByQueryAndLocation(@Param("query") String query,
                                           @Param("city") String city,
                                           @Param("pincode") String pincode,
                                           @Param("status") Product.Status status,
                                           Pageable pageable);

    // ---- Admin queries ----

    long countByStatus(Product.Status status);
}
