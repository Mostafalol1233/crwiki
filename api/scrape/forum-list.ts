import type { VercelRequest, VercelResponse } from "@vercel/node";

const CORS = new Map([
  ["Access-Control-Allow-Origin", "*"],
  ["Access-Control-Allow-Methods", "POST, OPTIONS"],
  ["Access-Control-Allow-Headers", "Content-Type, Authorization"],
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return res.status(204).setHeaders(CORS).end();
  if (req.method !== "POST") return res.status(405).setHeaders(CORS).json({ error: "POST only" });

  try {
    const RSS_URL = "https://forum.z8games.com/categories/crossfire-announcements/feed.rss";
    const r = await fetch(RSS_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status} fetching RSS feed`);
    const xml = await r.text();

    const getTag = (block: string, tag: string): string => {
      const open = `<${tag}`;
      const close = `</${tag}>`;
      const start = block.indexOf(open);
      if (start === -1) return "";
      const gtIdx = block.indexOf(">", start);
      if (gtIdx === -1) return "";
      const end = block.indexOf(close, gtIdx);
      if (end === -1) return "";
      let val = block.slice(gtIdx + 1, end).trim();
      if (val.startsWith("<![CDATA[")) val = val.slice(9);
      if (val.endsWith("]]>")) val = val.slice(0, -3);
      return val.trim();
    };

    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const posts: any[] = [];
    let m: RegExpExecArray | null;
    while ((m = itemRegex.exec(xml)) !== null) {
      const block  = m[1];
      const title  = getTag(block, "title");
      const link   = getTag(block, "link");
      const pubDate = getTag(block, "pubDate");
      const creator = getTag(block, "dc:creator");
      const desc   = getTag(block, "description");
      const imgMatch = desc.match(/src="([^"]+)"/);
      const image  = imgMatch ? imgMatch[1] : "";
      let dateISO  = "";
      try { dateISO = new Date(pubDate).toISOString(); } catch { /* invalid date */ }
      if (title && link) posts.push({ title, url: link, date: pubDate || "", dateISO, image, author: creator });
    }
    return res.status(200).setHeaders(CORS).json({ posts });
  } catch (e: any) {
    return res.status(500).setHeaders(CORS).json({ error: e.message || "Forum RSS fetch failed" });
  }
}
