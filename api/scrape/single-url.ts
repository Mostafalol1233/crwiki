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
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} fetching ${url}`);
  const html = await r.text();
  const cheerio = await import("cheerio");
  const $ = cheerio.load(html);

  const title =
    $("h1.page-header__title").first().text().trim() ||
    $("h1").first().text().trim() ||
    $("title").text().replace(/\s*[|\-–].*$/, "").trim() ||
    $('meta[property="og:title"]').attr("content") || "";

  const image =
    $('meta[property="og:image"]').attr("content") ||
    $(".mw-content-text img").first().attr("src") ||
    $("article img").first().attr("src") || "";

  $("nav,script,style,header,footer,.navbox,.toc,.mw-indicators,.mw-editsection,#mw-navigation,#mw-head,#mw-panel,.sidebar,aside,.advertisement").remove();

  const contentEl = $(".mw-parser-output, article, main, #content, .content").first();
  const content = contentEl.length ? contentEl.html() || "" : $("body").html() || "";
  const plain = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const summary = plain.slice(0, 300);

  return { title, content, summary, image };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return res.status(204).setHeaders(CORS).end();
  if (req.method !== "POST") return res.status(405).setHeaders(CORS).json({ error: "POST only" });

  try {
    const { url } = req.body || {};
    if (!url || !String(url).startsWith("http"))
      return res.status(400).setHeaders(CORS).json({ error: "Valid URL required" });

    const scraped = await scrapePage(url);
    const plain = scraped.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
    return res.status(200).setHeaders(CORS).json({
      title: scraped.title, content: scraped.content,
      excerpt: scraped.summary, seoDescription: scraped.summary, seoTitle: scraped.title,
      keywords: [], mainImage: scraped.image, image: scraped.image,
      sourceUrl: url, url,
      isWiki: url.includes("fandom.com") || url.includes("wiki"),
      contentLength: plain.length, status: "success",
    });
  } catch (e: any) {
    return res.status(500).setHeaders(CORS).json({ error: e.message || "Scrape failed" });
  }
}
