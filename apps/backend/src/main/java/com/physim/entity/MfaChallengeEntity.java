package com.physim.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "mfa_challenges")
public class MfaChallengeEntity {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "challenge_token_hash", nullable = false, unique = true, length = 64)
    private String challengeTokenHash;

    @Column(nullable = false, length = 50)
    private String purpose;

    @Column(name = "webauthn_challenge", columnDefinition = "TEXT")
    private String webauthnChallenge;

    @Column(name = "pending_totp_secret", length = 64)
    private String pendingTotpSecret;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public UserEntity getUser() {
        return user;
    }

    public void setUser(UserEntity user) {
        this.user = user;
    }

    public String getChallengeTokenHash() {
        return challengeTokenHash;
    }

    public void setChallengeTokenHash(String challengeTokenHash) {
        this.challengeTokenHash = challengeTokenHash;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getWebauthnChallenge() {
        return webauthnChallenge;
    }

    public void setWebauthnChallenge(String webauthnChallenge) {
        this.webauthnChallenge = webauthnChallenge;
    }

    public String getPendingTotpSecret() {
        return pendingTotpSecret;
    }

    public void setPendingTotpSecret(String pendingTotpSecret) {
        this.pendingTotpSecret = pendingTotpSecret;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
