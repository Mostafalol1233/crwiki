import type { VercelRequest, VercelResponse } from "@vercel/node";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function scrapePage(url: string) {
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
  const title = $("h1").first().text().trim() || $("title").text().replace(/\s*[|\-–].*$/, "").trim() || "";
  const image = $('meta[property="og:image"]').attr("content") || $("article img").first().attr("src") || "";
  $("nav,script,style,header,footer,.navbox,.toc,.mw-indicators,.mw-editsection").remove();
  const contentEl = $(".mw-parser-output, article, main, #content, .content").first();
  const content = contentEl.length ? contentEl.html() || "" : $("body").html() || "";
  const plain = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return { title, content, summary: plain.slice(0, 300), image };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return res.status(204).setHeaders(CORS).end();
  if (req.method !== "POST") return res.status(405).setHeaders(CORS).json({ error: "POST only" });

  try {
    const { type, id, url } = req.body || {};
    if (!type || !id || !url || !String(url).startsWith("http"))
      return res.status(400).setHeaders(CORS).json({ error: "type, id, and valid url required" });

    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
    const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || "";
    if (!SUPABASE_URL || !SERVICE_KEY)
      return res.status(500).setHeaders(CORS).json({ error: "Supabase not configured" });

    const scraped = await scrapePage(url);
    const plain = scraped.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
    const seoTitle = (scraped.title || "").slice(0, 60);
    const seoDesc  = (scraped.summary || "").slice(0, 160);

    const table = type === "events" ? "events" : type === "news" ? "news" : "posts";
    let updateBody: any = {};
    if (type === "events") {
      updateBody = { description: scraped.content, image_url: scraped.image, seo_title: seoTitle, seo_description: seoDesc, source_url: url };
    } else if (type === "news") {
      updateBody = { content: scraped.content, html_content: scraped.content, image_url: scraped.image, seo_title: seoTitle, seo_description: seoDesc, source_url: url };
    } else {
      updateBody = { content: scraped.content, image_url: scraped.image, seo_title: seoTitle, seo_description: seoDesc, source_url: url };
    }

    const headers = { "Content-Type": "application/json", "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}`, "Prefer": "return=minimal" };
    const upRes = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH", headers, body: JSON.stringify(updateBody),
    });
    if (!upRes.ok) throw new Error(`Supabase update failed: ${await upRes.text()}`);

    return res.status(200).setHeaders(CORS).json({
      success: true,
      scraped: { title: scraped.title, image: scraped.image, contentLength: plain.length },
    });
  } catch (e: any) {
    return res.status(500).setHeaders(CORS).json({ error: e.message || "Rescrape failed" });
  }
}
