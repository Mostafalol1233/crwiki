-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Add missing columns to site_settings table
-- Run this ONCE in your Supabase project → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS hero_image                          TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS featured_event_id                   TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS secondary_event_ids                 TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS review_verification_video_url       TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS review_verification_prompt          TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS review_verification_passphrase      TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS review_verification_timecode        TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS review_verification_you_tube_channel_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS portal_img_weapons                  TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS portal_img_maps                     TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS portal_img_mercenaries              TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS portal_img_modes                    TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS portal_img_ranks                    TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS portal_img_events                   TEXT DEFAULT '';

-- Verify columns were added:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'site_settings'
ORDER BY ordinal_position;
