/**
 * POST /api/admin/scraper
 *
 * Re-scrapes a content item from its source URL and updates the
 * matching Supabase record.  Called by WikiRescraper.tsx.
 *
 * Body: { url: string, type: "news" | "events" | "posts" }
 * Auth: Authorization: Bearer <adminToken>  (base64 JSON token)
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const CORS = new Map([
  ["Access-Control-Allow-Origin", "*"],
  ["Access-Control-Allow-Methods", "POST, OPTIONS"],
  ["Access-Control-Allow-Headers", "Content-Type, Authorization"],
]);

function addCorsHeaders(res: VercelResponse) {
  for (const [key, value] of CORS) {
    res.setHeader(key, value);
  }
  return res;
}


type ContentType = "news" | "events" | "posts";

async function scrapeWithFirecrawl(url: string, fcKey: string) {
  const r = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    signal: AbortSignal.timeout(30000),
    headers: { Authorization: `Bearer ${fcKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats: ["markdown", "html"], onlyMainContent: true }),
  });
  if (!r.ok) throw new Error(`Firecrawl HTTP ${r.status}`);
  const d = await r.json() as any;
  const html: string = d?.data?.html || d?.html || "";
  const md:   string = d?.data?.markdown || d?.markdown || "";

  // Extract title from markdown first heading or html
  const title = md.match(/^#+\s+(.+)/m)?.[1]?.trim()
    || html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim()
    || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.replace(/\s*[|–-].*/, "").trim()
    || "";

  // Extract first meaningful image
  const image = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)?.[1]
    || html.match(/<img[^>]+src="(https?:[^"]+)"/i)?.[1] || "";

  // Strip HTML for plain summary
  const plain = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const summary = plain.slice(0, 300);

  return { title, content: html || md, summary, image };
}

async function scrapeDirect(url: string) {
  const r = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; WikiBot/1.0)",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} fetching ${url}`);
  const html = await r.text();

  const cheerio = await import("cheerio");
  const $ = cheerio.load(html);

  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("h1").first().text().trim() ||
    $("title").text().replace(/\s*[|–-].*$/, "").trim() || "";

  const image =
    $('meta[property="og:image"]').attr("content") ||
    $(".mw-content-text img, article img").first().attr("src") || "";

  $("nav,script,style,header,footer,.navbox,.toc,.mw-indicators,.mw-editsection").remove();
  const contentEl = $(".mw-parser-output, article, main, #content, .content").first();
  const content = contentEl.length ? contentEl.html() || "" : $("body").html() || "";
  const plain = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  return { title, content, summary: plain.slice(0, 300), image };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return addCorsHeaders(res).status(204).end();
  if (req.method !== "POST") return addCorsHeaders(res).status(405).json({ error: "POST only" });

  try {
    const { url, type } = req.body || {};

    if (!url || !String(url).startsWith("http"))
      return addCorsHeaders(res).status(400).json({ error: "Valid URL required" });

    const contentType: ContentType = ["news", "events", "posts"].includes(type) ? type : "posts";

    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
    const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || "";
    const FC_KEY       = process.env.FIRECRAWL_API_KEY || "";

    if (!SUPABASE_URL || !SERVICE_KEY)
      return addCorsHeaders(res).status(500).json({ error: "Supabase not configured" });

    // Scrape — Firecrawl first (renders JS), direct fetch as fallback
    let scraped: { title: string; content: string; summary: string; image: string };
    try {
      scraped = FC_KEY
        ? await scrapeWithFirecrawl(url, FC_KEY)
        : await scrapeDirect(url);
    } catch {
      scraped = await scrapeDirect(url);
    }

    const seoTitle = (scraped.title || "").slice(0, 60);
    const seoDesc  = (scraped.summary || "").slice(0, 160);

    // Map type → Supabase table and update body
    const table = contentType === "events" ? "events" : contentType === "news" ? "news" : "posts";
    let updateBody: Record<string, any>;
    if (contentType === "events") {
      updateBody = {
        description: scraped.content,
        image_url: scraped.image || undefined,
        seo_title: seoTitle, seo_description: seoDesc,
      };
    } else if (contentType === "news") {
      updateBody = {
        content: scraped.content, html_content: scraped.content,
        image_url: scraped.image || undefined,
        seo_title: seoTitle, seo_description: seoDesc,
      };
    } else {
      updateBody = {
        content: scraped.content,
        image_url: scraped.image || undefined,
        seo_title: seoTitle, seo_description: seoDesc,
      };
    }

    // Remove undefined values (Supabase rejects them)
    for (const k of Object.keys(updateBody)) {
      if (updateBody[k] === undefined) delete updateBody[k];
    }

    // Find the record by source_url and update it
    const sbHeaders = {
      "Content-Type": "application/json",
      "apikey": SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "Prefer": "return=minimal",
    };
    const upRes = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?source_url=eq.${encodeURIComponent(url)}`,
      { method: "PATCH", headers: sbHeaders, body: JSON.stringify(updateBody) }
    );
    if (!upRes.ok) {
      const txt = await upRes.text();
      throw new Error(`Supabase update failed: ${txt}`);
    }

    const plain = scraped.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    return addCorsHeaders(res).status(200).json({
      success: true,
      scraped: { title: scraped.title, image: scraped.image, contentLength: plain.length },
    });
  } catch (err: any) {
    console.error("[admin/scraper]", err.message);
    return addCorsHeaders(res).status(500).json({ error: err.message || "Scrape failed" });
  }
}
