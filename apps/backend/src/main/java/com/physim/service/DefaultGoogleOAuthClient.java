package com.physim.service;

import com.physim.dto.GoogleTokenResponse;
import com.physim.exception.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Service
public class DefaultGoogleOAuthClient implements GoogleOAuthClient {

    private static final Logger log = LoggerFactory.getLogger(DefaultGoogleOAuthClient.class);
    private static final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

    private final RestTemplate restTemplate;
    private final String clientId;
    private final String clientSecret;

    public DefaultGoogleOAuthClient(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${app.oauth2.google.client-id:}") String clientId,
            @Value("${app.oauth2.google.client-secret:}") String clientSecret) {
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(10))
                .setReadTimeout(Duration.ofSeconds(10))
                .build();
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    @Override
    public GoogleTokenResponse exchangeCode(String code, String codeVerifier, String redirectUri) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("code", code);
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("redirect_uri", redirectUri);
        body.add("grant_type", "authorization_code");
        if (codeVerifier != null && !codeVerifier.isBlank()) {
            body.add("code_verifier", codeVerifier);
        }

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<GoogleTokenResponse> response = restTemplate.postForEntity(
                    GOOGLE_TOKEN_URL,
                    request,
                    GoogleTokenResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            } else {
                log.error("Google token exchange returned status: {}", response.getStatusCode());
                throw new BadRequestException("Failed to exchange authorization code with Google.");
            }
        } catch (HttpStatusCodeException ex) {
            log.error("Google token exchange failed with status: {}", ex.getStatusCode());
            throw new BadRequestException("Google authorization exchange failed or authorization code has expired.");
        } catch (Exception ex) {
            log.error("Google token exchange network or client error: {}", ex.getMessage());
            throw new BadRequestException("Unable to contact Google OAuth servers. Please try again.");
        }
    }
}
