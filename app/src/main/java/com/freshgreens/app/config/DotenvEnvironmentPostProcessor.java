package com.freshgreens.app.config;

import io.github.cdimascio.dotenv.Dotenv;
import io.github.cdimascio.dotenv.DotenvException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Map;

/**
 * Loads a {@code .env} file from the current working directory into Spring's
 * property sources at application startup — for local development only.
 *
 * Priority (highest → lowest):
 *   1. System / OS environment variables  ← GitHub Actions secrets live here
 *   2. .env file                          ← local developer overrides
 *   3. application.properties defaults
 *
 * The processor is a no-op when {@code .env} is absent (CI / production),
 * so it is safe to ship in all environments.
 */
@Order(Ordered.LOWEST_PRECEDENCE)
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor {

    private static final Logger log = LoggerFactory.getLogger(DotenvEnvironmentPostProcessor.class);
    private static final String PROPERTY_SOURCE_NAME = "dotenvProperties";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment,
                                       SpringApplication application) {
        try {
            Dotenv dotenv = Dotenv.configure()
                    .ignoreIfMissing()   // silently skip if .env is not present
                    .load();

            Map<String, Object> props = new HashMap<>();
            dotenv.entries().forEach(entry -> props.put(entry.getKey(), entry.getValue()));

            if (props.isEmpty()) {
                return; // no .env file found — CI / production path
            }

            // Insert AFTER system env so OS variables (GitHub Actions secrets) always win
            environment.getPropertySources()
                    .addAfter("systemEnvironment", new MapPropertySource(PROPERTY_SOURCE_NAME, props));

            log.debug(".env loaded — {} properties added to environment", props.size());

        } catch (DotenvException e) {
            log.debug(".env not loaded: {}", e.getMessage());
        }
    }
}
