package com.physim.controller;

import com.physim.dto.AuthResponse;
import com.physim.dto.GoogleAuthUrlResponse;
import com.physim.dto.GoogleOAuthCallbackRequest;
import com.physim.dto.GoogleOAuthLinkRequest;
import com.physim.service.GoogleOAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/api/v1/auth/oauth/google")
@Tag(name = "OAuth", description = "Google OAuth 2.0 / OpenID Connect authentication")
public class OAuthController {

    private final GoogleOAuthService googleOAuthService;
    private final String cookieName;
    private final int sessionTtlDays;
    private final boolean cookieSecure;

    public OAuthController(
            GoogleOAuthService googleOAuthService,
            @Value("${app.security.cookie-name:physim_session}") String cookieName,
            @Value("${app.security.session-ttl-days:30}") int sessionTtlDays,
            @Value("${app.security.cookie-secure:false}") boolean cookieSecure) {
        this.googleOAuthService = googleOAuthService;
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

    @GetMapping("/authorize")
    @Operation(summary = "Get Google Authorization URL", description = "Generates authorization URL with state, nonce, and PKCE parameters.")
    public ResponseEntity<GoogleAuthUrlResponse> getAuthorizationUrl(
            @RequestParam(name = "redirectUri", required = false) String redirectUri) {
        GoogleAuthUrlResponse response = googleOAuthService.generateAuthorizationUrl(redirectUri);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/callback")
    @Operation(summary = "Google OAuth Callback", description = "Exchanges authorization code for session cookie and user profile.")
    public ResponseEntity<AuthResponse> handleCallback(
            @Valid @RequestBody GoogleOAuthCallbackRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        String userAgent = httpRequest.getHeader("User-Agent");
        String ipAddress = httpRequest.getRemoteAddr();

        AuthResponse authResponse = googleOAuthService.handleCallback(request, userAgent, ipAddress);
        attachSessionCookie(httpRequest, httpResponse, authResponse.getToken());

        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/link")
    @Operation(summary = "Link Google Account to Existing Account", description = "Verifies password of existing account and links Google provider ID.")
    public ResponseEntity<AuthResponse> linkAccount(
            @Valid @RequestBody GoogleOAuthLinkRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        String userAgent = httpRequest.getHeader("User-Agent");
        String ipAddress = httpRequest.getRemoteAddr();

        AuthResponse authResponse = googleOAuthService.linkAccount(request, userAgent, ipAddress);
        attachSessionCookie(httpRequest, httpResponse, authResponse.getToken());

        return ResponseEntity.ok(authResponse);
    }
}
