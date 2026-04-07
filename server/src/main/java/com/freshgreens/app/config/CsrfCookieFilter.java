package com.freshgreens.app.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Forces the deferred CSRF token to materialise on every response so that
 * {@code CookieCsrfTokenRepository} writes the {@code XSRF-TOKEN} cookie.
 *
 * <p>Spring Security 6 lazily loads the CSRF token — the cookie is only written
 * when something actually calls {@link CsrfToken#getToken()}.  GET requests from
 * a React SPA never trigger that call, so the browser never receives the cookie
 * and every subsequent POST/PUT/DELETE gets rejected with 403.</p>
 *
 * <p>Registered in {@link SecurityConfig} after {@code UsernamePasswordAuthenticationFilter}
 * (i.e. after the {@code CsrfFilter} has already stored the deferred token as a
 * request attribute).</p>
 */
public class CsrfCookieFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        // Calling getToken() on the deferred proxy forces the real token to be loaded,
        // which triggers CookieCsrfTokenRepository.saveToken() → writes XSRF-TOKEN cookie.
        if (csrfToken != null) {
            csrfToken.getToken();
        }
        filterChain.doFilter(request, response);
    }
}
