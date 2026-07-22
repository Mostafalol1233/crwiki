import type { VercelRequest, VercelResponse } from "@vercel/node";

const CORS = new Map([
  ["Access-Control-Allow-Origin", "*"],
  ["Access-Control-Allow-Methods", "GET, OPTIONS"],
  ["Access-Control-Allow-Headers", "Content-Type, Authorization"],
]);

const CF_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://crossfire.z8games.com/myprofile.html",
  "sec-fetch-site": "same-origin",
  "sec-fetch-mode": "cors",
  "sec-fetch-dest": "empty",
};

/** Parse Firecrawl markdown into a profile object. Returns null if insufficient data. */
function parseFirecrawlMarkdown(md: string, regionLabel: string, profileId?: string) {
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

/** Call Firecrawl /v1/scrape and return parsed profile, or null on failure. */
async function firecrawlLookup(
  targetUrl: string,
  fcKey: string,
  regionLabel: string,
  profileId?: string
) {
  try {
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

    if (!fcRes.ok) return null;
    const fcData = await fcRes.json() as any;
    const md: string = fcData?.data?.markdown || fcData?.markdown || "";
    return parseFirecrawlMarkdown(md, regionLabel, profileId);
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return res.status(204).setHeaders(CORS).end();

  try {
    const nickname      = String(req.query.nickname    || "").trim();
    const region        = String(req.query.region      || "na").toLowerCase();
    const rawProfileUrl = String(req.query.profileUrl  || "").trim();
    const rawProfileId  = String(req.query.profileId   || "").trim();

    // Extract a numeric profile ID if embedded in the URL
    const profileIdFromUrl = rawProfileUrl.match(/\/profile\/(\d+)/)?.[1] || "";
    const profileId = (rawProfileId || profileIdFromUrl).trim();

    const regionLabel = region === "west" ? "CrossFire West" : "CrossFire NA";
    const fcKey = process.env.FIRECRAWL_API_KEY || "";

    const restBases = region === "west"
      ? ["https://cfwest.z8games.com/rest", "https://crossfire.z8games.com/rest"]
      : ["https://crossfire.z8games.com/rest"];

    // ── Path A: URL was provided → Firecrawl FIRST ──────────────────────────
    if (rawProfileUrl) {
      // Normalise the URL — use it directly (could be any CF profile page shape)
      const targetUrl = rawProfileUrl.startsWith("http")
        ? rawProfileUrl
        : `https://${rawProfileUrl}`;

      if (fcKey) {
        const profile = await firecrawlLookup(targetUrl, fcKey, regionLabel, profileId || undefined);
        if (profile) {
          return res.status(200).setHeaders(CORS).json({ success: true, profile });
        }
      }

      // Firecrawl failed or no key — try REST if we have a numeric ID
      if (profileId && /^\d+$/.test(profileId)) {
        const idParams = ["char_no", "user_no", "UserNo", "CharNo", "usn_no", "uid"];
        for (const base of restBases) {
          for (const param of idParams) {
            try {
              const response = await fetch(`${base}/userprofile.json?${param}=${profileId}`, {
                signal: AbortSignal.timeout(5000),
                headers: CF_HEADERS,
              });
              const ct = response.headers.get("content-type") || "";
              if (!ct.includes("json")) continue;
              const json = await response.json() as any;
              if (json.p_o_ErrID === -702) continue;
              if (json.UserNickname || json.TotalExp != null || json.TotalKills != null) {
                const kills  = json.TotalKills  ?? json.Kills  ?? null;
                const deaths = json.TotalDeaths ?? json.Deaths ?? null;
                const wins   = json.TotalWins   ?? json.Wins   ?? null;
                const losses = json.TotalLosses ?? json.Losses ?? null;
                const exp    = json.TotalExp    ?? json.UserExp ?? null;
                return res.status(200).setHeaders(CORS).json({
                  success: true,
                  profile: {
                    nickname: json.UserNickname || json.usn || nickname,
                    region: regionLabel, exp,
                    rank: json.RankName || json.Rank || null,
                    rankTier: json.RankNo || json.RankTier || null,
                    rankImage: json.RankImg || null,
                    kills, deaths, wins, losses,
                    kdRatio: kills && deaths && deaths > 0 ? parseFloat((kills / deaths).toFixed(2)) : null,
                    winRate: wins != null && losses != null && (wins + losses) > 0
                      ? parseFloat(((wins / (wins + losses)) * 100).toFixed(1)) : null,
                    playtime: json.PlayTime || null,
                    level: json.UserLevel || null,
                    clan: json.ClanName || null,
                    vipDays: json.VIPDays ?? json.VipRemainDays ?? null,
                    vipLevel: json.VIPLevel ?? json.VipLevel ?? null,
                  },
                });
              }
            } catch { /* try next */ }
          }
        }
      }

      return res.status(404).setHeaders(CORS).json({
        error: "Could not load profile from that URL. Try entering your in-game nickname directly.",
        notFound: true,
        suggestNickname: true,
      });
    }

    // ── Path B: numeric profile ID (no URL) ─────────────────────────────────
    if (profileId && /^\d+$/.test(profileId)) {
      let data: any = null;
      const idParams = ["char_no", "user_no", "UserNo", "CharNo", "usn_no", "uid", "user_id", "char_id"];
      outer: for (const base of restBases) {
        for (const param of idParams) {
          try {
            const response = await fetch(`${base}/userprofile.json?${param}=${profileId}`, {
              signal: AbortSignal.timeout(4000),
              headers: CF_HEADERS,
            });
            const ct = response.headers.get("content-type") || "";
            if (!ct.includes("json")) continue;
            const json = await response.json() as any;
            if (json.p_o_ErrID === -702) continue;
            if (json.UserNickname || json.TotalExp != null || json.TotalKills != null) {
              data = json; break outer;
            }
          } catch { /* try next */ }
        }
      }

      if (!data && fcKey) {
        const profile = await firecrawlLookup(
          `https://crossfire.z8games.com/profile/${profileId}`,
          fcKey, regionLabel, profileId
        );
        if (profile) return res.status(200).setHeaders(CORS).json({ success: true, profile });
      }

      if (!data) {
        return res.status(404).setHeaders(CORS).json({
          error: `Could not load profile #${profileId}. Please enter your in-game nickname directly.`,
          notFound: true, suggestNickname: true,
        });
      }

      const kills  = data.TotalKills  ?? data.total_kills  ?? data.Kills  ?? null;
      const deaths = data.TotalDeaths ?? data.total_deaths ?? data.Deaths ?? null;
      const wins   = data.TotalWins   ?? data.total_wins   ?? data.Wins   ?? null;
      const losses = data.TotalLosses ?? data.total_losses ?? data.Losses ?? null;
      const exp    = data.TotalExp    ?? data.UserExp      ?? data.exp    ?? null;
      const vipDays  = data.VIPDays  ?? data.VipDays  ?? data.vip_days  ?? data.VipRemainDays ?? null;
      const vipLevel = data.VIPLevel ?? data.VipLevel ?? data.vip_level ?? null;

      return res.status(200).setHeaders(CORS).json({
        success: true,
        profile: {
          nickname: data.UserNickname || data.usn || nickname,
          region: regionLabel, exp,
          rank: data.RankName || data.rank_name || data.Rank || null,
          rankTier: data.RankNo || data.rank_no || data.RankTier || null,
          rankImage: data.RankImg || data.rank_img || null,
          kills, deaths, wins, losses,
          kdRatio: kills !== null && deaths !== null && deaths > 0 ? parseFloat((kills / deaths).toFixed(2)) : null,
          winRate: wins !== null && losses !== null && (wins + losses) > 0 ? parseFloat(((wins / (wins + losses)) * 100).toFixed(1)) : null,
          playtime: data.PlayTime || data.play_time || null,
          level: data.UserLevel || data.level || null,
          clan: data.ClanName || data.clan_name || null,
          vipDays, vipLevel, raw: data,
        },
      });
    }

    // ── Path C: nickname lookup ──────────────────────────────────────────────
    if (!nickname || nickname.length < 2 || nickname.length > 32)
      return res.status(400).setHeaders(CORS).json({ error: "Invalid nickname — must be 2–32 characters." });

    let data: any = null;
    for (const base of restBases) {
      try {
        const response = await fetch(`${base}/userprofile.json?usn=${encodeURIComponent(nickname)}`, {
          signal: AbortSignal.timeout(10000),
          headers: CF_HEADERS,
        });
        const ct = response.headers.get("content-type") || "";
        if (!ct.includes("json")) continue;
        const json = await response.json() as any;
        if (json.p_o_ErrID === -702 || json.p_o_ErrDesc === "Character not found") break;
        data = json;
        break;
      } catch { /* timeout — try next */ }
    }

    if (!data) {
      const msg = region === "west"
        ? `Player "${nickname}" not found. CrossFire West was discontinued — try switching to CrossFire NA.`
        : `Player "${nickname}" not found on ${regionLabel}. Nicknames are case-sensitive.`;
      return res.status(404).setHeaders(CORS).json({ error: msg, notFound: true });
    }

    const kills  = data.TotalKills  ?? data.total_kills  ?? data.Kills  ?? null;
    const deaths = data.TotalDeaths ?? data.total_deaths ?? data.Deaths ?? null;
    const wins   = data.TotalWins   ?? data.total_wins   ?? data.Wins   ?? null;
    const losses = data.TotalLosses ?? data.total_losses ?? data.Losses ?? null;
    const exp    = data.TotalExp    ?? data.UserExp      ?? data.exp    ?? null;
    const vipDays  = data.VIPDays  ?? data.VipDays  ?? data.vip_days  ?? data.VipRemainDays ?? null;
    const vipLevel = data.VIPLevel ?? data.VipLevel ?? data.vip_level ?? null;

    return res.status(200).setHeaders(CORS).json({
      success: true,
      profile: {
        nickname: data.UserNickname || data.usn || nickname,
        region: regionLabel, exp,
        rank: data.RankName || data.rank_name || data.Rank || null,
        rankTier: data.RankNo || data.rank_no || data.RankTier || null,
        rankImage: data.RankImg || data.rank_img || null,
        kills, deaths, wins, losses,
        kdRatio: kills !== null && deaths !== null && deaths > 0 ? parseFloat((kills / deaths).toFixed(2)) : null,
        winRate: wins !== null && losses !== null && (wins + losses) > 0 ? parseFloat(((wins / (wins + losses)) * 100).toFixed(1)) : null,
        playtime: data.PlayTime || data.play_time || null,
        level: data.UserLevel || data.level || null,
        clan: data.ClanName || data.clan_name || null,
        vipDays, vipLevel, raw: data,
      },
    });
  } catch (err: any) {
    const isTimeout = err?.name === "TimeoutError" || err?.message?.includes("timeout");
    return res.status(isTimeout ? 504 : 500).setHeaders(CORS).json({
      error: isTimeout ? "CF servers timed out — try again shortly." : "Failed to fetch player data.",
    });
  }
}
