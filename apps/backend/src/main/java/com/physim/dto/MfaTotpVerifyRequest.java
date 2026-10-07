package com.physim.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class MfaTotpVerifyRequest {

    @NotBlank
    private String challengeToken;

    @NotBlank
    @Pattern(regexp = "\\d{6}")
    private String code;

    public String getChallengeToken() {
        return challengeToken;
    }

    public void setChallengeToken(String challengeToken) {
        this.challengeToken = challengeToken;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
