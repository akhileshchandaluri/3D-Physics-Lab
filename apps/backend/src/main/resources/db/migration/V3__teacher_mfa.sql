-- Teacher / admin second-factor fields and short-lived login challenges

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(64),
    ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS webauthn_credential_id TEXT,
    ADD COLUMN IF NOT EXISTS webauthn_public_key TEXT,
    ADD COLUMN IF NOT EXISTS webauthn_sign_count BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS webauthn_user_handle VARCHAR(64);

CREATE TABLE IF NOT EXISTS mfa_challenges (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    challenge_token_hash VARCHAR(64) NOT NULL UNIQUE,
    purpose VARCHAR(50) NOT NULL,
    webauthn_challenge TEXT,
    pending_totp_secret VARCHAR(64),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mfa_challenges_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mfa_challenges_expires_at ON mfa_challenges(expires_at);
