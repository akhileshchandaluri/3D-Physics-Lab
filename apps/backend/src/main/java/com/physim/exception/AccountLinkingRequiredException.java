package com.physim.exception;

public class AccountLinkingRequiredException extends RuntimeException {

    private final String email;
    private final String linkToken;

    public AccountLinkingRequiredException(String email, String linkToken) {
        super("An account with this email already exists. Enter your password to link your Google account.");
        this.email = email;
        this.linkToken = linkToken;
    }

    public String getEmail() {
        return email;
    }

    public String getLinkToken() {
        return linkToken;
    }
}
