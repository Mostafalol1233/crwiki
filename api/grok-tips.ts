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
    const { currentRank, targetRank, kdRatio, winRate, clan, vipLevel } = req.body || {};

    const rank = (currentRank || "").toLowerCase();
    const isLowRank  = /trainee|private|corporal|sergeant/.test(rank);
    const isMidRank  = /lieutenant|captain|major/.test(rank);
    const isHighRank = /colonel|brigadier|general/.test(rank);
    const isElite    = /marshall|marshal/.test(rank);

    const kd      = typeof kdRatio  === "number" ? kdRatio  : null;
    const wr      = typeof winRate  === "number" ? winRate  : null;
    const inClan  = !!clan;
    const hasVip  = vipLevel != null;

    const tips: string[] = [];

    if (isLowRank) {
      tips.push("Play Team Deathmatch (TDM) continuously — it gives the fastest EXP per minute for newer ranks. Aim for 20+ kills per match to maximise your round bonus.");
    } else if (isMidRank) {
      tips.push("Switch between TDM and Search & Destroy (S&D). S&D awards a large EXP bonus for planting/defusing bombs — even losing rounds still give solid EXP if you participate actively.");
    } else {
      tips.push("Ghost Mode and Mutation Mode give high EXP bonuses and are quicker to finish than TDM at your rank. Queue them back-to-back during double-EXP events for maximum gain.");
    }

    if (kd !== null && kd < 1.5) {
      tips.push(`Your K/D is ${kd} — focus on crosshair placement and pre-aiming common angles rather than rushing. Staying alive longer each round directly increases your end-of-match EXP bonus.`);
    } else if (wr !== null && wr < 55) {
      tips.push(`Your win rate is ${wr}% — consider maining a single map until you know every angle cold. Map mastery wins more rounds than raw aim, and win bonuses stack up quickly.`);
    } else {
      tips.push("Maintain your strong performance — coordinate calls with your team in voice or text chat. Objective play (bomb plants, zone holds) awards extra EXP on top of kill bonuses.");
    }

    tips.push("Log in every day for the daily EXP mission bonus. CrossFire NA regularly runs weekend double-EXP events — save your hardest grind sessions for those windows to rank up 2× as fast.");

    if (inClan) {
      tips.push(`Playing as a clan group (you're in [${clan}]) applies a clan EXP bonus multiplier. Party up with 3–4 clan members in premade lobbies — the party bonus stacks with the clan bonus for a significant EXP boost.`);
    } else {
      tips.push("Join a clan — clan membership grants a permanent EXP multiplier on every match. Even a small active clan beats solo queuing for rank-up speed.");
    }

    if (hasVip) {
      tips.push("Your VIP status gives bonus EXP at end of round — never let it expire during an active grind. Renew before a double-EXP weekend to stack all three multipliers at once.");
    } else if (isHighRank || isElite) {
      tips.push(`At ${currentRank} the EXP gaps between sub-tiers are large. Use weapon crates and daily missions to supplement game EXP — every extra source counts when you need millions of EXP per tier.`);
    } else {
      tips.push(`Set ${targetRank} as your visible goal in your profile — tracking visible progress keeps motivation high. Use the rank calculator on this site to see exactly how many matches you need.`);
    }

    const tipsText = tips.map((t, i) => `${i + 1}. ${t}`).join("\n");
    return res.status(200).setHeaders(CORS).json({ tips: tipsText });
  } catch (err: any) {
    return res.status(500).setHeaders(CORS).json({ error: err.message || "Failed to generate tips" });
  }
}
