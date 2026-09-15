package com.physim.dto;

public record GoogleIdTokenClaims(
        String subject,
        String email,
        boolean emailVerified,
        String name,
        String picture
) {
}
