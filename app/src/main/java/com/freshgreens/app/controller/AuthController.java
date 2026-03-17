package com.freshgreens.app.controller;

import com.freshgreens.app.dto.ApiResponse;
import com.freshgreens.app.dto.AuthRequest;
import com.freshgreens.app.dto.AuthResponse;
import com.freshgreens.app.model.User;
import com.freshgreens.app.repository.UserRepository;
import com.freshgreens.app.service.AuthService;
import com.google.firebase.auth.FirebaseAuthException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Session-based authentication using Firebase ID tokens")
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
    @PostMapping("/login")
        @Operation(summary = "Login with Firebase token", description = "Verifies Firebase ID token and creates authenticated server session (JSESSIONID).")
        @ApiResponses(value = {
                @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Login successful",
                content = @Content(schema = @Schema(implementation = com.freshgreens.app.dto.ApiResponse.class))),
                @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request payload"),
                @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Invalid Firebase token"),
                @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "503", description = "Authentication service unavailable")
        })
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
        } catch (IllegalArgumentException e) {
            log.warn("Auth request rejected: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (IllegalStateException e) {
            log.error("Auth service unavailable: {}", e.getMessage());
            return ResponseEntity.status(503)
                    .body(ApiResponse.error("Authentication service unavailable. Check Firebase configuration."));
        } catch (DataAccessException e) {
            log.error("Database error during login", e);
            return ResponseEntity.status(503)
                    .body(ApiResponse.error("Database unavailable. Try again shortly."));
        } catch (Exception e) {
            log.error("Unexpected error during login", e);
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Login failed due to server error"));
        }
    }

    /**
     * POST /api/auth/logout
     * Invalidates the server-side session and clears SecurityContext.
     */
    @PostMapping("/logout")
    @Operation(summary = "Logout current session", description = "Invalidates server-side HTTP session.")
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
    @Operation(summary = "Check active session", description = "Returns logged-in user details for active session cookie.")
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
