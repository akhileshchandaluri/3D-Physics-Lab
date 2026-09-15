package com.physim.security;

import com.physim.entity.SessionEntity;
import com.physim.repository.SessionRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Arrays;
import java.util.Optional;

@Component
public class SessionAuthenticationFilter extends OncePerRequestFilter {

    private final SessionRepository sessionRepository;
    private final String cookieName;

    public SessionAuthenticationFilter(
            SessionRepository sessionRepository,
            @Value("${app.security.cookie-name:physim_session}") String cookieName) {
        this.sessionRepository = sessionRepository;
        this.cookieName = cookieName;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String token = extractToken(request);

        if (token != null && !token.isBlank() && SecurityContextHolder.getContext().getAuthentication() == null) {
            String tokenHash = TokenUtils.hashToken(token);
            Optional<SessionEntity> sessionOpt = sessionRepository.findBySessionTokenHash(tokenHash);

            if (sessionOpt.isPresent()) {
                SessionEntity session = sessionOpt.get();
                if (session.getExpiresAt().isAfter(Instant.now()) && session.getUser().isActive()) {
                    UserPrincipal principal = new UserPrincipal(session.getUser());
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        // 1. Check cookies
        if (request.getCookies() != null) {
            Optional<Cookie> cookie = Arrays.stream(request.getCookies())
                    .filter(c -> cookieName.equals(c.getName()))
                    .findFirst();
            if (cookie.isPresent() && cookie.get().getValue() != null && !cookie.get().getValue().isBlank()) {
                return cookie.get().getValue();
            }
        }

        // 2. Check Authorization header
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7).trim();
        }

        return null;
    }
}
