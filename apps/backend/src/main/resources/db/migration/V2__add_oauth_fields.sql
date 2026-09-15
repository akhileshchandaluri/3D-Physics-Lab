-- V2__add_oauth_fields.sql: Add OAuth provider support to users table

-- Allow password_hash to be NULL for OAuth-only accounts
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add provider and provider identity columns
ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) NOT NULL DEFAULT 'LOCAL';
ALTER TABLE users ADD COLUMN provider_id VARCHAR(255);

-- Index for fast lookup by provider ID
CREATE INDEX idx_users_provider ON users(auth_provider, provider_id);
