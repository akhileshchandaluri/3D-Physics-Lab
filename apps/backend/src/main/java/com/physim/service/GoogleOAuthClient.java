package com.physim.service;

import com.physim.dto.GoogleTokenResponse;

public interface GoogleOAuthClient {
    GoogleTokenResponse exchangeCode(String code, String codeVerifier, String redirectUri);
}
