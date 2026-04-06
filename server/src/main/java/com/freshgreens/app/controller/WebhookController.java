package com.freshgreens.app.controller;

import com.freshgreens.app.dto.ApiResponse;
import com.freshgreens.app.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Razorpay Webhook endpoint — receives payment events from Razorpay servers.
 * Verifies HMAC-SHA256 signature for security.
 */
@RestController
@RequestMapping("/api/webhook")
public class WebhookController {

    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);

    @Value("${razorpay.webhook.secret}")
    private String webhookSecret;

    private final OrderRepository orderRepository;

    public WebhookController(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @PostMapping("/razorpay")
    public ResponseEntity<ApiResponse<String>> handleRazorpayWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {

        // Webhook secret is optional — skip processing if not configured
        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.debug("Webhook secret not configured — acknowledging without processing");
            return ResponseEntity.ok(ApiResponse.success("Webhook acknowledged", null));
        }

        if (signature == null || signature.isBlank()) {
            log.warn("Webhook received without signature");
            return ResponseEntity.badRequest().body(ApiResponse.error("Missing signature"));
        }

        // Verify HMAC-SHA256 signature
        if (!verifySignature(payload, signature)) {
            log.warn("Webhook signature verification failed");
            return ResponseEntity.status(401).body(ApiResponse.error("Invalid signature"));
        }

        log.info("Razorpay webhook received: {}", payload.substring(0, Math.min(200, payload.length())));

        // Process webhook event (payment.captured, payment.failed, etc.)
        // For now, just acknowledge — the main payment flow is handled by verify-payment endpoint
        return ResponseEntity.ok(ApiResponse.success("Webhook processed", null));
    }

    private boolean verifySignature(String payload, String expectedSignature) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                    webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }

            return MessageDigest.isEqual(
                    hexString.toString().getBytes(StandardCharsets.UTF_8),
                    expectedSignature.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            log.error("Signature verification error: {}", e.getMessage());
            return false;
        }
    }
}
