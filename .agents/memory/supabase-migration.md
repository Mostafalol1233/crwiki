---
name: Supabase migration
description: MongoDB was killed, entire app migrated to Supabase (PostgreSQL). Frontend calls Supabase directly via supabaseApi.ts. No Express backend.
---

## Rule
All data access goes through `client/src/lib/supabaseApi.ts` (Supabase JS client). Never use `fetch('/api/...')` or `apiRequest()` for public data — those hit the dead Express backend.

**Why:** MongoDB Atlas cluster is dead and unreachable. Express backend in `backend-deploy-full/` is no longer started. `npm run dev` now runs Vite directly (`node_modules/.bin/vite --port 5000 --host 0.0.0.0`).

## Key files
- `client/src/lib/supabase.ts` — Supabase client (uses `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`)
- `client/src/lib/supabaseApi.ts` — full data access layer (weapons, modes, maps, ranks, mercenaries, posts, news, events, FAQ, sellers, seller_reviews, tutorials, tickets, comments, auth, settings)
- `supabase-schema.sql` — full schema to run in Supabase SQL editor (must be run before app works)
- `scripts/migrate-to-supabase.js` — seeds rescued static data (requires `SUPABASE_SERVICE_KEY`)

## How to apply
1. Go to Supabase dashboard > SQL editor > run `supabase-schema.sql`
2. Run migration: `SUPABASE_SERVICE_KEY=<service_role_key> node scripts/migrate-to-supabase.js`
3. App will work with data from Supabase tables

## What still uses old API (admin-only, non-blocking)
- `client/src/pages/Admin.tsx` — admin CRUD (not yet migrated, admin panel not functional)
- `client/src/components/AdvancedContentManager.tsx` — admin content management
- `client/src/components/AnnouncementModal.tsx` — seller/global announcements (gracefully fails)
- `client/src/pages/Chat.tsx` — real-time chat (not migrated)
- `client/src/pages/ResetPassword.tsx` — password reset (uses Supabase auth can replace)
