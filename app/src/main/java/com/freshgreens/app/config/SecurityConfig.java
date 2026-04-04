package com.freshgreens.app.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final FirebaseTokenFilter firebaseTokenFilter;

    @org.springframework.beans.factory.annotation.Value("${app.cors.allowed-origins:}")
    private String extraOrigins;

    @org.springframework.beans.factory.annotation.Value("${app.cookie.domain:}")
    private String cookieDomain;

    @org.springframework.beans.factory.annotation.Value("${server.servlet.session.cookie.secure:true}")
    private boolean cookieSecure;

    @org.springframework.beans.factory.annotation.Value("${server.servlet.session.cookie.same-site:None}")
    private String cookieSameSite;

    public SecurityConfig(FirebaseTokenFilter firebaseTokenFilter) {
        this.firebaseTokenFilter = firebaseTokenFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        CsrfTokenRequestAttributeHandler requestHandler = new CsrfTokenRequestAttributeHandler();
        requestHandler.setCsrfRequestAttributeName("_csrf");

        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // Relax COOP so Firebase popup sign-in can check window.closed
            .headers(headers -> headers
                .crossOriginOpenerPolicy(coop -> coop
                    .policy(org.springframework.security.web.header.writers.CrossOriginOpenerPolicyHeaderWriter
                            .CrossOriginOpenerPolicy.SAME_ORIGIN_ALLOW_POPUPS))
            )
            .csrf(csrf -> csrf
                .csrfTokenRepository(csrfTokenRepository())
                .csrfTokenRequestHandler(requestHandler)
                // Disable CSRF for API endpoints that use Bearer token auth
                .ignoringRequestMatchers("/api/auth/**", "/api/webhook/**")
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                .sessionConcurrency(concurrency -> concurrency
                    .maximumSessions(3)
                )
            )
            .authorizeHttpRequests(auth -> auth
                // Static resources — public
                .requestMatchers("/", "/*.html", "/assets/**", "/images/**",
                                 "/favicon.ico", "/error/**").permitAll()
                // Public API endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/webhook/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/config/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                // Swagger UI
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                // Actuator health
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                // Admin-only endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // Everything else requires authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(firebaseTokenFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setContentType("application/json");
                    response.setStatus(401);
                    response.getWriter().write("{\"success\":false,\"message\":\"Authentication required\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setContentType("application/json");
                    response.setStatus(403);
                    response.getWriter().write("{\"success\":false,\"message\":\"Access denied\"}");
                })
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Always allow localhost for development
        List<String> origins = new ArrayList<>(List.of("http://localhost:8080", "http://localhost:5173"));
        // Add production / Cloud Run origins from env var (comma-separated)
        if (extraOrigins != null && !extraOrigins.isBlank()) {
            origins.addAll(List.of(extraOrigins.split(","))
                .stream()
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .collect(Collectors.toList()));
        }
        configuration.setAllowedOrigins(origins);

        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Set-Cookie"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public CookieCsrfTokenRepository csrfTokenRepository() {
        CookieCsrfTokenRepository repository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        repository.setCookieCustomizer(builder -> {
            builder.path("/");
            builder.secure(cookieSecure);
            builder.sameSite(cookieSameSite);

            if (cookieDomain != null && !cookieDomain.isBlank()) {
                builder.domain(cookieDomain);
            }
        });

        return repository;
    }
}
