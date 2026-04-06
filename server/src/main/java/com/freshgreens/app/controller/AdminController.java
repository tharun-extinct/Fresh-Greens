package com.freshgreens.app.controller;

import com.freshgreens.app.dto.*;
import com.freshgreens.app.service.AdminService;
//import org.slf4j.Logger;
//import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Admin REST API — all endpoints require ROLE_ADMIN.
 * Route: /api/admin/**
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    //private static final Logger log = LoggerFactory.getLogger(AdminController.class);

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    // ── Stats ──────────────────────────────────────────────────────────────────

    /** GET /api/admin/stats — Dashboard metrics */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getStats()));
    }

    // ── Users ──────────────────────────────────────────────────────────────────

    /** GET /api/admin/users — Paginated user list */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<AdminUserResponse>>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getUsers(page, size)));
    }

    /** PUT /api/admin/users/{id}/role — Change a user's role */
    @PutMapping("/users/{id}/role")
    public ResponseEntity<ApiResponse<String>> updateUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String role = body.get("role");
        if (role == null || role.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("'role' field is required"));
        }
        try {
            adminService.updateUserRole(id, role);
            return ResponseEntity.ok(ApiResponse.success("User role updated", null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid role: " + role));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /** PUT /api/admin/users/{id}/status — Activate or deactivate a user */
    @PutMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<String>> updateUserStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body) {
        Boolean active = body.get("active");
        if (active == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("'active' field is required"));
        }
        try {
            adminService.updateUserStatus(id, active);
            return ResponseEntity.ok(ApiResponse.success("User status updated", null));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── Products ───────────────────────────────────────────────────────────────

    /** GET /api/admin/products — Paginated product list (all statuses) */
    @GetMapping("/products")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getProducts(page, size)));
    }

    /** PUT /api/admin/products/{id}/status — Update product status */
    @PutMapping("/products/{id}/status")
    public ResponseEntity<ApiResponse<String>> updateProductStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("'status' field is required"));
        }
        try {
            adminService.updateProductStatus(id, status);
            return ResponseEntity.ok(ApiResponse.success("Product status updated", null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid status: " + status));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── Orders ─────────────────────────────────────────────────────────────────

    /** GET /api/admin/orders — Paginated order list (all users) */
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<Page<AdminOrderResponse>>> getOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getOrders(page, size)));
    }

    /** PUT /api/admin/orders/{id}/status — Update order fulfilment status */
    @PutMapping("/orders/{id}/status")
    public ResponseEntity<ApiResponse<String>> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("'status' field is required"));
        }
        try {
            adminService.updateOrderStatus(id, status);
            return ResponseEntity.ok(ApiResponse.success("Order status updated", null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid status: " + status));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
