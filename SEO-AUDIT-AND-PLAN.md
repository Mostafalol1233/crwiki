# CrossFire Wiki — SEO Audit & Improvement Plan (summary)

## Context
This document targets the main site located at `last/client` (production host: https://crossfire.wiki). It lists quick findings and step-by-step actions to make the site indexable and search-friendly.

## Quick Findings (scanned)
- `index.html` in `last/client` already contains good base meta tags, Open Graph, and JSON-LD `WebSite` entry.
- `robots.txt` and `sitemap.xml` were absent or minimal in the `last/client/public` folder — added templates.
- `manifest.json` missing — added template.
- On-page: `index.html` has a strong site-wide title and description, but individual content pages (wiki entries) need structured title + meta description and clear H1/H2.
- Internal search: app appears to use a client-side React/Vite app (`/src/main.tsx`) — recommend an indexed search solution (Algolia/Meili/Elastic/Lunr) based on scale.

## Immediate Actions Added
- Added `last/client/public/robots.txt` with disallow rules for `/admin`, `/api`, and query pages.
- Added `last/client/public/sitemap.xml` template and `manifest.json` to support PWA & discoverability.
- `scripts/generate-sitemap.js` (repo root) is present to auto-generate a sitemap for static builds; run it against your built `dist` folder to produce a full sitemap.

## Next Steps (priority)
1. Generate a full sitemap after static build and upload to root `sitemap.xml`.
2. Implement per-page meta/title injection in the app (set meta tags per route / wiki page).
3. Add canonical tags on paginated or duplicate content pages.
4. Improve internal search: implement incremental indexing and client-side suggestions. For small-medium sites, use Algolia or Meili for fast results.
5. Run Lighthouse to measure Core Web Vitals; optimize images (WebP), use CDN (Cloudflare), enable HTTP caching and Brotli compression.
6. Submit `sitemap.xml` and verify ownership in Google Search Console; then monitor Coverage & Performance.

## Files added
- `last/client/public/robots.txt`
- `last/client/public/sitemap.xml` (template)
- `last/client/public/manifest.json`
- `scripts/generate-sitemap.js` (already present at repo root)

## How to generate a full sitemap (quick)
1. Build your client: `cd last && npm run build` (adjust for your build script)
2. Run the generator (example):

```powershell
node scripts/generate-sitemap.js --dir last/dist --base https://crossfire.wiki --out last/dist/sitemap.xml
```

3. Copy `last/dist/sitemap.xml` to `last/client/public/sitemap.xml` (or configure CI to publish it at the root of the site).

## What I can do next
- Run a deeper file-by-file metadata audit in `last/src` and produce a list of pages missing titles/descriptions.
- Create a sample per-route meta component (React/Vite) to inject SEO tags and JSON-LD for article pages.
- Provide an internal search implementation plan & example for Meili or Algolia.

If you want, I'll now:
- Audit `last/src` to enumerate all routes/pages and produce per-page SEO recommendations, or
- Implement the per-route meta tag helper (React) and sample usage for a wiki entry page.

Tell me which you prefer and I’ll continue.
