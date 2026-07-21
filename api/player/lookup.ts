import type { VercelRequest, VercelResponse } from "@vercel/node";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const CF_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://crossfire.z8games.com/myprofile.html",
  "sec-fetch-site": "same-origin",
  "sec-fetch-mode": "cors",
  "sec-fetch-dest": "empty",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return res.status(204).setHeaders(CORS).end();

  try {
    const nickname    = String(req.query.nickname    || "").trim();
    const region      = String(req.query.region      || "na").toLowerCase();
    const rawProfileUrl = String(req.query.profileUrl || "").trim();
    const rawProfileId  = String(req.query.profileId  || "").trim();
    const profileIdFromUrl = rawProfileUrl.match(/\/profile\/(\d+)/)?.[1] || "";
    const profileId = (rawProfileId || profileIdFromUrl).trim();
    const regionLabel = region === "west" ? "CrossFire West" : "CrossFire NA";

    const restBases = region === "west"
      ? ["https://cfwest.z8games.com/rest", "https://crossfire.z8games.com/rest"]
      : ["https://crossfire.z8games.com/rest"];

    let data: any = null;

    // ── Path A: numeric profile ID lookup ─────────────────────────────────────
    if (profileId && /^\d+$/.test(profileId)) {
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
              data = json;
              break outer;
            }
          } catch { /* timeout or bad response — try next */ }
        }
      }

      // Firecrawl fallback
      if (!data) {
        const fcKey = process.env.FIRECRAWL_API_KEY || "";
        if (fcKey) {
          try {
            const fcRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
              method: "POST",
              signal: AbortSignal.timeout(30000),
              headers: { Authorization: `Bearer ${fcKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                url: `https://crossfire.z8games.com/profile/${profileId}`,
                formats: ["markdown"],
                onlyMainContent: true,
              }),
            });
            if (fcRes.ok) {
              const fcData = await fcRes.json() as any;
              const md: string = fcData?.data?.markdown || fcData?.markdown || "";
              if (md && md.length > 200) {
                const nick      = md.match(/^#\s+\[([^\]]+)\]/m)?.[1]?.trim() || null;
                const rankLine  = md.match(/##\s+!\[[^\]]*\]\([^)]*\/rank_\d+\.[^)]+\)[^\S\n]*([^\n]+)/)?.[1]?.trim() || "";
                const expStr    = rankLine.match(/(\d[\d,]*)\s*EXP/)?.[1]?.replace(/,/g, "") || null;
                const exp       = expStr ? parseInt(expStr, 10) : null;
                const rankName  = rankLine.replace(/\d[\d,]*\s*EXP.*/, "").trim() || null;
                const rankTierMatch = md.match(/\/rank_(\d+)\.jpg/);
                const rankTier  = rankTierMatch ? parseInt(rankTierMatch[1], 10) : null;
                const clanHeadings = [...md.matchAll(/^##\s+(?:!\[[^\]]*\]\([^)]+\)){2,}([^\n!\[]+)/gm)];
                const clan      = clanHeadings[0]?.[1]?.trim() || null;
                const statNum = (label: string) => {
                  const m = md.match(new RegExp(`#####\\s+${label}\\s*\\n+###\\s+([\\d,]+)`, "i"));
                  return m ? parseInt(m[1].replace(/,/g, ""), 10) : null;
                };
                const inlineNum = (label: string) => {
                  const m = md.match(new RegExp(`${label}\\s*\\n+([\\d.]+)`, "i"));
                  return m ? parseFloat(m[1]) : null;
                };
                const kills  = statNum("Kills");
                const deaths = statNum("Deaths");
                const wins   = statNum("Wins");
                const losses = statNum("Losses");
                const kdRatio    = inlineNum("Kill-Death Ratio");
                const winRatePct = md.match(/Winner Rate\s*\n+([\d.]+)%/i)?.[1] || null;
                const hsRate     = md.match(/Headshot Rate[\s\S]{0,200}?([\d.]+)%/i)?.[1] || null;
                const vipLevelMatch = md.match(/\bVIP\s*(?:Level\s*)?(\d+)/i);
                const vipLevel   = vipLevelMatch ? parseInt(vipLevelMatch[1], 10) : null;
                const vipDaysMatch = md.match(/VIP[^\n]*?(\d+)\s*day/i);
                const vipDays    = vipDaysMatch ? parseInt(vipDaysMatch[1], 10) : null;
                const clanImgMatch = md.match(/!\[[^\]]*\]\((https?:\/\/[^)]*clan[^)]*)\)/i)
                  || md.match(/!\[[^\]]*\]\((https?:\/\/[^)]*mark[^)]*)\)/i);
                const clanImage = clanImgMatch ? clanImgMatch[1] : null;
                if (nick) {
                  return res.status(200).setHeaders(CORS).json({
                    success: true,
                    profile: {
                      nickname: nick, region: regionLabel, exp, rank: rankName, rankTier,
                      rankImage: rankTier ? `https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_${rankTier}.jpg` : null,
                      kills, deaths, wins, losses,
                      kdRatio: kdRatio ?? (kills !== null && deaths !== null && deaths > 0 ? parseFloat((kills / deaths).toFixed(2)) : null),
                      winRate: winRatePct ? parseFloat(winRatePct) : (wins !== null && losses !== null && (wins + losses) > 0 ? parseFloat(((wins / (wins + losses)) * 100).toFixed(1)) : null),
                      headShotRate: hsRate ? parseFloat(hsRate) : null,
                      clan, clanImage, vipDays, vipLevel, playtime: null, level: null,
                    },
                  });
                }
              }
            }
          } catch { /* Firecrawl timeout or network error */ }
        }
        return res.status(404).setHeaders(CORS).json({
          error: `Could not load profile #${profileId}. Please enter your in-game nickname directly.`,
          notFound: true, suggestNickname: true,
        });
      }
    }

    // ── Path B: nickname lookup ────────────────────────────────────────────────
    else {
      if (!nickname || nickname.length < 2 || nickname.length > 32)
        return res.status(400).setHeaders(CORS).json({ error: "Invalid nickname — must be 2–32 characters." });

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
    }

    // ── Map raw API response to profile shape ──────────────────────────────────
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
