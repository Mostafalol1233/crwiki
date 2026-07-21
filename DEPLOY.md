# Vercel Deployment Guide

## 1. Connect repo to Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. Vercel auto-detects the `vercel.json` config — no framework preset needed.

## 2. Build settings (auto-detected from vercel.json)

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist/client` |
| Install command | `npm install` |

## 3. Environment variables (set in Vercel dashboard → Settings → Environment Variables)

| Variable | Description | Example |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | `eyJ...` |
| `VITE_SUPABASE_SERVICE_KEY` | Supabase service role key (**server-side only** — prefix without VITE_ is also read by functions) | `eyJ...` |
| `SUPABASE_SERVICE_KEY` | Same service key — set this too so API functions read it without the VITE_ prefix | `eyJ...` |
| `ADMIN_PASSWORD` | Super-admin login password | `your-secret` |
| `OPENROUTER_API_KEY` | OpenRouter key for AI chat | `sk-or-...` |
| `FIRECRAWL_API_KEY` | Firecrawl key for player profile scraping | `fc-...` |
| `RESEND_API_KEY` | Resend key for transactional email | `re_...` |

> **Important**: Set `VITE_*` variables for the **Production** environment so Vite bakes them into the client bundle at build time.
> Set `SUPABASE_SERVICE_KEY` and `ADMIN_PASSWORD` (without `VITE_` prefix) as well — Vercel serverless functions read them from `process.env` at runtime.

## 4. API functions

All Vite dev-server middleware has been ported to Vercel serverless functions in `api/`:

| Route | File |
|---|---|
| `POST /api/auth/register` | `api/auth/register.ts` |
| `POST /api/admin/login` | `api/admin/login.ts` |
| `POST /api/ai/chat` (SSE) | `api/ai/chat.ts` |
| `POST /api/grok-tips` | `api/grok-tips.ts` |
| `GET  /api/player/lookup` | `api/player/lookup.ts` |
| `POST /api/scrape/forum-list` | `api/scrape/forum-list.ts` |
| `POST /api/scrape/forum-thread` | `api/scrape/forum-thread.ts` |
| `POST /api/scrape/single-url` | `api/scrape/single-url.ts` |
| `POST /api/admin/rescrape-item` | `api/admin/rescrape-item.ts` |
| `POST /api/admin/rebuild-mercenary-posts` | `api/admin/rebuild-mercenary-posts.ts` |
| `POST /api/admin/rebuild-wiki-posts` | `api/admin/rebuild-wiki-posts.ts` |
| `POST /api/send-email` | `api/send-email.ts` |

## 5. Vercel plan notes

- The AI chat function streams SSE and has a 60s timeout — requires **Vercel Pro** (hobby plan caps at 10s).
- Scraping functions (forum, wiki rebuilds) can take 30–60s — also requires Pro for the longer timeouts.
- If you're on hobby, set `maxDuration` values in `vercel.json` down to 10 and expect timeouts on heavy scrape jobs.

## 6. After deploy

- Go to **Vercel Dashboard → Domains** to add your custom domain (e.g. `crossfirewiki.com`).
- Update Supabase **Auth → URL Configuration** → Site URL to your production domain.
- Update Supabase **Auth → Redirect URLs** to include `https://yourdomain.com/**`.
- If using Google OAuth, update the **Authorized redirect URIs** in Google Cloud Console to point to your production domain.
