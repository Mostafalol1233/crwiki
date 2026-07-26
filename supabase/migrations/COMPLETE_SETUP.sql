-- ================================================================
-- CROSSFIRE WIKI — COMPLETE DATABASE SETUP
-- Run this ONCE in your Supabase SQL Editor to enable every feature.
-- Safe to re-run: all statements use IF NOT EXISTS / IF EXISTS guards.
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- 1. ADD MISSING COLUMNS TO EXISTING TABLES
-- ────────────────────────────────────────────────────────────────

-- events: gallery images, countdown dates, tags
ALTER TABLE events ADD COLUMN IF NOT EXISTS gallery      JSONB    DEFAULT '[]';
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_date   TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_date     TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS tags         TEXT[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS source_url   TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS seo_title    TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS featured     BOOLEAN  DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS title_ar     TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS description_ar TEXT;

-- posts: gallery images, bilingual SEO, OG image
ALTER TABLE posts ADD COLUMN IF NOT EXISTS gallery        JSONB    DEFAULT '[]';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS og_image       TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS canonical_url  TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS focus_keyword  TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS title_ar       TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_ar     TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS seo_title      TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS summary        TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS tags           TEXT[];
ALTER TABLE posts ADD COLUMN IF NOT EXISTS featured       BOOLEAN  DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS language       TEXT     DEFAULT 'en';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS preview_on_home BOOLEAN DEFAULT true;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ DEFAULT now();

-- tickets: title + updated_at
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS title        TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ DEFAULT now();

-- sellers: logo_url column
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS logo_url     TEXT;

-- ────────────────────────────────────────────────────────────────
-- 2. CREATE MISSING TABLES
-- ────────────────────────────────────────────────────────────────

-- Support: ticket messages (admin reply thread)
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
  month       INTEGER,
  year        INTEGER,
  media_type  TEXT        DEFAULT 'image',
  url         TEXT,
  sort_order  INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

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

-- Custom pages (CMS pages)
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
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  slug         TEXT        UNIQUE NOT NULL,
  name         TEXT        NOT NULL,
  name_ar      TEXT,
  description  TEXT,
  description_ar TEXT,
  icon         TEXT        DEFAULT '💬',
  color        TEXT        DEFAULT '#f5a623',
  thread_count INTEGER     DEFAULT 0,
  post_count   INTEGER     DEFAULT 0,
  sort_order   INTEGER     DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
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
-- 3. ROW LEVEL SECURITY
-- Public can read everything; public can insert user-generated content;
-- admin (service key) can do anything (service key bypasses RLS).
-- ────────────────────────────────────────────────────────────────

DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY[
    'ticket_messages','site_highlights','announcements','custom_pages',
    'tutorials','faq_categories','faq_articles',
    'forum_categories','forum_threads','forum_posts',
    'likes','video_likes','comment_likes',
    'conversations','messages'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    -- Drop & recreate public-read policy (idempotent)
    EXECUTE format('DROP POLICY IF EXISTS "public_select_%1$s" ON %1$I', tbl);
    EXECUTE format('CREATE POLICY "public_select_%1$s" ON %1$I FOR SELECT USING (true)', tbl);
  END LOOP;
END $$;

-- Allow public inserts for user-generated content tables
DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY[
    'forum_threads','forum_posts',
    'likes','video_likes','comment_likes',
    'ticket_messages','messages'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format('DROP POLICY IF EXISTS "public_insert_%1$s" ON %1$I', tbl);
    EXECUTE format('CREATE POLICY "public_insert_%1$s" ON %1$I FOR INSERT WITH CHECK (true)', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "public_delete_%1$s" ON %1$I', tbl);
    EXECUTE format('CREATE POLICY "public_delete_%1$s" ON %1$I FOR DELETE USING (true)', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "public_update_%1$s" ON %1$I', tbl);
    EXECUTE format('CREATE POLICY "public_update_%1$s" ON %1$I FOR UPDATE USING (true)', tbl);
  END LOOP;
END $$;

-- ────────────────────────────────────────────────────────────────
-- Done! All tables and columns are now set up.
-- ────────────────────────────────────────────────────────────────
