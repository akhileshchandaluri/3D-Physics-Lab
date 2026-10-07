package com.physim.dto;

import jakarta.validation.constraints.NotBlank;

public class MfaChallengeRequest {

    @NotBlank
    private String challengeToken;

    public String getChallengeToken() {
        return challengeToken;
    }

    public void setChallengeToken(String challengeToken) {
        this.challengeToken = challengeToken;
    }
}
