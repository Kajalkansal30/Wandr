-- Notification deep-link metadata + idempotency; review anonymization for account delete

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_type VARCHAR(64);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_id BIGINT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata VARCHAR(2000);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS source_event_id VARCHAR(128);

-- Backfill entity_id from legacy data when it was a place id string
UPDATE notifications
SET entity_type = 'PLACE',
    entity_id = CASE WHEN data ~ '^[0-9]+$' THEN CAST(data AS BIGINT) ELSE NULL END
WHERE entity_id IS NULL AND data IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_notifications_user_type_event
    ON notifications (user_id, type, source_event_id)
    WHERE source_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notification_user_unread
    ON notifications (user_id)
    WHERE read_at IS NULL;

ALTER TABLE reviews ALTER COLUMN user_id DROP NOT NULL;
