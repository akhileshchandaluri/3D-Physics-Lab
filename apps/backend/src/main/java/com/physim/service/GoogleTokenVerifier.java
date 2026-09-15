package com.physim.service;

import com.physim.dto.GoogleIdTokenClaims;

public interface GoogleTokenVerifier {
    GoogleIdTokenClaims verifyToken(String idToken, String expectedNonce);
}
