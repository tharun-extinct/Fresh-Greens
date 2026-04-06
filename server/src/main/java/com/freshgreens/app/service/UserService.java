package com.freshgreens.app.service;

import com.freshgreens.app.dto.UserUpdateRequest;
import com.freshgreens.app.model.User;
import com.freshgreens.app.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional(readOnly = true)
    public User getUserByFirebaseUid(String uid) {
        return userRepository.findByFirebaseUid(uid)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public User updateUser(Long userId, UserUpdateRequest request) {
        User user = getUserById(userId);

        if (request.getDisplayName() != null) {
            user.setDisplayName(request.getDisplayName());
        }
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        if (request.getPhone() != null) {
            String newPhone = request.getPhone().trim();
            if (!newPhone.equals(user.getPhone())) {
                user.setPhone(newPhone);
                user.setPhoneVerified(false);
            }
        }
        if (request.getCity() != null) {
            user.setCity(request.getCity());
        }
        if (request.getPincode() != null) {
            user.setPincode(request.getPincode());
        }

        user = userRepository.save(user);
        log.debug("User updated: {}", user.getDisplayName());
        return user;
    }

    @Transactional
    public User verifyEmail(Long userId) {
        User user = getUserById(userId);
        user.setEmailVerified(true);
        return userRepository.save(user);
    }

    @Transactional
    public User verifyPhone(Long userId, String phone) {
        User user = getUserById(userId);
        user.setPhone(phone);
        user.setPhoneVerified(true);
        return userRepository.save(user);
    }

    @Transactional
    public User savePhoneForVerification(Long userId, String phone) {
        User user = getUserById(userId);
        user.setPhone(phone);
        user.setPhoneVerified(false);
        return userRepository.save(user);
    }
}
