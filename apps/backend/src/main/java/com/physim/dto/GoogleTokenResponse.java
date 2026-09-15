package com.physim.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record GoogleTokenResponse(
        @JsonProperty("id_token") String idToken,
        @JsonProperty("access_token") String accessToken,
        @JsonProperty("token_type") String tokenType,
        @JsonProperty("expires_in") Long expiresIn
) {
}
