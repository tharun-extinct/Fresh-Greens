package com.freshgreens.app.controller;

import com.freshgreens.app.dto.ApiResponse;
import com.freshgreens.app.dto.UserUpdateRequest;
import com.freshgreens.app.model.User;
import com.freshgreens.app.service.TwilioVerifyService;
import com.freshgreens.app.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final TwilioVerifyService twilioVerifyService;

    public UserController(UserService userService,
                          TwilioVerifyService twilioVerifyService) {
        this.userService = userService;
        this.twilioVerifyService = twilioVerifyService;
    }

    /**
     * GET /api/users/me — Get current authenticated user profile
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfile(
            @AuthenticationPrincipal User user) {
        Map<String, Object> profile = Map.of(
                "id", user.getId(),
                "displayName", user.getDisplayName() != null ? user.getDisplayName() : "",
                "email", user.getEmail() != null ? user.getEmail() : "",
                "phone", user.getPhone() != null ? user.getPhone() : "",
                "photoUrl", user.getPhotoUrl() != null ? user.getPhotoUrl() : "",
                "city", user.getCity() != null ? user.getCity() : "",
                "pincode", user.getPincode() != null ? user.getPincode() : "",
                "role", user.getRole().name(),
                "emailVerified", user.isEmailVerified(),
                "phoneVerified", user.isPhoneVerified()
        );
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    /**
     * PUT /api/users/me — Update user profile
     */
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<String>> updateProfile(
            @Valid @RequestBody UserUpdateRequest request,
            @AuthenticationPrincipal User user) {
        userService.updateUser(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated", null));
    }

    /**
     * POST /api/users/verify-email — Mark email as verified
     */
    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<String>> verifyEmail(
            @AuthenticationPrincipal User user) {
        userService.verifyEmail(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Email verified", null));
    }

    /**
     * POST /api/users/send-phone-otp — Send OTP to phone via Twilio Verify
     */
    @PostMapping("/send-phone-otp")
    public ResponseEntity<ApiResponse<String>> sendPhoneOtp(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {
        String phone;
        try {
            phone = normalizePhone(body.get("phone"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        }
        if (phone == null || phone.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Phone number is required"));
        }

        try {
            userService.savePhoneForVerification(user.getId(), phone);
            twilioVerifyService.startSmsVerification(phone);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(503).body(ApiResponse.error(ex.getMessage()));
        }

        return ResponseEntity.ok(ApiResponse.success("OTP sent to your phone", null));
    }

    /**
     * POST /api/users/verify-phone — Verify OTP sent to phone via Twilio Verify
     */
    @PostMapping("/verify-phone")
    public ResponseEntity<ApiResponse<String>> verifyPhone(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {
        String phone;
        try {
            phone = normalizePhone(body.get("phone"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        }
        String otpCode = body.get("otpCode");

        if (phone == null || phone.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Phone number is required"));
        }
        if (otpCode == null || otpCode.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("OTP code is required"));
        }

        try {
            boolean approved = twilioVerifyService.checkSmsVerification(phone, otpCode.trim());
            if (!approved) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Invalid or expired OTP"));
            }
            userService.verifyPhone(user.getId(), phone);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(503).body(ApiResponse.error(ex.getMessage()));
        }

        return ResponseEntity.ok(ApiResponse.success("Phone verified", null));
    }

    private String normalizePhone(String rawPhone) {
        if (rawPhone == null) {
            return null;
        }

        String candidate = rawPhone.trim();
        if (candidate.isBlank()) {
            return null;
        }

        // Convert leading international dial prefix "00" to '+'
        if (candidate.startsWith("00")) {
            candidate = "+" + candidate.substring(2);
        }

        // Keep a single leading '+' (if present) and strip all other non-digits
        boolean hasLeadingPlus = candidate.startsWith("+");
        String digitsOnly = candidate.replaceAll("\\D", "");
        if (digitsOnly.isBlank()) {
            return null;
        }

        String normalized;
        if (hasLeadingPlus) {
            normalized = "+" + digitsOnly;
        } else if (digitsOnly.length() == 10) {
            normalized = "+91" + digitsOnly;
        } else {
            normalized = "+" + digitsOnly;
        }

        if (!normalized.matches("^\\+[1-9]\\d{7,14}$")) {
            throw new IllegalArgumentException("Invalid phone format. Use a valid mobile number.");
        }

        return normalized;
    }
}
