import type { VercelRequest, VercelResponse } from "@vercel/node";
import { REGIONS, WEAPONS } from "../shared/crossfire-regions.js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const ANON_KEY     = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const BASE         = "https://crossfire.wiki";

const h = () => ({ apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, "Content-Type": "application/json" });

async function q(table: string, select: string, order: string, limit = 2000): Promise<any[]> {
  if (!SUPABASE_URL || !ANON_KEY) return [];
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}&order=${encodeURIComponent(order)}&limit=${limit}`,
      { headers: h(), signal: AbortSignal.timeout(9000) }
    );
    if (!r.ok) return [];
    return r.json();
  } catch { return []; }
}

async function readContentRows(
  type: 'weapons' | 'posts',
  opts: { limit?: number; offset?: number; category?: string } = {}
): Promise<{ rows: any[]; total: number }> {
  if (type === 'weapons') {
    // Keep the catalogue compatible with older Supabase schemas: try the richer
    // acquisition fields first, then fall back to the stable public projection.
    const enrichedRows = await q(
      'weapons',
      'id,name,category,description,stats,image_url,background_url,created_at,acquisition_type,acquisition_method,acquisition_verified,acquisition,shop_type,currency,source_url',
      'name',
    );
    if (enrichedRows.length > 0) return { rows: enrichedRows, total: enrichedRows.length };

    const rows = await q('weapons', 'id,name,category,description,stats,image_url,created_at', 'name');
    return { rows, total: rows.length };
  }

  if (!SUPABASE_URL || !ANON_KEY) return { rows: [], total: 0 };
  const limit = Math.min(50, Math.max(1, Number(opts.limit) || 24));
  const offset = Math.max(0, Number(opts.offset) || 0);
  const params = new URLSearchParams({
    select: 'id,title,title_ar,post_slug,summary,summary_ar,content,content_ar,image_url,category,tags,author,views,reading_time,featured,language,seo_title,seo_description,og_image,canonical_url,full_layout,template,wiki_tabs,external_links,source_url,gallery,created_at,updated_at',
    order: 'created_at.desc',
    limit: String(limit),
    offset: String(offset),
  });
  if (opts.category) params.set('category', `eq.${opts.category}`);

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/posts?${params.toString()}`, {
      headers: { ...h(), Prefer: 'count=exact' },
      signal: AbortSignal.timeout(9000),
    });
    if (!response.ok) return { rows: [], total: 0 };
    const rows = await response.json();
    const contentRange = response.headers.get('content-range') || '';
    const totalText = contentRange.split('/')[1] || '';
    const total = Number.parseInt(totalText, 10);
    return { rows: Array.isArray(rows) ? rows : [], total: Number.isFinite(total) ? total : rows.length };
  } catch {
    return { rows: [], total: 0 };
  }
}

function xe(s: string) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function isoDate(s?: string) {
  if (!s) return "";
  try { return new Date(s).toISOString().split("T")[0]; } catch { return ""; }
}

function dateAtOrBefore(value: unknown, maxDate: string) {
  const date = isoDate(value == null ? "" : String(value));
  return date && date <= maxDate ? date : "";
}

interface UrlEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
  images?: { url: string; title?: string; caption?: string }[];
  videos?: { thumbnail: string; title: string; description?: string; contentLoc?: string; playerLoc?: string; publicationDate?: string }[];
}

function entry({ loc, lastmod, changefreq, priority, images, videos }: UrlEntry) {
  let xml = `  <url>\n    <loc>${xe(loc)}</loc>\n`;
  if (lastmod)    xml += `    <lastmod>${lastmod}</lastmod>\n`;
  if (changefreq) xml += `    <changefreq>${changefreq}</changefreq>\n`;
  if (priority)   xml += `    <priority>${priority}</priority>\n`;
  for (const img of (images || [])) {
    xml += `    <image:image>\n`;
    xml += `      <image:loc>${xe(img.url)}</image:loc>\n`;
    if (img.title)   xml += `      <image:title>${xe(img.title)}</image:title>\n`;
    if (img.caption) xml += `      <image:caption>${xe(img.caption)}</image:caption>\n`;
    xml += `    </image:image>\n`;
  }
  for (const video of (videos || [])) {
    xml += `    <video:video>\n`;
    xml += `      <video:thumbnail_loc>${xe(video.thumbnail)}</video:thumbnail_loc>\n`;
    xml += `      <video:title>${xe(video.title)}</video:title>\n`;
    if (video.description) xml += `      <video:description>${xe(video.description)}</video:description>\n`;
    if (video.contentLoc) xml += `      <video:content_loc>${xe(video.contentLoc)}</video:content_loc>\n`;
    if (video.playerLoc) xml += `      <video:player_loc>${xe(video.playerLoc)}</video:player_loc>\n`;
    if (video.publicationDate) xml += `      <video:publication_date>${xe(video.publicationDate)}</video:publication_date>\n`;
    xml += `    </video:video>\n`;
  }
  xml += `  </url>\n`;
  return xml;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  const rawType = Array.isArray(req.query.type) ? req.query.type[0] : req.query.type;
  if (req.method === 'GET' && typeof rawType === 'string' && (rawType === 'weapons' || rawType === 'posts')) {
    const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
    const rawOffset = Array.isArray(req.query.offset) ? req.query.offset[0] : req.query.offset;
    const rawCategory = Array.isArray(req.query.category) ? req.query.category[0] : req.query.category;
    const { rows, total } = await readContentRows(rawType as 'weapons' | 'posts', {
      limit: Number(rawLimit),
      offset: Number(rawOffset),
      category: typeof rawCategory === 'string' ? rawCategory : undefined,
    });
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(rawType === 'weapons' ? { weapons: rows || [], total } : { posts: rows || [], total });
  }

  const today = new Date().toISOString().split("T")[0];

  const [events, news, posts, tutorials, customPages, weapons, mercs, modes] = await Promise.all([
    q("events",       "id,title,event_name_slug,image_url,date,updated_at,seo_description,source_url", "date.desc"),
    q("news",         "id,title,news_slug,image_url,created_at,updated_at,seo_description,source_url", "created_at.desc"),
    q("posts",        "id,title,post_slug,image_url,created_at,updated_at,seo_description,source_url", "created_at.desc"),
    q("tutorials",    "id,title,slug,image_url,created_at,seo_title,seo_description,youtube_url,youtube_id,video_url", "created_at.desc"),
    q("custom_pages", "id,slug,title_en,title_ar,seo_title,seo_description,updated_at,status", "updated_at.desc"),
    q("weapons",      "id,name,image_url",                                                   "name", 10000),
    q("mercenaries",  "id,name,image_url",                                                   "order_index", 10000),
    q("modes",        "id,name,image_url",                                                   "name", 10000),
  ]);

  // Use the newest real content timestamp for shared/static URLs. This avoids
  // publishing a stale fixed date while still falling back safely when the DB
  // is unavailable or contains malformed timestamps.
  const contentDates = [...events, ...news, ...posts, ...tutorials, ...customPages]
    .flatMap((row: any) => [row.updated_at, row.created_at, row.date])
    .map((value) => dateAtOrBefore(value, today))
    .filter(Boolean)
    .sort()
    .reverse();
  const latestContentDate = contentDates[0] || today;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:xhtml="http://www.w3.org/1999/xhtml"\n`;
  xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n`;
  xml += `        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"\n`;
  xml += `        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n\n`;

  // ── Static pages ──────────────────────────────────────────────────────
  const statics: UrlEntry[] = [
    { loc: `${BASE}/`,           priority: "1.0", changefreq: "daily",   lastmod: latestContentDate },
    { loc: `${BASE}/global-wiki`,priority: "0.98",changefreq: "daily",   lastmod: latestContentDate },
    { loc: `${BASE}/events`,     priority: "0.95",changefreq: "daily",   lastmod: latestContentDate },
    { loc: `${BASE}/weapons`,    priority: "0.9", changefreq: "weekly",  lastmod: latestContentDate },
    { loc: `${BASE}/modes`,      priority: "0.9", changefreq: "weekly",  lastmod: latestContentDate },
    { loc: `${BASE}/ranks`,      priority: "0.9", changefreq: "weekly",  lastmod: latestContentDate },
    { loc: `${BASE}/mercenaries`,priority: "0.9", changefreq: "weekly",  lastmod: latestContentDate },
    { loc: `${BASE}/maps`,       priority: "0.8", changefreq: "weekly",  lastmod: latestContentDate },
    { loc: `${BASE}/news`,       priority: "0.85",changefreq: "daily",   lastmod: latestContentDate },
    { loc: `${BASE}/posts`,      priority: "0.75",changefreq: "daily",   lastmod: latestContentDate },
    { loc: `${BASE}/tutorials`,  priority: "0.8", changefreq: "daily",   lastmod: latestContentDate },
    { loc: `${BASE}/videos`,      priority: "0.8", changefreq: "daily",   lastmod: latestContentDate },
    { loc: `${BASE}/pages`,       priority: "0.7", changefreq: "weekly",  lastmod: latestContentDate },
    { loc: `${BASE}/content-hub`, priority: "0.8", changefreq: "weekly",  lastmod: latestContentDate },
    { loc: `${BASE}/faq`,         priority: "0.6", changefreq: "monthly", lastmod: latestContentDate },
    { loc: `${BASE}/grave-games`, priority: "0.5", changefreq: "monthly", lastmod: latestContentDate },
    { loc: `${BASE}/category/news`,   priority: "0.7", changefreq: "daily"   },
    { loc: `${BASE}/category/events`, priority: "0.7", changefreq: "daily"   },
    { loc: `${BASE}/category/guides`, priority: "0.7", changefreq: "weekly"  },
    { loc: `${BASE}/download`,   priority: "0.7", changefreq: "weekly"  },
    { loc: `${BASE}/sellers`,    priority: "0.6", changefreq: "weekly"  },
    { loc: `${BASE}/services`,   priority: "0.6", changefreq: "weekly"  },
    { loc: `${BASE}/reviews`,    priority: "0.6", changefreq: "weekly"  },
    { loc: `${BASE}/forum`,      priority: "0.6", changefreq: "daily"   },
    { loc: `${BASE}/about`,      priority: "0.5", changefreq: "monthly" },
    { loc: `${BASE}/contact`,    priority: "0.5", changefreq: "monthly" },
    { loc: `${BASE}/support`,    priority: "0.5", changefreq: "monthly" },
    { loc: `${BASE}/privacy`,    priority: "0.3", changefreq: "monthly" },
    { loc: `${BASE}/terms`,      priority: "0.3", changefreq: "monthly" },
  ];
  for (const s of statics) xml += entry(s);
  xml += "\n";

  xml += "  <!-- Regional wiki landing pages -->\n";
  for (const region of REGIONS) {
    xml += entry({ loc: `${BASE}/${region.slug}`, priority: "0.9", changefreq: "weekly", lastmod: latestContentDate });
    for (const weapon of WEAPONS) {
      xml += entry({ loc: `${BASE}/${region.slug}/weapons/${weapon.slug}`, priority: "0.8", changefreq: "weekly", lastmod: latestContentDate });
    }
  }
  xml += "\n";

  // ── Events ────────────────────────────────────────────────────────────
  xml += "  <!-- Events -->\n";
  for (const ev of events) {
    const slug = ev.event_name_slug || ev.id;
    if (!slug) continue;
    const img = ev.image_url;
    xml += entry({
      loc:        `${BASE}/events/${slug}`,
      lastmod:    dateAtOrBefore(ev.updated_at || ev.date, today) || today,
      changefreq: "weekly",
      priority:   "0.85",
      images:     img ? [{ url: img, title: ev.title, caption: `CrossFire event: ${ev.title}` }] : [],
    });
  }
  xml += "\n";

  // ── News ──────────────────────────────────────────────────────────────
  xml += "  <!-- News -->\n";
  for (const n of news) {
    const slug = n.news_slug || n.id;
    if (!slug) continue;
    const img = n.image_url;
    xml += entry({
      loc:        `${BASE}/news/${slug}`,
      lastmod:    dateAtOrBefore(n.updated_at || n.created_at, today) || today,
      changefreq: "weekly",
      priority:   "0.75",
      images:     img ? [{ url: img, title: n.title, caption: `CrossFire news: ${n.title}` }] : [],
    });
  }
  xml += "\n";

  // ── Posts ─────────────────────────────────────────────────────────────
  xml += "  <!-- Posts -->\n";
  for (const p of posts) {
    const slug = p.post_slug || p.id;
    if (!slug) continue;
    const img = p.image_url;
    xml += entry({
      loc:        `${BASE}/posts/${slug}`,
      lastmod:    dateAtOrBefore(p.updated_at || p.created_at, today) || today,
      changefreq: "weekly",
      priority:   "0.65",
      images:     img ? [{ url: img, title: p.title }] : [],
    });
  }
  xml += "\n";

  // ── Tutorials ─────────────────────────────────────────────────────────
  xml += "  <!-- Tutorials -->\n";
  for (const t of tutorials) {
    const slug = t.slug || t.id;
    if (!slug) continue;
    const img = t.image_url;
    xml += entry({
      loc:        `${BASE}/tutorials/${slug}`,
      lastmod:    dateAtOrBefore(t.updated_at || t.created_at, today) || today,
      changefreq: "monthly",
      priority:   "0.65",
      images:     img ? [{ url: img, title: t.title }] : [],
      videos: t.youtube_id || t.youtube_url || t.video_url ? [{
        thumbnail: img || `https://img.youtube.com/vi/${t.youtube_id}/hqdefault.jpg`,
        title: t.title || "CrossFire tutorial",
        description: t.seo_description || `CrossFire tutorial: ${t.title}`,
        playerLoc: t.youtube_id ? `https://www.youtube.com/embed/${t.youtube_id}` : undefined,
        contentLoc: t.video_url || undefined,
        publicationDate: dateAtOrBefore(t.created_at, today) ? new Date(t.created_at).toISOString() : undefined,
      }] : [],
    });
  }
  xml += "\n";

  // ── Custom pages ───────────────────────────────────────────────────────
  xml += "  <!-- Published custom pages -->\n";
  for (const page of customPages) {
    if (page.status && page.status !== "published") continue;
    const slug = page.slug || page.id;
    if (!slug) continue;
    xml += entry({
      loc: `${BASE}/pages/${slug}`,
      lastmod: dateAtOrBefore(page.updated_at, today) || today,
      changefreq: "weekly",
      priority: "0.65",
    });
  }
  xml += "\n";

  // ── Weapons (image sitemap) ───────────────────────────────────────────
  xml += "  <!-- Weapons -->\n";
  for (const w of weapons) {
    if (!w.name) continue;
    const slug = w.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const img = w.image_url;
    xml += entry({
      loc:        `${BASE}/weapons`,
      images:     img ? [{ url: img, title: `${w.name} — CrossFire Weapon`, caption: `CrossFire weapon: ${w.name}` }] : [],
    });
  }
  xml += "\n";

  // ── Mercenaries (image sitemap) ───────────────────────────────────────
  xml += "  <!-- Mercenaries -->\n";
  for (const m of mercs) {
    if (!m.name) continue;
    const img = m.image_url;
    if (!img) continue;
    xml += entry({
      loc:    `${BASE}/mercenaries`,
      images: [{ url: img, title: `${m.name} — CrossFire Mercenary`, caption: `CrossFire mercenary: ${m.name}` }],
    });
  }

  xml += "\n</urlset>";

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400");
  res.setHeader("X-Robots-Tag", "noindex");
  return res.status(200).send(xml);
}
