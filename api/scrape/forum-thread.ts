import type { VercelRequest, VercelResponse } from "@vercel/node";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const toISO = (s: string) => {
  if (!s) return "";
  try {
    const d = new Date(`${s} ${new Date().getFullYear()}`);
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 16);
  } catch { return ""; }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return res.status(204).setHeaders(CORS).end();
  if (req.method !== "POST") return res.status(405).setHeaders(CORS).json({ error: "POST only" });

  try {
    const { url } = req.body || {};
    if (!url || !String(url).startsWith("http"))
      return res.status(400).setHeaders(CORS).json({ error: "Valid URL required" });

    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,*/*",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(25000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const html = await r.text();
    const cheerio = await import("cheerio");
    const $ = cheerio.load(html);

    const threadTitle =
      $('meta[property="og:title"]').attr("content") ||
      $("h1").first().text().trim() ||
      $("title").text().replace(/\s*[|–\-].*$/, "").trim() || "Untitled Event";

    const threadImage =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") || "";

    const threadDate =
      $(".ItemDiscussion time, #Item_0 time, .DateCreated time").first().attr("datetime") ||
      $("time").first().attr("datetime") || "";

    const allMessages = $(".Message");
    const opBody = allMessages.first();
    const descriptionHtml = opBody.html() || "";
    const descriptionText = opBody.text().replace(/\s+/g, " ").trim().slice(0, 500);

    const dateRe = /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?/gi;
    const dateParts = threadTitle.match(dateRe) || [];
    const startDateStr = dateParts[0] || (threadDate ? threadDate.slice(0, 10) : "");
    const endDateStr   = dateParts[1] || dateParts[0] || "";

    const event = {
      title: threadTitle, image: threadImage, date: startDateStr,
      startDate: toISO(startDateStr), endDate: toISO(endDateStr),
      description: descriptionHtml, descriptionText, sourceUrl: url, selected: true,
    };

    return res.status(200).setHeaders(CORS).json({
      threadTitle, threadDate, threadImage, threadUrl: url, events: [event],
    });
  } catch (e: any) {
    return res.status(500).setHeaders(CORS).json({ error: e.message || "Thread scrape failed" });
  }
}
