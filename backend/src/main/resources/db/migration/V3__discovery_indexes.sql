-- Discovery workload indexes (prod uses ddl-auto=validate; entity @Index alone is not enough)
CREATE INDEX IF NOT EXISTS idx_places_status_created
    ON places (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_places_owner_created
    ON places (owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_places_status_operating
    ON places (status, operating_status);

CREATE INDEX IF NOT EXISTS idx_reviews_place_status_created
    ON reviews (place_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_boost_active
    ON boost_campaigns (status, ends_at);

CREATE INDEX IF NOT EXISTS idx_boost_place_status
    ON boost_campaigns (place_id, status);

-- Optional PostGIS for radius queries (no-op if extension unavailable on some hosts)
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS postgis;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'PostGIS not available: %', SQLERRM;
END $$;
