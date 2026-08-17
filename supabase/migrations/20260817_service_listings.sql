-- Editable service directory records.
-- Public pages read published rows; the existing authenticated admin workflow
-- can manage rows through the same Supabase client conventions as sellers.

CREATE TABLE IF NOT EXISTS service_listings (
  id                    UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_name            TEXT        NOT NULL,
  seller_slug            TEXT,
  service_name           TEXT        NOT NULL,
  service_name_ar        TEXT,
  profile_url            TEXT,
  price_snapshot         TEXT,
  price_snapshot_ar      TEXT,
  observed_at_label      TEXT,
  observed_at_label_ar   TEXT,
  confidence             TEXT        DEFAULT 'unverified' CHECK (confidence IN ('higher', 'limited', 'unverified')),
  note                   TEXT,
  note_ar                TEXT,
  media_url              TEXT,
  gallery                JSONB       DEFAULT '[]'::jsonb,
  media_source           TEXT,
  media_source_ar        TEXT,
  contacts               JSONB       DEFAULT '{}'::jsonb,
  published              BOOLEAN     DEFAULT true,
  featured               BOOLEAN     DEFAULT false,
  sort_order             INTEGER     DEFAULT 9999,
  source_url             TEXT,
  source_checked_at      TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE service_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_service_listings" ON service_listings;
CREATE POLICY "public_select_service_listings"
  ON service_listings FOR SELECT
  USING (published = true);

CREATE INDEX IF NOT EXISTS service_listings_published_order_idx
  ON service_listings (published, sort_order, created_at DESC);

CREATE INDEX IF NOT EXISTS service_listings_seller_slug_idx
  ON service_listings (seller_slug);

COMMENT ON TABLE service_listings IS 'Editable CrossFire service directory records with bilingual copy, source references, media, and contact/social links.';
