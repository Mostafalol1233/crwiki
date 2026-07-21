---
name: Admin auth security
description: How admin login is secured; remaining known risks with the service key in the client bundle.
---

## Rule
Admin password comparison (ADMIN_PASSWORD and bcrypt for admin_users rows) happens in the Vite server plugin `cfAdminAuthPlugin()` at `/api/admin/login`. The client calls this endpoint — plaintext passwords and hashes never reach the browser.

**Why:** VITE_ADMIN_PASSWORD was previously compared client-side (visible in DevTools). Any visitor could extract it.

**How to apply:** `adminLogin()` in `supabaseAdmin.ts` just POSTs to `/api/admin/login`. The plugin reads `process.env.ADMIN_PASSWORD` and `process.env.VITE_ADMIN_PASSWORD` (both work from the server side).

## Known remaining risk
`VITE_SUPABASE_SERVICE_KEY` is still in the client bundle because `supabaseService` is imported by admin CRUD pages (Dashboard, WeaponsManager, etc.) to bypass RLS. Anyone who inspects the JS bundle can extract this key and bypass all Supabase RLS.

**Long-term fix:** proxy all admin writes through server-side endpoints so the service key lives only in `process.env.SUPABASE_SERVICE_KEY` (no VITE_ prefix = not bundled). This requires a full admin API layer.
