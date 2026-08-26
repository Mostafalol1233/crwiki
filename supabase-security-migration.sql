-- CrossFire Wiki security migration
-- Review and apply this file in Supabase SQL Editor only after confirming the
-- live table names. The application now writes community data through verified
-- server endpoints using the service role; public clients need read access only.
-- This migration intentionally does not seed, delete, or replace content.

DO $$
DECLARE
  table_name text;
  policy_name text;
  public_read_tables text[] := ARRAY[
    'comments', 'seller_reviews', 'likes', 'video_likes', 'comment_likes',
    'forum_categories', 'forum_threads', 'forum_posts'
  ];
  protected_tables text[] := ARRAY[
    'comments', 'seller_reviews', 'likes', 'video_likes', 'comment_likes',
    'forum_categories', 'forum_threads', 'forum_posts', 'tickets', 'ticket_messages',
    'conversations', 'messages', 'announcements'
  ];
BEGIN
  FOREACH table_name IN ARRAY protected_tables LOOP
    IF to_regclass(format('public.%I', table_name)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);

    -- Remove policies from these legacy tables so an old USING(true) or
    -- WITH CHECK(true) policy cannot keep public mutations open.
    FOR policy_name IN
      SELECT pol.policyname
      FROM pg_policies pol
      WHERE pol.schemaname = 'public' AND pol.tablename = table_name
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name);
    END LOOP;

    EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.%I FROM anon, authenticated', table_name);

    IF table_name = ANY(public_read_tables) THEN
      EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon, authenticated', table_name);
      IF table_name = 'seller_reviews' THEN
        EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (approved = true)', 'crwiki_public_read_' || table_name, table_name);
      ELSIF table_name = 'comments' THEN
        EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (approved = true)', 'crwiki_public_read_' || table_name, table_name);
      ELSE
        EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)', 'crwiki_public_read_' || table_name, table_name);
      END IF;
    ELSE
      -- Tickets and ticket messages are private. They are read and written by
      -- server endpoints after ownership or admin authorization checks.
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', table_name);
    END IF;
  END LOOP;
END $$;

-- Announcements are public only while active and targeted at the public site.
-- All writes remain server-side through the service role.
DO $$
BEGIN
  IF to_regclass('public.announcements') IS NULL THEN
    RETURN;
  END IF;
  EXECUTE 'GRANT SELECT ON TABLE public.announcements TO anon, authenticated';
  EXECUTE 'CREATE POLICY crwiki_public_read_announcements ON public.announcements FOR SELECT TO anon, authenticated USING (active = true AND target IN (''all'', ''global''))';
END $$;

-- Keep the service role as the only database actor for private support data.
-- Supabase service_role bypasses RLS by design; no service credential belongs
-- in the browser bundle.
