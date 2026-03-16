package com.freshgreens.app.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

@Configuration
public class FirebaseConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${app.firebase.config-path}")
    private String firebaseConfigPath;

    @PostConstruct
    public void initFirebase() {
        if (!FirebaseApp.getApps().isEmpty()) {
            return;
        }

        try {
            byte[] json = loadServiceAccountJson();
            if (json.length > 0) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(new ByteArrayInputStream(json)))
                        .build();
                FirebaseApp.initializeApp(options);
                log.info("Firebase Admin SDK initialized successfully using service account JSON");
                return;
            }
            log.warn("Firebase service account JSON is empty");
        } catch (IOException | IllegalArgumentException e) {
            log.warn("Firebase service account load failed: {}", e.getMessage());
        }

        // Fallback: Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS, gcloud auth, etc.)
        try {
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.getApplicationDefault())
                    .build();
            FirebaseApp.initializeApp(options);
            log.info("Firebase Admin SDK initialized successfully using Application Default Credentials");
        } catch (IOException | IllegalArgumentException e) {
            log.warn("Firebase Admin SDK not initialized — login via Firebase token will fail. Reason: {}", e.getMessage());
        }
    }

    private byte[] loadServiceAccountJson() throws IOException {
        // 1) Preferred for CI/containers: env var with full JSON content
        String fromEnv = System.getenv("FIREBASE_SERVICE_ACCOUNT_JSON");
        if (fromEnv != null && !fromEnv.isBlank()) {
            log.info("Initializing Firebase using FIREBASE_SERVICE_ACCOUNT_JSON environment variable");
            return fromEnv.getBytes(StandardCharsets.UTF_8);
        }

        // 2) File path from property (supports absolute and relative filesystem paths)
        Path configuredPath = Path.of(firebaseConfigPath);
        if (Files.exists(configuredPath)) {
            log.info("Initializing Firebase using file path: {}", configuredPath);
            return Files.readAllBytes(configuredPath);
        }

        // 2b) Common local format: src/main/resources/<file>.json
        if (firebaseConfigPath.startsWith("src/main/resources/")) {
            Path strippedPath = Path.of(firebaseConfigPath.substring("src/main/resources/".length()));
            if (Files.exists(strippedPath)) {
                log.info("Initializing Firebase using file path: {}", strippedPath);
                return Files.readAllBytes(strippedPath);
            }
        }

        // 3) Relative path in classpath resources
        log.info("Initializing Firebase using classpath resource: {}", firebaseConfigPath);
        try (InputStream serviceAccount = new ClassPathResource(firebaseConfigPath).getInputStream()) {
            return serviceAccount.readAllBytes();
        }
    }
}
