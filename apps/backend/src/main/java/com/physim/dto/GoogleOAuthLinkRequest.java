package com.physim.dto;

import jakarta.validation.constraints.NotBlank;

public class GoogleOAuthLinkRequest {

    @NotBlank(message = "Link token is required")
    private String linkToken;

    @NotBlank(message = "Password is required to link account")
    private String password;

    public GoogleOAuthLinkRequest() {
    }

    public GoogleOAuthLinkRequest(String linkToken, String password) {
        this.linkToken = linkToken;
        this.password = password;
    }

    public String getLinkToken() {
        return linkToken;
    }

    public void setLinkToken(String linkToken) {
        this.linkToken = linkToken;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
