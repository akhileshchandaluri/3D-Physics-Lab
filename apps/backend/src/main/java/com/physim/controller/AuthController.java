package com.physim.controller;

import com.physim.dto.AuthResponse;
import com.physim.dto.LoginRequest;
import com.physim.dto.UserDTO;
import com.physim.entity.UserEntity;
import com.physim.exception.UnauthorizedException;
import com.physim.repository.UserRepository;
import com.physim.security.UserPrincipal;
import com.physim.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Auth", description = "Authentication, registration, and session management")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final String cookieName;
    private final int sessionTtlDays;
    private final boolean cookieSecure;

    public AuthController(
            AuthService authService,
            UserRepository userRepository,
            @Value("${app.security.cookie-name:physim_session}") String cookieName,
            @Value("${app.security.session-ttl-days:30}") int sessionTtlDays,
            @Value("${app.security.cookie-secure:false}") boolean cookieSecure) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.cookieName = cookieName;
        this.sessionTtlDays = sessionTtlDays;
        this.cookieSecure = cookieSecure;
    }

    private void attachSessionCookie(HttpServletRequest request, HttpServletResponse response, String token) {
        boolean isSecure = cookieSecure || (request != null && (request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"))));
        ResponseCookie cookie = ResponseCookie.from(cookieName, token)
                .httpOnly(true)
                .secure(isSecure)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofDays(sessionTtlDays))
                .build();
        response.setHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearSessionCookie(HttpServletRequest request, HttpServletResponse response) {
        boolean isSecure = cookieSecure || (request != null && (request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"))));
        ResponseCookie cookie = ResponseCookie.from(cookieName, "")
                .httpOnly(true)
                .secure(isSecure)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();
        response.setHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticates credentials and establishes a session cookie.")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        String userAgent = httpRequest.getHeader("User-Agent");
        String ipAddress = httpRequest.getRemoteAddr();

        AuthResponse authResponse = authService.login(request, userAgent, ipAddress);
        if (authResponse.getToken() != null) {
            attachSessionCookie(httpRequest, httpResponse, authResponse.getToken());
        }

        return ResponseEntity.ok(authResponse);
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Restores authenticated session and returns user profile.")
    public ResponseEntity<Map<String, Object>> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException();
        }

        UserEntity user = userRepository.findById(principal.getId())
                .orElseThrow(UnauthorizedException::new);

        return ResponseEntity.ok(Map.of("user", authService.toDTO(user)));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout", description = "Invalidates session token and clears the session cookie.")
    public ResponseEntity<Map<String, String>> logout(
            @CookieValue(name = "${app.security.cookie-name:physim_session}", required = false) String sessionCookie,
            @RequestHeader(name = "Authorization", required = false) String authHeader,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        String token = sessionCookie;
        if (token == null && authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7).trim();
        }

        authService.logout(token);
        clearSessionCookie(httpRequest, httpResponse);

        return ResponseEntity.ok(Map.of("message", "Logged out successfully."));
    }
}
