package com.physim.service;

import com.physim.dto.*;
import com.physim.entity.UserEntity;
import com.physim.exception.AccountLinkingRequiredException;
import com.physim.exception.BadRequestException;
import com.physim.exception.ForbiddenException;
import com.physim.exception.UnauthorizedException;
import com.physim.repository.UserRepository;
import com.physim.security.TokenUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.*;

@Service
public class GoogleOAuthService {

    private static final Logger log = LoggerFactory.getLogger(GoogleOAuthService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final AuthService authService;
    private final OAuthStateStore stateStore;
    private final GoogleOAuthClient googleOAuthClient;
    private final GoogleTokenVerifier googleTokenVerifier;
    private final PasswordEncoder passwordEncoder;

    private final String clientId;
    private final String defaultRedirectUri;
    private final Set<String> allowedRedirectUris;

    public GoogleOAuthService(
            UserRepository userRepository,
            AuthService authService,
            OAuthStateStore stateStore,
            GoogleOAuthClient googleOAuthClient,
            GoogleTokenVerifier googleTokenVerifier,
            PasswordEncoder passwordEncoder,
            @Value("${app.oauth2.google.client-id:}") String clientId,
            @Value("${app.oauth2.google.redirect-uri:http://localhost:5173/oauth/callback}") String defaultRedirectUri,
            @Value("${app.oauth2.google.allowed-redirect-uris:http://localhost:5173/oauth/callback,http://localhost:5174/oauth/callback,http://127.0.0.1:5173/oauth/callback,http://127.0.0.1:5174/oauth/callback}") String allowedRedirectUrisStr) {
        this.userRepository = userRepository;
        this.authService = authService;
        this.stateStore = stateStore;
        this.googleOAuthClient = googleOAuthClient;
        this.googleTokenVerifier = googleTokenVerifier;
        this.passwordEncoder = passwordEncoder;
        this.clientId = clientId;
        this.defaultRedirectUri = defaultRedirectUri;
        this.allowedRedirectUris = new HashSet<>(
                Arrays.stream(allowedRedirectUrisStr.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList()
        );
    }

    public GoogleAuthUrlResponse generateAuthorizationUrl(String requestedRedirectUri) {
        String effectiveRedirectUri = defaultRedirectUri;
        if (requestedRedirectUri != null && !requestedRedirectUri.isBlank()) {
            String trimmedUri = requestedRedirectUri.trim();
            if (!allowedRedirectUris.contains(trimmedUri)) {
                log.warn("Disallowed redirect URI requested: {}", trimmedUri);
                throw new BadRequestException("Invalid or disallowed redirect URI.");
            }
            effectiveRedirectUri = trimmedUri;
        }

        String state = TokenUtils.generateRandomToken(32);
        String nonce = TokenUtils.generateRandomToken(32);
        String codeVerifier = generateCodeVerifier();
        String codeChallenge = generateCodeChallenge(codeVerifier);

        stateStore.saveState(state, nonce, codeVerifier, effectiveRedirectUri, 10);

        String encodedRedirectUri = URLEncoder.encode(effectiveRedirectUri, StandardCharsets.UTF_8);
        String encodedScope = URLEncoder.encode("openid email profile", StandardCharsets.UTF_8);

        String authUrl = "https://accounts.google.com/o/oauth2/v2/auth?" +
                "client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8) +
                "&redirect_uri=" + encodedRedirectUri +
                "&response_type=code" +
                "&scope=" + encodedScope +
                "&state=" + state +
                "&nonce=" + nonce +
                "&code_challenge=" + codeChallenge +
                "&code_challenge_method=S256" +
                "&prompt=select_account";

        return new GoogleAuthUrlResponse(authUrl, state);
    }

    @Transactional
    public AuthResponse handleCallback(GoogleOAuthCallbackRequest request, String userAgent, String ipAddress) {
        OAuthStateStore.StateEntry stateEntry = stateStore.consumeState(request.getState())
                .orElseThrow(() -> new BadRequestException("Invalid or expired OAuth state. Please restart sign-in."));

        String redirectUri = (request.getRedirectUri() != null && !request.getRedirectUri().isBlank())
                ? request.getRedirectUri().trim()
                : stateEntry.redirectUri();

        GoogleTokenResponse tokenResponse = googleOAuthClient.exchangeCode(
                request.getCode(),
                stateEntry.codeVerifier(),
                redirectUri
        );

        GoogleIdTokenClaims claims = googleTokenVerifier.verifyToken(tokenResponse.idToken(), stateEntry.nonce());

        if (!claims.emailVerified()) {
            throw new BadRequestException("Google email is not verified.");
        }

        String email = claims.email().trim().toLowerCase();

        // 1. Check if user exists by Google provider ID
        Optional<UserEntity> existingGoogleUser = userRepository.findByAuthProviderAndProviderId("GOOGLE", claims.subject());
        if (existingGoogleUser.isPresent()) {
            UserEntity user = existingGoogleUser.get();
            if (!user.isActive()) {
                throw new ForbiddenException("Account is deactivated.");
            }
            String sessionToken = authService.createSession(user, userAgent, ipAddress);
            return new AuthResponse(authService.toDTO(user), sessionToken, "Google sign-in successful.");
        }

        // 2. Check if user exists by email (prevent silent account merging!)
        Optional<UserEntity> existingEmailUser = userRepository.findByEmail(email);
        if (existingEmailUser.isPresent()) {
            UserEntity user = existingEmailUser.get();
            if (!user.isActive()) {
                throw new ForbiddenException("Account is deactivated.");
            }
            // Generate link token for verified account linking
            String linkToken = TokenUtils.generateRandomToken(32);
            stateStore.saveLinkToken(linkToken, user.getEmail(), claims.subject(), 10);
            throw new AccountLinkingRequiredException(user.getEmail(), linkToken);
        }

        // 3. Unknown Google account — only admins may provision users
        throw new UnauthorizedException("No PhySim account exists for this Google email. Ask an administrator to create one.");
    }

    @Transactional
    public AuthResponse linkAccount(GoogleOAuthLinkRequest request, String userAgent, String ipAddress) {
        OAuthStateStore.LinkEntry linkEntry = stateStore.consumeLinkToken(request.getLinkToken())
                .orElseThrow(() -> new BadRequestException("Invalid or expired account linking session. Please sign in again."));

        UserEntity user = userRepository.findByEmail(linkEntry.email())
                .orElseThrow(() -> new BadRequestException("User account not found."));

        if (!user.isActive()) {
            throw new ForbiddenException("Account is deactivated.");
        }

        if (user.getPasswordHash() != null) {
            if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
                throw new UnauthorizedException("Incorrect password for account linking.");
            }
        }

        user.setProviderId(linkEntry.providerId());
        user.setAuthProvider("GOOGLE");
        UserEntity updatedUser = userRepository.save(user);

        String sessionToken = authService.createSession(updatedUser, userAgent, ipAddress);
        return new AuthResponse(authService.toDTO(updatedUser), sessionToken, "Account successfully linked with Google.");
    }

    private String generateCodeVerifier() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String generateCodeChallenge(String codeVerifier) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(codeVerifier.getBytes(StandardCharsets.US_ASCII));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}
