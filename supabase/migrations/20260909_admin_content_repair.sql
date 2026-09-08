-- CrossFire Wiki: repair admin-managed content tables and public interaction tables.
-- Safe to run repeatedly. It does not expose or depend on service-role credentials.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.site_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  month text NOT NULL DEFAULT '',
  year integer NOT NULL DEFAULT EXTRACT(YEAR FROM now())::integer,
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  url text NOT NULL DEFAULT '',
  sort_order bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_highlights ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.site_highlights ADD COLUMN IF NOT EXISTS month text;
ALTER TABLE public.site_highlights ADD COLUMN IF NOT EXISTS year integer;
ALTER TABLE public.site_highlights ADD COLUMN IF NOT EXISTS media_type text;
ALTER TABLE public.site_highlights ADD COLUMN IF NOT EXISTS url text;
ALTER TABLE public.site_highlights ADD COLUMN IF NOT EXISTS sort_order bigint;
ALTER TABLE public.site_highlights ADD COLUMN IF NOT EXISTS created_at timestamptz;

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text,
  title_ar text,
  content_en text,
  content_ar text,
  type text NOT NULL DEFAULT 'info',
  target text NOT NULL DEFAULT 'global',
  display text NOT NULL DEFAULT 'banner',
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  dismissible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id text NOT NULL,
  target_type text NOT NULL DEFAULT 'post',
  user_identifier text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (target_id, target_type, user_identifier)
);

CREATE TABLE IF NOT EXISTS public.video_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id text NOT NULL,
  user_identifier text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (video_id, user_identifier)
);

CREATE TABLE IF NOT EXISTS public.comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id text NOT NULL,
  user_identifier text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_identifier)
);

ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS title_ar text DEFAULT '';
ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS content text DEFAULT '';
ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS content_ar text DEFAULT '';
ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS image_url text DEFAULT '';
ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS video_url text DEFAULT '';
ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS youtube_url text DEFAULT '';
ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS youtube_id text DEFAULT '';
ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS category text DEFAULT 'tutorial';
ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS order_index bigint DEFAULT 0;
ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS seo_title text DEFAULT '';
ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS seo_description text DEFAULT '';

CREATE INDEX IF NOT EXISTS site_highlights_period_idx ON public.site_highlights (year DESC, month, sort_order);
CREATE INDEX IF NOT EXISTS announcements_active_target_idx ON public.announcements (target, active, created_at DESC);
CREATE INDEX IF NOT EXISTS video_likes_video_idx ON public.video_likes (video_id);
CREATE INDEX IF NOT EXISTS likes_target_idx ON public.likes (target_id, target_type);
CREATE INDEX IF NOT EXISTS tutorials_category_created_idx ON public.tutorials (category, created_at DESC);

ALTER TABLE public.site_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "public_read_site_highlights" ON public.site_highlights;
  CREATE POLICY "public_read_site_highlights" ON public.site_highlights FOR SELECT USING (true);
  DROP POLICY IF EXISTS "public_read_active_announcements" ON public.announcements;
  CREATE POLICY "public_read_active_announcements" ON public.announcements FOR SELECT USING (active = true);
  DROP POLICY IF EXISTS "public_insert_likes" ON public.likes;
  CREATE POLICY "public_insert_likes" ON public.likes FOR INSERT WITH CHECK (true);
  DROP POLICY IF EXISTS "public_delete_likes" ON public.likes;
  CREATE POLICY "public_delete_likes" ON public.likes FOR DELETE USING (true);
  DROP POLICY IF EXISTS "public_insert_video_likes" ON public.video_likes;
  CREATE POLICY "public_insert_video_likes" ON public.video_likes FOR INSERT WITH CHECK (true);
  DROP POLICY IF EXISTS "public_delete_video_likes" ON public.video_likes;
  CREATE POLICY "public_delete_video_likes" ON public.video_likes FOR DELETE USING (true);
  DROP POLICY IF EXISTS "public_insert_comment_likes" ON public.comment_likes;
  CREATE POLICY "public_insert_comment_likes" ON public.comment_likes FOR INSERT WITH CHECK (true);
  DROP POLICY IF EXISTS "public_delete_comment_likes" ON public.comment_likes;
  CREATE POLICY "public_delete_comment_likes" ON public.comment_likes FOR DELETE USING (true);
END $$;

-- Remove the obsolete global banner only. Seller announcements and normal posts remain intact.
DELETE FROM public.announcements WHERE target IN ('global', 'all');
DELETE FROM public.posts
WHERE category = '__ANNOUNCEMENT__'
  AND tags @> ARRAY['global']::text[];

COMMENT ON TABLE public.site_highlights IS 'Homepage monthly highlights managed from the admin dashboard';
COMMENT ON TABLE public.video_likes IS 'One like per video and user identifier';
COMMENT ON TABLE public.announcements IS 'Active public announcements; admin writes use the protected server boundary';

-- Replace stale homepage highlights with current September 2026 official CrossFire West items.
DELETE FROM public.site_highlights;
INSERT INTO public.site_highlights (title, month, year, media_type, url, sort_order) VALUES
  ('Hidden Clues Hunt — September 8–14, 2026', 'Sep', 2026, 'image', 'https://z8games.akamaized.net/cfna/web/main/Forum/260904_cfwe_scavengerhunt_forum.jpg', 1),
  ('Mercenary Pass Season 62: Fall Line', 'Sep', 2026, 'image', 'https://z8games.akamaized.net/cfna/web/main/Forum/260813_cfwe_bp_sep_main_forum.jpg', 2),
  ('Sentient Scholars — September 2 to October 6, 2026', 'Sep', 2026, 'image', 'https://z8games.akamaized.net/cfna/web/main/Forum/260812_cfwe_qbz191s_endlessfury_forum.jpg', 3),
  ('Voyage of the Orca — September 1–14, 2026', 'Sep', 2026, 'image', 'https://z8games.akamaized.net/cfna/web/main/Forum/260826_cfwe_orca_crate_forum.jpg', 4),
  ('Prime Surge Bonus — September 1–30, 2026', 'Sep', 2026, 'image', 'https://z8games.akamaized.net/cfna/web/main/Forum/260826_cfwe_zppubonus_forum.jpg', 5),
  ('Graffiti Getaway — September Weekends', 'Sep', 2026, 'image', 'https://z8games.akamaized.net/cfna/web/main/Forum/260831_cfwe_weekendparty_forums.jpg', 6);

-- Add verified recent CrossFire videos without duplicating existing tutorial records.
INSERT INTO public.tutorials (title, title_ar, slug, content, content_ar, image_url, youtube_url, youtube_id, category, order_index, seo_title, seo_description)
SELECT v.title, v.title_ar, v.slug, v.content, v.content_ar, v.image_url, v.youtube_url, v.youtube_id, v.category, v.order_index, v.seo_title, v.seo_description
FROM (VALUES
  ('CFS 2026 Regional Qualifiers EUMENA — Day 1 Highlights', 'أبرز لقطات تصفيات CFS 2026 الإقليمية — اليوم الأول', 'cfs-2026-eumena-day-1-highlights', 'Official Day 1 highlights from the CFS 2026 EUMENA Regional Qualifiers.', 'أبرز لقطات اليوم الأول من تصفيات CFS 2026 لمنطقة أوروبا والشرق الأوسط وشمال أفريقيا.', 'https://i.ytimg.com/vi/dEGACFrjGEw/hqdefault.jpg', 'https://www.youtube.com/watch?v=dEGACFrjGEw', 'dEGACFrjGEw', 'highlights', 1, 'CFS 2026 EUMENA Day 1 Highlights | CrossFire Wiki', 'Watch the official CFS 2026 EUMENA Regional Qualifiers Day 1 highlights and key CrossFire esports moments.'),
  ('CFS 2026 Regional Qualifiers EUMENA — Day 2 Highlights', 'أبرز لقطات تصفيات CFS 2026 الإقليمية — اليوم الثاني', 'cfs-2026-eumena-day-2-highlights', 'Official Day 2 highlights from the CFS 2026 EUMENA Regional Qualifiers.', 'أبرز لقطات اليوم الثاني من تصفيات CFS 2026 لمنطقة أوروبا والشرق الأوسط وشمال أفريقيا.', 'https://i.ytimg.com/vi/DwO2cvPoeW4/hqdefault.jpg', 'https://www.youtube.com/watch?v=DwO2cvPoeW4', 'DwO2cvPoeW4', 'highlights', 2, 'CFS 2026 EUMENA Day 2 Highlights | CrossFire Wiki', 'Watch the official CFS 2026 EUMENA Regional Qualifiers Day 2 highlights and match moments.'),
  ('CFS 2026 Regional Qualifiers EUMENA — Day 3 Highlights', 'أبرز لقطات تصفيات CFS 2026 الإقليمية — اليوم الثالث', 'cfs-2026-eumena-day-3-highlights', 'Official Day 3 highlights from the CFS 2026 EUMENA Regional Qualifiers.', 'أبرز لقطات اليوم الثالث من تصفيات CFS 2026 لمنطقة أوروبا والشرق الأوسط وشمال أفريقيا.', 'https://i.ytimg.com/vi/EjWagVgt8MQ/hqdefault.jpg', 'https://www.youtube.com/watch?v=EjWagVgt8MQ', 'EjWagVgt8MQ', 'highlights', 3, 'CFS 2026 EUMENA Day 3 Highlights | CrossFire Wiki', 'Watch the official CFS 2026 EUMENA Regional Qualifiers Day 3 highlights and turning points.'),
  ('CrossFire West — Vixen Character Gameplay in ZM Void Rift', 'أسلوب لعب شخصية Vixen في خريطة ZM Void Rift', 'crossfire-west-vixen-zm-void-rift-gameplay', 'CrossFire West character gameplay featuring Vixen in ZM Void Rift.', 'فيديو لأسلوب لعب شخصية Vixen في وضع الزومبي داخل خريطة ZM Void Rift.', 'https://i.ytimg.com/vi/dqRX5JNlOyg/hqdefault.jpg', 'https://www.youtube.com/watch?v=dqRX5JNlOyg', 'dqRX5JNlOyg', 'game-weapons', 4, 'CrossFire West Vixen Gameplay in ZM Void Rift | CrossFire Wiki', 'Explore CrossFire West Vixen character gameplay in the ZM Void Rift zombie mode map.'),
  ('CrossFire West Lapis — September 2026 Showcase', 'عرض Lapis في CrossFire West — سبتمبر 2026', 'crossfire-west-lapis-september-2026', 'A September 2026 CrossFire West Lapis showcase and discussion.', 'عرض حديث لمحتوى Lapis في CrossFire West خلال سبتمبر 2026.', 'https://i.ytimg.com/vi/69cSYqonhwQ/hqdefault.jpg', 'https://www.youtube.com/watch?v=69cSYqonhwQ', '69cSYqonhwQ', 'game-weapons', 5, 'CrossFire West Lapis September 2026 | CrossFire Wiki', 'Review the September 2026 CrossFire West Lapis showcase and related weapon discussion.')
) AS v(title, title_ar, slug, content, content_ar, image_url, youtube_url, youtube_id, category, order_index, seo_title, seo_description)
WHERE NOT EXISTS (SELECT 1 FROM public.tutorials t WHERE t.youtube_id = v.youtube_id);
