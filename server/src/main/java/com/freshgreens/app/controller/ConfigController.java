package com.freshgreens.app.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@RestController
public class ConfigController {

    @Value("${app.firebase.web.api-key:}")
    private String apiKey;

    @Value("${app.firebase.web.auth-domain:}")
    private String authDomain;

    @Value("${app.firebase.web.project-id:}")
    private String projectId;

    @Value("${app.firebase.web.storage-bucket:}")
    private String storageBucket;

    @Value("${app.firebase.web.messaging-sender-id:}")
    private String messagingSenderId;

    @Value("${app.firebase.web.app-id:}")
    private String appId;

    @Value("${app.firebase.web.measurement-id:}")
    private String measurementId;

    @GetMapping(value = "/api/config/firebase-config.js", produces = "application/javascript")
    public ResponseEntity<String> firebaseWebConfig() {
        List<String> missing = validateRequiredFields();
        if (!missing.isEmpty()) {
            String body = "window.FGFirebaseConfigError = Object.freeze({\n" +
                "  message: 'Firebase web config missing',\n" +
                "  missing: [" + toQuotedList(missing) + "]\n" +
                "});\n";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(new MediaType("application", "javascript", StandardCharsets.UTF_8));

            return ResponseEntity.status(503)
                .headers(headers)
                .cacheControl(CacheControl.noStore())
                .body(body);
        }

        String body = "window.FGFirebaseConfig = Object.freeze({\n" +
                "  apiKey: '" + js(apiKey) + "',\n" +
                "  authDomain: '" + js(authDomain) + "',\n" +
                "  projectId: '" + js(projectId) + "',\n" +
                "  storageBucket: '" + js(storageBucket) + "',\n" +
                "  messagingSenderId: '" + js(messagingSenderId) + "',\n" +
                "  appId: '" + js(appId) + "',\n" +
                "  measurementId: '" + js(measurementId) + "'\n" +
                "});\n";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType("application", "javascript", StandardCharsets.UTF_8));

        return ResponseEntity.ok()
                .headers(headers)
                .cacheControl(CacheControl.noStore())
                .body(body);
    }

    private List<String> validateRequiredFields() {
        List<String> missing = new ArrayList<>();
        if (!StringUtils.hasText(apiKey)) missing.add("apiKey");
        if (!StringUtils.hasText(authDomain)) missing.add("authDomain");
        if (!StringUtils.hasText(projectId)) missing.add("projectId");
        if (!StringUtils.hasText(storageBucket)) missing.add("storageBucket");
        if (!StringUtils.hasText(messagingSenderId)) missing.add("messagingSenderId");
        if (!StringUtils.hasText(appId)) missing.add("appId");
        return missing;
    }

    private String toQuotedList(List<String> values) {
        return values.stream()
                .map(v -> "'" + js(v) + "'")
                .reduce((a, b) -> a + ", " + b)
                .orElse("");
    }

    private String js(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("\r", "")
                .replace("\n", "");
    }
}
