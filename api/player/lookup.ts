import type { VercelRequest, VercelResponse } from "@vercel/node";

const CORS = new Map([
  ["Access-Control-Allow-Origin", "*"],
  ["Access-Control-Allow-Methods", "GET, OPTIONS"],
  ["Access-Control-Allow-Headers", "Content-Type, Authorization"],
]);

function addCorsHeaders(res: VercelResponse) {
  for (const [key, value] of CORS) {
    res.setHeader(key, value);
  }
  return res;
}

function normalizeDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

function parseNumber(value: string | undefined): number | null {
  if (!value) return null;
  const normalized = normalizeDigits(value).replace(/[\s,\u00a0]/g, "");
  if (!/^\d+$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function normalizeRankTier(rawTier: number | null, rankName: string | null): number | null {
  if (!rawTier) return null;
  // Z8Games can expose the Grand Marshal emblem as rank_105 while the
  // official rank table and this wiki use tier 104 for Grand Marshal.
  if (rawTier >= 104 && /grand\s+marshal/i.test(rankName || "")) return 104;
  return rawTier;
}

/** Parse Firecrawl markdown into a profile object. Returns null if insufficient data. */
export function parseFirecrawlMarkdown(md: string, regionLabel: string) {
  if (!md || md.length < 40) return null;

  // Nickname: first H1/H2 heading that isn't a stat label.
  const nick =
    md.match(/^#+\s+\[([^\]]{2,48})\]/m)?.[1]?.trim() ||
    md.match(/^#+\s+([A-Za-z0-9_*\-\.\[\]]{2,48})\s*$/m)?.[1]?.trim() ||
    null;

  // Rank tier from an image URL like /rank_83.jpg. The text after the image
  // is the most reliable place to read the displayed rank and total EXP.
  const rankImgMatch = md.match(
    /!\[[^\]]*\]\(([^)]*\/rank_(\d{1,3})\.(?:jpg|png|webp))\)\s*([^\n]*)/i,
  );
  const rawRankTier = rankImgMatch ? parseInt(rankImgMatch[2], 10) : null;
  const rankLineFull = rankImgMatch?.[3]?.trim() || "";

  // The profile has appeared in several layouts, including:
  //   Major General 211551338 EXP
  //   Total EXP: 119400214
  // Prefer the rank line and an explicit Total EXP label before any generic
  // EXP match, so a navigation/table label cannot become the player's value.
  const expCandidates = [
    rankLineFull.match(/([0-9٠-٩][0-9٠-٩,\u00a0 ]*)\s*(?:EXP|Experience)\b/i)?.[1],
    md.match(/(?:Total\s+)?EXP\s*[:\-]?\s*([0-9٠-٩][0-9٠-٩,\u00a0 ]*)/i)?.[1],
    md.match(/([0-9٠-٩][0-9٠-٩,\u00a0 ]*)\s*(?:EXP|Experience)\b/i)?.[1],
  ];
  const exp = expCandidates.map(parseNumber).find((value) => value !== null) ?? null;
  const rankName = rankLineFull
    .replace(/[0-9٠-٩][0-9٠-٩,\u00a0 ]*\s*(?:EXP|Experience).*/i, "")
    .trim()
    .replace(/\s{2,}/g, " ") || null;
  const rankTier = normalizeRankTier(rawRankTier, rankName);

  // Stats helpers
  const statNum = (label: string): number | null => {
    const m =
      md.match(new RegExp(`#####?\\s+${label}\\s*\\n+###?\\s+([\\d,]+)`, "i")) ||
      md.match(new RegExp(`\\*\\*${label}\\*\\*[:\\s]+([\\d,]+)`, "i")) ||
      md.match(new RegExp(`${label}[:\\s]+([\\d,]+)`, "i"));
    return m ? parseInt(m[1].replace(/,/g, ""), 10) : null;
  };

  const kills = statNum("Kills");
  const deaths = statNum("Deaths");
  const wins = statNum("Wins");
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

  // Require at minimum a nickname to consider the scrape useful.
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
  if (req.method === "OPTIONS") return addCorsHeaders(res).status(204).end();

  try {
    const rawProfileUrl = String(req.query.profileUrl || "").trim();

    if (!rawProfileUrl) {
      return addCorsHeaders(res).status(400).json({
        error: "A profile URL is required. Paste your z8games.com/profile/… link.",
      });
    }

    const targetUrl = rawProfileUrl.startsWith("http")
      ? rawProfileUrl
      : `https://${rawProfileUrl}`;

    const fcKey = process.env.FIRECRAWL_API_KEY || "";
    if (!fcKey) {
      return addCorsHeaders(res).status(503).json({
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
        waitFor: 3000,
        // Player pages are dynamic and Firecrawl can otherwise reuse an old
        // snapshot containing a previous EXP value.
        maxAge: 0,
      }),
    });

    if (!fcRes.ok) {
      return addCorsHeaders(res).status(502).json({
        error: "Could not scrape the profile page. Make sure the URL is a valid z8games.com profile link.",
      });
    }

    const fcData = await fcRes.json() as any;
    const md: string = fcData?.data?.markdown || fcData?.markdown || "";
    const profile = parseFirecrawlMarkdown(md, regionLabel);

    if (!profile) {
      return addCorsHeaders(res).status(404).json({
        error: "Profile data not found on that page. Make sure your profile is set to public on z8games.com.",
        notFound: true,
      });
    }

    return addCorsHeaders(res).status(200).json({ success: true, profile });
  } catch (err: any) {
    const isTimeout = err?.name === "TimeoutError" || err?.message?.includes("timeout");
    return addCorsHeaders(res).status(isTimeout ? 504 : 500).json({
      error: isTimeout ? "Scraping timed out — try again shortly." : "Failed to fetch profile.",
    });
  }
}
