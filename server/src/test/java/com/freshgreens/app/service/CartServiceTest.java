package com.freshgreens.app.service;

import com.freshgreens.app.dto.CartResponse;
import com.freshgreens.app.model.Cart;
import com.freshgreens.app.model.User;
import com.freshgreens.app.service.CartService;
import com.freshgreens.app.repository.CartItemRepository;
import com.freshgreens.app.repository.CartRepository;
import com.freshgreens.app.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class CartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private CartService cartService;

    @Test
    void testGetCartEmpty() {
        User user = new User();
        user.setId(1L);

        when(cartRepository.findByUserIdWithItems(1L)).thenReturn(Optional.empty());

        CartResponse response = cartService.getCart(user);
        assertNotNull(response);
        assertEquals(0, response.getTotalItems());
        assertEquals(BigDecimal.ZERO, response.getTotalAmount());
    }
}