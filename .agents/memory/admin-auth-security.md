---
name: Admin auth security
description: How admin login and privileged browser operations are secured.
---

## Current rule

Admin password comparison (`ADMIN_PASSWORD` and bcrypt for `admin_users` rows) happens server-side in the Vite and production admin login handlers. The browser calls `adminLogin()` and never receives a password hash or service-role credential.

Successful logins receive an HMAC-signed, seven-day token from `server/adminAuth.ts`. Production admin mutations verify the bearer token before using `SUPABASE_SERVICE_KEY`; the development scraper and rebuild middleware use the same shared verifier. The optional Express media upload endpoint also requires a valid signed token.

`ADMIN_TOKEN_SECRET` should be configured explicitly in production. The implementation supports a server-only secret fallback for backwards compatibility, but privileged values must never use the `VITE_` prefix.

## Browser credential boundary

`client/src/lib/supabaseAdmin.ts` no longer creates a service-role client. Its legacy `supabaseService` export is only a compatibility alias for the publishable Supabase client and remains subject to RLS. Browser uploads delegate to the authenticated media endpoint, and the CI workflow rejects service-role environment names in `client/src`.

## Remaining migration boundary

Some older admin CRUD screens still call Supabase directly through the publishable client. Those operations are safe from service-key exposure but depend on Supabase RLS policies. Privileged CRUD that must bypass RLS should be migrated to authenticated server endpoints rather than reintroducing a service-role client in browser code.
