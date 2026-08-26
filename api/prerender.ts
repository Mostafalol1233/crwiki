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
  dateModified?: string;
  keywords?: string;
  schema?: object;
  robots?: string;
  alternates?: Array<{ lang: string; url: string }>;
  content?: string;
  imageType?: string;
  notFound?: boolean;
}

const HEADERS = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };

function safeIso(value: unknown): string | undefined {
  if (!value) return undefined;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function stripHtml(value: unknown): string {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function clip(value: unknown, max: number): string {
  return stripHtml(value).slice(0, max).trim();
}

function safeImage(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return DEFAULT_IMG;
  try {
    const parsed = new URL(value.trim(), BASE);
    if (parsed.protocol !== "https:") return DEFAULT_IMG;
    if (/^(image\.(?:us\.)?z8games\.com)$/i.test(parsed.hostname)) return DEFAULT_IMG;
    return parsed.toString();
  } catch {
    return DEFAULT_IMG;
  }
}

function imageType(value: string): string {
  const pathname = (() => { try { return new URL(value).pathname.toLowerCase(); } catch { return ""; } })();
  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".webp")) return "image/webp";
  if (pathname.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

function localizePath(path: string): { routePath: string; isArabic: boolean; prefix: string } {
  const isArabic = path === "/ar" || path.startsWith("/ar/");
  const routePath = isArabic ? (path.replace(/^\/ar(?=\/|$)/, "") || "/") : path;
  return { routePath, isArabic, prefix: isArabic ? "/ar" : "" };
}

async function fetchOne(table: string, field: string, value: string, select: string) {
  if (!SUPABASE_URL || !ANON_KEY) return undefined;
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?${field}=eq.${encodeURIComponent(value)}&select=${encodeURIComponent(select)}&limit=1`,
      { headers: HEADERS, signal: AbortSignal.timeout(7000) }
    );
    if (!r.ok) return undefined;
    const rows = await r.json();
    return rows?.[0] ?? null;
  } catch { return undefined; }
}

function missingMeta(url: string, label: string): PageMeta {
  return {
    title: `${label} not found | CrossFire Wiki`,
    description: `The requested ${label.toLowerCase()} was not found on CrossFire Wiki.`,
    image: DEFAULT_IMG,
    url,
    type: "website",
    robots: "noindex, nofollow",
    notFound: true,
  };
}

async function resolveMeta(path: string): Promise<PageMeta> {
  const { routePath, isArabic, prefix } = localizePath(path);
  const localizedUrl = (section: string, slug = "") => `${BASE}${prefix}${section}${slug ? `/${slug}` : ""}`;
  const alternateUrls = (section: string, slug = "") => [
    { lang: "en", url: `${BASE}${section}${slug ? `/${slug}` : ""}` },
    { lang: "ar", url: `${BASE}/ar${section}${slug ? `/${slug}` : ""}` },
    { lang: "x-default", url: `${BASE}${section}${slug ? `/${slug}` : ""}` },
  ];
  // ── /events/:slug ────────────────────────────────────────────────────
  const evM = routePath.match(/^\/events\/([^/?#]+)/);
  if (evM) {
    const slug = evM[1];
    const ev = await fetchOne("events", "event_name_slug", slug,
      "title,title_ar,description,description_ar,seo_title,seo_description,image_url,date,type,end_date,updated_at");
    const url = localizedUrl("/events", slug);
    if (ev === undefined) return { title: "CrossFire Events | CrossFire Wiki", description: "CrossFire events, dates, rewards and verified announcements.", image: DEFAULT_IMG, url, type: "article", alternates: alternateUrls("/events", slug) };
    if (!ev) return { ...missingMeta(url, "Event"), alternates: alternateUrls("/events", slug) };
    const title = (isArabic && ev.title_ar) || ev.seo_title || ev.title || "CrossFire Event";
    const sourceDescription = isArabic ? (ev.description_ar || ev.description) : ev.description;
    const desc = clip(ev.seo_description || sourceDescription || `CrossFire event "${ev.title}" — check dates, rewards and details on CrossFire Wiki.`, 160);
    const image = safeImage(ev.image_url);
    const startDate = safeIso(ev.date);
    const modifiedDate = safeIso(ev.updated_at) || startDate;
    return {
      title: `${title} | CrossFire Wiki`,
      description: desc,
      content: clip(sourceDescription, 5000),
      image,
      imageType: imageType(image),
      url,
      type: "article",
      datePublished: startDate,
      dateModified: modifiedDate,
      keywords: `CrossFire, CrossFire event, ${title}, Z8Games`,
      alternates: alternateUrls("/events", slug),
      schema: {
        "@context": "https://schema.org",
        "@type": "Event",
        name: title,
        description: clip(sourceDescription || desc, 500),
        image: { "@type": "ImageObject", url: image, width: 1200, height: 630 },
        startDate,
        endDate: safeIso(ev.end_date),
        url,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
        location: { "@type": "VirtualLocation", url: "https://crossfire.z8games.com" },
        organizer: { "@type": "Organization", name: "Smilegate West", url: "https://crossfire.z8games.com" },
        publisher: { "@type": "Organization", name: "CrossFire Wiki", url: BASE, logo: { "@type": "ImageObject", url: LOGO, width: 512, height: 512 } },
        inLanguage: isArabic ? "ar" : "en",
      },
    };
  }

  // ── /news/:slug ──────────────────────────────────────────────────────
  const newsM = routePath.match(/^\/news\/([^/?#]+)/);
  if (newsM) {
    const slug = newsM[1];
    const item = await fetchOne("news", "news_slug", slug,
      "title,title_ar,content,content_ar,html_content,seo_title,seo_description,image_url,created_at,updated_at,author,category");
    const url = localizedUrl("/news", slug);
    if (item === undefined) return { title: "CrossFire News | CrossFire Wiki", description: "Latest CrossFire updates, patch notes, announcements and verified game news.", image: DEFAULT_IMG, url, type: "article", alternates: alternateUrls("/news", slug) };
    if (!item) return { ...missingMeta(url, isArabic ? "News item" : "News item"), alternates: alternateUrls("/news", slug) };
    const title = (isArabic && item.title_ar) || item.seo_title || item.title || "CrossFire News";
    const sourceContent = isArabic ? (item.content_ar || item.content || item.html_content) : (item.content || item.html_content);
    const desc = clip(item.seo_description || sourceContent || `CrossFire news: ${item.title}`, 160);
    const img = safeImage(item.image_url);
    const published = safeIso(item.created_at);
    const modified = safeIso(item.updated_at) || published;
    return {
      title: `${title} | CrossFire Wiki`,
      description: desc,
      content: clip(sourceContent, 7000),
      image: img,
      imageType: imageType(img),
      url,
      type: "article",
      datePublished: published,
      dateModified: modified,
      keywords: `CrossFire, CrossFire news, ${item.category || "gaming"}, ${title}, Z8Games`,
      alternates: alternateUrls("/news", slug),
      schema: {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: title,
        description: clip(sourceContent || desc, 500),
        image: [{ "@type": "ImageObject", url: img, width: 1200, height: 630 }],
        datePublished: published,
        dateModified: modified,
        author: [{ "@type": "Person", name: item.author || "CrossFire Wiki" }],
        publisher: { "@type": "Organization", name: "CrossFire Wiki", url: BASE, logo: { "@type": "ImageObject", url: LOGO, width: 512, height: 512 } },
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        url,
        inLanguage: isArabic ? "ar" : "en",
      },
    };
  }

  // ── /posts/:slug ─────────────────────────────────────────────────────
  const postM = routePath.match(/^\/posts\/([^/?#]+)/);
  if (postM) {
    const slug = postM[1];
    const item = await fetchOne("posts", "post_slug", slug,
      "title,title_ar,content,content_ar,summary,summary_ar,seo_title,seo_description,image_url,og_image,created_at,updated_at,author,category,source_url");
    const url = localizedUrl("/posts", slug);
    if (item === undefined) return { title: "CrossFire Guides and Posts | CrossFire Wiki", description: "Verified CrossFire guides, explanations and community reference posts.", image: DEFAULT_IMG, url, type: "article", alternates: alternateUrls("/posts", slug) };
    if (!item) return { ...missingMeta(url, "Post"), alternates: alternateUrls("/posts", slug) };
    const title = (isArabic && item.title_ar) || item.seo_title || item.title || "CrossFire Guide";
    const sourceContent = isArabic ? (item.content_ar || item.content || item.summary_ar || item.summary) : (item.content || item.summary);
    const desc = clip(item.seo_description || sourceContent || `${item.title} — CrossFire Wiki`, 160);
    const img = safeImage(item.og_image || item.image_url);
    const published = safeIso(item.created_at);
    const modified = safeIso(item.updated_at) || published;
    return {
      title: `${title} | CrossFire Wiki`,
      description: desc,
      content: clip(sourceContent, 7000),
      image: img,
      imageType: imageType(img),
      url,
      type: "article",
      datePublished: published,
      dateModified: modified,
      keywords: `CrossFire, ${item.category || "guide"}, ${title}, Z8Games`,
      alternates: alternateUrls("/posts", slug),
      schema: {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description: clip(sourceContent || desc, 500),
        image: { "@type": "ImageObject", url: img, width: 1200, height: 630 },
        datePublished: published,
        dateModified: modified,
        author: [{ "@type": "Person", name: item.author || "CrossFire Wiki" }],
        publisher: { "@type": "Organization", name: "CrossFire Wiki", url: BASE, logo: { "@type": "ImageObject", url: LOGO, width: 512, height: 512 } },
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        url,
        inLanguage: isArabic ? "ar" : "en",
      },
    };
  }

  // ── /tutorials/:slug and /videos/:category/:slug ───────────────────────
  const tutM = routePath.match(/^\/tutorials\/([^/?#]+)$/);
  const videoM = routePath.match(/^\/videos\/[^/?#]+\/([^/?#]+)$/);
  if (tutM || videoM) {
    const slug = (tutM || videoM)![1];
    const item = await fetchOne("tutorials", "slug", slug,
      "title,title_ar,description,content,content_ar,seo_title,seo_description,image_url,created_at,youtube_url,youtube_id,video_url,category,difficulty");
    const url = videoM ? localizedUrl(routePath.slice(0, routePath.lastIndexOf("/")), slug) : localizedUrl("/tutorials", slug);
    if (item === undefined) return { title: "CrossFire Tutorials | CrossFire Wiki", description: "CrossFire tutorials and practical guides for weapons, modes and gameplay.", image: DEFAULT_IMG, url, type: "article" };
    if (!item) return missingMeta(url, "Tutorial");
    const title = (isArabic && item.title_ar) || item.seo_title || item.title || "CrossFire Tutorial";
    const sourceContent = isArabic ? (item.content_ar || item.content || item.description) : (item.content || item.description);
    const desc = clip(item.seo_description || sourceContent || `Learn: ${item.title} — a complete CrossFire guide with steps, strategy and gameplay advice.`, 160);
    const image = safeImage(item.image_url || (item.youtube_id ? `https://img.youtube.com/vi/${item.youtube_id}/hqdefault.jpg` : DEFAULT_IMG));
    const published = safeIso(item.created_at);
    const howTo = { "@type": "HowTo", name: title, description: clip(sourceContent || desc, 500), image, supply: [], tool: [] };
    const video = item.youtube_id || item.youtube_url || item.video_url ? {
      "@type": "VideoObject",
      name: title,
      description: clip(sourceContent || desc, 500),
      thumbnailUrl: [image],
      uploadDate: published,
      embedUrl: item.youtube_id ? `https://www.youtube.com/embed/${item.youtube_id}` : undefined,
      contentUrl: item.video_url || item.youtube_url || undefined,
      publisher: { "@type": "Organization", name: "CrossFire Wiki", url: BASE, logo: { "@type": "ImageObject", url: LOGO, width: 512, height: 512 } },
      isFamilyFriendly: true,
    } : null;
    return {
      title: `${title} | CrossFire Tutorials`,
      description: desc,
      content: clip(sourceContent, 7000),
      image,
      imageType: imageType(image),
      url,
      type: "article",
      datePublished: published,
      dateModified: published,
      keywords: `CrossFire tutorial, ${item.category || "gameplay guide"}, ${item.difficulty || "beginner"}, CrossFire video, Z8Games`,
      schema: { "@context": "https://schema.org", "@graph": [{ "@id": `${url}#howto`, ...howTo }, ...(video ? [{ "@id": `${url}#video`, ...video }] : [])] },
    };
  }

  // ── /pages/:slug ──────────────────────────────────────────────────────
  const pageM = routePath.match(/^\/pages\/([^/?#]+)$/);
  if (pageM) {
    const slug = pageM[1];
    const page = await fetchOne("custom_pages", "slug", slug,
      "slug,title_en,title_ar,content_en,content_ar,seo_title,seo_description,og_image,updated_at,status");
    const url = localizedUrl("/pages", slug);
    if (page === undefined) return { title: "CrossFire Wiki Pages", description: "Detailed CrossFire Wiki reference pages and guides.", image: DEFAULT_IMG, url, type: "article" };
    if (!page || page.status !== "published") return missingMeta(url, "Wiki page");
    const title = (isArabic && page.title_ar) || page.seo_title || page.title_en || page.title_ar || "CrossFire Wiki Page";
    const sourceContent = isArabic ? (page.content_ar || page.content_en) : page.content_en;
    const desc = clip(page.seo_description || sourceContent || `A detailed CrossFire Wiki page about ${title}.`, 160);
    const image = safeImage(page.og_image);
    const modified = safeIso(page.updated_at);
    return {
      title: `${title} | CrossFire Wiki`,
      description: desc,
      content: clip(sourceContent, 7000),
      image,
      imageType: imageType(image),
      url,
      type: "article",
      dateModified: modified,
      keywords: `CrossFire Wiki, ${title}, CrossFire guide`,
      alternates: alternateUrls("/pages", slug),
      schema: { "@context": "https://schema.org", "@type": "WebPage", name: title, description: clip(sourceContent || desc, 500), url, dateModified: modified, isPartOf: { "@type": "WebSite", name: "CrossFire Wiki", url: BASE }, publisher: { "@type": "Organization", name: "CrossFire Wiki", url: BASE, logo: { "@type": "ImageObject", url: LOGO, width: 512, height: 512 } }, inLanguage: isArabic ? "ar" : "en" },
    };
  }

  // ── /competition and /ar/competition ─────────────────────────────
  const isArabicCompetition = path === "/ar/competition";
  if (path === "/competition" || isArabicCompetition) {
    const activeConfig = await fetchOne("competition_config", "id", "default", "active");
    const active = Boolean(activeConfig?.active);
    const url = `${BASE}${path}`;
    const englishUrl = `${BASE}/competition`;
    const arabicUrl = `${BASE}/ar/competition`;
    const title = isArabicCompetition
      ? "مسابقة CrossFire Wiki بالعربية | اختبار معرفة كروس فاير"
      : "CrossFire Wiki Competition | CrossFire Knowledge Quiz";
    const description = isArabicCompetition
      ? "اختبار معرفة ثنائي اللغة عن CrossFire بأسئلة موثقة ونظام نقاط ومراجعة إدارية."
      : "A bilingual CrossFire knowledge quiz with sourced questions, administrator-reviewed scoring, and optional proof submissions.";
    return {
      title,
      description,
      image: `${BASE}/feature-crossfire.jpg`,
      url,
      type: "website",
      robots: active ? undefined : "noindex, follow",
      keywords: "CrossFire competition, CrossFire quiz, CrossFire Wiki, كروس فاير مسابقة",
      alternates: [
        { lang: "en", url: englishUrl },
        { lang: "ar", url: arabicUrl },
        { lang: "x-default", url: englishUrl },
      ],
      schema: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: title,
        description,
        url,
        isPartOf: { "@type": "WebSite", name: "CrossFire Wiki", url: BASE },
        inLanguage: isArabicCompetition ? "ar" : "en",
      },
    };
  }

  // ── /:region and /:region/weapons/:slug ───────────────────────────
  const regionMatch = routePath.match(/^\/([a-z0-9-]+)(?:\/weapons\/([a-z0-9-]+))?$/);
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
        image: DEFAULT_IMG,
        url: `${BASE}${prefix}${routePath}`,
        type: "website",
        imageType: imageType(DEFAULT_IMG),
        alternates: [{ lang: "en", url: `${BASE}${routePath}` }, { lang: "ar", url: `${BASE}/ar${routePath}` }, { lang: "x-default", url: `${BASE}${routePath}` }],
      };
    }
  }

  // ── static section pages ─────────────────────────────────────────────
  const sectionMeta: Record<string, Partial<PageMeta>> = {
        "/events":      { title: "CrossFire Events | Calendar, Dates & Rewards | CrossFire Wiki",           description: "CrossFire events, tournaments, and limited-time updates with dates, reward details, and archived information." },
    "/weapons":     { title: "CrossFire Weapons Database — Stats, Variants & Guides | CrossFire Wiki",    description: "Complete CrossFire weapon stats, damage values, variants and unlock methods." },
    "/modes":       { title: "CrossFire Game Modes — Team Match, Mutation, Ghost & More | CrossFire Wiki", description: "Every CrossFire game mode explained: rules, strategies, and tips for Team Match, Mutation Mode, Ghost Mode and more." },
    "/ranks":       { title: "CrossFire Rank System — All 104 Tiers & EXP Required | CrossFire Wiki",    description: "Full CrossFire ranking system from Private to National Soldier. EXP requirements, badges and promotion tips." },
    "/mercenaries": { title: "CrossFire Mercenaries — Characters, Stats & Abilities | CrossFire Wiki",   description: "Every CrossFire mercenary with abilities, teams, and how to get them." },
    "/maps":        { title: "CrossFire Maps — Black Widow, Egypt, Cabin & More | CrossFire Wiki",       description: "All CrossFire maps with layout overviews, strategies and callouts." },
    "/news":        { title: "CrossFire News — Updates, Patches & Announcements | CrossFire Wiki",       description: "Latest CrossFire West news, patch notes, updates and game announcements." },
    "/posts":       { title: "CrossFire Guides and Posts | Builds, Explanations & Reference | CrossFire Wiki", description: "Detailed CrossFire guides, mechanics explanations, strategies and verified community reference posts." },
    "/tutorials":   { title: "CrossFire Tutorials | Beginner Guides & Game Systems | CrossFire Wiki",           description: "CrossFire tutorials covering installation, movement, weapons, game systems, and practical gameplay questions." },
    "/videos":      { title: "CrossFire Videos — Tutorials, Gameplay & Highlights | CrossFire Wiki", description: "Watch CrossFire tutorials, gameplay, weapon guides, creator videos and highlights with useful explanations." },
    "/pages":       { title: "CrossFire Wiki Pages — Guides, Updates & Reference | CrossFire Wiki", description: "Browse detailed CrossFire Wiki pages covering updates, modes, weapons, events, systems and community guides." },
    "/content-hub": { title: "CrossFire Content Hub | Guides, Updates & Reference | CrossFire Wiki", description: "Browse organized CrossFire guides, updates, videos, events, and reference pages in the wiki content hub." },
    "/global-wiki":  { title: "CrossFire Global Wiki | Regional Weapons, Modes & Game Data", description: "Explore region-specific CrossFire weapons, modes, maps and verified game data across global versions." },
    "/grave-games":  { title: "CrossFire Grave Games | Modes, Rules & Reference | CrossFire Wiki", description: "Reference information for CrossFire Grave Games modes, rules and related game content." },
    "/sellers":      { title: "CrossFire Sellers | Trusted Stores, Top-Up & Community Services", description: "Browse CrossFire sellers and stores with available services, contact links and profile information." },
    "/services":     { title: "CrossFire Services | Player Services and Offers | CrossFire Wiki", description: "Explore reviewed CrossFire player services and available seller offers with clear details." },
    "/reviews":      { title: "CrossFire Seller Reviews | Community Ratings & Feedback", description: "Read community feedback and ratings for CrossFire sellers and services." },
    "/forum":        { title: "CrossFire Community Forum | Questions, Guides & Discussion", description: "Join CrossFire community discussions, ask questions and share useful gameplay knowledge." },
    "/download":     { title: "Download CrossFire | Official Installation and Support Links", description: "Find official CrossFire download, installation and support resources." },
    "/about":        { title: "About CrossFire Wiki | Independent CrossFire Reference", description: "Learn about CrossFire Wiki, its sources, editorial approach and community reference goals." },
    "/contact":      { title: "Contact CrossFire Wiki | Support and Feedback", description: "Contact CrossFire Wiki for corrections, source suggestions and site feedback." },
    "/faq":         { title: "CrossFire FAQ — Answers to Common Questions | CrossFire Wiki", description: "Find clear answers about CrossFire installation, modes, weapons, ranks, events, accounts and gameplay systems." },
  };
  const sectionMetaAr: Record<string, { title: string; description: string }> = {
    "/events": { title: "أحداث CrossFire | التقويم والمواعيد والمكافآت", description: "أحداث CrossFire والبطولات والتحديثات المؤقتة مع المواعيد والمكافآت والمعلومات الموثقة." },
    "/weapons": { title: "أسلحة CrossFire | الإحصائيات والأنواع وطرق الاقتناء", description: "قاعدة بيانات أسلحة CrossFire مع الإحصائيات والضرر والأنواع وطرق الحصول على كل سلاح." },
    "/modes": { title: "أوضاع لعب CrossFire | شرح القواعد والاستراتيجيات", description: "شرح أوضاع لعب CrossFire مثل Team Match وMutation وGhost مع القواعد والنصائح العملية." },
    "/ranks": { title: "رتب CrossFire | مستويات الخبرة ومتطلبات الترقية", description: "شرح نظام رتب CrossFire ومستويات الخبرة والشارات ومتطلبات الترقية." },
    "/mercenaries": { title: "شخصيات CrossFire | القدرات والأدوار", description: "مرجع شخصيات CrossFire مع القدرات والأدوار والفرق وطرق الاستخدام." },
    "/maps": { title: "خرائط CrossFire | Black Widow وEgypt وغيرها", description: "خرائط CrossFire مع الشروحات وأماكن التحرك والاستراتيجيات ونقاط النداء." },
    "/news": { title: "أخبار CrossFire | التحديثات والإعلانات", description: "آخر أخبار CrossFire والتحديثات وملاحظات التصحيح والإعلانات الموثقة." },
    "/posts": { title: "مقالات وأدلة CrossFire | الشروحات والاستراتيجيات", description: "مقالات وأدلة CrossFire المفصلة لشرح الأسلحة والأنظمة والاستراتيجيات والمعلومات الموثقة." },
    "/tutorials": { title: "أدلة CrossFire التعليمية | شرح المبتدئين وأنظمة اللعبة", description: "أدلة تعليمية عملية عن CrossFire والتثبيت والحركة والأسلحة وأنظمة اللعب." },
    "/videos": { title: "فيديوهات CrossFire | شروحات وأسلوب اللعب", description: "فيديوهات وشروحات CrossFire عن الأسلحة والأوضاع وأسلوب اللعب والمحتوى المفيد." },
    "/content-hub": { title: "مركز محتوى CrossFire | الأدلة والأخبار والمرجع", description: "تصفح أدلة CrossFire والأخبار والفيديوهات والأحداث وصفحات المرجع في مكان واحد." },
    "/faq": { title: "الأسئلة الشائعة عن CrossFire | إجابات واضحة", description: "إجابات واضحة عن تثبيت CrossFire والأسلحة والرتب والأحداث والحسابات وأسلوب اللعب." },
  };
  const sp = sectionMeta[routePath];
  if (sp) {
    const sectionUrl = `${BASE}${prefix}${routePath}`;
    const localized = isArabic ? (sectionMetaAr[routePath] || { title: `${sp.title!.split(" | ")[0]} بالعربية | CrossFire Wiki`, description: sp.description! }) : { title: sp.title!, description: sp.description! };
    return {
      title: localized.title,
      description: localized.description,
      image: DEFAULT_IMG,
      imageType: imageType(DEFAULT_IMG),
      url: sectionUrl,
      type: "website",
      alternates: routePath === "/competition" ? undefined : [{ lang: "en", url: `${BASE}${routePath}` }, { lang: "ar", url: `${BASE}/ar${routePath}` }, { lang: "x-default", url: `${BASE}${routePath}` }],
    };
  }

  // ── Default fallback ─────────────────────────────────────────────────
  return {
    title: isArabic ? "CrossFire Wiki بالعربية | مرجع الأسلحة والأحداث والأدلة" : "CrossFire Wiki | Weapons, Modes, Mercenaries & Community",
    description: isArabic ? "مرجع CrossFire يضم الأسلحة والخرائط والشخصيات والأوضاع والرتب والأحداث والأدلة." : "An independent CrossFire reference for weapons, maps, characters, game modes, ranks, events, and community resources.",
    image: DEFAULT_IMG,
    imageType: imageType(DEFAULT_IMG),
    url: `${BASE}${path}`,
    type: "website",
  };
}

function e(s: string) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function jsonLd(value: object): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = String(req.query.path || "/").trim() || "/";
  const meta = await resolveMeta(path);
  const requestHost = typeof req.headers.host === "string" ? req.headers.host : "";
  const isPreviewHost = requestHost.length > 0 && !/(^|\.)crossfire\.wiki$/i.test(requestHost.split(":")[0]);
  const robots = isPreviewHost ? "noindex, nofollow" : (meta.robots || "index, follow, max-image-preview:large");

  const isArabic = path === "/ar" || path.startsWith("/ar/");
  const schemaBlock = meta.schema
    ? `<script type="application/ld+json">${jsonLd(meta.schema)}</script>`
    : "";
  const contentBlock = meta.content
    ? `<section aria-label="${e(meta.title)}"><h2>${e(meta.title)}</h2><p>${e(meta.content)}</p></section>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="${isArabic ? "ar" : "en"}" prefix="og: https://ogp.me/ns#">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${e(meta.title)}</title>
<meta name="description" content="${e(meta.description)}">
<meta name="robots" content="${e(robots)}">
<meta name="googlebot" content="${e(robots)}">
<meta name="bingbot" content="${e(robots)}">
${meta.keywords ? `<meta name="keywords" content="${e(meta.keywords)}">` : ""}
${meta.datePublished ? `<meta name="article:published_time" content="${e(meta.datePublished)}">` : ""}
${meta.dateModified ? `<meta name="article:modified_time" content="${e(meta.dateModified)}">` : ""}
<link rel="canonical" href="${e(meta.url)}">

<!-- Open Graph -->
<meta property="og:type" content="${e(meta.type)}">
<meta property="og:url" content="${e(meta.url)}">
<meta property="og:title" content="${e(meta.title)}">
<meta property="og:description" content="${e(meta.description)}">
<meta property="og:image" content="${e(meta.image)}">
<meta property="og:image:secure_url" content="${e(meta.image)}">
<meta property="og:image:type" content="${e(meta.imageType || "image/jpeg")}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${e(meta.title)}">
<meta property="og:site_name" content="CrossFire Wiki">
<meta property="og:locale" content="${isArabic ? "ar_AR" : "en_US"}">
<meta property="og:locale:alternate" content="${isArabic ? "en_US" : "ar_AR"}">
${(meta.alternates || []).filter((alternate) => alternate.lang !== "x-default").map((alternate) => `<link rel="alternate" hreflang="${e(alternate.lang)}" href="${e(alternate.url)}">`).join("\n")}

<!-- Twitter / X -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@crossfirewiki">
<meta name="twitter:creator" content="@crossfirewiki">
<meta name="twitter:url" content="${e(meta.url)}">
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
<main>
<h1>${e(meta.title)}</h1>
<p>${e(meta.description)}</p>
${contentBlock}
<p><a href="${e(meta.url)}" style="color:#f5a623">Visit ${e(meta.url)}</a></p>
</main>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Robots-Tag", robots);
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300, stale-while-revalidate=3600");
  return res.status(meta.notFound ? 404 : 200).send(html);
}
