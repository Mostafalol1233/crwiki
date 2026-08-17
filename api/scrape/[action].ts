import type { VercelRequest, VercelResponse } from "@vercel/node";

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

function assertPublicHttpUrl(value: unknown): string {
  if (typeof value !== "string") throw new Error("Valid URL required");
  const parsed = new URL(value);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("Valid URL required");
  const hostname = parsed.hostname.toLowerCase();
  const isPrivateHost =
    hostname === "localhost" ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    /^127\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);
  if (isPrivateHost) throw new Error("Private network URLs are not allowed");
  return parsed.toString();
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
    status: "success",
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return addCorsHeaders(res).status(204).end();
  if (req.method !== "POST") return addCorsHeaders(res).status(405).json({ error: "POST only" });

  try {
    const action = readAction(req);
    if (action === "forum-list") return addCorsHeaders(res).status(200).json(await scrapeForumList());
    if (action === "single-url") return addCorsHeaders(res).status(200).json(await scrapeSingleUrl(assertPublicHttpUrl(req.body?.url)));
    if (action === "forum-thread") return addCorsHeaders(res).status(200).json(await scrapeForumThread(assertPublicHttpUrl(req.body?.url)));
    return addCorsHeaders(res).status(404).json({ error: "Unsupported scrape action" });
  } catch (error: any) {
    return addCorsHeaders(res).status(500).json({ error: error?.message || "Scrape failed" });
  }
}
