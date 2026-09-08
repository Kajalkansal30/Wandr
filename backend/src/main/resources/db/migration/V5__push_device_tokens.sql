-- Expo / FCM push device tokens for mobile clients

CREATE TABLE IF NOT EXISTS push_device_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(512) NOT NULL,
    platform VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_push_device_tokens_token ON push_device_tokens (token);
CREATE INDEX IF NOT EXISTS idx_push_device_tokens_user ON push_device_tokens (user_id);
