package com.freshgreens.app.service;

import com.twilio.Twilio;
import com.twilio.exception.ApiException;
import com.twilio.rest.verify.v2.service.Verification;
import com.twilio.rest.verify.v2.service.VerificationCheck;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TwilioVerifyService {
    private static final Logger log = LoggerFactory.getLogger(TwilioVerifyService.class);

    private final String accountSid;
    private final String authToken;
    private final String verifyServiceSid;

    public TwilioVerifyService(
            @Value("${twilio.account.sid:}") String accountSid,
            @Value("${twilio.auth.token:}") String authToken,
            @Value("${twilio.verify.service.sid:}") String verifyServiceSid) {
        this.accountSid = accountSid;
        this.authToken = authToken;
        this.verifyServiceSid = verifyServiceSid;
    }

    @PostConstruct
    public void init() {
        if (accountSid != null && !accountSid.isBlank() && authToken != null && !authToken.isBlank()) {
            Twilio.init(accountSid, authToken);
            log.info("Twilio SDK initialized");
        }
    }

    private void ensureConfigured() {
        if (accountSid == null || accountSid.isBlank() || authToken == null || authToken.isBlank() || verifyServiceSid == null || verifyServiceSid.isBlank()) {
            throw new IllegalStateException("Twilio Verify is not configured on server. Missing: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_VERIFY_SERVICE_SID");
        }
    }

    public void startSmsVerification(String phoneE164) {
        ensureConfigured();
        try {
            Verification verification = Verification.creator(verifyServiceSid, phoneE164, "sms").create();
            log.info("Twilio verify status: {}", verification.getStatus());
        } catch (ApiException e) {
            log.error("Twilio verify error", e);
            if (e.getStatusCode() == 400 || e.getStatusCode() == 404) {
                throw new IllegalArgumentException("Invalid phone number or OTP. Use a valid E.164 mobile number.");
            }
            if (e.getStatusCode() == 401 || e.getStatusCode() == 403) {
                throw new IllegalStateException("Phone verification service credentials are invalid.");
            }
            if (e.getStatusCode() == 429) {
                throw new IllegalStateException("Too many verification attempts. Please try again later.");
            }
            throw new IllegalStateException("Phone verification service error. Please try again.");
        }
    }

    public boolean checkSmsVerification(String phoneE164, String otpCode) {
        ensureConfigured();
        try {
            VerificationCheck check = VerificationCheck.creator(verifyServiceSid).setTo(phoneE164).setCode(otpCode).create();
            return "approved".equalsIgnoreCase(check.getStatus());
        } catch (ApiException e) {
            log.error("Twilio check error", e);
            return false;
        }
    }
}
