package com.physim.dto;

public class CreateShareRequest {

    private Integer expiresInDays;

    public CreateShareRequest() {
    }

    public Integer getExpiresInDays() {
        return expiresInDays;
    }

    public void setExpiresInDays(Integer expiresInDays) {
        this.expiresInDays = expiresInDays;
    }
}
