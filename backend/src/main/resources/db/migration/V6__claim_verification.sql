-- Claim/verification foundations: members, evidence, claim extensions, place classification

ALTER TABLE places ADD COLUMN IF NOT EXISTS business_model VARCHAR(32);
ALTER TABLE places ADD COLUMN IF NOT EXISTS business_size VARCHAR(32);
ALTER TABLE places ADD COLUMN IF NOT EXISTS needs_reverification BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE places ADD COLUMN IF NOT EXISTS verification_level VARCHAR(32);
ALTER TABLE places ADD COLUMN IF NOT EXISTS verification_method VARCHAR(64);
ALTER TABLE places ADD COLUMN IF NOT EXISTS business_email VARCHAR(255);

ALTER TABLE place_claims ADD COLUMN IF NOT EXISTS requested_role VARCHAR(40);
ALTER TABLE place_claims ADD COLUMN IF NOT EXISTS risk_score INTEGER;
ALTER TABLE place_claims ADD COLUMN IF NOT EXISTS verification_score INTEGER;
ALTER TABLE place_claims ADD COLUMN IF NOT EXISTS verification_method VARCHAR(64);
ALTER TABLE place_claims ADD COLUMN IF NOT EXISTS verification_level VARCHAR(32);
ALTER TABLE place_claims ADD COLUMN IF NOT EXISTS decision VARCHAR(32);
ALTER TABLE place_claims ADD COLUMN IF NOT EXISTS claim_kind VARCHAR(32) DEFAULT 'CLAIM';
ALTER TABLE place_claims ADD COLUMN IF NOT EXISTS risk_reasons VARCHAR(2000);

CREATE TABLE IF NOT EXISTS business_members (
    id BIGSERIAL PRIMARY KEY,
    place_id BIGINT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(40) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (place_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_business_members_place ON business_members (place_id);
CREATE INDEX IF NOT EXISTS idx_business_members_user ON business_members (user_id);

CREATE TABLE IF NOT EXISTS claim_evidence (
    id BIGSERIAL PRIMARY KEY,
    claim_id BIGINT NOT NULL REFERENCES place_claims(id) ON DELETE CASCADE,
    place_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    method VARCHAR(40) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    target_value VARCHAR(512),
    secret_hash VARCHAR(128),
    challenge_token VARCHAR(128),
    media_url VARCHAR(1000),
    metadata VARCHAR(2000),
    expires_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_evidence_claim ON claim_evidence (claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_evidence_place ON claim_evidence (place_id, method);

-- Backfill primary owners into business_members
INSERT INTO business_members (place_id, user_id, role, status, created_at, updated_at)
SELECT p.id, p.owner_id, 'OWNER', 'ACTIVE', NOW(), NOW()
FROM places p
WHERE p.owner_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM business_members bm WHERE bm.place_id = p.id AND bm.user_id = p.owner_id
  );
