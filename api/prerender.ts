/**
 * Bot prerender endpoint — serves complete HTML with correct OG/Twitter meta
 * tags for social crawlers (Facebook, Discord, WhatsApp, Telegram, Slack, etc.)
 * Called by middleware.ts when a known bot user-agent is detected.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRegionBySlug, getWeaponBySlug } from "../shared/crossfire-regions.js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const ANON_KEY     = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const BASE         = "https://crossfire.wiki";
const DEFAULT_IMG  = `${BASE}/feature-crossfire.jpg`;
const LOGO         = `${BASE}/logo-new.png`;

interface PageMeta {
  title: string;
  description: string;
  image: string;
  url: string;
  type: "website" | "article";
  datePublished?: string;
  keywords?: string;
  schema?: object;
}

const HEADERS = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };

async function fetchOne(table: string, field: string, value: string, select: string) {
  if (!SUPABASE_URL || !ANON_KEY) return null;
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?${field}=eq.${encodeURIComponent(value)}&select=${encodeURIComponent(select)}&limit=1`,
      { headers: HEADERS, signal: AbortSignal.timeout(7000) }
    );
    if (!r.ok) return null;
    const rows = await r.json();
    return rows?.[0] ?? null;
  } catch { return null; }
}

async function resolveMeta(path: string): Promise<PageMeta> {
  // ── /events/:slug ────────────────────────────────────────────────────
  const evM = path.match(/^\/events\/([^/?#]+)/);
  if (evM) {
    const slug = evM[1];
    const ev = await fetchOne("events", "event_name_slug", slug,
      "title,seo_title,seo_description,image_url,date,type,end_date");
    if (ev) {
      const title = ev.seo_title || ev.title || "CrossFire Event";
      const desc  = ev.seo_description
        || `CrossFire event "${ev.title}" — check dates, rewards and details on CrossFire Wiki.`;
      return {
        title:         `${title} | CrossFire Wiki`,
        description:   desc.substring(0, 160),
        image:         ev.image_url || DEFAULT_IMG,
        url:           `${BASE}/events/${slug}`,
        type:          "article",
        datePublished: ev.date ? new Date(ev.date).toISOString() : undefined,
        keywords:      `CrossFire, CrossFire event, ${ev.title}, Z8Games`,
        schema: {
          "@context": "https://schema.org",
          "@type": "Event",
          name: ev.title,
          description: desc.substring(0, 200),
          image: ev.image_url || DEFAULT_IMG,
          startDate: ev.date,
          endDate: ev.end_date || undefined,
          url: `${BASE}/events/${slug}`,
          eventStatus: "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
          location: { "@type": "VirtualLocation", url: "https://crossfire.z8games.com" },
          organizer: { "@type": "Organization", name: "Smilegate West", url: "https://crossfire.z8games.com" },
          publisher: { "@type": "Organization", name: "CrossFire Wiki", url: BASE, logo: LOGO },
        },
      };
    }
  }

  // ── /news/:slug ──────────────────────────────────────────────────────
  const newsM = path.match(/^\/news\/([^/?#]+)/);
  if (newsM) {
    const slug = newsM[1];
    const item = await fetchOne("news", "slug", slug,
      "title,seo_title,seo_description,image,image_url,created_at,updated_at,author,category");
    if (item) {
      const title = item.seo_title || item.title || "CrossFire News";
      const desc  = item.seo_description || `CrossFire news: ${item.title}`;
      const img   = item.image || item.image_url || DEFAULT_IMG;
      return {
        title:         `${title} | CrossFire Wiki`,
        description:   desc.substring(0, 160),
        image:         img,
        url:           `${BASE}/news/${slug}`,
        type:          "article",
        datePublished: item.created_at,
        keywords:      `CrossFire, CrossFire news, ${item.category || "gaming"}, Z8Games`,
        schema: {
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: title,
          description: desc.substring(0, 200),
          image: [{ "@type": "ImageObject", url: img, width: 1200, height: 630 }],
          datePublished: item.created_at ? new Date(item.created_at).toISOString() : new Date().toISOString(),
          dateModified:  item.updated_at ? new Date(item.updated_at).toISOString() : new Date().toISOString(),
          author: [{ "@type": "Person", name: item.author || "CrossFire Wiki" }],
          publisher: { "@type": "Organization", name: "CrossFire Wiki", url: BASE, logo: { "@type": "ImageObject", url: LOGO } },
          mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE}/news/${slug}` },
          url: `${BASE}/news/${slug}`,
        },
      };
    }
  }

  // ── /posts/:slug ─────────────────────────────────────────────────────
  const postM = path.match(/^\/posts\/([^/?#]+)/);
  if (postM) {
    const slug = postM[1];
    const item = await fetchOne("posts", "slug", slug,
      "title,seo_title,seo_description,image,created_at,author,category");
    if (item) {
      const title = item.seo_title || item.title || "CrossFire";
      const desc  = item.seo_description || `${item.title} — CrossFire Wiki`;
      return {
        title:         `${title} | CrossFire Wiki`,
        description:   desc.substring(0, 160),
        image:         item.image || DEFAULT_IMG,
        url:           `${BASE}/posts/${slug}`,
        type:          "article",
        datePublished: item.created_at,
        keywords:      `CrossFire, ${item.category || "guide"}, Z8Games`,
        schema: {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: title,
          description: desc.substring(0, 200),
          image: item.image || DEFAULT_IMG,
          datePublished: item.created_at ? new Date(item.created_at).toISOString() : new Date().toISOString(),
          author: [{ "@type": "Person", name: item.author || "CrossFire Wiki" }],
          publisher: { "@type": "Organization", name: "CrossFire Wiki", url: BASE, logo: { "@type": "ImageObject", url: LOGO } },
        },
      };
    }
  }

  // ── /tutorials/:slug ─────────────────────────────────────────────────
  const tutM = path.match(/^\/tutorials\/([^/?#]+)/);
  if (tutM) {
    const slug = tutM[1];
    const item = await fetchOne("tutorials", "slug", slug,
      "title,seo_title,seo_description,image,created_at");
    if (item) {
      const title = item.seo_title || item.title || "CrossFire Tutorial";
      const desc  = item.seo_description || `Learn: ${item.title} — step-by-step CrossFire guide.`;
      return {
        title:         `${title} | CrossFire Tutorials`,
        description:   desc.substring(0, 160),
        image:         item.image || DEFAULT_IMG,
        url:           `${BASE}/tutorials/${slug}`,
        type:          "article",
        datePublished: item.created_at,
        keywords:      "CrossFire tutorial, CrossFire guide, how to play CrossFire, Z8Games",
        schema: {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: title,
          description: desc.substring(0, 200),
          image: item.image || DEFAULT_IMG,
          publisher: { "@type": "Organization", name: "CrossFire Wiki", url: BASE },
        },
      };
    }
  }

  // ── /:region and /:region/weapons/:slug ───────────────────────────
  const regionMatch = path.match(/^\/([a-z0-9-]+)(?:\/weapons\/([a-z0-9-]+))?$/);
  if (regionMatch) {
    const region = getRegionBySlug(regionMatch[1]);
    if (region) {
      const weaponSlug = regionMatch[2];
      const weapon = weaponSlug ? getWeaponBySlug(weaponSlug) : null;
      const title = weapon
        ? `${region.name} ${weapon.name} | CrossFire Global Wiki`
        : region.seoTitle || `${region.name} | CrossFire Global Wiki`;
      const description = weapon
        ? `Region-specific coverage for ${weapon.name} in ${region.name}.`
        : region.seoDescription || `Regional overview for ${region.name} in the global CrossFire wiki.`;
      return {
        title,
        description: description.substring(0, 160),
        image: `${BASE}/feature-crossfire.jpg`,
        url: `${BASE}${path}`,
        type: "website",
      };
    }
  }

  // ── static section pages ─────────────────────────────────────────────
  const sectionMeta: Record<string, Partial<PageMeta>> = {
    "/events":      { title: "CrossFire Events 2025–2026 | Calendar & Rewards | CrossFire Wiki",           description: "All CrossFire West events, tournaments and limited-time updates. Dates, rewards and full details." },
    "/weapons":     { title: "CrossFire Weapons Database — Stats, Variants & Guides | CrossFire Wiki",    description: "Complete CrossFire weapon stats, damage values, variants and unlock methods." },
    "/modes":       { title: "CrossFire Game Modes — Team Match, Mutation, Ghost & More | CrossFire Wiki", description: "Every CrossFire game mode explained: rules, strategies, and tips for Team Match, Mutation Mode, Ghost Mode and more." },
    "/ranks":       { title: "CrossFire Rank System — All 104 Tiers & EXP Required | CrossFire Wiki",    description: "Full CrossFire ranking system from Private to National Soldier. EXP requirements, badges and promotion tips." },
    "/mercenaries": { title: "CrossFire Mercenaries — Characters, Stats & Abilities | CrossFire Wiki",   description: "Every CrossFire mercenary with abilities, teams, and how to get them." },
    "/maps":        { title: "CrossFire Maps — Black Widow, Egypt, Cabin & More | CrossFire Wiki",       description: "All CrossFire maps with layout overviews, strategies and callouts." },
    "/news":        { title: "CrossFire News — Updates, Patches & Announcements | CrossFire Wiki",       description: "Latest CrossFire West news, patch notes, updates and game announcements." },
    "/tutorials":   { title: "CrossFire Tutorials — Beginner to Pro Guides | CrossFire Wiki",           description: "Expert CrossFire tutorials: aim training, movement, weapons, and competitive strategies." },
  };
  const sp = sectionMeta[path];
  if (sp) {
    return {
      title:       sp.title!,
      description: sp.description!,
      url:         `${BASE}${path}`,
      type:        "website",
      image:       `${BASE}/feature-crossfire.jpg`,
    };
  }

  // ── Default fallback ─────────────────────────────────────────────────
  return {
    title:       "CrossFire Wiki | Weapons, Modes, Mercenaries & Community",
    description: "The definitive CrossFire encyclopedia: weapons, maps, mercenaries, game modes, ranks, and community resources.",
    image:       DEFAULT_IMG,
    url:         `${BASE}${path}`,
    type:        "website",
  };
}

function e(s: string) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = String(req.query.path || "/").trim() || "/";
  const meta = await resolveMeta(path);

  const schemaBlock = meta.schema
    ? `<script type="application/ld+json">${JSON.stringify(meta.schema)}</script>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns#">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${e(meta.title)}</title>
<meta name="description" content="${e(meta.description)}">
<meta name="robots" content="index, follow, max-image-preview:large">
${meta.keywords ? `<meta name="keywords" content="${e(meta.keywords)}">` : ""}
${meta.datePublished ? `<meta name="article:published_time" content="${e(meta.datePublished)}">` : ""}
<link rel="canonical" href="${e(meta.url)}">

<!-- Open Graph -->
<meta property="og:type" content="${e(meta.type)}">
<meta property="og:url" content="${e(meta.url)}">
<meta property="og:title" content="${e(meta.title)}">
<meta property="og:description" content="${e(meta.description)}">
<meta property="og:image" content="${e(meta.image)}">
<meta property="og:image:secure_url" content="${e(meta.image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${e(meta.title)}">
<meta property="og:site_name" content="CrossFire Wiki">
<meta property="og:locale" content="en_US">
<meta property="og:locale:alternate" content="ar_AR">

<!-- Twitter / X -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@crossfirewiki">
<meta name="twitter:creator" content="@crossfirewiki">
<meta name="twitter:title" content="${e(meta.title)}">
<meta name="twitter:description" content="${e(meta.description)}">
<meta name="twitter:image" content="${e(meta.image)}">
<meta name="twitter:image:alt" content="${e(meta.title)}">

<!-- Structured Data -->
${schemaBlock}

<!-- Immediate redirect for human visitors (bots will not follow this) -->
<noscript><meta http-equiv="refresh" content="0;url=${e(meta.url)}"></noscript>
<script>if(!/bot|crawler|spider|crawling/i.test(navigator.userAgent)){window.location.replace("${e(meta.url)}")}</script>
</head>
<body style="font-family:sans-serif;background:#0a0a0a;color:#fff;padding:2rem">
<h1>${e(meta.title)}</h1>
<p>${e(meta.description)}</p>
<p><a href="${e(meta.url)}" style="color:#f5a623">Visit ${e(meta.url)}</a></p>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300, stale-while-revalidate=3600");
  return res.status(200).send(html);
}
