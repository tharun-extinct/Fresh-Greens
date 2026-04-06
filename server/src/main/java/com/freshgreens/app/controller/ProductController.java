package com.freshgreens.app.controller;

import com.freshgreens.app.dto.ApiResponse;
import com.freshgreens.app.dto.PageResponse;
import com.freshgreens.app.dto.ProductRequest;
import com.freshgreens.app.dto.ProductResponse;
import com.freshgreens.app.model.User;
import com.freshgreens.app.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    /**
     * GET /api/products — Public: List active products (paginated, cached)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(ApiResponse.success(productService.getActiveProducts(page, size)));
    }

    /**
     * GET /api/products/{id} — Public: Get product detail
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProduct(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(productService.getProductById(id)));
    }

    /**
     * GET /api/products/category/{categoryId} — Public: Products by category
     */
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getByCategory(
            @PathVariable Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                productService.getProductsByCategory(categoryId, page, size)));
    }

    /**
     * GET /api/products/search — Public: Search products with optional location filter
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> searchProducts(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String pincode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                productService.searchProducts(q, city, pincode, page, size)));
    }

    /**
     * POST /api/products — Auth required: Create new product listing
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @Valid @RequestBody ProductRequest request,
            @AuthenticationPrincipal User user) {
        ProductResponse product = productService.createProduct(request, user);
        return ResponseEntity.ok(ApiResponse.success("Product listed successfully", product));
    }

    /**
     * GET /api/products/my-listings — Auth required: Seller's own products
     */
    @GetMapping("/my-listings")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getMyListings(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(productService.getSellerProducts(user.getId())));
    }
}
