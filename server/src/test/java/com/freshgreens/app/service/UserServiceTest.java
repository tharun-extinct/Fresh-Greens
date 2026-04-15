package test.java.com.freshgreens.app.service;

import com.freshgreens.app.dto.UserUpdateRequest;
import com.freshgreens.app.model.User;
import com.freshgreens.app.service.UserService;
import com.freshgreens.app.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void testGetUserById_Success() {
        User mockUser = new User();
        mockUser.setId(1L);
        mockUser.setDisplayName("Alice");

        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));

        User result = userService.getUserById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Alice", result.getDisplayName());
        verify(userRepository, times(1)).findById(1L);
    }

    @Test
    void testUpdateUser_Success() {
        User mockUser = new User();
        mockUser.setId(1L);
        mockUser.setDisplayName("Old Name");
        mockUser.setPhone("1234567890");
        mockUser.setPhoneVerified(true);

        UserUpdateRequest request = new UserUpdateRequest();
        request.setDisplayName("New Name");
        request.setPhone("0987654321"); // New phone should trigger verification reset

        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(userRepository.save(any(User.class))).thenReturn(mockUser);

        User updatedUser = userService.updateUser(1L, request);

        assertEquals("New Name", updatedUser.getDisplayName());
        assertEquals("0987654321", updatedUser.getPhone());
        assertFalse(updatedUser.isPhoneVerified()); // Should be false because phone changed
        verify(userRepository, times(1)).save(mockUser);
    }

    @Test
    void testVerifyEmail() {
        User mockUser = new User();
        mockUser.setId(1L);
        mockUser.setEmailVerified(false);

        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(userRepository.save(any(User.class))).thenReturn(mockUser);

        User verifiedUser = userService.verifyEmail(1L);

        assertTrue(verifiedUser.isEmailVerified());
        verify(userRepository, times(1)).save(mockUser);
    }
}
