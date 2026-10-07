package com.physim.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.physim.dto.AuthResponse;
import com.physim.entity.MfaChallengeEntity;
import com.physim.entity.UserEntity;
import com.physim.entity.UserRole;
import com.physim.exception.UnauthorizedException;
import com.physim.repository.MfaChallengeRepository;
import com.physim.repository.UserRepository;
import com.physim.security.TokenUtils;
import com.yubico.webauthn.AssertionRequest;
import com.yubico.webauthn.AssertionResult;
import com.yubico.webauthn.CredentialRepository;
import com.yubico.webauthn.FinishAssertionOptions;
import com.yubico.webauthn.FinishRegistrationOptions;
import com.yubico.webauthn.RegisteredCredential;
import com.yubico.webauthn.RegistrationResult;
import com.yubico.webauthn.RelyingParty;
import com.yubico.webauthn.StartAssertionOptions;
import com.yubico.webauthn.StartRegistrationOptions;
import com.yubico.webauthn.data.AuthenticatorAssertionResponse;
import com.yubico.webauthn.data.AuthenticatorAttestationResponse;
import com.yubico.webauthn.data.AuthenticatorSelectionCriteria;
import com.yubico.webauthn.data.ByteArray;
import com.yubico.webauthn.data.ClientAssertionExtensionOutputs;
import com.yubico.webauthn.data.ClientRegistrationExtensionOutputs;
import com.yubico.webauthn.data.PublicKeyCredential;
import com.yubico.webauthn.data.PublicKeyCredentialCreationOptions;
import com.yubico.webauthn.data.PublicKeyCredentialDescriptor;
import com.yubico.webauthn.data.RelyingPartyIdentity;
import com.yubico.webauthn.data.ResidentKeyRequirement;
import com.yubico.webauthn.data.UserIdentity;
import com.yubico.webauthn.data.UserVerificationRequirement;
import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.util.Utils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class MfaService {

    public static final String DEMO_TOTP_SECRET = "JBSWY3DPEHPK3PXP";

    private final UserRepository userRepository;
    private final MfaChallengeRepository challengeRepository;
    private final AuthService authService;
    private final ObjectMapper objectMapper;
    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();
    private final CodeVerifier codeVerifier;
    private final QrGenerator qrGenerator = new ZxingPngQrGenerator();
    private final RelyingParty relyingParty;

    public MfaService(
            UserRepository userRepository,
            MfaChallengeRepository challengeRepository,
            AuthService authService,
            ObjectMapper objectMapper,
            @Value("${app.security.cors.allowed-origins:http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174}") String allowedOriginsStr,
            @Value("${app.mfa.rp-id:localhost}") String rpId,
            @Value("${app.mfa.rp-name:PhySim Lab}") String rpName) {
        this.userRepository = userRepository;
        this.challengeRepository = challengeRepository;
        this.authService = authService;
        this.objectMapper = objectMapper;

        CodeGenerator codeGenerator = new DefaultCodeGenerator(HashingAlgorithm.SHA1);
        DefaultCodeVerifier verifier = new DefaultCodeVerifier(codeGenerator, new SystemTimeProvider());
        verifier.setAllowedTimePeriodDiscrepancy(1);
        this.codeVerifier = verifier;

        Set<String> origins = new HashSet<>();
        for (String part : allowedOriginsStr.split(",")) {
            String trimmed = part.trim();
            if (!trimmed.isEmpty()) {
                origins.add(trimmed);
            }
        }
        if (origins.isEmpty()) {
            origins.add("http://localhost:5173");
        }

        this.relyingParty = RelyingParty.builder()
                .identity(RelyingPartyIdentity.builder().id(rpId).name(rpName).build())
                .credentialRepository(new UserCredentialRepository(userRepository))
                .origins(origins)
                .build();
    }

    public boolean requiresMfa(UserEntity user) {
        return user.getRole() == UserRole.TEACHER || user.getRole() == UserRole.ADMIN;
    }

    @Transactional
    public AuthResponse beginMfaChallenge(UserEntity user) {
        challengeRepository.deleteByExpiresAtBefore(Instant.now());
        String rawToken = TokenUtils.generateRandomToken(32);
        MfaChallengeEntity challenge = new MfaChallengeEntity();
        challenge.setUser(user);
        challenge.setChallengeTokenHash(TokenUtils.hashToken(rawToken));
        challenge.setPurpose(user.hasMfaConfigured() ? "LOGIN" : "SETUP");
        challenge.setExpiresAt(Instant.now().plus(10, ChronoUnit.MINUTES));
        challengeRepository.save(challenge);

        boolean webauthnEnabled = user.getWebauthnCredentialId() != null && !user.getWebauthnCredentialId().isBlank();
        return AuthResponse.mfaChallenge(
                authService.toDTO(user),
                rawToken,
                !user.hasMfaConfigured(),
                user.isTotpEnabled(),
                webauthnEnabled
        );
    }

    @Transactional
    public Map<String, String> startTotpSetup(String challengeToken) {
        MfaChallengeEntity challenge = requireChallenge(challengeToken);
        UserEntity user = challenge.getUser();
        String secret = secretGenerator.generate();
        challenge.setPendingTotpSecret(secret);
        challengeRepository.save(challenge);

        QrData data = new QrData.Builder()
                .label(user.getEmail())
                .secret(secret)
                .issuer("PhySim Lab")
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();

        try {
            String qrDataUrl = Utils.getDataUriForImage(qrGenerator.generate(data), qrGenerator.getImageMimeType());
            return Map.of(
                    "secret", secret,
                    "otpauthUrl", data.getUri(),
                    "qrDataUrl", qrDataUrl
            );
        } catch (QrGenerationException e) {
            return Map.of(
                    "secret", secret,
                    "otpauthUrl", data.getUri()
            );
        }
    }

    @Transactional
    public AuthResponse confirmTotp(String challengeToken, String code, String userAgent, String ipAddress) {
        MfaChallengeEntity challenge = requireChallenge(challengeToken);
        UserEntity user = challenge.getUser();
        String secret = challenge.getPendingTotpSecret();
        if (secret == null || secret.isBlank()) {
            throw new UnauthorizedException("Start authenticator setup before confirming the code.");
        }
        if (!codeVerifier.isValidCode(secret, code)) {
            throw new UnauthorizedException("That code did not work.");
        }
        user.setTotpSecret(secret);
        user.setTotpEnabled(true);
        userRepository.save(user);
        challengeRepository.delete(challenge);
        return finishLogin(user, userAgent, ipAddress);
    }

    @Transactional
    public AuthResponse verifyTotp(String challengeToken, String code, String userAgent, String ipAddress) {
        MfaChallengeEntity challenge = requireChallenge(challengeToken);
        UserEntity user = challenge.getUser();
        if (!user.isTotpEnabled() || user.getTotpSecret() == null) {
            throw new UnauthorizedException("Authenticator app is not set up for this account.");
        }
        if (!codeVerifier.isValidCode(user.getTotpSecret(), code)) {
            throw new UnauthorizedException("That code did not work.");
        }
        challengeRepository.delete(challenge);
        return finishLogin(user, userAgent, ipAddress);
    }

    @Transactional
    public AuthResponse skipSetup(String challengeToken, String userAgent, String ipAddress) {
        MfaChallengeEntity challenge = requireChallenge(challengeToken);
        UserEntity user = challenge.getUser();
        if (!"SETUP".equals(challenge.getPurpose()) || user.hasMfaConfigured()) {
            throw new UnauthorizedException("Second check cannot be skipped for this account.");
        }
        challengeRepository.delete(challenge);
        return finishLogin(user, userAgent, ipAddress);
    }

    @Transactional
    @SuppressWarnings("unchecked")
    public Map<String, Object> startWebAuthnRegistration(String challengeToken) throws Exception {
        MfaChallengeEntity challenge = requireChallenge(challengeToken);
        UserEntity user = challenge.getUser();
        if (user.getWebauthnUserHandle() == null || user.getWebauthnUserHandle().isBlank()) {
            user.setWebauthnUserHandle(UUID.randomUUID().toString().replace("-", ""));
            userRepository.save(user);
        }

        PublicKeyCredentialCreationOptions options = relyingParty.startRegistration(
                StartRegistrationOptions.builder()
                        .user(UserIdentity.builder()
                                .name(user.getEmail())
                                .displayName(user.getName())
                                .id(new ByteArray(user.getWebauthnUserHandle().getBytes(StandardCharsets.UTF_8)))
                                .build())
                        .authenticatorSelection(AuthenticatorSelectionCriteria.builder()
                                .residentKey(ResidentKeyRequirement.PREFERRED)
                                .userVerification(UserVerificationRequirement.PREFERRED)
                                .build())
                        .build()
        );

        challenge.setWebauthnChallenge(options.toJson());
        challengeRepository.save(challenge);
        return objectMapper.readValue(options.toCredentialsCreateJson(), Map.class);
    }

    @Transactional
    public AuthResponse finishWebAuthnRegistration(String challengeToken, JsonNode credentialJson, String userAgent, String ipAddress) throws Exception {
        MfaChallengeEntity challenge = requireChallenge(challengeToken);
        UserEntity user = challenge.getUser();
        if (challenge.getWebauthnChallenge() == null) {
            throw new UnauthorizedException("Start the browser check before confirming it.");
        }

        PublicKeyCredentialCreationOptions request = PublicKeyCredentialCreationOptions.fromJson(challenge.getWebauthnChallenge());
        PublicKeyCredential<AuthenticatorAttestationResponse, ClientRegistrationExtensionOutputs> credential =
                PublicKeyCredential.parseRegistrationResponseJson(credentialPayload(credentialJson));

        RegistrationResult result = relyingParty.finishRegistration(FinishRegistrationOptions.builder()
                .request(request)
                .response(credential)
                .build());

        user.setWebauthnCredentialId(result.getKeyId().getId().getBase64Url());
        user.setWebauthnPublicKey(result.getPublicKeyCose().getBase64Url());
        user.setWebauthnSignCount(result.getSignatureCount());
        userRepository.save(user);
        challengeRepository.delete(challenge);
        return finishLogin(user, userAgent, ipAddress);
    }

    @Transactional
    @SuppressWarnings("unchecked")
    public Map<String, Object> startWebAuthnAuthentication(String challengeToken) throws Exception {
        MfaChallengeEntity challenge = requireChallenge(challengeToken);
        UserEntity user = challenge.getUser();
        if (user.getWebauthnCredentialId() == null || user.getWebauthnCredentialId().isBlank()) {
            throw new UnauthorizedException("This browser check is not set up for this account.");
        }

        AssertionRequest assertionRequest = relyingParty.startAssertion(
                StartAssertionOptions.builder()
                        .username(user.getEmail())
                        .userVerification(UserVerificationRequirement.PREFERRED)
                        .build()
        );

        challenge.setWebauthnChallenge(assertionRequest.toJson());
        challengeRepository.save(challenge);
        return objectMapper.readValue(assertionRequest.toCredentialsGetJson(), Map.class);
    }

    @Transactional
    public AuthResponse finishWebAuthnAuthentication(String challengeToken, JsonNode credentialJson, String userAgent, String ipAddress) throws Exception {
        MfaChallengeEntity challenge = requireChallenge(challengeToken);
        UserEntity user = challenge.getUser();
        if (challenge.getWebauthnChallenge() == null) {
            throw new UnauthorizedException("Start the browser check before confirming it.");
        }

        AssertionRequest assertionRequest = AssertionRequest.fromJson(challenge.getWebauthnChallenge());
        PublicKeyCredential<AuthenticatorAssertionResponse, ClientAssertionExtensionOutputs> credential =
                PublicKeyCredential.parseAssertionResponseJson(credentialPayload(credentialJson));

        AssertionResult result = relyingParty.finishAssertion(FinishAssertionOptions.builder()
                .request(assertionRequest)
                .response(credential)
                .build());

        if (!result.isSuccess()) {
            throw new UnauthorizedException("The browser check failed.");
        }

        user.setWebauthnSignCount(result.getSignatureCount());
        userRepository.save(user);
        challengeRepository.delete(challenge);
        return finishLogin(user, userAgent, ipAddress);
    }

    private AuthResponse finishLogin(UserEntity user, String userAgent, String ipAddress) {
        String token = authService.createSession(user, userAgent, ipAddress);
        return new AuthResponse(authService.toDTO(user), token, "Login successful.");
    }

    private String credentialPayload(JsonNode credentialJson) {
        if (credentialJson instanceof com.fasterxml.jackson.databind.node.ObjectNode objectNode) {
            objectNode.remove("challengeToken");
            if (!objectNode.has("clientExtensionResults") || objectNode.get("clientExtensionResults").isNull()) {
                objectNode.putObject("clientExtensionResults");
            }
        }
        return credentialJson.toString();
    }

    private MfaChallengeEntity requireChallenge(String challengeToken) {
        if (challengeToken == null || challengeToken.isBlank()) {
            throw new UnauthorizedException("Second check expired. Log in again.");
        }
        MfaChallengeEntity challenge = challengeRepository.findByChallengeTokenHash(TokenUtils.hashToken(challengeToken))
                .orElseThrow(() -> new UnauthorizedException("Second check expired. Log in again."));
        if (challenge.getExpiresAt().isBefore(Instant.now())) {
            challengeRepository.delete(challenge);
            throw new UnauthorizedException("Second check expired. Log in again.");
        }
        return challenge;
    }

    private static ByteArray decodeBase64Url(String value) {
        try {
            return ByteArray.fromBase64Url(value);
        } catch (Exception e) {
            throw new IllegalStateException("Stored WebAuthn value is invalid.", e);
        }
    }

    private static class UserCredentialRepository implements CredentialRepository {
        private final UserRepository userRepository;

        private UserCredentialRepository(UserRepository userRepository) {
            this.userRepository = userRepository;
        }

        @Override
        public Set<PublicKeyCredentialDescriptor> getCredentialIdsForUsername(String username) {
            return userRepository.findByEmail(username.toLowerCase())
                    .filter(u -> u.getWebauthnCredentialId() != null && !u.getWebauthnCredentialId().isBlank())
                    .map(u -> Set.of(PublicKeyCredentialDescriptor.builder()
                            .id(decodeBase64Url(u.getWebauthnCredentialId()))
                            .build()))
                    .orElse(Set.of());
        }

        @Override
        public Optional<ByteArray> getUserHandleForUsername(String username) {
            return userRepository.findByEmail(username.toLowerCase())
                    .map(UserEntity::getWebauthnUserHandle)
                    .filter(h -> h != null && !h.isBlank())
                    .map(h -> new ByteArray(h.getBytes(StandardCharsets.UTF_8)));
        }

        @Override
        public Optional<String> getUsernameForUserHandle(ByteArray userHandle) {
            String handle = new String(userHandle.getBytes(), StandardCharsets.UTF_8);
            return userRepository.findByWebauthnUserHandle(handle).map(UserEntity::getEmail);
        }

        @Override
        public Optional<RegisteredCredential> lookup(ByteArray credentialId, ByteArray userHandle) {
            String id = credentialId.getBase64Url();
            return userRepository.findByWebauthnCredentialId(id)
                    .map(u -> RegisteredCredential.builder()
                            .credentialId(credentialId)
                            .userHandle(new ByteArray(u.getWebauthnUserHandle().getBytes(StandardCharsets.UTF_8)))
                            .publicKeyCose(decodeBase64Url(u.getWebauthnPublicKey()))
                            .signatureCount(u.getWebauthnSignCount())
                            .build());
        }

        @Override
        public Set<RegisteredCredential> lookupAll(ByteArray credentialId) {
            return lookup(credentialId, new ByteArray(new byte[0]))
                    .map(Set::of)
                    .orElse(Set.of());
        }
    }
}
