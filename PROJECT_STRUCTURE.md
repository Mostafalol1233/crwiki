# Project Structure and Overview

## Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui + Radix, Wouter (routing), TanStack Query, Vite (root `client/`, out `dist/client`).
- **Backend**: `backend/server.js` optional Express media service + `api/` Vercel serverless + `vite.config.ts` dev middleware (auth, AI proxy, scraper, player lookup).
- **Database**: Supabase Postgres (primary, RLS) via `supabase-schema.sql`; legacy Mongoose/Drizzle in `shared/` kept for reference.
- **Media**: Cloudinary (primary) + Catbox CDN fallback; no local filesystem storage.
- **Shared**: TypeScript contracts in `shared/` (AI models, regions, crossfire data).

## Directory Structure
- **`client/`**: Frontend application (Vite root).
  - `src/pages/`: Page components (e.g., `Home.tsx`, `Admin.tsx`, `News.tsx`, `Posts.tsx`, `EventDetail.tsx`).
  - `src/components/`: Reusable components (e.g., `SEOHead.tsx`, `Header.tsx`, `Footer.tsx`, `ui/`).
  - `src/lib/`: Utilities and query client setup (`supabase.ts`, `supabaseApi.ts`, `supabaseAdmin.ts`).
  - `public/`: Static web root (`robots.txt`, `manifest.json`, `llms.txt`, `logo-new.png`).
- **`api/`**: Production serverless endpoints (`sitemap.ts`, `prerender.ts`, `admin/*`, `scrape/*`, `player/lookup.ts`).
- **`backend/`**: Optional Express service (`server.js` — authenticated media uploads).
- **`server/`**: Shared server helpers (`adminAuth.ts` HMAC, `urlSafety.ts`, `competitionAccess.ts`).
- **`shared/`**: Shared code between frontend and backend.
  - `mongodb-schema.ts`: Mongoose schema definitions (interfaces and schemas, legacy).
  - `schema.ts`: Drizzle ORM schema definitions (legacy/alternative).

## Key Architectural Patterns
- **Pagination**: API routes return `{ items: any[], total: number }`. Frontend uses React Query to handle pagination state.
- **Slugs**: Content (Posts, Events, News, Tutorials) uses slugs for SEO-friendly URLs. Unique constraints are enforced in Mongoose schemas.
- **Multilingual Support**: Content supports English and Arabic (e.g., `contentHtmlEn`, `contentHtmlAr`).
- **Role-Based Access**: Admin dashboard (`Admin.tsx`) is protected and provides CRUD operations.

## Key Files
- `client/src/pages/Admin.tsx`: Main admin dashboard (delegates to `client/src/pages/admin/*` managers).
- `client/src/pages/EventDetail.tsx`: Event detail page with slug handling.
- `backend/server.js`: Optional Express media service entry point.
- `api/sitemap.ts`: Dynamic DB sitemap + image/news/video extensions.
- `api/prerender.ts`: Bot prerender (OG + JSON-LD) for crawler UAs.
- `vite.config.ts`: Vite dev server + local API middleware (root `client/`).
- `shared/mongodb-schema.ts`: Database schemas (legacy reference).
