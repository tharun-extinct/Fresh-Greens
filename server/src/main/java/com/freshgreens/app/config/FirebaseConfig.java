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
            if (json.length == 0) {
                log.warn("Firebase service account JSON is empty — skipping Firebase init");
                return;
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(new ByteArrayInputStream(json)))
                    .build();

            FirebaseApp.initializeApp(options);
            log.info("Firebase Admin SDK initialized successfully");
        } catch (IOException | IllegalArgumentException e) {
            log.warn("Firebase Admin SDK not initialized — running without Firebase. Reason: {}", e.getMessage());
        }
    }

    private byte[] loadServiceAccountJson() throws IOException {
        String fromEnv = System.getenv("FIREBASE_SERVICE_ACCOUNT_JSON");
        if (fromEnv != null && !fromEnv.isBlank()) {
            log.info("Initializing Firebase using FIREBASE_SERVICE_ACCOUNT_JSON environment variable");
            return fromEnv.getBytes(StandardCharsets.UTF_8);
        }

        Path configuredPath = Path.of(firebaseConfigPath);
        if (Files.exists(configuredPath)) {
            log.info("Initializing Firebase using file path: {}", configuredPath);
            return Files.readAllBytes(configuredPath);
        }

        if (firebaseConfigPath.startsWith("src/main/resources/")) {
            Path stripped = Path.of(firebaseConfigPath.substring("src/main/resources/".length()));
            if (Files.exists(stripped)) {
                log.info("Initializing Firebase using file path: {}", stripped);
                return Files.readAllBytes(stripped);
            }
        }

        log.info("Initializing Firebase using classpath resource: {}", firebaseConfigPath);
        try (InputStream serviceAccount = new ClassPathResource(firebaseConfigPath).getInputStream()) {
            return serviceAccount.readAllBytes();
        }
    }
}
