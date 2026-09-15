package com.physim.controller;

import com.physim.exception.UnauthorizedException;
import com.physim.service.NimbusGoogleTokenVerifier;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertThrows;

class GoogleTokenVerifierTest {

    @Test
    void testNullOrBlankTokenThrowsUnauthorized() {
        NimbusGoogleTokenVerifier verifier = new NimbusGoogleTokenVerifier("test-client-id");
        assertThrows(UnauthorizedException.class, () -> verifier.verifyToken(null, null));
        assertThrows(UnauthorizedException.class, () -> verifier.verifyToken("", null));
        assertThrows(UnauthorizedException.class, () -> verifier.verifyToken("   ", null));
    }

    @Test
    void testMalformedTokenThrowsUnauthorized() {
        NimbusGoogleTokenVerifier verifier = new NimbusGoogleTokenVerifier("test-client-id");
        assertThrows(UnauthorizedException.class, () -> verifier.verifyToken("invalid.jwt.token", "nonce123"));
    }
}
