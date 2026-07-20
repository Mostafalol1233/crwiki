-- CrossFire Wiki - Supabase Schema
-- Run this in your Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/qywburkldwdkegztsgjj/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Weapons ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weapons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  background_url TEXT DEFAULT '',
  category TEXT DEFAULT 'Uncategorized',
  description TEXT DEFAULT '',
  stats JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS weapons_name_idx ON weapons(name);
CREATE INDEX IF NOT EXISTS weapons_category_idx ON weapons(category);

-- ─── Modes ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS modes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  description TEXT DEFAULT '',
  type TEXT DEFAULT '',
  category TEXT DEFAULT 'Standard',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Maps ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  description TEXT DEFAULT '',
  mode TEXT DEFAULT '',
  category TEXT DEFAULT 'Official',
  wiki_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS maps_name_idx ON maps(name);

-- ─── Ranks ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ranks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  tier INTEGER DEFAULT 0,
  exp_required INTEGER DEFAULT 0,
  description TEXT DEFAULT '',
  requirements TEXT DEFAULT '',
  bonus TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Mercenaries ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mercenaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  role TEXT DEFAULT '',
  sounds TEXT[] DEFAULT '{}',
  order_index INTEGER DEFAULT 9999,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Posts ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  post_slug TEXT DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  summary TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  images TEXT[] DEFAULT '{}',
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  author TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  reading_time INTEGER DEFAULT 1,
  featured BOOLEAN DEFAULT FALSE,
  preview_on_home BOOLEAN DEFAULT TRUE,
  language TEXT DEFAULT 'en',
  seo_title TEXT DEFAULT '',
  seo_description TEXT DEFAULT '',
  seo_keywords TEXT[] DEFAULT '{}',
  canonical_url TEXT DEFAULT '',
  og_image TEXT DEFAULT '',
  source_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS posts_slug_idx ON posts(post_slug);
CREATE INDEX IF NOT EXISTS posts_category_idx ON posts(category);

-- ─── News ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  news_slug TEXT DEFAULT '',
  title_ar TEXT DEFAULT '',
  date_range TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  images TEXT[] DEFAULT '{}',
  category TEXT NOT NULL,
  content TEXT DEFAULT '',
  content_ar TEXT DEFAULT '',
  html_content TEXT DEFAULT '',
  raw_html_content TEXT DEFAULT '',
  author TEXT NOT NULL,
  featured BOOLEAN DEFAULT FALSE,
  preview_on_home BOOLEAN DEFAULT TRUE,
  seo_title TEXT DEFAULT '',
  seo_description TEXT DEFAULT '',
  seo_keywords TEXT[] DEFAULT '{}',
  canonical_url TEXT DEFAULT '',
  source_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS news_slug_idx ON news(news_slug);

-- ─── Events ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  event_name_slug TEXT DEFAULT '',
  title_ar TEXT DEFAULT '',
  description TEXT DEFAULT '',
  description_ar TEXT DEFAULT '',
  raw_html_content TEXT DEFAULT '',
  date TEXT NOT NULL DEFAULT '',
  location TEXT DEFAULT '',
  type TEXT NOT NULL DEFAULT 'community',
  image_url TEXT DEFAULT '',
  images TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT FALSE,
  seo_title TEXT DEFAULT '',
  seo_description TEXT DEFAULT '',
  canonical_url TEXT DEFAULT '',
  source_url TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 9999,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS events_slug_idx ON events(event_name_slug);

-- ─── FAQ Categories ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS faq_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_ar TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faq_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES faq_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT DEFAULT '',
  body TEXT DEFAULT '',
  body_ar TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Sellers ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sellers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  seller_name_slug TEXT DEFAULT '',
  description TEXT DEFAULT '',
  images TEXT[] DEFAULT '{}',
  prices JSONB DEFAULT '[]',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  discord TEXT DEFAULT '',
  website TEXT DEFAULT '',
  facebook TEXT DEFAULT '',
  twitter TEXT DEFAULT '',
  instagram TEXT DEFAULT '',
  youtube TEXT DEFAULT '',
  tiktok TEXT DEFAULT '',
  telegram TEXT DEFAULT '',
  featured BOOLEAN DEFAULT FALSE,
  promotion_text TEXT DEFAULT '',
  average_rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 9999,
  seo_title TEXT DEFAULT '',
  seo_description TEXT DEFAULT '',
  og_image TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Seller Reviews ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seller_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_phone TEXT DEFAULT '',
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Tutorials ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tutorials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  youtube_url TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  category TEXT DEFAULT 'tutorial',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Tickets ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'normal',
  category TEXT NOT NULL,
  media_url TEXT DEFAULT '',
  media_type TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  media_url TEXT DEFAULT '',
  media_type TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Comments ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id TEXT NOT NULL,
  post_type TEXT DEFAULT 'post',
  content TEXT NOT NULL,
  author_name TEXT NOT NULL,
  approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS comments_post_idx ON comments(post_id);

-- ─── Newsletter ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Site Settings ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_verification_enabled BOOLEAN DEFAULT FALSE,
  announcements_enabled BOOLEAN DEFAULT TRUE,
  seo_title TEXT DEFAULT 'CrossFire Wiki',
  seo_description TEXT DEFAULT 'Comprehensive CrossFire gaming wiki and community hub',
  seo_keywords TEXT[] DEFAULT '{}',
  seo_og_image_url TEXT DEFAULT '',
  robots TEXT DEFAULT 'index, follow',
  featured_weapons TEXT[] DEFAULT '{}',
  public_base_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Site Highlights ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_highlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL DEFAULT '',
  month TEXT DEFAULT '',
  year INTEGER DEFAULT 2025,
  media_type TEXT DEFAULT 'image',
  url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Likes (universal: videos, comments, posts) ───────────────────────────────
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_id TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'post',
  user_identifier TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(target_id, target_type, user_identifier)
);
CREATE INDEX IF NOT EXISTS likes_target_idx ON likes(target_id, target_type);

-- ─── Video Likes ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS video_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id TEXT NOT NULL,
  user_identifier TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(video_id, user_identifier)
);
CREATE INDEX IF NOT EXISTS video_likes_video_idx ON video_likes(video_id);

-- ─── Comment Likes ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_identifier TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_identifier)
);

-- ─── Row Level Security (RLS) ─────────────────────────────────────────────────
-- Enable RLS on all tables
ALTER TABLE weapons ENABLE ROW LEVEL SECURITY;
ALTER TABLE modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE mercenaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Public read access for content tables
CREATE POLICY "Public read weapons" ON weapons FOR SELECT USING (true);
CREATE POLICY "Public read modes" ON modes FOR SELECT USING (true);
CREATE POLICY "Public read maps" ON maps FOR SELECT USING (true);
CREATE POLICY "Public read ranks" ON ranks FOR SELECT USING (true);
CREATE POLICY "Public read mercenaries" ON mercenaries FOR SELECT USING (true);
CREATE POLICY "Public read posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Public read news" ON news FOR SELECT USING (true);
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);
CREATE POLICY "Public read faq_categories" ON faq_categories FOR SELECT USING (true);
CREATE POLICY "Public read faq_articles" ON faq_articles FOR SELECT USING (true);
CREATE POLICY "Public read sellers" ON sellers FOR SELECT USING (true);
CREATE POLICY "Public read approved seller reviews" ON seller_reviews FOR SELECT USING (approved = true);
CREATE POLICY "Public read tutorials" ON tutorials FOR SELECT USING (true);
CREATE POLICY "Public read site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Public read approved comments" ON comments FOR SELECT USING (approved = true);

-- Public insert for user actions
CREATE POLICY "Anyone can submit ticket" ON tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can subscribe newsletter" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can add comment" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can submit seller review" ON seller_reviews FOR INSERT WITH CHECK (true);

-- New tables RLS
CREATE POLICY "Public read site_highlights" ON site_highlights FOR SELECT USING (true);
CREATE POLICY "Public read likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Anyone can add like" ON likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can remove own like" ON likes FOR DELETE USING (true);
CREATE POLICY "Public read video_likes" ON video_likes FOR SELECT USING (true);
CREATE POLICY "Anyone can add video like" ON video_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can remove video like" ON video_likes FOR DELETE USING (true);
CREATE POLICY "Public read comment_likes" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "Anyone can add comment like" ON comment_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can remove comment like" ON comment_likes FOR DELETE USING (true);
