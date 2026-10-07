package com.physim.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {

    private UserDTO user;
    private String token;
    private String message;
    private Boolean mfaRequired;
    private Boolean mfaSetupRequired;
    private String mfaChallengeToken;
    private Boolean totpEnabled;
    private Boolean webauthnEnabled;

    public AuthResponse() {
    }

    public AuthResponse(UserDTO user, String token, String message) {
        this.user = user;
        this.token = token;
        this.message = message;
    }

    public static AuthResponse mfaChallenge(
            UserDTO user,
            String challengeToken,
            boolean setupRequired,
            boolean totpEnabled,
            boolean webauthnEnabled) {
        AuthResponse response = new AuthResponse();
        response.user = user;
        response.mfaRequired = true;
        response.mfaSetupRequired = setupRequired;
        response.mfaChallengeToken = challengeToken;
        response.totpEnabled = totpEnabled;
        response.webauthnEnabled = webauthnEnabled;
        response.message = setupRequired
                ? "Password accepted. Set up a second check to continue."
                : "Password accepted. Complete the second check to continue.";
        return response;
    }

    public UserDTO getUser() {
        return user;
    }

    public void setUser(UserDTO user) {
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Boolean getMfaRequired() {
        return mfaRequired;
    }

    public void setMfaRequired(Boolean mfaRequired) {
        this.mfaRequired = mfaRequired;
    }

    public Boolean getMfaSetupRequired() {
        return mfaSetupRequired;
    }

    public void setMfaSetupRequired(Boolean mfaSetupRequired) {
        this.mfaSetupRequired = mfaSetupRequired;
    }

    public String getMfaChallengeToken() {
        return mfaChallengeToken;
    }

    public void setMfaChallengeToken(String mfaChallengeToken) {
        this.mfaChallengeToken = mfaChallengeToken;
    }

    public Boolean getTotpEnabled() {
        return totpEnabled;
    }

    public void setTotpEnabled(Boolean totpEnabled) {
        this.totpEnabled = totpEnabled;
    }

    public Boolean getWebauthnEnabled() {
        return webauthnEnabled;
    }

    public void setWebauthnEnabled(Boolean webauthnEnabled) {
        this.webauthnEnabled = webauthnEnabled;
    }
}
