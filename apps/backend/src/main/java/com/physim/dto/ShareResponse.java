package com.physim.dto;

import java.time.Instant;

public class ShareResponse {

    private String shareId;
    private String shareToken;
    private Instant expiresAt;

    public ShareResponse() {
    }

    public ShareResponse(String shareId, String shareToken, Instant expiresAt) {
        this.shareId = shareId;
        this.shareToken = shareToken;
        this.expiresAt = expiresAt;
    }

    public String getShareId() {
        return shareId;
    }

    public String getId() {
        return shareId;
    }

    public void setShareId(String shareId) {
        this.shareId = shareId;
    }

    public String getShareToken() {
        return shareToken;
    }

    public String getToken() {
        return shareToken;
    }

    public void setShareToken(String shareToken) {
        this.shareToken = shareToken;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }
}
