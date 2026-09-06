-- Security, accounts, reviews moderation, notifications

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens (user_id);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    data VARCHAR(2000),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notification_user ON notifications (user_id, created_at DESC);

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'APPROVED';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS report_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderated_by BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS uk_reviews_user_place ON reviews (user_id, place_id);
