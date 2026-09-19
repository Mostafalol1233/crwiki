-- Migration: Extend weapons table to support structured acquisition methods
-- See Weapons audit 2026-09-19: add acquisition_methods JSONB + supporting fields
-- Safe to re-run (IF NOT EXISTS). Does not delete existing data.

ALTER TABLE weapons ADD COLUMN IF NOT EXISTS acquisition_methods JSONB DEFAULT '[]'::jsonb;
ALTER TABLE weapons ADD COLUMN IF NOT EXISTS acquisition_summary_ar TEXT DEFAULT '';
ALTER TABLE weapons ADD COLUMN IF NOT EXISTS acquisition_summary_en TEXT DEFAULT '';
ALTER TABLE weapons ADD COLUMN IF NOT EXISTS release_date DATE;
ALTER TABLE weapons ADD COLUMN IF NOT EXISTS is_permanent BOOLEAN DEFAULT true;
ALTER TABLE weapons ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unknown' CHECK (verification_status IN ('verified','needs_review','conflicting','unknown'));
ALTER TABLE weapons ADD COLUMN IF NOT EXISTS source_url TEXT DEFAULT '';
ALTER TABLE weapons ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'unknown';
ALTER TABLE weapons ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

-- Helpful indexes (GIN for JSONB, plus common filters)
CREATE INDEX IF NOT EXISTS weapons_acquisition_methods_gin ON weapons USING GIN (acquisition_methods);
CREATE INDEX IF NOT EXISTS weapons_verification_status_idx ON weapons (verification_status);
CREATE INDEX IF NOT EXISTS weapons_release_date_idx ON weapons (release_date);

-- Comment for documentation
COMMENT ON COLUMN weapons.acquisition_methods IS 'JSONB array of acquisition methods: [{type, title, description, currency, price, permanent, region, version, status, source, sourceUrl, ...}]';
COMMENT ON COLUMN weapons.verification_status IS 'verified | needs_review | conflicting | unknown';
