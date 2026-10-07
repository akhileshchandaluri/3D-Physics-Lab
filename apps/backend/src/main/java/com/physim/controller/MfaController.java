package com.physim.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.physim.dto.AuthResponse;
import com.physim.dto.MfaChallengeRequest;
import com.physim.dto.MfaTotpVerifyRequest;
import com.physim.service.MfaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth/mfa")
@Tag(name = "MFA", description = "Second check for teacher and admin accounts")
public class MfaController {

    private final MfaService mfaService;
    private final String cookieName;
    private final int sessionTtlDays;
    private final boolean cookieSecure;

    public MfaController(
            MfaService mfaService,
            @Value("${app.security.cookie-name:physim_session}") String cookieName,
            @Value("${app.security.session-ttl-days:30}") int sessionTtlDays,
            @Value("${app.security.cookie-secure:false}") boolean cookieSecure) {
        this.mfaService = mfaService;
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

    private ResponseEntity<AuthResponse> withSession(
            AuthResponse authResponse,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        if (authResponse.getToken() != null) {
            attachSessionCookie(httpRequest, httpResponse, authResponse.getToken());
        }
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/totp/setup")
    @Operation(summary = "Start authenticator setup")
    public ResponseEntity<Map<String, String>> totpSetup(@Valid @RequestBody MfaChallengeRequest request) {
        return ResponseEntity.ok(mfaService.startTotpSetup(request.getChallengeToken()));
    }

    @PostMapping("/totp/confirm")
    @Operation(summary = "Confirm authenticator setup and open session")
    public ResponseEntity<AuthResponse> totpConfirm(
            @Valid @RequestBody MfaTotpVerifyRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        AuthResponse authResponse = mfaService.confirmTotp(
                request.getChallengeToken(),
                request.getCode(),
                httpRequest.getHeader("User-Agent"),
                httpRequest.getRemoteAddr());
        return withSession(authResponse, httpRequest, httpResponse);
    }

    @PostMapping("/totp/verify")
    @Operation(summary = "Verify authenticator code and open session")
    public ResponseEntity<AuthResponse> totpVerify(
            @Valid @RequestBody MfaTotpVerifyRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        AuthResponse authResponse = mfaService.verifyTotp(
                request.getChallengeToken(),
                request.getCode(),
                httpRequest.getHeader("User-Agent"),
                httpRequest.getRemoteAddr());
        return withSession(authResponse, httpRequest, httpResponse);
    }

    @PostMapping("/skip")
    @Operation(summary = "Skip MFA setup for now and open session")
    public ResponseEntity<AuthResponse> skipSetup(
            @Valid @RequestBody MfaChallengeRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        AuthResponse authResponse = mfaService.skipSetup(
                request.getChallengeToken(),
                httpRequest.getHeader("User-Agent"),
                httpRequest.getRemoteAddr());
        return withSession(authResponse, httpRequest, httpResponse);
    }

    @PostMapping("/webauthn/register/options")
    @Operation(summary = "Start browser / security-key registration")
    public ResponseEntity<Map<String, Object>> webAuthnRegisterOptions(@Valid @RequestBody MfaChallengeRequest request) throws Exception {
        return ResponseEntity.ok(mfaService.startWebAuthnRegistration(request.getChallengeToken()));
    }

    @PostMapping("/webauthn/register/verify")
    @Operation(summary = "Finish browser / security-key registration")
    public ResponseEntity<AuthResponse> webAuthnRegisterVerify(
            @RequestBody JsonNode body,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) throws Exception {
        String challengeToken = body.path("challengeToken").asText(null);
        AuthResponse authResponse = mfaService.finishWebAuthnRegistration(
                challengeToken,
                body.deepCopy(),
                httpRequest.getHeader("User-Agent"),
                httpRequest.getRemoteAddr());
        return withSession(authResponse, httpRequest, httpResponse);
    }

    @PostMapping("/webauthn/authenticate/options")
    @Operation(summary = "Start browser / security-key assertion")
    public ResponseEntity<Map<String, Object>> webAuthnAuthOptions(@Valid @RequestBody MfaChallengeRequest request) throws Exception {
        return ResponseEntity.ok(mfaService.startWebAuthnAuthentication(request.getChallengeToken()));
    }

    @PostMapping("/webauthn/authenticate/verify")
    @Operation(summary = "Finish browser / security-key assertion")
    public ResponseEntity<AuthResponse> webAuthnAuthVerify(
            @RequestBody JsonNode body,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) throws Exception {
        String challengeToken = body.path("challengeToken").asText(null);
        AuthResponse authResponse = mfaService.finishWebAuthnAuthentication(
                challengeToken,
                body.deepCopy(),
                httpRequest.getHeader("User-Agent"),
                httpRequest.getRemoteAddr());
        return withSession(authResponse, httpRequest, httpResponse);
    }
}
