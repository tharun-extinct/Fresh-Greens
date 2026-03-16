package com.freshgreens.app.service;

import com.freshgreens.app.dto.AuthResponse;
import com.freshgreens.app.model.User;
import com.freshgreens.app.repository.UserRepository;
import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Verify Firebase ID token, create or update user in MySQL,
     * and return auth response with user details.
     */
    @Transactional
    public AuthResponse verifyAndLogin(String idToken) throws FirebaseAuthException {
        if (idToken == null || idToken.isBlank()) {
            throw new IllegalArgumentException("ID token is required");
        }

        if (FirebaseApp.getApps().isEmpty()) {
            throw new IllegalStateException("Firebase Admin SDK is not initialized");
        }

        FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);

        String uid = decodedToken.getUid();
        String email = decodedToken.getEmail();
        String name = decodedToken.getName();
        String picture = decodedToken.getPicture();
        String provider = extractProvider(decodedToken);

        boolean isNewUser = false;
        User user = userRepository.findByFirebaseUid(uid).orElse(null);

        if (user == null) {
            // First-time login — create user
            user = User.builder()
                    .firebaseUid(uid)
                    .displayName(name)
                    .email(email)
                    .photoUrl(picture)
                    .provider(provider)
                    .emailVerified(decodedToken.isEmailVerified())
                    .role(User.Role.BUYER)
                    .active(true)
                    .build();
            user = userRepository.save(user);
            isNewUser = true;
            log.info("New user registered: {} ({})", name, email);
        } else {
            // Returning user — update profile from provider
            user.setDisplayName(name);
            user.setEmail(email);
            user.setPhotoUrl(picture);
            user.setEmailVerified(decodedToken.isEmailVerified());
            user = userRepository.save(user);
            log.debug("User logged in: {} ({})", name, email);
        }

        return AuthResponse.builder()
                .userId(user.getId())
                .displayName(user.getDisplayName())
                .email(user.getEmail())
                .photoUrl(user.getPhotoUrl())
                .role(user.getRole().name())
                .newUser(isNewUser)
                .build();
    }

    private String extractProvider(FirebaseToken token) {
        if (token.getClaims().containsKey("firebase")) {
            Object firebase = token.getClaims().get("firebase");
            if (firebase instanceof java.util.Map) {
                @SuppressWarnings("unchecked")
                java.util.Map<String, Object> firebaseMap = (java.util.Map<String, Object>) firebase;
                Object signInProvider = firebaseMap.get("sign_in_provider");
                if (signInProvider != null) {
                    return signInProvider.toString().replace(".com", "");
                }
            }
        }
        return "unknown";
    }
}
