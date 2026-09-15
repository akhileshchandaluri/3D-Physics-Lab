package com.physim.dto;

import jakarta.validation.constraints.NotBlank;

public class GoogleOAuthCallbackRequest {

    @NotBlank(message = "Authorization code is required")
    private String code;

    @NotBlank(message = "State parameter is required")
    private String state;

    private String redirectUri;

    public GoogleOAuthCallbackRequest() {
    }

    public GoogleOAuthCallbackRequest(String code, String state, String redirectUri) {
        this.code = code;
        this.state = state;
        this.redirectUri = redirectUri;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getRedirectUri() {
        return redirectUri;
    }

    public void setRedirectUri(String redirectUri) {
        this.redirectUri = redirectUri;
    }
}
