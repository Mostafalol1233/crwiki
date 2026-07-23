import type { VercelRequest, VercelResponse } from "@vercel/node";

const CORS = new Map([
  ["Access-Control-Allow-Origin", "*"],
  ["Access-Control-Allow-Methods", "GET, OPTIONS"],
  ["Access-Control-Allow-Headers", "Content-Type, Authorization"],
]);

/** Parse Firecrawl markdown into a profile object. Returns null if insufficient data. */
function parseFirecrawlMarkdown(md: string, regionLabel: string) {
  if (!md || md.length < 100) return null;

  // Nickname: first H1/H2 heading that isn't a stat label
  const nick =
    md.match(/^#+\s+\[([^\]]{2,32})\]/m)?.[1]?.trim() ||
    md.match(/^#+\s+([A-Za-z0-9_\-\.\[\]]{2,32})\s*$/m)?.[1]?.trim() ||
    null;

  // Rank tier from image URL like /rank_42.jpg
  const rankTierMatch = md.match(/\/rank_(\d{1,3})\.(jpg|png|webp)/i);
  const rankTier = rankTierMatch ? parseInt(rankTierMatch[1], 10) : null;

  // Rank name — line after the rank image
  const rankImgLine = md.match(/!\[[^\]]*\]\([^)]*\/rank_\d+\.[^\)]+\)[^\S\n]*([^\n]*)/);
  const rankLineFull = rankImgLine?.[1]?.trim() || "";
  const expStr = rankLineFull.match(/(\d[\d,]*)\s*EXP/)?.[1]?.replace(/,/g, "") ||
    md.match(/(\d[\d,]+)\s*EXP/)?.[1]?.replace(/,/g, "") || null;
  const exp = expStr ? parseInt(expStr, 10) : null;
  const rankName = rankLineFull.replace(/\d[\d,]*\s*EXP.*/i, "").trim() || null;

  // Stats helpers
  const statNum = (label: string): number | null => {
    const m =
      md.match(new RegExp(`#####?\\s+${label}\\s*\\n+###?\\s+([\\d,]+)`, "i")) ||
      md.match(new RegExp(`\\*\\*${label}\\*\\*[:\\s]+([\\d,]+)`, "i")) ||
      md.match(new RegExp(`${label}[:\\s]+([\\d,]+)`, "i"));
    return m ? parseInt(m[1].replace(/,/g, ""), 10) : null;
  };

  const kills  = statNum("Kills");
  const deaths = statNum("Deaths");
  const wins   = statNum("Wins");
  const losses = statNum("Losses");

  const kdRatio = kills !== null && deaths !== null && deaths > 0
    ? parseFloat((kills / deaths).toFixed(2))
    : null;

  const winRatePct = md.match(/Winner\s*Rate\s*\n+([\d.]+)\s*%/i)?.[1] ||
    md.match(/Win\s*Rate[:\s]+([\d.]+)\s*%/i)?.[1] || null;
  const winRate = winRatePct
    ? parseFloat(winRatePct)
    : wins !== null && losses !== null && (wins + losses) > 0
      ? parseFloat(((wins / (wins + losses)) * 100).toFixed(1))
      : null;

  const hsRate = md.match(/Headshot\s*Rate[\s\S]{0,200}?([\d.]+)\s*%/i)?.[1] || null;

  const vipLevelMatch = md.match(/\bVIP\s*(?:Level\s*)?(\d+)/i);
  const vipLevel = vipLevelMatch ? parseInt(vipLevelMatch[1], 10) : null;
  const vipDaysMatch = md.match(/VIP[^\n]*?(\d+)\s*day/i);
  const vipDays = vipDaysMatch ? parseInt(vipDaysMatch[1], 10) : null;

  const clanImgMatch =
    md.match(/!\[[^\]]*\]\((https?:\/\/[^)]*clan[^)]*)\)/i) ||
    md.match(/!\[[^\]]*\]\((https?:\/\/[^)]*mark[^)]*)\)/i);
  const clanImage = clanImgMatch ? clanImgMatch[1] : null;

  // Clan name from double-image heading pattern or simple pattern
  const clanHeadings = [...md.matchAll(/^##\s+(?:!\[[^\]]*\]\([^)]+\)){2,}([^\n!\[]+)/gm)];
  const clan = clanHeadings[0]?.[1]?.trim() || null;

  // Require at minimum a nickname to consider the scrape useful
  if (!nick) return null;

  return {
    nickname: nick,
    region: regionLabel,
    exp,
    rank: rankName,
    rankTier,
    rankImage: rankTier
      ? `https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_${rankTier}.jpg`
      : null,
    kills, deaths, wins, losses,
    kdRatio,
    winRate,
    headShotRate: hsRate ? parseFloat(hsRate) : null,
    clan, clanImage, vipDays, vipLevel,
    playtime: null, level: null,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return res.status(204).setHeaders(CORS).end();

  try {
    const rawProfileUrl = String(req.query.profileUrl || "").trim();

    if (!rawProfileUrl) {
      return res.status(400).setHeaders(CORS).json({
        error: "A profile URL is required. Paste your z8games.com/profile/… link.",
      });
    }

    const targetUrl = rawProfileUrl.startsWith("http")
      ? rawProfileUrl
      : `https://${rawProfileUrl}`;

    const fcKey = process.env.FIRECRAWL_API_KEY || "";
    if (!fcKey) {
      return res.status(503).setHeaders(CORS).json({
        error: "Scraping service not configured.",
      });
    }

    const region = String(req.query.region || "na").toLowerCase();
    const regionLabel = region === "west" ? "CrossFire West" : "CrossFire NA";

    const fcRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      signal: AbortSignal.timeout(30000),
      headers: {
        Authorization: `Bearer ${fcKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: targetUrl,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 2000,
      }),
    });

    if (!fcRes.ok) {
      return res.status(502).setHeaders(CORS).json({
        error: "Could not scrape the profile page. Make sure the URL is a valid z8games.com profile link.",
      });
    }

    const fcData = await fcRes.json() as any;
    const md: string = fcData?.data?.markdown || fcData?.markdown || "";
    const profile = parseFirecrawlMarkdown(md, regionLabel);

    if (!profile) {
      return res.status(404).setHeaders(CORS).json({
        error: "Profile data not found on that page. Make sure your profile is set to public on z8games.com.",
        notFound: true,
      });
    }

    return res.status(200).setHeaders(CORS).json({ success: true, profile });
  } catch (err: any) {
    const isTimeout = err?.name === "TimeoutError" || err?.message?.includes("timeout");
    return res.status(isTimeout ? 504 : 500).setHeaders(CORS).json({
      error: isTimeout ? "Scraping timed out — try again shortly." : "Failed to fetch profile.",
    });
  }
}
