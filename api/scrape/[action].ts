import type { VercelRequest, VercelResponse } from "@vercel/node";

import { verifyAdminRequest } from "../../server/adminAuth.js";
import { assertApprovedSourceUrl } from "../../server/urlSafety.js";
import { buildFandomDraft, discoverFandomCategory, scrapeFandomPage as scrapeFandomPageData } from "../../server/fandomAutomation.js";

const CORS = new Map([
  ["Access-Control-Allow-Origin", "*"],
  ["Access-Control-Allow-Methods", "POST, OPTIONS"],
  ["Access-Control-Allow-Headers", "Content-Type, Authorization"],
]);

function addCorsHeaders(res: VercelResponse) {
  for (const [key, value] of CORS) res.setHeader(key, value);
  return res;
}

function readAction(req: VercelRequest): string {
  const value = req.query.action;
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function cronAuthorized(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET || "";
  const authorization = typeof req.headers.authorization === "string" ? req.headers.authorization : "";
  return secret.length >= 16 && authorization === `Bearer ${secret}`;
}

function normalizeImageUrl(value: unknown, baseUrl?: string): string {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const parsed = new URL(value.trim(), baseUrl);
    const hostname = parsed.hostname.toLowerCase();
    // This legacy host presents a certificate for a different name and cannot
    // be safely embedded from an HTTPS page. The UI will use its local fallback.
    if (hostname === "image.us.z8games.com" || hostname === "image.z8games.com") return "";
    if (parsed.protocol === "http:") parsed.protocol = "https:";
    if (parsed.protocol !== "https:") return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

async function fetchHtml(url: string, timeoutMs = 20000) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; CrossFireWikiBot/1.0)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} fetching source`);
  return response.text();
}

type ScrapedMedia = {
  images: string[];
  videos: string[];
  links: string[];
};

type DeepScrapedPage = {
  title: string;
  content: string;
  rawHtml?: string;
  markdown?: string;
  wikitext?: string;
  excerpt: string;
  seoDescription: string;
  seoTitle: string;
  keywords: string[];
  mainImage: string;
  image: string;
  sourceUrl: string;
  url: string;
  isWiki: boolean;
  contentLength: number;
  media: ScrapedMedia;
  sections?: Array<{ index?: string; line?: string; anchor?: string }>;
  status: "success";
};

function uniqueValues(values: string[], max: number): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(0, max);
}

function isVideoUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" &&
      (parsed.hostname === "youtu.be" || parsed.hostname.endsWith("youtube.com") || parsed.hostname.endsWith("youtube-nocookie.com") || parsed.hostname.endsWith("vimeo.com"));
  } catch {
    return false;
  }
}

async function extractMedia(html: string, baseUrl: string): Promise<ScrapedMedia> {
  const cheerio = await import("cheerio");
  const $ = cheerio.load(html);
  const images: string[] = [];
  $("img").each((_index, element) => {
    const value = $(element).attr("src") || $(element).attr("data-src") || $(element).attr("data-image-url") || "";
    const normalized = normalizeImageUrl(value, baseUrl);
    if (normalized) images.push(normalized);
  });
  const videos: string[] = [];
  $("iframe,video source,a").each((_index, element) => {
    const value = $(element).attr("src") || $(element).attr("href") || "";
    const normalized = normalizeImageUrl(value, baseUrl);
    if (normalized && isVideoUrl(normalized)) videos.push(normalized);
  });
  const links: string[] = [];
  $("a[href]").each((_index, element) => {
    const href = $(element).attr("href") || "";
    try {
      const parsed = new URL(href, baseUrl);
      if (parsed.protocol === "https:") links.push(parsed.toString());
    } catch { /* Ignore malformed links in source HTML. */ }
  });
  return {
    images: uniqueValues(images, 300),
    videos: uniqueValues(videos, 100),
    links: uniqueValues(links, 500),
  };
}

async function sanitizeSourceHtml(html: string, baseUrl: string): Promise<string> {
  const cheerio = await import("cheerio");
  const $ = cheerio.load(`<div id="__source_root__">${html}</div>`);
  $("script,style,object,embed,form,button,input,textarea,select").remove();
  $("[onload],[onclick],[onerror],[onmouseover],[onfocus],[onmouseenter]").each((_index, element) => {
    const attributes = (element as { attribs?: Record<string, string> }).attribs || {};
    for (const attribute of Object.keys(attributes)) {
      if (attribute.toLowerCase().startsWith("on")) $(element).removeAttr(attribute);
    }
  });
  $("img").each((_index, element) => {
    const raw = $(element).attr("src") || $(element).attr("data-src") || $(element).attr("data-image-url") || "";
    const normalized = normalizeImageUrl(raw, baseUrl);
    if (!normalized) $(element).remove();
    else {
      $(element).attr("src", normalized);
      $(element).removeAttr("srcset").removeAttr("data-src").removeAttr("data-image-url");
    }
  });
  $("a").each((_index, element) => {
    const href = $(element).attr("href") || "";
    try {
      const parsed = new URL(href, baseUrl);
      if (parsed.protocol !== "https:") $(element).replaceWith($(element).text());
      else $(element).attr("href", parsed.toString()).attr("rel", "nofollow noopener noreferrer").attr("target", "_blank");
    } catch {
      $(element).replaceWith($(element).text());
    }
  });
  $("iframe").each((_index, element) => {
    const source = $(element).attr("src") || "";
    try {
      const parsed = new URL(source, baseUrl);
      const allowed = parsed.protocol === "https:" && (parsed.hostname.endsWith("youtube.com") || parsed.hostname.endsWith("youtube-nocookie.com") || parsed.hostname.endsWith("vimeo.com"));
      if (!allowed) $(element).remove();
      else $(element).attr("src", parsed.toString()).removeAttr("allowfullscreen").attr("loading", "lazy").attr("referrerpolicy", "strict-origin-when-cross-origin");
    } catch {
      $(element).remove();
    }
  });
  $("*").each((_index, element) => {
    const attributes = (element as { attribs?: Record<string, string> }).attribs || {};
    for (const attribute of Object.keys(attributes)) {
      if (attribute.toLowerCase().startsWith("on")) $(element).removeAttr(attribute);
    }
  });
  return $("#__source_root__").html() || "";
}

function isFandomUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.endsWith(".fandom.com") && !hostname.startsWith("fandom.com");
  } catch {
    return false;
  }
}

function fandomPageTitle(url: string): string {
  const parsed = new URL(url);
  const match = parsed.pathname.match(/^\/wiki\/(.+)$/i);
  if (!match) throw new Error("Fandom page URL must use the /wiki/Page_Name format");
  return decodeURIComponent(match[1]).replace(/_/g, " ").trim();
}

async function scrapeFandomPage(url: string): Promise<DeepScrapedPage> {
  const parsedUrl = new URL(url);
  const apiUrl = new URL("/api.php", parsedUrl.origin);
  apiUrl.search = new URLSearchParams({
    action: "parse",
    page: fandomPageTitle(url),
    prop: "text|wikitext|images|externallinks|sections|links|displaytitle",
    format: "json",
    formatversion: "2",
    origin: "*",
  }).toString();
  const response = await fetch(apiUrl, {
    headers: { "User-Agent": "CrossFireWikiBot/1.0 (+content import)" },
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) throw new Error(`Fandom API HTTP ${response.status}`);
  const payload = await response.json() as any;
  if (payload?.error || !payload?.parse) throw new Error(payload?.error?.info || "Fandom page could not be parsed");
  const parsed = payload.parse;
  const rawHtml = typeof parsed.text === "string" ? parsed.text : "";
  const content = await sanitizeSourceHtml(rawHtml, url);
  const cheerio = await import("cheerio");
  const $ = cheerio.load(content);
  const plain = $.text().replace(/\s+/g, " ").trim();
  const media = await extractMedia(content, url);
  const image = media.images[0] || "";
  const linksFromApi = Array.isArray(parsed.links)
    ? parsed.links.map((link: any) => typeof link === "string" ? link : String(link?.url || link?.title || "")).filter(Boolean)
    : [];
  const internalLinks = linksFromApi.map((link: string) => {
    try {
      return new URL(link.startsWith("/") ? link : `/wiki/${link.replace(/^wiki\//, "")}`, parsedUrl.origin).toString();
    } catch { return ""; }
  });
  return {
    title: String(parsed.title || parsed.displaytitle || fandomPageTitle(url)).replace(/<[^>]+>/g, "").trim(),
    content,
    rawHtml,
    wikitext: typeof parsed.wikitext === "string" ? parsed.wikitext.slice(0, 500000) : undefined,
    excerpt: plain.slice(0, 300),
    seoDescription: plain.slice(0, 300),
    seoTitle: String(parsed.title || fandomPageTitle(url)).slice(0, 160),
    keywords: uniqueValues(plain.split(/[,.;|]/).map((value) => value.trim()), 20),
    mainImage: image,
    image,
    sourceUrl: url,
    url,
    isWiki: true,
    contentLength: plain.length,
    media: { ...media, links: uniqueValues([...media.links, ...internalLinks], 500) },
    sections: Array.isArray(parsed.sections) ? parsed.sections.slice(0, 100).map((section: any) => ({ index: section.index, line: section.line, anchor: section.anchor })) : [],
    status: "success",
  };
}

async function scrapeWithFirecrawlDeep(url: string, fcKey: string): Promise<DeepScrapedPage> {
  const r = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    signal: AbortSignal.timeout(60000),
    headers: { Authorization: `Bearer ${fcKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      formats: ["markdown", "html", "links"],
      onlyMainContent: true,
      waitFor: 1000,
      removeBase64Images: true,
      actions: [
        { type: "executeJavascript", script: "(()=>{const s=['details summary','[role=tab]','.tabber__tab','.wds-dropdown__toggle'];let n=0;for(const q of s)for(const e of document.querySelectorAll(q)){try{e.click();n++}catch{}}return String(n)})()" },
        { type: "wait", milliseconds: 750 },
        { type: "scrape" },
      ],
    }),
  });
  if (!r.ok) throw new Error(`Firecrawl HTTP ${r.status}`);
  const payload = await r.json() as any;
  const data = payload?.data || payload;
  const rawHtml = typeof data?.html === "string" ? data.html : "";
  const markdown = typeof data?.markdown === "string" ? data.markdown : "";
  const content = await sanitizeSourceHtml(rawHtml, url);
  const cheerio = await import("cheerio");
  const $ = cheerio.load(content || `<p>${markdown}</p>`);
  const plain = $.text().replace(/\s+/g, " ").trim() || markdown.replace(/\s+/g, " ").trim();
  const media = await extractMedia(rawHtml || content, url);
  const listedLinks = Array.isArray(data?.links) ? data.links.filter((value: unknown): value is string => typeof value === "string") : [];
  const title = String(data?.metadata?.title || $("h1").first().text() || $("title").text() || "").trim();
  return {
    title,
    content: content || `<p>${markdown.slice(0, 500000)}</p>`,
    rawHtml,
    markdown: markdown.slice(0, 500000),
    excerpt: plain.slice(0, 300),
    seoDescription: plain.slice(0, 300),
    seoTitle: title.slice(0, 160),
    keywords: [],
    mainImage: media.images[0] || normalizeImageUrl(String(data?.metadata?.ogImage || ""), url),
    image: media.images[0] || normalizeImageUrl(String(data?.metadata?.ogImage || ""), url),
    sourceUrl: url,
    url,
    isWiki: url.includes("fandom.com") || url.includes("wiki"),
    contentLength: plain.length,
    media: { ...media, links: uniqueValues([...media.links, ...listedLinks], 500) },
    status: "success",
  };
}

async function scrapeDeepUrl(url: string, firecrawlKey: string): Promise<DeepScrapedPage> {
  if (isFandomUrl(url)) {
    try { return await scrapeFandomPage(url); }
    catch (error) {
      if (!firecrawlKey) throw error;
    }
  }
  if (firecrawlKey) {
    try { return await scrapeWithFirecrawlDeep(url, firecrawlKey); }
    catch (error) { console.warn("[scrape/deep] Firecrawl fallback", error instanceof Error ? error.message : error); }
  }
  const basic = await scrapeSingleUrl(url);
  const content = await sanitizeSourceHtml(basic.content, url);
  const cheerio = await import("cheerio");
  const $ = cheerio.load(content);
  const plain = $.text().replace(/\s+/g, " ").trim();
  return { ...basic, content, rawHtml: basic.content, seoDescription: plain.slice(0, 300), contentLength: plain.length, media: await extractMedia(content, url), status: "success" as const };
}

async function discoverFandomPages(url: string, limit: number, category?: string) {
  const parsedUrl = new URL(url);
  const apiUrl = new URL("/api.php", parsedUrl.origin);
  const params = new URLSearchParams({ action: "query", format: "json", formatversion: "2", origin: "*" });
  if (category) {
    params.set("list", "categorymembers");
    params.set("cmtitle", `Category:${category.replace(/^Category:/i, "").trim()}`);
    params.set("cmnamespace", "0");
    params.set("cmlimit", String(limit));
  } else {
    params.set("prop", "links");
    params.set("titles", fandomPageTitle(url));
    params.set("plnamespace", "0");
    params.set("pllimit", String(limit));
  }
  apiUrl.search = params.toString();
  const response = await fetch(apiUrl, { headers: { "User-Agent": "CrossFireWikiBot/1.0 (+content import)" }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Fandom discovery HTTP ${response.status}`);
  const payload = await response.json() as any;
  if (payload?.error) throw new Error(payload.error.info || "Fandom discovery failed");
  const rows = category ? (Array.isArray(payload?.query?.categorymembers) ? payload.query.categorymembers : []) : (Array.isArray(payload?.query?.pages?.[0]?.links) ? payload.query.pages[0].links : []);
  const pages = rows.map((row: any) => {
    const title = String(row.title || "").trim();
    return title ? { title, url: new URL(`/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`, parsedUrl.origin).toString() } : null;
  }).filter(Boolean);
  return { sourceUrl: url, category: category || null, pages };
}

async function startFandomCrawl(url: string, firecrawlKey: string, options: { limit?: number; depth?: number; includePaths?: string[] }) {
  if (!firecrawlKey) throw new Error("Firecrawl is not configured for crawl jobs");
  const limit = Math.min(200, Math.max(1, Number(options.limit) || 25));
  const maxDiscoveryDepth = Math.min(3, Math.max(0, Number(options.depth) || 1));
  const includePaths = Array.isArray(options.includePaths) ? options.includePaths.filter((value): value is string => typeof value === "string" && value.startsWith("/") && value.length <= 160).slice(0, 10) : [];
  const response = await fetch("https://api.firecrawl.dev/v2/crawl", {
    method: "POST",
    headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(30000),
    body: JSON.stringify({
      url,
      limit,
      maxDiscoveryDepth,
      includePaths: includePaths.length ? includePaths : undefined,
      sitemap: "include",
      ignoreQueryParameters: true,
      crawlEntireDomain: false,
      allowExternalLinks: false,
      allowSubdomains: false,
      maxConcurrency: 2,
      delay: 500,
      scrapeOptions: {
        formats: ["markdown", "html", "links"],
        onlyMainContent: true,
        waitFor: 1000,
        removeBase64Images: true,
        blockAds: true,
        actions: [
          { type: "executeJavascript", script: "(()=>{const s=['details summary','[role=tab]','.tabber__tab','.wds-dropdown__toggle'];for(const q of s)for(const e of document.querySelectorAll(q)){try{e.click()}catch{}}return true})()" },
          { type: "wait", milliseconds: 500 },
          { type: "scrape" },
        ],
      },
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) throw new Error(payload?.error || `Firecrawl crawl HTTP ${response.status}`);
  return { id: String(payload.id || ""), url: String(payload.url || url), limit, maxDiscoveryDepth };
}

async function getFandomCrawlStatus(id: string, firecrawlKey: string) {
  if (!firecrawlKey || !/^[a-zA-Z0-9_-]{8,160}$/.test(id)) throw new Error("Valid Firecrawl crawl id is required");
  const response = await fetch(`https://api.firecrawl.dev/v2/crawl/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${firecrawlKey}` }, signal: AbortSignal.timeout(30000) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || `Firecrawl crawl status HTTP ${response.status}`);
  return payload;
}

async function saveFandomPageDraft(sourceUrl: string) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || "";
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase is not configured for draft saving");
  const page = await scrapeFandomPageData(sourceUrl);
  const draft = buildFandomDraft(page);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    Prefer: "return=representation",
  };
  const existingResponse = await fetch(`${supabaseUrl}/rest/v1/custom_pages?slug=eq.${encodeURIComponent(draft.slug)}&select=id,status&limit=1`, { headers, signal: AbortSignal.timeout(9000) });
  if (!existingResponse.ok) throw new Error("Could not check existing draft");
  const existingRows = await existingResponse.json().catch(() => []);
  const existing = Array.isArray(existingRows) ? existingRows[0] : null;
  if (existing?.status === "published") return { status: "published-exists", id: String(existing.id), title: page.title, sourceUrl };
  const response = existing?.id
    ? await fetch(`${supabaseUrl}/rest/v1/custom_pages?id=eq.${encodeURIComponent(String(existing.id))}`, { method: "PATCH", headers, body: JSON.stringify({ ...draft, updated_at: new Date().toISOString() }), signal: AbortSignal.timeout(9000) })
    : await fetch(`${supabaseUrl}/rest/v1/custom_pages`, { method: "POST", headers, body: JSON.stringify(draft), signal: AbortSignal.timeout(9000) });
  if (!response.ok) throw new Error(`Draft save failed: ${await response.text()}`);
  const rows = await response.json().catch(() => []);
  return { status: "draft", id: String(rows?.[0]?.id || existing?.id || draft.slug), title: page.title, sourceUrl, contentLength: page.text.length, images: page.imageUrls.length, videos: page.videoUrls.length, links: page.links.length };
}

async function runFandomAutomation() {
  const rootUrl = process.env.FANDOM_AUTOMATION_ROOT_URL || "https://crossfirefps.fandom.com/wiki/Weapons";
  const category = (process.env.FANDOM_AUTOMATION_CATEGORY || "Weapons").trim();
  const configuredLimit = Number(process.env.FANDOM_AUTOMATION_MAX_PAGES || 3);
  const limit = Math.min(3, Math.max(1, Number.isFinite(configuredLimit) ? Math.floor(configuredLimit) : 3));
  if (!rootUrl || !category) return { status: "skipped", reason: "Fandom automation source is not configured", discovered: 0, drafted: 0, skippedPublished: 0, failed: [] };
  const approvedRoot = await assertApprovedSourceUrl(rootUrl);
  if (!isFandomUrl(approvedRoot)) throw new Error("Fandom automation root must be a Fandom URL");
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || "";
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase is not configured for draft automation");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    Prefer: "return=representation",
  };
  const pages = await discoverFandomCategory(approvedRoot, category, limit);
  let drafted = 0;
  let skippedPublished = 0;
  const failed: Array<{ title: string; error: string }> = [];
  for (const pageRef of pages.slice(0, limit)) {
    try {
      const page = await scrapeFandomPageData(pageRef.url);
      const draft = buildFandomDraft(page);
      const existingResponse = await fetch(`${supabaseUrl}/rest/v1/custom_pages?slug=eq.${encodeURIComponent(draft.slug)}&select=id,status&limit=1`, { headers, signal: AbortSignal.timeout(9000) });
      if (!existingResponse.ok) throw new Error("Could not check existing draft");
      const existingRows = await existingResponse.json().catch(() => []);
      const existing = Array.isArray(existingRows) ? existingRows[0] : null;
      if (existing?.status === "published") {
        skippedPublished += 1;
        continue;
      }
      const response = existing?.id
        ? await fetch(`${supabaseUrl}/rest/v1/custom_pages?id=eq.${encodeURIComponent(String(existing.id))}`, { method: "PATCH", headers, body: JSON.stringify({ ...draft, updated_at: new Date().toISOString() }), signal: AbortSignal.timeout(9000) })
        : await fetch(`${supabaseUrl}/rest/v1/custom_pages`, { method: "POST", headers, body: JSON.stringify(draft), signal: AbortSignal.timeout(9000) });
      if (!response.ok) throw new Error(`Draft save failed: ${await response.text()}`);
      drafted += 1;
    } catch (error) {
      failed.push({ title: pageRef.title, error: error instanceof Error ? error.message : "Page failed" });
    }
  }
  return { status: "completed", rootUrl: approvedRoot, category, discovered: pages.length, drafted, skippedPublished, failed };
}

async function scrapeSingleUrl(url: string) {
  const html = await fetchHtml(url);
  const cheerio = await import("cheerio");
  const $ = cheerio.load(html);
  const title =
    $("h1.page-header__title").first().text().trim() ||
    $("h1").first().text().trim() ||
    $("title").text().replace(/\s*[|\-–].*$/, "").trim() ||
    $("meta[property='og:title']").attr("content") || "";
  const image = normalizeImageUrl(
    $("meta[property='og:image']").attr("content") ||
    $(".mw-content-text img").first().attr("src") ||
    $("article img").first().attr("src") || "",
    url,
  );

  $("nav,script,style,header,footer,.navbox,.toc,.mw-indicators,.mw-editsection,#mw-navigation,#mw-head,#mw-panel,.sidebar,aside,.advertisement").remove();
  const contentEl = $(".mw-parser-output, article, main, #content, .content").first();
  const content = contentEl.length ? contentEl.html() || "" : $("body").html() || "";
  const plain = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  return {
    title,
    content,
    excerpt: plain.slice(0, 300),
    seoDescription: plain.slice(0, 300),
    seoTitle: title,
    keywords: [],
    mainImage: image,
    image,
    sourceUrl: url,
    url,
    isWiki: url.includes("fandom.com") || url.includes("wiki"),
    contentLength: plain.length,
    status: "success" as const,
  };
}

async function scrapeForumList() {
  const rssUrl = "https://forum.z8games.com/categories/crossfire-announcements/feed.rss";
  const response = await fetch(rssUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; CrossFireWikiBot/1.0)",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} fetching RSS feed`);
  const xml = await response.text();
  const getTag = (block: string, tag: string): string => {
    const start = block.indexOf(`<${tag}`);
    if (start === -1) return "";
    const contentStart = block.indexOf(">", start);
    const end = block.indexOf(`</${tag}>`, contentStart);
    if (contentStart === -1 || end === -1) return "";
    return block.slice(contentStart + 1, end).trim().replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
  };

  const posts: Array<{ title: string; url: string; date: string; dateISO: string; image: string; author: string }> = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = getTag(block, "title");
    const url = getTag(block, "link");
    const date = getTag(block, "pubDate");
    const author = getTag(block, "dc:creator");
    const description = getTag(block, "description");
    const image = normalizeImageUrl(description.match(/src="([^"]+)"/)?.[1] || "", url);
    let dateISO = "";
    try { dateISO = new Date(date).toISOString(); } catch { /* keep an empty date */ }
    if (title && url) posts.push({ title, url, date, dateISO, image, author });
  }
  return { posts };
}

function toIso(value: string) {
  if (!value) return "";
  const date = new Date(`${value} ${new Date().getFullYear()}`);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 16);
}

async function scrapeForumThread(url: string) {
  const html = await fetchHtml(url, 25000);
  const cheerio = await import("cheerio");
  const $ = cheerio.load(html);
  const threadTitle =
    $("meta[property='og:title']").attr("content") ||
    $("h1").first().text().trim() ||
    $("title").text().replace(/\s*[|–\-].*$/, "").trim() ||
    "Untitled Event";
  const threadImage = normalizeImageUrl(
    $("meta[property='og:image']").attr("content") || $("meta[name='twitter:image']").attr("content") || "",
    url,
  );
  const threadDate = $(".ItemDiscussion time, #Item_0 time, .DateCreated time").first().attr("datetime") || $("time").first().attr("datetime") || "";
  const firstMessage = $(".Message").first();
  const description = firstMessage.html() || "";
  const descriptionText = firstMessage.text().replace(/\s+/g, " ").trim();
  const dateParts = threadTitle.match(/(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?/gi) || [];
  const startDate = dateParts[0] || (threadDate ? threadDate.slice(0, 10) : "");
  const endDate = dateParts[1] || dateParts[0] || "";

  return {
    threadTitle,
    threadDate,
    threadImage,
    threadUrl: url,
    events: [{
      title: threadTitle,
      image: threadImage,
      date: startDate,
      startDate: toIso(startDate),
      endDate: toIso(endDate),
      description,
      descriptionText,
      sourceUrl: url,
      selected: true,
    }],
  };
}

// ── auto-publisher: forum events → translated event+news rows ─────────────────
// Egyptian Arabic (simple, calm, NOT Fusha) + simple clear English.
// Reuses scrapeForumList (RSS) + scrapeForumThread from this file.
async function translateEventText(threadTitle: string, threadText: string): Promise<{ title_ar: string; description_ar: string; title_en: string; description_en: string } | null> {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY || "";
  if (!apiKey) return null;
  const model = process.env.OPENROUTER_MODEL || process.env.VITE_OPENROUTER_MODEL || "openai/gpt-oss-20b:free";
  const system = "You are the translator for CrossFire Wiki. You rewrite official CrossFire event announcements for players. RULES (follow strictly): \"description_ar\" MUST be in Egyptian Arabic, calm and friendly, simple words the average player understands. NEVER use formal Fusha. Explain: what the event is, what the player should do step by step, and when it ends if a date is mentioned. \"title_ar\" is a short Egyptian Arabic event title. \"description_en\" is the SAME explanation in simple, clear, easy English (short sentences, no complex words). \"title_en\" is a short simple English title. Keep each description 2-4 short sentences (max ~500 characters). Reply with ONLY a JSON object, no code fences, no extra text: {\"title_ar\": \"...\", \"description_ar\": \"...\", \"title_en\": \"...\", \"description_en\": \"...\"}";
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json", "HTTP-Referer": "https://crossfirewiki.com", "X-Title": "CrossFire Wiki Auto-Publisher" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: "Event title: " + threadTitle + "\n\nOfficial text:\n" + String(threadText || "").slice(0, 4000) },
        ],
        max_tokens: 1200,
        temperature: 0.4,
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    let content: string = data?.choices?.[0]?.message?.content || "";
    content = content.replace(/```json|```/gi, "").trim();
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    const parsed = JSON.parse(content.slice(start, end + 1));
    if (!parsed.description_ar && !parsed.description_en) return null;
    return {
      title_ar: String(parsed.title_ar || threadTitle).slice(0, 160),
      description_ar: String(parsed.description_ar || "").slice(0, 2000),
      title_en: String(parsed.title_en || threadTitle).slice(0, 160),
      description_en: String(parsed.description_en || "").slice(0, 2000),
    };
  } catch {
    return null;
  }
}

async function runEventsAutoPublisher(query: Record<string, unknown>) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || "";
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase is not configured for auto-publish");
  const dry = String(Array.isArray(query.dry) ? query.dry[0] : query.dry || "") === "1";
  const limit = Math.min(8, Math.max(1, Number(Array.isArray(query.limit) ? query.limit[0] : query.limit) || 3));
  const headers = { apikey: serviceKey, Authorization: "Bearer " + serviceKey, "Content-Type": "application/json", Prefer: "return=minimal" };
  const summary: Record<string, unknown> = { checked: 0, alreadyPublished: 0, published: [] as string[], skipped: 0, failed: [] as Array<{ title: string; error: string }>, dry };
  const slugify = (v: string) => String(v || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "event";

  const { posts } = await scrapeForumList();
  summary.checked = posts.length;

  let processed = 0;
  for (const post of posts) {
    const idMatch = String(post.url || "").match(/\/discussion\/(\d+)/);
    const discussionId = idMatch ? idMatch[1] : "";
    if (!discussionId) continue;
    let exists = false;
    try {
      const r = await fetch(supabaseUrl + "/rest/v1/events?source_url=like.*discussion%2F" + discussionId + "*&select=id&limit=1", { headers, signal: AbortSignal.timeout(10000) });
      const rows = r.ok ? await r.json().catch(() => []) : [];
      exists = Array.isArray(rows) && rows.length > 0;
    } catch { exists = false; }
    if (exists) {
      summary.alreadyPublished = Number(summary.alreadyPublished) + 1;
      continue;
    }
    if (processed >= limit) {
      summary.skipped = Number(summary.skipped) + 1;
      continue;
    }
    processed++;
    try {
      const thread = await scrapeForumThread(post.url);
      const first = Array.isArray(thread.events) && thread.events[0] ? thread.events[0] : null;
      const sourceText = (first?.descriptionText || post.title || "").toString();
      const tr = await translateEventText(post.title, sourceText);
      if (!tr) throw new Error("Translation failed");
      const slug = slugify(tr.title_en || post.title) + "-cf" + discussionId;
      const dateISO = (first?.startDate as string) || post.dateISO || new Date().toISOString();
      const eventRow = {
        title: tr.title_en || post.title,
        title_ar: tr.title_ar,
        event_name_slug: slug,
        description: tr.description_en,
        description_ar: tr.description_ar,
        date: dateISO,
        start_date: dateISO,
        end_date: (first?.endDate as string) || dateISO,
        image_url: (first?.image as string) || post.image || "",
        type: "community",
        source_url: post.url,
      };
      if (!dry) {
        const ins = await fetch(supabaseUrl + "/rest/v1/events", { method: "POST", headers, body: JSON.stringify(eventRow), signal: AbortSignal.timeout(15000) });
        if (!ins.ok) throw new Error("Event insert failed: " + await ins.text());
        try {
          await fetch(supabaseUrl + "/rest/v1/news", {
            method: "POST", headers, signal: AbortSignal.timeout(15000),
            body: JSON.stringify({ title: eventRow.title, news_slug: slug + "-" + Date.now(), content: eventRow.description, html_content: eventRow.description, image_url: eventRow.image_url, category: "events", author: "CrossFire Wiki", source_url: post.url, featured: false, preview_on_home: true }),
          });
        } catch { /* news mirror is best-effort */ }
      }
      (summary.published as string[]).push(post.title);
    } catch (e: unknown) {
      (summary.failed as Array<{ title: string; error: string }>).push({ title: post.title, error: e instanceof Error ? e.message : "Publish failed" });
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  return summary;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return addCorsHeaders(res).status(204).end();
  const action = readAction(req);
  const isAutomationRequest = action === "automation";
  if (isAutomationRequest && req.method === "GET") {
    if (!cronAuthorized(req)) return addCorsHeaders(res).status(401).json({ error: "Unauthorized" });
    try {
      const result = await runFandomAutomation();
      return addCorsHeaders(res).status(200).json(result);
    } catch (error) {
      console.error("[scrape/automation]", error instanceof Error ? error.message : error);
      return addCorsHeaders(res).status(500).json({ error: error instanceof Error ? error.message : "Automation failed" });
    }
  }
  const isPublishEventsRequest = action === "publish-events";
  if (isPublishEventsRequest && req.method === "GET") {
    if (!cronAuthorized(req)) return addCorsHeaders(res).status(401).json({ error: "Unauthorized" });
    try {
      const result = await runEventsAutoPublisher(req.query as Record<string, unknown>);
      return addCorsHeaders(res).status(200).json(result);
    } catch (error) {
      console.error("[scrape/publish-events]", error instanceof Error ? error.message : error);
      return addCorsHeaders(res).status(500).json({ error: error instanceof Error ? error.message : "Auto-publish failed" });
    }
  }
  if (req.method !== "POST") return addCorsHeaders(res).status(405).json({ error: "POST only" });
  if (!verifyAdminRequest(req.headers as Record<string, unknown>)) {
    return addCorsHeaders(res).status(401).json({ error: "Unauthorized" });
  }

  try {
    const firecrawlKey = process.env.FIRECRAWL_API_KEY || "";
    if (action === "fandom-page" || action === "custom-url") {
      const approvedUrl = await assertApprovedSourceUrl(req.body?.url);
      if (action === "fandom-page" && !isFandomUrl(approvedUrl)) {
        return addCorsHeaders(res).status(400).json({ error: "Fandom page action requires a Fandom URL" });
      }
      const scraped = await scrapeDeepUrl(approvedUrl, firecrawlKey);
      return addCorsHeaders(res).status(200).json({
        ...scraped,
        contentLength: scraped.contentLength,
        mediaCounts: {
          images: scraped.media.images.length,
          videos: scraped.media.videos.length,
          links: scraped.media.links.length,
          sections: scraped.sections?.length || 0,
        },
      });
    }
    if (action === "fandom-discover") {
      const approvedUrl = await assertApprovedSourceUrl(req.body?.url);
      if (!isFandomUrl(approvedUrl)) return addCorsHeaders(res).status(400).json({ error: "Fandom discovery requires a Fandom URL" });
      const category = typeof req.body?.category === "string" ? req.body.category.trim().slice(0, 120) : "";
      if (!category) return addCorsHeaders(res).status(400).json({ error: "A Fandom category is required" });
      const result = await discoverFandomPages(approvedUrl, Math.min(100, Math.max(1, Number(req.body?.limit) || 25)), category);
      return addCorsHeaders(res).status(200).json(result);
    }
    if (action === "fandom-crawl-start") {
      const approvedUrl = await assertApprovedSourceUrl(req.body?.url);
      if (!isFandomUrl(approvedUrl)) return addCorsHeaders(res).status(400).json({ error: "Fandom crawl requires a Fandom URL" });
      const result = await startFandomCrawl(approvedUrl, firecrawlKey, { limit: req.body?.limit, depth: req.body?.depth, includePaths: req.body?.includePaths });
      return addCorsHeaders(res).status(202).json({ success: true, ...result, note: "Crawl results must be reviewed before importing as draft content" });
    }
    if (action === "fandom-crawl-status") {
      const crawlId = typeof req.body?.id === "string" ? req.body.id.trim() : "";
      return addCorsHeaders(res).status(200).json(await getFandomCrawlStatus(crawlId, firecrawlKey));
    }
    if (action === "fandom-draft-save") {
      const approvedUrl = await assertApprovedSourceUrl(req.body?.url);
      if (!isFandomUrl(approvedUrl)) return addCorsHeaders(res).status(400).json({ error: "Draft saving requires a Fandom URL" });
      const result = await saveFandomPageDraft(approvedUrl);
      return addCorsHeaders(res).status(result.status === "published-exists" ? 409 : 201).json(result);
    }
    if (action === "automation") {
      const result = await runFandomAutomation();
      return addCorsHeaders(res).status(200).json(result);
    }
    if (action === "forum-list") {
      const { posts } = await scrapeForumList();
      return addCorsHeaders(res).status(200).json(posts);
    }
    if (action === "single-url") {
      return addCorsHeaders(res).status(200).json(await scrapeSingleUrl(await assertApprovedSourceUrl(req.body?.url)));
    }
    if (action === "forum-thread") {
      return addCorsHeaders(res).status(200).json(await scrapeForumThread(await assertApprovedSourceUrl(req.body?.url)));
    }
    if (action === "multiple-events") {
      const rawUrls = Array.isArray(req.body?.urls) ? req.body.urls : [];
      if (rawUrls.length === 0 || rawUrls.length > 25) {
        return addCorsHeaders(res).status(400).json({ error: "Provide between 1 and 25 event URLs" });
      }
      const events: unknown[] = [];
      for (const rawUrl of rawUrls) {
        try {
          const result = await scrapeForumThread(await assertApprovedSourceUrl(rawUrl));
          if (Array.isArray(result.events)) {
            events.push(...result.events.map(event => ({
              ...event,
              url: event.sourceUrl,
              rawHtmlContent: event.description,
              content: event.description,
              category: "event",
              colors: [],
              preview: event.descriptionText,
            })));
          }
        } catch (error) {
          console.warn("[scrape/multiple-events] skipped source", error instanceof Error ? error.message : error);
        }
      }
      return addCorsHeaders(res).status(200).json(events);
    }
    if (action === "validate-content") {
      const html = typeof req.body?.html === "string" ? req.body.html : "";
      if (html.length > 500_000) return addCorsHeaders(res).status(413).json({ error: "Content is too large" });
      const colors = [...new Set([...html.matchAll(/(?:color\s*:\s*|color\s*=\s*[\"'])(#[0-9a-f]{3,8}|[a-z]+)\b/gi)].map(match => match[1].toLowerCase()))];
      const tagCounts: Record<string, number> = {};
      for (const match of html.matchAll(/<([a-z0-9-]+)\b/gi)) tagCounts[match[1].toLowerCase()] = (tagCounts[match[1].toLowerCase()] || 0) + 1;
      return addCorsHeaders(res).status(200).json({ valid: true, colors, tagCounts, length: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length });
    }
    return addCorsHeaders(res).status(404).json({ error: "Unsupported scrape action" });
  } catch (error: any) {
    return addCorsHeaders(res).status(500).json({ error: error?.message || "Scrape failed" });
  }
}
