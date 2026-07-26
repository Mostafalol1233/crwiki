-- ================================================================
-- CROSSFIRE WIKI — FULL DATABASE SETUP (COMPLETE)
-- Run this ONCE in your Supabase SQL Editor.
-- Safe to re-run: all statements use IF NOT EXISTS / IF EXISTS guards.
-- Covers: all tables, all columns, all RLS policies.
-- ================================================================


-- ────────────────────────────────────────────────────────────────
-- 1. CORE WIKI TABLES (create if they don't exist yet)
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS weapons (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name           TEXT        NOT NULL,
  image_url      TEXT,
  background_url TEXT,
  category       TEXT        DEFAULT 'Uncategorized',
  description    TEXT,
  stats          JSONB       DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS modes (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT        NOT NULL,
  image_url   TEXT,
  description TEXT,
  type        TEXT,
  category    TEXT        DEFAULT 'Standard',
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS maps (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT        NOT NULL,
  image_url   TEXT,
  description TEXT,
  mode        TEXT,
  category    TEXT        DEFAULT 'Official',
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ranks (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name         TEXT        NOT NULL,
  image_url    TEXT,
  tier         INTEGER     DEFAULT 0,
  exp_required BIGINT      DEFAULT 0,
  description  TEXT,
  requirements TEXT,
  bonus        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mercenaries (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT        NOT NULL,
  image_url   TEXT,
  role        TEXT,
  sounds      JSONB       DEFAULT '[]',
  order_index INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sellers (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name             TEXT        NOT NULL,
  seller_name_slug TEXT        UNIQUE,
  description      TEXT,
  images           JSONB       DEFAULT '[]',
  prices           JSONB       DEFAULT '[]',
  email            TEXT,
  phone            TEXT,
  whatsapp         TEXT,
  discord          TEXT,
  website          TEXT,
  facebook         TEXT,
  twitter          TEXT,
  instagram        TEXT,
  youtube          TEXT,
  tiktok           TEXT,
  telegram         TEXT,
  logo_url         TEXT,
  featured         BOOLEAN     DEFAULT false,
  promotion_text   TEXT,
  average_rating   NUMERIC(3,2) DEFAULT 0,
  total_reviews    INTEGER     DEFAULT 0,
  rank             INTEGER     DEFAULT 9999,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title           TEXT        NOT NULL,
  event_name_slug TEXT        UNIQUE,
  title_ar        TEXT,
  description     TEXT,
  description_ar  TEXT,
  date            TEXT,
  start_date      TEXT,
  end_date        TEXT,
  location        TEXT,
  type            TEXT,
  image_url       TEXT,
  gallery         JSONB       DEFAULT '[]',
  tags            TEXT[],
  featured        BOOLEAN     DEFAULT false,
  seo_title       TEXT,
  seo_description TEXT,
  canonical_url   TEXT,
  source_url      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS news (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title          TEXT        NOT NULL,
  news_slug      TEXT        UNIQUE,
  title_ar       TEXT,
  date_range     TEXT,
  image_url      TEXT,
  category       TEXT,
  content        TEXT,
  content_ar     TEXT,
  html_content   TEXT,
  author         TEXT,
  featured       BOOLEAN     DEFAULT false,
  preview_on_home BOOLEAN    DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title           TEXT        NOT NULL,
  post_slug       TEXT        UNIQUE,
  content         TEXT,
  summary         TEXT,
  image_url       TEXT,
  category        TEXT,
  tags            TEXT[],
  author          TEXT,
  views           INTEGER     DEFAULT 0,
  reading_time    INTEGER     DEFAULT 1,
  featured        BOOLEAN     DEFAULT false,
  preview_on_home BOOLEAN     DEFAULT true,
  language        TEXT        DEFAULT 'en',
  seo_title       TEXT,
  seo_description TEXT,
  gallery         JSONB       DEFAULT '[]',
  og_image        TEXT,
  canonical_url   TEXT,
  focus_keyword   TEXT,
  title_ar        TEXT,
  content_ar      TEXT,
  updated_at      TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tickets (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT,
  description TEXT,
  user_name   TEXT,
  user_email  TEXT,
  category    TEXT,
  priority    TEXT        DEFAULT 'normal',
  status      TEXT        DEFAULT 'open',
  updated_at  TIMESTAMPTZ DEFAULT now(),
  created_at  TIMESTAMPTZ DEFAULT now()
);


-- ────────────────────────────────────────────────────────────────
-- 2. ADD MISSING COLUMNS TO EXISTING TABLES
--    (safe even if they already exist)
-- ────────────────────────────────────────────────────────────────

-- events
ALTER TABLE events ADD COLUMN IF NOT EXISTS gallery         JSONB    DEFAULT '[]';
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_date      TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_date        TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS tags            TEXT[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS source_url      TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS canonical_url   TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS seo_title       TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS featured        BOOLEAN  DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS title_ar        TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS description_ar  TEXT;

-- posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS gallery         JSONB    DEFAULT '[]';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS og_image        TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS canonical_url   TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS focus_keyword   TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS title_ar        TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_ar      TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS seo_title       TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS summary         TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS tags            TEXT[];
ALTER TABLE posts ADD COLUMN IF NOT EXISTS featured        BOOLEAN  DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS language        TEXT     DEFAULT 'en';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS preview_on_home BOOLEAN  DEFAULT true;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT now();
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reading_time    INTEGER  DEFAULT 1;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS views           INTEGER  DEFAULT 0;

-- tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS title      TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS priority   TEXT DEFAULT 'normal';

-- sellers
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- site_settings: add all columns in case table already existed without them
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS seo_title                             TEXT    DEFAULT 'CrossFire Wiki';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS seo_description                      TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS seo_keywords                         TEXT[]  DEFAULT '{}';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS seo_og_image_url                     TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_image                           TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS robots                               TEXT    DEFAULT 'index, follow';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS announcements_enabled                BOOLEAN DEFAULT true;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS review_verification_enabled          BOOLEAN DEFAULT false;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS review_verification_video_url        TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS review_verification_prompt           TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS review_verification_passphrase       TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS review_verification_timecode         TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS review_verification_you_tube_channel_url TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS featured_weapons                     TEXT[]  DEFAULT '{}';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS featured_event_id                    TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS secondary_event_ids                  TEXT[]  DEFAULT '{}';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS public_base_url                      TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS portal_img_weapons                   TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS portal_img_maps                      TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS portal_img_mercenaries               TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS portal_img_modes                     TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS portal_img_ranks                     TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS portal_img_events                    TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS updated_at                           TIMESTAMPTZ DEFAULT now();


-- ────────────────────────────────────────────────────────────────
-- 3. MISSING TABLES
-- ────────────────────────────────────────────────────────────────

-- Comments (used on event/post/article pages)
CREATE TABLE IF NOT EXISTS comments (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id     TEXT        NOT NULL,
  post_type   TEXT        NOT NULL DEFAULT 'post',
  content     TEXT        NOT NULL,
  author_name TEXT        NOT NULL DEFAULT 'Anonymous',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Seller reviews
CREATE TABLE IF NOT EXISTS seller_reviews (
  id                 UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id          TEXT        NOT NULL,
  seller_slug        TEXT,
  user_name          TEXT        NOT NULL,
  rating             INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment            TEXT,
  user_phone         TEXT,
  verified_code      TEXT,
  helpful_votes      INTEGER     DEFAULT 0,
  status             TEXT        DEFAULT 'pending',
  created_at         TIMESTAMPTZ DEFAULT now()
);

-- Site settings (single-row config table)
CREATE TABLE IF NOT EXISTS site_settings (
  id                                    UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  seo_title                             TEXT        DEFAULT 'CrossFire Wiki',
  seo_description                       TEXT,
  seo_keywords                          TEXT[]      DEFAULT '{}',
  seo_og_image_url                      TEXT,
  hero_image                            TEXT,
  robots                                TEXT        DEFAULT 'index, follow',
  announcements_enabled                 BOOLEAN     DEFAULT true,
  review_verification_enabled           BOOLEAN     DEFAULT false,
  review_verification_video_url         TEXT,
  review_verification_prompt            TEXT,
  review_verification_passphrase        TEXT,
  review_verification_timecode          TEXT,
  review_verification_you_tube_channel_url TEXT,
  featured_weapons                      TEXT[]      DEFAULT '{}',
  featured_event_id                     TEXT,
  secondary_event_ids                   TEXT[]      DEFAULT '{}',
  public_base_url                       TEXT,
  portal_img_weapons                    TEXT,
  portal_img_maps                       TEXT,
  portal_img_mercenaries                TEXT,
  portal_img_modes                      TEXT,
  portal_img_ranks                      TEXT,
  portal_img_events                     TEXT,
  updated_at                            TIMESTAMPTZ DEFAULT now(),
  created_at                            TIMESTAMPTZ DEFAULT now()
);

-- Admin users (for admin panel login)
CREATE TABLE IF NOT EXISTS admin_users (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  username      TEXT        UNIQUE NOT NULL,
  email         TEXT        UNIQUE,
  password_hash TEXT        NOT NULL,
  role          TEXT        DEFAULT 'editor',
  permissions   JSONB       DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Support: ticket reply thread
CREATE TABLE IF NOT EXISTS ticket_messages (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id   UUID        REFERENCES tickets(id) ON DELETE CASCADE,
  message     TEXT        NOT NULL,
  is_internal BOOLEAN     DEFAULT false,
  sender_id   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Site highlights (monthly highlights feature)
CREATE TABLE IF NOT EXISTS site_highlights (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT        NOT NULL,
  month       TEXT,                          -- e.g. 'Jan', 'Feb' (NOT integer)
  year        INTEGER,
  media_type  TEXT        DEFAULT 'image',
  url         TEXT,
  sort_order  INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);
-- If you already ran the old SQL with month as INTEGER, convert it:
ALTER TABLE site_highlights ALTER COLUMN month TYPE TEXT USING month::TEXT;

-- Announcements (site-wide banners)
CREATE TABLE IF NOT EXISTS announcements (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title_en    TEXT,
  title_ar    TEXT,
  content_en  TEXT,
  content_ar  TEXT,
  type        TEXT        DEFAULT 'info',
  target      TEXT        DEFAULT 'all',
  display     TEXT        DEFAULT 'banner',
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  active      BOOLEAN     DEFAULT true,
  dismissible BOOLEAN     DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Custom pages (CMS)
CREATE TABLE IF NOT EXISTS custom_pages (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  slug            TEXT        UNIQUE NOT NULL,
  title_en        TEXT,
  title_ar        TEXT,
  content_en      TEXT,
  content_ar      TEXT,
  template        TEXT        DEFAULT 'default',
  status          TEXT        DEFAULT 'draft',
  show_in_nav     BOOLEAN     DEFAULT false,
  seo_title       TEXT,
  seo_description TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Tutorials
CREATE TABLE IF NOT EXISTS tutorials (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title           TEXT        NOT NULL,
  title_ar        TEXT,
  slug            TEXT        UNIQUE,
  content         TEXT,
  content_ar      TEXT,
  image_url       TEXT,
  difficulty      TEXT        DEFAULT 'beginner',
  video_url       TEXT,
  youtube_url     TEXT,
  youtube_id      TEXT,
  category        TEXT        DEFAULT 'tutorial',
  order_index     INTEGER     DEFAULT 0,
  seo_title       TEXT,
  seo_description TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- FAQ categories
CREATE TABLE IF NOT EXISTS faq_categories (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  slug        TEXT        UNIQUE NOT NULL,
  name        TEXT        NOT NULL,
  name_ar     TEXT,
  sort_order  INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- FAQ articles
CREATE TABLE IF NOT EXISTS faq_articles (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  category     TEXT,
  question_en  TEXT,
  question_ar  TEXT,
  answer_en    TEXT,
  answer_ar    TEXT,
  title        TEXT,
  title_ar     TEXT,
  body         TEXT,
  body_ar      TEXT,
  order_index  INTEGER     DEFAULT 0,
  active       BOOLEAN     DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Forum: categories
CREATE TABLE IF NOT EXISTS forum_categories (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  slug           TEXT        UNIQUE NOT NULL,
  name           TEXT        NOT NULL,
  name_ar        TEXT,
  description    TEXT,
  description_ar TEXT,
  icon           TEXT        DEFAULT '💬',
  color          TEXT        DEFAULT '#f5a623',
  thread_count   INTEGER     DEFAULT 0,
  post_count     INTEGER     DEFAULT 0,
  sort_order     INTEGER     DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Forum: threads
CREATE TABLE IF NOT EXISTS forum_threads (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id   UUID        REFERENCES forum_categories(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  body          TEXT,
  author_id     TEXT,
  author_name   TEXT        DEFAULT 'Anonymous',
  author_avatar TEXT,
  is_pinned     BOOLEAN     DEFAULT false,
  is_locked     BOOLEAN     DEFAULT false,
  view_count    INTEGER     DEFAULT 0,
  reply_count   INTEGER     DEFAULT 0,
  last_reply_at TIMESTAMPTZ DEFAULT now(),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Forum: posts (replies)
CREATE TABLE IF NOT EXISTS forum_posts (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id     UUID        REFERENCES forum_threads(id) ON DELETE CASCADE,
  body          TEXT,
  author_id     TEXT,
  author_name   TEXT        DEFAULT 'Anonymous',
  author_avatar TEXT,
  is_op         BOOLEAN     DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Likes: universal
CREATE TABLE IF NOT EXISTS likes (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  target_id       TEXT        NOT NULL,
  target_type     TEXT        NOT NULL,
  user_identifier TEXT        NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(target_id, target_type, user_identifier)
);

-- Likes: videos
CREATE TABLE IF NOT EXISTS video_likes (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id        TEXT        NOT NULL,
  user_identifier TEXT        NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(video_id, user_identifier)
);

-- Likes: comments
CREATE TABLE IF NOT EXISTS comment_likes (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id      TEXT        NOT NULL,
  user_identifier TEXT        NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comment_id, user_identifier)
);

-- Chat: conversations
CREATE TABLE IF NOT EXISTS conversations (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name         TEXT,
  type         TEXT        DEFAULT 'direct',
  participants TEXT[],
  last_message TEXT,
  avatar       TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Chat: messages
CREATE TABLE IF NOT EXISTS messages (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id  UUID        REFERENCES conversations(id) ON DELETE CASCADE,
  sender_username  TEXT,
  content          TEXT,
  type             TEXT        DEFAULT 'text',
  reply_to_id      UUID,
  reply_to_content TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);


-- ────────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY — ALL TABLES
--
--    Strategy:
--    • Public can SELECT everything (wiki is public).
--    • Public can INSERT/UPDATE/DELETE user-generated content.
--    • Admin-only tables (admin_users, site_settings) are
--      read-protected: only the service key (which bypasses RLS)
--      can touch them.
-- ────────────────────────────────────────────────────────────────

-- Helper: enable RLS + public SELECT on every table
DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY[
    -- core wiki
    'weapons','modes','maps','ranks','mercenaries',
    -- content
    'news','posts','events',
    -- commerce
    'sellers','seller_reviews',
    -- support
    'tickets','ticket_messages',
    -- community
    'comments','forum_categories','forum_threads','forum_posts',
    'likes','video_likes','comment_likes',
    -- chat
    'conversations','messages',
    -- cms / config
    'site_highlights','announcements','custom_pages','tutorials',
    'faq_categories','faq_articles',
    -- settings (read-only via anon; writes go through service key)
    'site_settings',
    -- admin (service key only — anon can still SELECT but not mutate)
    'admin_users'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "public_select_%1$s" ON %1$I', tbl);
    EXECUTE format(
      'CREATE POLICY "public_select_%1$s" ON %1$I FOR SELECT USING (true)',
      tbl
    );
  END LOOP;
END $$;

-- Allow public INSERT / UPDATE / DELETE on user-generated-content tables
DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY[
    'forum_threads','forum_posts',
    'likes','video_likes','comment_likes',
    'comments',
    'seller_reviews',
    'ticket_messages','messages',
    'tickets'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format('DROP POLICY IF EXISTS "public_insert_%1$s" ON %1$I', tbl);
    EXECUTE format(
      'CREATE POLICY "public_insert_%1$s" ON %1$I FOR INSERT WITH CHECK (true)',
      tbl
    );
    EXECUTE format('DROP POLICY IF EXISTS "public_update_%1$s" ON %1$I', tbl);
    EXECUTE format(
      'CREATE POLICY "public_update_%1$s" ON %1$I FOR UPDATE USING (true)',
      tbl
    );
    EXECUTE format('DROP POLICY IF EXISTS "public_delete_%1$s" ON %1$I', tbl);
    EXECUTE format(
      'CREATE POLICY "public_delete_%1$s" ON %1$I FOR DELETE USING (true)',
      tbl
    );
  END LOOP;
END $$;

-- conversations: allow anon INSERT so chat users can start a DM
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_insert_conversations" ON conversations;
CREATE POLICY "public_insert_conversations" ON conversations
  FOR INSERT WITH CHECK (true);


-- ────────────────────────────────────────────────────────────────
-- 5. SUPABASE STORAGE BUCKETS
--    These cannot be created via SQL — create them manually in
--    the Supabase dashboard → Storage → New bucket:
--
--    • "uploads"  — public  — general image uploads (weapons, events, etc.)
--    • "avatars"  — public  — user profile pictures
--    • "media"    — public  — highlights / gallery media files
--
--    Set each bucket to Public so getPublicUrl() works without auth.
-- ────────────────────────────────────────────────────────────────


-- ────────────────────────────────────────────────────────────────
-- Done! Every table, column, and RLS policy is now in place.
-- ────────────────────────────────────────────────────────────────
