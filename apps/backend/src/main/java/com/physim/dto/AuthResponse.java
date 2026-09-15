package com.physim.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {

    private UserDTO user;
    private String token;
    private String message;

    public AuthResponse() {
    }

    public AuthResponse(UserDTO user, String token, String message) {
        this.user = user;
        this.token = token;
        this.message = message;
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
}
