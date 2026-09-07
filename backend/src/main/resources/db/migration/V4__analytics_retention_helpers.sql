-- Analytics retention helpers: index for time-based prune + note in DEPLOY.md
CREATE INDEX IF NOT EXISTS idx_analytics_created
    ON analytics_events (created_at);

-- Favorites lookup by user
CREATE INDEX IF NOT EXISTS idx_favorites_user_created
    ON favorites (user_id, created_at DESC);
