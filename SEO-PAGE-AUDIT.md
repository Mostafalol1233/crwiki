# CrossFire Wiki — Per-Page SEO Audit (last/client/src)

Generated: 2025-11-17

This file lists all routes/pages found in `last/client/src/pages` and gives recommendations for Title, Meta Description, H1 usage, and whether `SEOHead` (or `PageSEO`) is present.

Summary: pages that already include `SEOHead` (good):
- `Article.tsx` — detailed Article usage (good schema JSON-LD present)
- `NewsDetail.tsx` — uses `SEOHead` with `NewsArticle` schema (good)
- `EventDetail.tsx` — uses `SEOHead` (good)
- `Weapons.tsx` — uses `SEOHead` (good)
- `Modes.tsx` — uses `SEOHead` (good)
- `Ranks.tsx` — uses `SEOHead` (good)

Pages found (and recommendations):

- `/` — `Home.tsx`
  - SEOHead: MISSING — added `PageSEO` on behalf of this audit (see commit)
  - Recommendation: use unique H1 summarizing site, include meta description with target keywords and include `og:image` and canonical.

- `/article/:id` — `Article.tsx`
  - SEOHead: PRESENT — Good: uses dynamic title/description, Article JSON-LD, canonical and og tags.
  - Recommendation: Ensure `article.seoTitle`, `seoDescription`, and `canonicalUrl` are generated at publish time. Validate image sizes and add `alternateName` in schema if translations exist.

- `/news` — `News.tsx`
  - SEOHead: MISSING
  - Recommendation: add `PageSEO` with `CollectionPage` schema; implement pagination-rel=next/prev and canonical for paged lists.

- `/news/:id` — `NewsDetail.tsx`
  - SEOHead: PRESENT — Good.

- `/events/:id` — `EventDetail.tsx`
  - SEOHead: PRESENT — Good. Verify event `datePublished` formats and `location` if available.

- `/category/:category` and `/category/news` — `Category.tsx`, `CategoryNews.tsx`
  - SEOHead: MISSING
  - Recommendation: add `PageSEO` with category-specific title/meta, set canonical to category URL, and use `noindex, follow` for category pages if thin content.

- `/weapons` — `Weapons.tsx`
  - SEOHead: PRESENT — Good. Consider adding structured `ItemList` or `CollectionPage` schema for weapons listing.

- `/modes` — `Modes.tsx`
  - SEOHead: PRESENT — Good.

- `/ranks` — `Ranks.tsx`
  - SEOHead: PRESENT — Good.

- `/tutorials` & `/tutorials/:id` — `Tutorials.tsx`, `TutorialDetail.tsx`
  - SEOHead: MISSING on list page; detail page should include Article schema.
  - Recommendation: Add `SEOHead` on both (list = CollectionPage, detail = Article). Ensure video tutorials include `VideoObject` schema when embedding YouTube.

- `/posts` — `Posts.tsx`
  - SEOHead: MISSING
  - Recommendation: Add meta, canonical, and structured data for lists.

- `/about` — `About.tsx`
  - SEOHead: ADDED in this patch
  - Recommendation: add Organization schema with contact info, logo, and social links.

- `/contact` — `Contact.tsx`
  - SEOHead: MISSING
  - Recommendation: add meta and `noindex` only if contact form is not valuable content.

- `/download`, `/support`, `/sellers`, `/reviews`, `/my-tickets`, `/privacy`, `/terms` — various pages
  - SEOHead: MISSING on most; some are utility/privacy pages which may be low priority.
  - Recommendation: Add minimal meta tags; set `noindex` on `my-tickets` and admin pages.

- `/admin` & `/admin/login` — `Admin.tsx`, `AdminLogin.tsx`
  - SEOHead: MISSING
  - Recommendation: explicitly set `<meta name="robots" content="noindex, nofollow" />` or use `SEOHead` with `noindex=true` to ensure admin pages are not indexed.

- `/not-found` — `not-found.tsx`
  - Recommendation: ensure the server returns 404 status where possible; add `noindex` meta tag for SPA fallback.

General recommendations
- Use `PageSEO` (or `SEOHead`) on every route that represents unique content (home, lists, detail pages).
- Admin, account, and session pages should be `noindex`.
- Ensure every article/news/tutorial has:
  - `seoTitle` (60–70 chars), `seoDescription` (120–155 chars)
  - `og:image` of the recommended size (1200x630)
  - `alt` attributes for all images
  - Canonical URL set (avoid duplicate query parameter variants)
- Pagination: use `rel="next"` / `rel="prev"` on paginated lists and canonical pointing to the main list.
- Sitemap: generate a sitemap after every content deployment (`scripts/generate-sitemap.js`) and submit to GSC.
- Structured Data: generate JSON-LD for Article, NewsArticle, VideoObject for tutorials, and Organization + WebSite on homepage.

If you want, I can now:
- Add `PageSEO` usage to the remaining pages automatically (e.g., News, Tutorials, Posts, Category pages), or
- Create a small utility that scans `src/pages` and inserts a `PageSEO` block into files that are missing it (requires careful code edits).

*** End of Audit
