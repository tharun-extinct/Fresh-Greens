package test.java.com.freshgreens.app.service;

import com.freshgreens.app.dto.ProductResponse;
import com.freshgreens.app.model.Product;
import com.freshgreens.app.service.ProductService;
import com.freshgreens.app.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductService productService;

    @Test
    void testGetProductById() {
        com.freshgreens.app.model.User mockUser = new com.freshgreens.app.model.User();
        mockUser.setId(1L);
        mockUser.setDisplayName("John Doe");

        Product mockProduct = new Product();
        mockProduct.setId(1L);
        mockProduct.setTitle("Test Product");
        mockProduct.setSeller(mockUser);
        
        when(productRepository.findById(1L)).thenReturn(Optional.of(mockProduct));

        ProductResponse result = productService.getProductById(1L);
        assertNotNull(result);
        assertEquals("Test Product", result.getTitle());
        assertEquals("John Doe", result.getSellerName());
    }
}