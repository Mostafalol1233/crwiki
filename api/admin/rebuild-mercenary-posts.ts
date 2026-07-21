import type { VercelRequest, VercelResponse } from "@vercel/node";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function scrapePage(url: string) {
  const r = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; WikiBot/1.0)", "Accept": "text/html,*/*" },
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const html = await r.text();
  const cheerio = await import("cheerio");
  const $ = cheerio.load(html);
  const title = $('meta[property="og:title"]').attr("content") || $("h1").first().text().trim() || "";
  const image = $('meta[property="og:image"]').attr("content") || $(".mw-content-text img").first().attr("src") || "";
  $("nav,script,style,header,footer,.navbox,.toc,.mw-indicators,.mw-editsection").remove();
  const contentEl = $(".mw-parser-output, article, main, #content").first();
  const content = contentEl.length ? contentEl.html() || "" : $("body").html() || "";
  const plain = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return { title, content, summary: plain.slice(0, 300), image };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return res.status(204).setHeaders(CORS).end();
  if (req.method !== "POST") return res.status(405).setHeaders(CORS).json({ error: "POST only" });

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
    const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || "";
    if (!SUPABASE_URL || !SERVICE_KEY)
      return res.status(500).setHeaders(CORS).json({ error: "Supabase not configured" });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "apikey": SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
    };

    await fetch(`${SUPABASE_URL}/rest/v1/posts?category=neq.__ANNOUNCEMENT__`, { method: "DELETE", headers });

    const mercenaries = [
      { name: "Wolf",         wikiSlug: "Wolf_(CrossFire)" },
      { name: "Vipers",       wikiSlug: "Vipers" },
      { name: "Sisterhood",   wikiSlug: "Sisterhood" },
      { name: "Black Mamba",  wikiSlug: "Black_Mamba_(CrossFire)" },
      { name: "Desperado",    wikiSlug: "Desperado" },
      { name: "Ronin",        wikiSlug: "Ronin_(CrossFire)" },
      { name: "Dean",         wikiSlug: "Dean" },
      { name: "Saber",        wikiSlug: "Saber_(CrossFire)" },
      { name: "Brimstone",    wikiSlug: "Brimstone_(CrossFire)" },
      { name: "Arch Honorary",wikiSlug: "Arch_Honorary" },
    ];

    let created = 0, failed = 0;
    for (const merc of mercenaries) {
      try {
        const wikiUrl = `https://crossfire.fandom.com/wiki/${merc.wikiSlug}`;
        const scraped = await scrapePage(wikiUrl);
        const plain   = scraped.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
        const slug    = `${merc.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
        const row = {
          title: scraped.title || merc.name, post_slug: slug,
          content: scraped.content, summary: scraped.summary, image_url: scraped.image,
          category: "Mercenaries",
          tags: ["mercenary", "crossfire", merc.name.toLowerCase()],
          author: "CrossFire Wiki", featured: false, source_url: wikiUrl,
          seo_title: (scraped.title || merc.name).slice(0, 60),
          seo_description: plain.slice(0, 160),
          seo_keywords: ["mercenary", "crossfire", merc.name.toLowerCase()],
        };
        const insRes = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
          method: "POST",
          headers: { ...headers, Prefer: "return=minimal" },
          body: JSON.stringify(row),
        });
        if (insRes.ok) created++; else failed++;
      } catch { failed++; }
    }
    return res.status(200).setHeaders(CORS).json({ deletedCount: 0, created, failed });
  } catch (e: any) {
    return res.status(500).setHeaders(CORS).json({ error: e.message });
  }
}
