package com.freshgreens.app.service;

import com.freshgreens.app.dto.CartItemRequest;
import com.freshgreens.app.dto.CartResponse;
import com.freshgreens.app.model.*;
import com.freshgreens.app.repository.CartItemRepository;
import com.freshgreens.app.repository.CartRepository;
import com.freshgreens.app.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.stream.Collectors;

@Service
public class CartService {

    private static final Logger log = LoggerFactory.getLogger(CartService.class);

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    public CartService(CartRepository cartRepository,
                       CartItemRepository cartItemRepository,
                       ProductRepository productRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public CartResponse getCart(User user) {
        Cart cart = cartRepository.findByUserIdWithItems(user.getId())
                .orElse(null);

        if (cart == null || cart.getItems().isEmpty()) {
            return CartResponse.builder()
                    .cartId(cart != null ? cart.getId() : null)
                    .items(java.util.Collections.emptyList())
                    .totalAmount(BigDecimal.ZERO)
                    .totalItems(0)
                    .build();
        }

        return toResponse(cart);
    }

    @Transactional
    public CartResponse addItem(User user, CartItemRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (product.getStatus() != Product.Status.ACTIVE) {
            throw new RuntimeException("Product is not available");
        }

        if (product.getStockQuantity() < request.getQuantity()) {
            throw new RuntimeException("Insufficient stock. Available: " + product.getStockQuantity());
        }

        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    Cart newCart = Cart.builder().user(user).build();
                    return cartRepository.save(newCart);
                });

        // Check if item already in cart
        CartItem existingItem = cartItemRepository
                .findByCartIdAndProductId(cart.getId(), product.getId())
                .orElse(null);

        if (existingItem != null) {
            existingItem.setQuantity(existingItem.getQuantity() + request.getQuantity());
            existingItem.setUnitPrice(product.getPrice());
            cartItemRepository.save(existingItem);
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .unitPrice(product.getPrice())
                    .build();
            cart.addItem(newItem);
            cartRepository.save(cart);
        }

        log.debug("Added {} x {} to cart for user {}", request.getQuantity(),
                product.getTitle(), user.getDisplayName());

        // Re-fetch with items loaded
        cart = cartRepository.findByUserIdWithItems(user.getId()).orElse(cart);
        return toResponse(cart);
    }

    @Transactional
    public CartResponse updateItemQuantity(User user, Long productId, int quantity) {
        Cart cart = cartRepository.findByUserIdWithItems(user.getId())
                .orElseThrow(() -> new RuntimeException("Cart not found"));

        CartItem item = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId)
                .orElseThrow(() -> new RuntimeException("Item not in cart"));

        if (quantity <= 0) {
            cart.removeItem(item);
            cartItemRepository.delete(item);
        } else {
            if (item.getProduct().getStockQuantity() < quantity) {
                throw new RuntimeException("Insufficient stock");
            }
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }

        cart = cartRepository.findByUserIdWithItems(user.getId()).orElse(cart);
        return toResponse(cart);
    }

    @Transactional
    public void removeItem(User user, Long productId) {
        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Cart not found"));
        cartItemRepository.deleteByCartIdAndProductId(cart.getId(), productId);
    }

    @Transactional
    public void clearCart(User user) {
        Cart cart = cartRepository.findByUserIdWithItems(user.getId()).orElse(null);
        if (cart != null) {
            cart.clearItems();
            cartRepository.save(cart);
        }
    }

    private CartResponse toResponse(Cart cart) {
        var items = cart.getItems().stream().map(item -> CartResponse.CartItemResponse.builder()
                .cartItemId(item.getId())
                .productId(item.getProduct().getId())
                .productTitle(item.getProduct().getTitle())
                .imageUrl(item.getProduct().getImageUrl())
                .unitPrice(item.getUnitPrice())
                .unit(item.getProduct().getUnit())
                .quantity(item.getQuantity())
                .totalPrice(item.getTotalPrice())
                .sellerName(item.getProduct().getSeller().getDisplayName())
                .build()
        ).collect(Collectors.toList());

        BigDecimal total = items.stream()
                .map(CartResponse.CartItemResponse::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartResponse.builder()
                .cartId(cart.getId())
                .items(items)
                .totalAmount(total)
                .totalItems(items.size())
                .build();
    }
}
