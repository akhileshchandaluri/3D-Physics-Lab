package com.physim.service;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.RemoteJWKSet;
import com.nimbusds.jose.proc.JWSKeySelector;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.nimbusds.jwt.proc.ConfigurableJWTProcessor;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import com.physim.dto.GoogleIdTokenClaims;
import com.physim.exception.UnauthorizedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URL;
import java.util.Date;
import java.util.List;

@Service
public class NimbusGoogleTokenVerifier implements GoogleTokenVerifier {

    private static final Logger log = LoggerFactory.getLogger(NimbusGoogleTokenVerifier.class);
    private static final String GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";

    private final String expectedClientId;
    private final ConfigurableJWTProcessor<SecurityContext> jwtProcessor;

    public NimbusGoogleTokenVerifier(@Value("${app.oauth2.google.client-id:}") String expectedClientId) {
        this.expectedClientId = expectedClientId;
        this.jwtProcessor = new DefaultJWTProcessor<>();
        try {
            URL jwkSetUrl = URI.create(GOOGLE_CERTS_URL).toURL();
            JWKSource<SecurityContext> keySource = new RemoteJWKSet<>(jwkSetUrl);
            JWSKeySelector<SecurityContext> keySelector = new JWSVerificationKeySelector<>(JWSAlgorithm.RS256, keySource);
            this.jwtProcessor.setJWSKeySelector(keySelector);
        } catch (Exception e) {
            log.error("Failed to initialize Google JWK Set processor: {}", e.getMessage());
        }
    }

    @Override
    public GoogleIdTokenClaims verifyToken(String idToken, String expectedNonce) {
        if (idToken == null || idToken.isBlank()) {
            throw new UnauthorizedException("Google ID token is required.");
        }

        try {
            SignedJWT signedJWT = SignedJWT.parse(idToken);
            JWTClaimsSet claims = jwtProcessor.process(signedJWT, null);

            // 1. Verify Issuer
            String issuer = claims.getIssuer();
            if (!"https://accounts.google.com".equals(issuer) && !"accounts.google.com".equals(issuer)) {
                log.warn("Invalid token issuer: {}", issuer);
                throw new UnauthorizedException("Invalid Google token issuer.");
            }

            // 2. Verify Audience
            List<String> audience = claims.getAudience();
            if (expectedClientId != null && !expectedClientId.isBlank() && (audience == null || !audience.contains(expectedClientId))) {
                log.warn("Audience mismatch in Google ID token.");
                throw new UnauthorizedException("Invalid Google token audience.");
            }

            // 3. Verify Expiration with 60s clock skew
            Date expiration = claims.getExpirationTime();
            Date nowWithSkew = new Date(System.currentTimeMillis() - 60_000);
            if (expiration == null || expiration.before(nowWithSkew)) {
                log.warn("Google token is expired.");
                throw new UnauthorizedException("Google ID token has expired.");
            }

            // 4. Verify Nonce if expected
            if (expectedNonce != null && !expectedNonce.isBlank()) {
                String tokenNonce = claims.getStringClaim("nonce");
                if (!expectedNonce.equals(tokenNonce)) {
                    log.warn("Nonce mismatch in Google ID token.");
                    throw new UnauthorizedException("Google ID token nonce mismatch.");
                }
            }

            // 5. Verify Email Verification claim
            Boolean emailVerified = claims.getBooleanClaim("email_verified");
            if (emailVerified == null || !emailVerified) {
                log.warn("Google account email is not verified.");
                throw new UnauthorizedException("Google account email must be verified.");
            }

            String subject = claims.getSubject();
            String email = claims.getStringClaim("email");
            String name = claims.getStringClaim("name");
            String picture = claims.getStringClaim("picture");

            if (subject == null || email == null) {
                throw new UnauthorizedException("Google ID token missing required claims.");
            }

            return new GoogleIdTokenClaims(subject, email, emailVerified, name, picture);
        } catch (UnauthorizedException ue) {
            throw ue;
        } catch (Exception e) {
            log.warn("Google ID token signature verification failed: {}", e.getMessage());
            throw new UnauthorizedException("Invalid Google ID token signature or claims.");
        }
    }
}
