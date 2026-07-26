---
name: Gallery + Editor upgrades
description: Gallery JSONB column migration, TipTap font color and HTML insert additions.
---

## Gallery column

Events and posts need `gallery JSONB DEFAULT '[]'` column added to Supabase.
SQL file: `supabase/migrations/add_gallery_column.sql`
Admin Dashboard detects missing column and shows a banner with the SQL to run.

**Why:** Supabase JS client cannot run DDL directly; column must be added manually or via migration.

**How to apply:** If events/posts gallery not saving, check the Dashboard banner. Run the two-line ALTER TABLE SQL in Supabase SQL editor.

## TipTap @tiptap/extension-color

Package requires `--legacy-peer-deps` to install because it resolves to @tiptap/core@3.29.0 while project uses @tiptap/core@3.25.0.
Install command: `npm install --legacy-peer-deps @tiptap/extension-color@3.25.0 @tiptap/extension-text-style@3.25.0`

**Why:** Without pinning to 3.25.0, npm resolves 3.29.0 which conflicts with existing TipTap packages.

## Key components

- `client/src/components/GallerySection.tsx` — public gallery display with zoom overlay, thumbnail strip, navigation arrows
- `client/src/components/admin/GalleryManager.tsx` — admin drag-to-reorder gallery items editor
- TipTapEditor gains: Palette (text color picker with 15 presets + custom color input), FileCode (raw HTML insert textarea)
