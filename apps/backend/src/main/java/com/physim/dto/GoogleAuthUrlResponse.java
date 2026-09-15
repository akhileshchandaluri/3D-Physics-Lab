package com.physim.dto;

public record GoogleAuthUrlResponse(
        String authUrl,
        String state
) {
}
