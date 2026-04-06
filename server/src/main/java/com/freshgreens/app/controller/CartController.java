package com.freshgreens.app.controller;

import com.freshgreens.app.dto.ApiResponse;
import com.freshgreens.app.dto.CartItemRequest;
import com.freshgreens.app.dto.CartResponse;
import com.freshgreens.app.model.User;
import com.freshgreens.app.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    /**
     * GET /api/cart — Get current user's cart
     */
    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getCart(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(cartService.getCart(user)));
    }

    /**
     * POST /api/cart/items — Add item to cart
     */
    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartResponse>> addItem(
            @Valid @RequestBody CartItemRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success("Item added to cart",
                cartService.addItem(user, request)));
    }

    /**
     * PUT /api/cart/items/{productId} — Update item quantity
     */
    @PutMapping("/items/{productId}")
    public ResponseEntity<ApiResponse<CartResponse>> updateQuantity(
            @PathVariable Long productId,
            @RequestParam int quantity,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                cartService.updateItemQuantity(user, productId, quantity)));
    }

    /**
     * DELETE /api/cart/items/{productId} — Remove item from cart
     */
    @DeleteMapping("/items/{productId}")
    public ResponseEntity<ApiResponse<Void>> removeItem(
            @PathVariable Long productId,
            @AuthenticationPrincipal User user) {
        cartService.removeItem(user, productId);
        return ResponseEntity.ok(ApiResponse.success("Item removed", null));
    }

    /**
     * DELETE /api/cart — Clear entire cart
     */
    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clearCart(@AuthenticationPrincipal User user) {
        cartService.clearCart(user);
        return ResponseEntity.ok(ApiResponse.success("Cart cleared", null));
    }
}
