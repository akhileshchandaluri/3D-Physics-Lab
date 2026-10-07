package com.physim.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
public class UserEntity {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String name;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "auth_provider", nullable = false, length = 50)
    private String authProvider = "LOCAL";

    @Column(name = "provider_id")
    private String providerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role = UserRole.STUDENT;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "totp_secret", length = 64)
    private String totpSecret;

    @Column(name = "totp_enabled", nullable = false)
    private boolean totpEnabled = false;

    @Column(name = "webauthn_credential_id", columnDefinition = "TEXT")
    private String webauthnCredentialId;

    @Column(name = "webauthn_public_key", columnDefinition = "TEXT")
    private String webauthnPublicKey;

    @Column(name = "webauthn_sign_count", nullable = false)
    private long webauthnSignCount = 0;

    @Column(name = "webauthn_user_handle", length = 64)
    private String webauthnUserHandle;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UserEntity() {
    }

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getAuthProvider() {
        return authProvider;
    }

    public void setAuthProvider(String authProvider) {
        this.authProvider = authProvider;
    }

    public String getProviderId() {
        return providerId;
    }

    public void setProviderId(String providerId) {
        this.providerId = providerId;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getTotpSecret() {
        return totpSecret;
    }

    public void setTotpSecret(String totpSecret) {
        this.totpSecret = totpSecret;
    }

    public boolean isTotpEnabled() {
        return totpEnabled;
    }

    public void setTotpEnabled(boolean totpEnabled) {
        this.totpEnabled = totpEnabled;
    }

    public String getWebauthnCredentialId() {
        return webauthnCredentialId;
    }

    public void setWebauthnCredentialId(String webauthnCredentialId) {
        this.webauthnCredentialId = webauthnCredentialId;
    }

    public String getWebauthnPublicKey() {
        return webauthnPublicKey;
    }

    public void setWebauthnPublicKey(String webauthnPublicKey) {
        this.webauthnPublicKey = webauthnPublicKey;
    }

    public long getWebauthnSignCount() {
        return webauthnSignCount;
    }

    public void setWebauthnSignCount(long webauthnSignCount) {
        this.webauthnSignCount = webauthnSignCount;
    }

    public String getWebauthnUserHandle() {
        return webauthnUserHandle;
    }

    public void setWebauthnUserHandle(String webauthnUserHandle) {
        this.webauthnUserHandle = webauthnUserHandle;
    }

    public boolean hasMfaConfigured() {
        return totpEnabled || (webauthnCredentialId != null && !webauthnCredentialId.isBlank());
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
