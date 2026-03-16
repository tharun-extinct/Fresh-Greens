package com.freshgreens.app.controller;

import com.freshgreens.app.dto.ApiResponse;
import com.freshgreens.app.dto.AuthRequest;
import com.freshgreens.app.dto.AuthResponse;
import com.freshgreens.app.model.User;
import com.freshgreens.app.repository.UserRepository;
import com.freshgreens.app.service.AuthService;
import com.google.firebase.auth.FirebaseAuthException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;
//import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;
    private final UserRepository userRepository;
    private final SecurityContextRepository securityContextRepository =
            new HttpSessionSecurityContextRepository();

    public AuthController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    /**
     * POST /api/auth/login
     * Receives Firebase ID token, verifies it, creates/upserts user,
     * and establishes a Spring Security session so @AuthenticationPrincipal works.
     */
    //@Tag(name="get", description="GET methods of Employee API")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody AuthRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        try {
            AuthResponse authResponse = authService.verifyAndLogin(request.getIdToken());

            // Load the full User entity so @AuthenticationPrincipal resolves to User
            User user = userRepository.findById(authResponse.getUserId()).orElseThrow();

            // Create Spring Security Authentication with User as principal
            List<SimpleGrantedAuthority> authorities = List.of(
                    new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
            );
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(user, null, authorities);

            // Persist SecurityContext to HTTP session — this is what makes
            // @AuthenticationPrincipal work on subsequent requests via JSESSIONID
            SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
            securityContext.setAuthentication(authentication);
            SecurityContextHolder.setContext(securityContext);
            securityContextRepository.saveContext(securityContext, httpRequest, httpResponse);

            log.info("Login successful for: {} ({})", user.getDisplayName(), user.getEmail());
            return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
        } catch (FirebaseAuthException e) {
            log.error("Firebase auth failed: {}", e.getMessage());
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("Invalid Firebase token: " + e.getMessage()));
        }
    }

    /**
     * POST /api/auth/logout
     * Invalidates the server-side session and clears SecurityContext.
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request,
                                                     HttpServletResponse response) {
        SecurityContextHolder.clearContext();
        request.getSession(false); // don't create if absent
        if (request.getSession(false) != null) {
            request.getSession().invalidate();
        }
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }

    /**
     * GET /api/auth/session
     * Check if user has an active authenticated session.
     */
    
    @GetMapping("/session")
    public ResponseEntity<ApiResponse<AuthResponse>> checkSession() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()
                || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(401).body(ApiResponse.error("No active session"));
        }

        // Principal is the full User entity (set during login or by FirebaseTokenFilter)
        if (auth.getPrincipal() instanceof User user) {
            AuthResponse resp = AuthResponse.builder()
                    .userId(user.getId())
                    .displayName(user.getDisplayName())
                    .email(user.getEmail())
                    .photoUrl(user.getPhotoUrl())
                    .role(user.getRole().name())
                    .build();
            return ResponseEntity.ok(ApiResponse.success(resp));
        }

        return ResponseEntity.status(401).body(ApiResponse.error("No active session"));
    }
}
