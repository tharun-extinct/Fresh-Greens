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
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${app.firebase.config-path}")
    private String firebaseConfigPath;

    @PostConstruct
    public void initFirebase() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                // Absolute path → mounted secret on Cloud Run; relative → classpath (local/CI)
                InputStream serviceAccount = firebaseConfigPath.startsWith("/")
                        ? new FileInputStream(firebaseConfigPath)
                        : new ClassPathResource(firebaseConfigPath).getInputStream();

                // Guard: skip init if the file is empty (CI environment without secret set)
                byte[] json = serviceAccount.readAllBytes();
                if (json.length == 0) {
                    log.warn("Firebase service account JSON is empty — skipping Firebase init (CI/test mode)");
                    return;
                }

                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(new ByteArrayInputStream(json)))
                        .build();

                FirebaseApp.initializeApp(options);
                log.info("Firebase Admin SDK initialized successfully");
            }
        } catch (IOException | IllegalArgumentException e) {
            log.warn("Firebase Admin SDK not initialized — running without Firebase. Reason: {}", e.getMessage());
        }
    }
}
