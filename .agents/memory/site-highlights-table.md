---
name: site_highlights Supabase table
description: Schema and usage for the site_highlights table that powers the homepage HighlightsSection carousel.
---

**Table:** `site_highlights`

**Columns:**
- `id` — uuid, primary key, default gen_random_uuid()
- `title` — text, not null
- `month` — text (e.g. "Jan", "Apr")
- `year` — integer
- `media_type` — text, either 'image' or 'video'
- `url` — text (Supabase Storage public URL or external CDN)
- `sort_order` — integer (lower = first)
- `created_at` — timestamptz, default now()

**Usage:**
- `HighlightsSection.tsx` fetches using anon client (`supabase`), falls back to static data if table is empty or missing.
- `HighlightsManager.tsx` (admin page) reads with anon client, writes/deletes with service role client (`supabaseService`).
- Video files upload to Supabase Storage `media` bucket under `highlights/` prefix.
- Admin route: `/admin/highlights`

**Why:** Allows the admin to manage carousel items (add/delete/reorder) without code changes, and supports both image and local video uploads (not just YouTube embeds).

**How to apply:** If the table doesn't exist yet, create it in Supabase SQL editor with the schema above and enable RLS with anon-read policy.
