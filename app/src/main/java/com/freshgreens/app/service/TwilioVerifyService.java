package com.freshgreens.app.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
public class TwilioVerifyService {

    private static final Logger log = LoggerFactory.getLogger(TwilioVerifyService.class);

    private final String accountSid;
    private final String authToken;
    private final String verifyServiceSid;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public TwilioVerifyService(
            @Value("${twilio.account.sid:}") String accountSid,
            @Value("${twilio.auth.token:}") String authToken,
            @Value("${twilio.verify.service.sid:}") String verifyServiceSid) {
        this.accountSid = accountSid;
        this.authToken = authToken;
        this.verifyServiceSid = verifyServiceSid;
    }

    public void startSmsVerification(String phoneE164) {
        ensureConfigured();

        String url = "https://verify.twilio.com/v2/Services/" + verifyServiceSid + "/Verifications";
        String form = "To=" + encode(phoneE164) + "&Channel=sms";

        String body = executePost(url, form);
        if (!body.contains("\"status\": \"pending\"") && !body.contains("\"status\":\"pending\"")) {
            log.warn("Unexpected Twilio verification start response for {}: {}", phoneE164, body);
        }
    }

    public boolean checkSmsVerification(String phoneE164, String otpCode) {
        ensureConfigured();

        String url = "https://verify.twilio.com/v2/Services/" + verifyServiceSid + "/VerificationCheck";
        String form = "To=" + encode(phoneE164) + "&Code=" + encode(otpCode);

        String body = executePost(url, form);
        return body.contains("\"status\": \"approved\"") || body.contains("\"status\":\"approved\"");
    }

    private String executePost(String url, String form) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Basic " + basicAuth())
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(form))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();

            if (status < 200 || status >= 300) {
                log.error("Twilio Verify API call failed. status={}, body={}", status, response.body());
                throw new IllegalStateException("Phone verification service error. Please try again.");
            }

            return response.body();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Phone verification request interrupted.");
        } catch (IOException e) {
            throw new IllegalStateException("Unable to reach phone verification service.");
        }
    }

    private void ensureConfigured() {
        if (isBlank(accountSid) || isBlank(authToken) || isBlank(verifyServiceSid)) {
            throw new IllegalStateException("Twilio Verify is not configured on server.");
        }
    }

    private String basicAuth() {
        String raw = accountSid + ":" + authToken;
        return Base64.getEncoder().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
