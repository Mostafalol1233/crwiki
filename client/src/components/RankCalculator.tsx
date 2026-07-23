import { useState, useMemo } from "react";
import {
  ChevronDown, Sparkles, Trophy, Zap, Target, Gift, Shield,
  Loader2, Star, Search, User, ArrowRight, X, ChevronRight, AlertCircle
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────────────────── */
interface Rank {
  id: string;
  name: string;
  tier?: number;
  imageUrl?: string;
  image?: string;
  image_url?: string;
  bonus?: string;
  expRequired?: number;
  exp_required?: number;
}

interface PlayerProfile {
  nickname: string;
  exp: number | null;
  rank: string | null;
  rankTier: number | null;
  kills?: number | null;
  wins?: number | null;
}

interface RankCalculatorProps {
  ranks: Rank[];
}

/* ─── Complete 104-tier CF rank list ────────────────────────────────────────── */
const Z8 = "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_";

// Real rank list from https://crossfire.z8games.com/ranks.html (2026-07-22)
function buildCFRankList(): Rank[] {
  const entries: Array<{ tier: number; name: string }> = [
    { tier: 1, name: "Trainee 1" },
    { tier: 2, name: "Trainee 2" },
    { tier: 3, name: "Private" },
    { tier: 4, name: "Private First Class" },
    { tier: 5, name: "Corporal" },
    // Sergeant 1-4: tiers 6-9
    ...Array.from({ length: 4 }, (_, i) => ({ tier: 6 + i, name: `Sergeant ${i + 1}` })),
    // Staff Sergeant 1-6: tiers 10-15
    ...Array.from({ length: 6 }, (_, i) => ({ tier: 10 + i, name: `Staff Sergeant ${i + 1}` })),
    // Sergeant First Class 1-6: tiers 16-21
    ...Array.from({ length: 6 }, (_, i) => ({ tier: 16 + i, name: `Sergeant First Class ${i + 1}` })),
    // Master Sergeant 1-6: tiers 22-27
    ...Array.from({ length: 6 }, (_, i) => ({ tier: 22 + i, name: `Master Sergeant ${i + 1}` })),
    // Second Lieutenant 1-8: tiers 28-35
    ...Array.from({ length: 8 }, (_, i) => ({ tier: 28 + i, name: `Second Lieutenant ${i + 1}` })),
    // First Lieutenant 1-8: tiers 36-43
    ...Array.from({ length: 8 }, (_, i) => ({ tier: 36 + i, name: `First Lieutenant ${i + 1}` })),
    // Captain 1-8: tiers 44-51
    ...Array.from({ length: 8 }, (_, i) => ({ tier: 44 + i, name: `Captain ${i + 1}` })),
    // Major 1-8: tiers 52-59
    ...Array.from({ length: 8 }, (_, i) => ({ tier: 52 + i, name: `Major ${i + 1}` })),
    // Lieutenant Colonel 1-8: tiers 60-67
    ...Array.from({ length: 8 }, (_, i) => ({ tier: 60 + i, name: `Lieutenant Colonel ${i + 1}` })),
    // Colonel 1-8: tiers 68-75
    ...Array.from({ length: 8 }, (_, i) => ({ tier: 68 + i, name: `Colonel ${i + 1}` })),
    // Brigadier General 1-6: tiers 76-81
    ...Array.from({ length: 6 }, (_, i) => ({ tier: 76 + i, name: `Brigadier General ${i + 1}` })),
    // Major General 1-6: tiers 82-87
    ...Array.from({ length: 6 }, (_, i) => ({ tier: 82 + i, name: `Major General ${i + 1}` })),
    // Lieutenant General 1-6: tiers 88-93
    ...Array.from({ length: 6 }, (_, i) => ({ tier: 88 + i, name: `Lieutenant General ${i + 1}` })),
    // General 1-6: tiers 94-99
    ...Array.from({ length: 6 }, (_, i) => ({ tier: 94 + i, name: `General ${i + 1}` })),
    { tier: 100, name: "Marshall" },
    { tier: 104, name: "Grand Marshall" },
  ];

  return entries.map(e => ({
    id: `cf${e.tier}`,
    name: e.name,
    tier: e.tier,
    imageUrl: `${Z8}${e.tier}.jpg`,
  }));
}

const CF_ALL_RANKS = buildCFRankList(); // 104 ranks

/* ─── Real EXP thresholds from https://crossfire.z8games.com/ranks.html ──────
   Scraped 2026-07-22. DB values always preferred; this is the static fallback.
*/
const CF_EXP_THRESHOLDS: Record<number, number> = {
  1: 0, 2: 457, 3: 913, 4: 1825, 5: 3193,
  6: 5017, 7: 7297, 8: 10033, 9: 13225,
  10: 17785, 11: 23941, 12: 33061, 13: 43093, 14: 54037, 15: 65893,
  16: 78661, 17: 92341, 18: 106933, 19: 122437, 20: 138853, 21: 156181,
  22: 174421, 23: 193573, 24: 213637, 25: 234613, 26: 256501, 27: 279301,
  28: 326725, 29: 375973, 30: 427045, 31: 479941, 32: 534661, 33: 591205, 34: 649573, 35: 709765,
  36: 771781, 37: 835621, 38: 901285, 39: 968773, 40: 1038085, 41: 1109221, 42: 1182181, 43: 1256965,
  44: 1333573, 45: 1412005, 46: 1492261, 47: 1574341, 48: 1658245, 49: 1743973, 50: 1831525, 51: 1920901,
  52: 2057701, 53: 2107237, 54: 2339509, 55: 2484517, 56: 2632261, 57: 2782741, 58: 2935957, 59: 3091909,
  60: 3277045, 61: 3465373, 62: 3673537, 63: 3885178, 64: 4100296, 65: 4318891, 66: 4540963, 67: 4766512,
  68: 5028199, 69: 5319184, 70: 5614501, 71: 5914150, 72: 6218131, 73: 6526501, 74: 6839203, 75: 7156237,
  76: 7578037, 77: 8026912, 78: 8481772, 79: 8964562, 80: 9475852, 81: 10016212,
  82: 10586212, 83: 11186422, 84: 11817412, 85: 12479752, 86: 13174012, 87: 13900762,
  88: 14660572, 89: 15454012, 90: 16281652, 91: 17144062, 92: 18041812, 93: 18975472,
  94: 19945612, 95: 20952802, 96: 21997612, 97: 23080612, 98: 24202372, 99: 25363462,
  100: 26564452, 104: 100000000,
};

/* ─── Bonus overrides for milestone ranks (from static data) ────────────────── */
const BONUS_MAP: Record<number, string> = {
  2: "Smile Grenade 7 days",
  3: "Boost Box 3 days",
  4: "Starter Weapon Box 3 days",
  5: "Pottery Boost Box 7 days",
  6: "Camo Box 7 days",
  9: "30,000 GP",
  10: "Red Dragon Box 7 days",
  13: "VIP Weapon Box 3 days",
  15: "Red SMOKE 30 days",
  17: "30,000 GP",
  19: "AK-47-K-Yellow Fractal 14 days",
  21: "B.C-Axe-Ares 7 days",
  23: "M4A1-S-Yellow Fractal 14 days",
  25: "Barrett M82A1-Royal Dragon 7 days",
  27: "Sidearm Box 7 days",
  29: "M4A1-S-Yellow Fractal 30 days",
  31: "Throw Weapon Box 30 days",
  33: "KAC Chainsaw-Ancient Dragon 30 days",
  35: "Kukri-Royal Dragon 30 days",
  37: "AK-47-K-Yellow Fractal 30 days",
  39: "Bulletproof Package 30 days",
  41: "Rifle Box 30 days",
  42: "Blue Muzzle Flame 30 days",
  45: "30,000 GP",
  47: "CFWE Pistol Ticket 30 days",
  49: "Yellow Smoke 30 days",
  51: "Green Muzzle Flame 30 days",
  52: "30,000 GP",
  54: "Mutant Box 30 days",
  57: "CFWE Sniper Ticket 30 days",
  58: "Octane Camo Grenade 30 days",
  59: "CFWE MG Ticket 30 days",
  61: "Bulletproof Package 30 days",
  62: "CFWE SMG Ticket 30 days",
  63: "M4A1 Custom-Octane Camo 30 days",
  65: "CFWE Rifle Ticket 30 days",
  67: "10 Horus Crates",
  70: "M4A1-S-Yellow Fractal 60 days",
  72: "BC Axe-Octane Camo 30 days",
  74: "Character Box 30 days",
  75: "10 Octane Crates",
  79: "AK-47-K-Yellow Fractal 60 days",
  81: "30 x 7th Anniversary Crates",
  83: "G-Yellow Crystal perm",
  86: "10 Color Blaze Crates",
  87: "Slaughter Ticket Box",
  90: "M4A1-S-Yellow Fractal perm",
  93: "RPK-Infernal Dragon 30 days",
  95: "AK-47-K-Yellow Fractal perm",
  97: "AWM-Infernal Dragon 30 days",
  99: "AK-47 Fury 30 days",
  104: "30 Free Crate Tickets",
};

/* ─── Helper: merge provided ranks with fallback ────────────────────────────── */
function mergeRanks(provided: Rank[]): Rank[] {
  // Build a map from the provided ranks (DB or static) by tier
  const byTier = new Map<number, Rank>();
  for (const r of provided) {
    if (r.tier) byTier.set(r.tier, r);
  }

  // For every CF rank, prefer DB data for names/images/bonuses/EXP.
  // The DB stores cumulative EXP totals matching the Z8Games profile page
  // (e.g. ~3M for Major 8 at tier 59). Only fall back to the formula when
  // the DB has no value for a tier.
  return CF_ALL_RANKS.map(fallback => {
    const db = byTier.get(fallback.tier!);
    const bonus = db?.bonus || (db as any)?.bonus || BONUS_MAP[fallback.tier!] || fallback.bonus || "";
    const dbExp = (db as any)?.exp_required ?? db?.expRequired ?? 0;
    const exp = dbExp > 0 ? dbExp : (CF_EXP_THRESHOLDS[fallback.tier!] ?? 0);

    return {
      id: db?.id || fallback.id,
      name: db?.name || fallback.name,
      tier: fallback.tier,
      imageUrl: db?.imageUrl || (db as any)?.image_url || fallback.imageUrl,
      bonus,
      expRequired: exp,
    };
  });
}

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
function getRankImage(r: Rank): string {
  const url = (r as any).image_url || r.imageUrl || r.image || "";
  if (url && (url.startsWith("http") || url.startsWith("/"))) return url;
  if (r.tier && r.tier > 0) return `${Z8}${r.tier}.jpg`;
  return "";
}

function getExp(r: Rank): number {
  // Prefer DB cumulative EXP (matches Z8Games profile totals).
  // Fall back to formula estimate only when DB value is absent.
  if (typeof r.expRequired === "number" && r.expRequired > 0) return r.expRequired;
  const db = (r as any).exp_required;
  if (typeof db === "number" && db > 0) return db;
  if (r.tier) return CF_EXP_THRESHOLDS[r.tier] ?? 0;
  return 0;
}

function fmt(n: number) { return n.toLocaleString(); }

function parseTipsToPoints(text: string): string[] {
  return text
    .split(/\n/)
    .map(l => l.replace(/^[\d]+[\.\)]\s*/, "").replace(/^[-•*]\s*/, "").trim())
    .filter(l => l.length > 12)
    .slice(0, 7);
}

function loadPuter(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).puter) return resolve((window as any).puter);
    const existing = document.getElementById("puter-js-cdn");
    if (existing) { existing.addEventListener("load", () => resolve((window as any).puter)); return; }
    const script = document.createElement("script");
    script.id = "puter-js-cdn";
    script.src = "https://js.puter.com/v2/";
    script.onload = () => resolve((window as any).puter);
    script.onerror = () => reject(new Error("Failed to load Puter.js"));
    document.head.appendChild(script);
  });
}

/* ─── RankPicker ─────────────────────────────────────────────────────────────── */
function RankPicker({ label, value, options, onChange, disabled, placeholder }: {
  label: string;
  value: Rank | undefined;
  options: Rank[];
  onChange: (id: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? options.filter(r => r.name.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "#666" }}>{label}</p>
      <div className="relative">
        <button
          disabled={disabled}
          onClick={() => !disabled && setOpen(o => !o)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left rounded transition-all"
          style={{
            background: "#0d1117",
            border: `1px solid ${value ? "rgba(212,160,23,0.35)" : "rgba(255,255,255,0.08)"}`,
            color: value ? "#fff" : "#444",
            opacity: disabled ? 0.45 : 1,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          {value ? (
            <>
              <img src={getRankImage(value)} alt={value.name}
                className="w-8 h-8 object-contain flex-shrink-0"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[12px] font-bold uppercase tracking-tight truncate leading-tight">{value.name}</p>
                {getExp(value) > 0 && (
                  <p className="text-[10px]" style={{ color: "#d4a017" }}>{fmt(getExp(value))} EXP</p>
                )}
              </div>
            </>
          ) : (
            <span className="text-[12px]">{placeholder || "— Select —"}</span>
          )}
          <ChevronDown className="h-3.5 w-3.5 ml-auto flex-shrink-0" style={{ color: "#444" }} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setQuery(""); }} />
            <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded overflow-hidden"
              style={{ background: "#0d1117", border: "1px solid rgba(212,160,23,0.2)", boxShadow: "0 12px 40px rgba(0,0,0,0.8)" }}>
              <div className="p-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <input
                  autoFocus
                  type="text"
                  placeholder="Search ranks..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="w-full px-3 py-1.5 text-[12px] rounded outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                />
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
                {filtered.length === 0 ? (
                  <p className="px-4 py-3 text-[11px]" style={{ color: "#444" }}>No ranks match</p>
                ) : filtered.map(rank => (
                  <button key={rank.id}
                    onClick={() => { onChange(rank.id); setOpen(false); setQuery(""); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-white/5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <img src={getRankImage(rank)} alt={rank.name} className="w-7 h-7 object-contain flex-shrink-0"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-tight truncate"
                        style={{ color: value?.id === rank.id ? "#d4a017" : "#ccc" }}>
                        {rank.name}
                      </p>
                    </div>
                    {getExp(rank) > 0 && (
                      <span className="text-[9px] font-bold flex-shrink-0" style={{ color: "#3a3a3a" }}>
                        {fmt(getExp(rank))}
                      </span>
                    )}
                    {value?.id === rank.id && <ChevronRight className="h-3 w-3 flex-shrink-0" style={{ color: "#d4a017" }} />}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────────── */
export default function RankCalculator({ ranks }: RankCalculatorProps) {
  // Merge provided ranks with the full CF fallback list
  const allRanks = useMemo(() => mergeRanks(ranks), [ranks]);
  const sortedRanks = useMemo(() => [...allRanks].sort((a, b) => (a.tier ?? 0) - (b.tier ?? 0)), [allRanks]);

  /* ── Lookup ── */
  const [lookupInput, setLookupInput] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [profile, setProfile] = useState<PlayerProfile | null>(null);

  /* ── Manual mode ── */
  const [manualExpInput, setManualExpInput] = useState("");
  const [currentRankId, setCurrentRankId] = useState("");
  const [destinationRankId, setDestinationRankId] = useState("");

  /* ── AI ── */
  const [tips, setTips] = useState<string[]>([]);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [tipsError, setTipsError] = useState("");

  /* ── Derived current rank ── */
  const manualExp = parseInt(manualExpInput.replace(/,/g, ""), 10);
  const currentExp: number | null = profile?.exp ?? (isNaN(manualExp) ? null : manualExp);

  // Auto-detect rank from profile lookup.
  // EXP is the ground truth — scraper rank names are often wrong.
  // Only fall back to name/tier when EXP is absent.
  const autoCurrentRank = useMemo<Rank | null>(() => {
    if (!profile) return null;

    // 1. EXP-based detection (most reliable — rank name from Firecrawl can be wrong)
    if (profile.exp != null && profile.exp > 0) {
      let best: Rank | null = null;
      for (const r of sortedRanks) {
        if (getExp(r) <= profile.exp!) best = r;
        else break;
      }
      if (best) return best;
    }

    // 2. Tier number fallback
    if (profile.rankTier) {
      const r = sortedRanks.find(r => r.tier === profile.rankTier);
      if (r) return r;
    }

    // 3. Rank name fallback (least reliable)
    if (profile.rank) {
      const nameL = profile.rank.toLowerCase().trim();
      const r = sortedRanks.find(r => r.name.toLowerCase() === nameL);
      if (r) return r;
      const r2 = sortedRanks.find(r => r.name.toLowerCase().includes(nameL) || nameL.includes(r.name.toLowerCase()));
      if (r2) return r2;
    }

    return null;
  }, [profile, sortedRanks]);

  const effectiveCurrentRank: Rank | null =
    autoCurrentRank ||
    (currentRankId ? sortedRanks.find(r => r.id === currentRankId) ?? null : null);

  const currentIdx = effectiveCurrentRank
    ? sortedRanks.findIndex(r => r.id === effectiveCurrentRank.id)
    : -1;

  const isMaxRank = currentIdx === sortedRanks.length - 1 && currentIdx >= 0;

  const availableDests = currentIdx >= 0 ? sortedRanks.slice(currentIdx + 1) : sortedRanks;

  // Default destination = next rank
  const defaultDestId = !isMaxRank && currentIdx >= 0 ? sortedRanks[currentIdx + 1]?.id ?? "" : "";
  const activeDestId = destinationRankId || defaultDestId;
  const destinationRank = sortedRanks.find(r => r.id === activeDestId) ?? null;
  const destIdx = destinationRank ? sortedRanks.findIndex(r => r.id === destinationRank.id) : -1;

  // exp_required = CUMULATIVE XP required to reach that rank from the very start.
  // player's currentXP (TotalExp from API) is also cumulative.
  // remainingXP = destinationRank.expRequired - currentXP
  // progress    = (currentXP - currentRank.expRequired) / (destinationRank.expRequired - currentRank.expRequired)
  const currentRankExp  = effectiveCurrentRank ? getExp(effectiveCurrentRank) : 0;
  const destinationExp  = destinationRank      ? getExp(destinationRank)      : 0;

  const expNeeded = useMemo(() => {
    if (!destinationRank || destinationExp <= 0) return 0;
    if (currentExp != null) return Math.max(0, destinationExp - currentExp);
    // No profile: show full gap from current rank threshold to destination
    return destinationExp > currentRankExp ? destinationExp - currentRankExp : 0;
  }, [destinationRank, currentExp, destinationExp, currentRankExp]);

  // Progress within the current rank segment (currentRank.exp → destinationRank.exp)
  const progressPct = useMemo(() => {
    if (!effectiveCurrentRank || !destinationRank || currentExp == null) return 0;
    const start = currentRankExp;
    const end   = destinationExp;
    if (end <= start) return 0;
    return Math.min(100, Math.round(((currentExp - start) / (end - start)) * 100));
  }, [effectiveCurrentRank, destinationRank, currentExp, currentRankExp, destinationExp]);

  const pathRanks = useMemo(() => {
    if (currentIdx < 0 || destIdx <= currentIdx) return [];
    return sortedRanks.slice(currentIdx + 1, destIdx + 1);
  }, [currentIdx, destIdx, sortedRanks]);

  const bonusesOnPath = pathRanks.filter(r => r.bonus).map(r => r.bonus as string);
  const vipCount = bonusesOnPath.filter(b => b.toLowerCase().includes("vip")).length;

  /* ── Handlers ── */
  const handleLookup = async () => {
    const input = lookupInput.trim();
    if (!input) { setLookupError("Paste your z8games.com profile URL."); return; }
    if (!input.startsWith("http") && !input.includes("z8games.com")) {
      setLookupError("Please paste a full profile URL (e.g. https://crossfire.z8games.com/profile/12345).");
      return;
    }
    setLookupLoading(true);
    setLookupError("");
    setProfile(null);
    setCurrentRankId("");
    setDestinationRankId("");
    setTips([]);
    try {
      const res = await fetch(`/api/player/lookup?profileUrl=${encodeURIComponent(input)}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Profile not found. Make sure your profile is public on z8games.com.");
      }
      const p = data.profile;
      setProfile({
        nickname: p.nickname || input,
        exp: typeof p.exp === "number" ? p.exp : (typeof p.TotalExp === "number" ? p.TotalExp : null),
        rank: p.rank || null,
        rankTier: typeof p.rankTier === "number" ? p.rankTier : null,
        kills: p.kills ?? null,
        wins: p.wins ?? null,
      });
    } catch (e: any) {
      setLookupError(e.message || "Lookup failed. Check the URL and try again.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleClear = () => {
    setProfile(null); setLookupInput(""); setLookupError("");
    setCurrentRankId(""); setDestinationRankId(""); setTips([]);
  };

  const handleGetTips = async () => {
    if (!effectiveCurrentRank || !destinationRank) return;
    setTipsLoading(true); setTipsError(""); setTips([]);
    try {
      const p = await loadPuter();
      const prompt = [
        `CrossFire player is at "${effectiveCurrentRank.name}" aiming for "${destinationRank.name}".`,
        currentExp != null ? `Current EXP: ${fmt(currentExp)}.` : "",
        expNeeded > 0 ? `EXP needed: ${fmt(expNeeded)}.` : "",
        vipCount > 0 ? `VIP boxes along the path: ${vipCount}.` : "",
        bonusesOnPath.length > 0 ? `Rank rewards: ${bonusesOnPath.slice(0, 4).join(", ")}.` : "",
        "Give 5 specific, actionable CrossFire tips to rank up faster. Be concise.",
      ].filter(Boolean).join(" ");
      const res = await p.ai.chat(prompt);
      const text: string = res?.message?.content ?? res?.text ?? String(res ?? "");
      if (!text) throw new Error("Empty AI response");
      setTips(parseTipsToPoints(text));
    } catch (e: any) {
      setTipsError(e.message || "AI tips unavailable. Try again.");
    } finally {
      setTipsLoading(false);
    }
  };

  /* ─── RENDER ──────────────────────────────────────────────────────────────── */
  return (
    <div className="rounded-lg overflow-hidden mb-10"
      style={{ border: "1px solid rgba(212,160,23,0.18)", background: "rgba(212,160,23,0.02)" }}>

      {/* Header bar */}
      <div className="flex items-center gap-3 px-5 py-3.5"
        style={{ background: "rgba(212,160,23,0.07)", borderBottom: "1px solid rgba(212,160,23,0.1)" }}>
        <Target className="h-4 w-4 flex-shrink-0" style={{ color: "#d4a017" }} />
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: "#d4a017" }}>
            Rank Progression Calculator
          </p>
          <p className="text-[10px]" style={{ color: "#555" }}>
            Paste your z8games.com profile URL, or manually enter EXP — works for all {sortedRanks.length} ranks
          </p>
        </div>
      </div>

      <div className="p-5 space-y-5">

        {/* ── LOOKUP PANEL ── */}
        <div className="rounded-md p-4" style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[9px] font-black uppercase tracking-[0.25em] mb-3" style={{ color: "#555" }}>
            Auto-Detect: Look Up Your Profile
          </p>

          {!profile ? (
            <>
              <p className="text-[10px] mb-2" style={{ color: "#555" }}>
                Go to <strong style={{ color: "#aaa" }}>crossfire.z8games.com</strong> → your profile → copy the page URL and paste it below.
              </p>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: "#444" }} />
                  <input
                    type="url"
                    placeholder="https://crossfire.z8games.com/profile/…"
                    value={lookupInput}
                    onChange={e => { setLookupInput(e.target.value); setLookupError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleLookup()}
                    className="w-full pl-9 pr-3 py-2.5 text-[12px] rounded outline-none"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${lookupError ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"}`,
                      color: "#fff",
                    }}
                  />
                </div>
                <button
                  onClick={handleLookup}
                  disabled={lookupLoading || !lookupInput.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-black uppercase tracking-wide rounded transition-all disabled:opacity-40"
                  style={{ background: "#d4a017", color: "#000", cursor: lookupLoading ? "not-allowed" : "pointer", flexShrink: 0 }}>
                  {lookupLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                  {lookupLoading ? "Loading…" : "Look Up"}
                </button>
              </div>
              {lookupError && (
                <div className="flex items-center gap-2 mt-2 text-[11px]" style={{ color: "#ef4444" }}>
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> {lookupError}
                </div>
              )}
            </>
          ) : (
            /* Profile card */
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                {autoCurrentRank && (
                  <img src={getRankImage(autoCurrentRank)} alt={autoCurrentRank.name}
                    className="w-12 h-12 object-contain flex-shrink-0"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3" style={{ color: "#d4a017" }} />
                    <span className="text-[13px] font-black uppercase" style={{ color: "#fff" }}>{profile.nickname}</span>
                  </div>
                  {autoCurrentRank && (
                    <p className="text-[11px] font-bold mt-0.5" style={{ color: "#d4a017" }}>{autoCurrentRank.name}</p>
                  )}
                  {profile.exp != null && (
                    <p className="text-[10px] mt-0.5" style={{ color: "#666" }}>
                      Total EXP: <strong style={{ color: "#aaa" }}>{fmt(profile.exp)}</strong>
                    </p>
                  )}
                  {profile.kills != null && (
                    <p className="text-[10px]" style={{ color: "#555" }}>Kills: {fmt(profile.kills)}</p>
                  )}
                </div>
              </div>
              <button onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                <X className="h-3 w-3" /> Clear
              </button>
            </div>
          )}
        </div>

        {/* ── MANUAL PANEL (shown when no profile lookup) ── */}
        {!profile && (
          <div className="rounded-md p-4" style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] mb-3" style={{ color: "#555" }}>
              Manual: Enter Your EXP or Select Rank
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "#666" }}>Your Total EXP</p>
                <input
                  type="text"
                  placeholder="e.g. 28179536"
                  value={manualExpInput}
                  onChange={e => setManualExpInput(e.target.value.replace(/[^0-9,]/g, ""))}
                  className="w-full px-3 py-2.5 text-[12px] rounded outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                />
              </div>
              <RankPicker
                label="Your Current Rank"
                value={sortedRanks.find(r => r.id === currentRankId)}
                options={sortedRanks}
                onChange={id => { setCurrentRankId(id); setDestinationRankId(""); setTips([]); }}
                placeholder="— Select current rank —"
              />
            </div>
          </div>
        )}

        {/* ── DESTINATION PICKER ── */}
        {effectiveCurrentRank && !isMaxRank && (
          <div className="flex flex-col sm:flex-row items-end gap-3">
            {/* Current rank display */}
            <div className="flex items-center gap-2 pb-0.5 flex-shrink-0">
              <img src={getRankImage(effectiveCurrentRank)} alt={effectiveCurrentRank.name}
                className="w-10 h-10 object-contain"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "#555" }}>Now</p>
                <p className="text-[11px] font-black uppercase leading-tight" style={{ color: "#ccc" }}>
                  {effectiveCurrentRank.name}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 mx-2" style={{ color: "#333" }} />
            </div>
            <RankPicker
              label="Target Rank"
              value={destinationRank || undefined}
              options={availableDests}
              onChange={id => { setDestinationRankId(id); setTips([]); }}
              placeholder="— Choose your target —"
            />
          </div>
        )}

        {/* ── MAX RANK ── */}
        {isMaxRank && (
          <div className="flex items-center gap-3 px-5 py-4 rounded-lg"
            style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.25)" }}>
            <Trophy className="h-7 w-7 flex-shrink-0" style={{ color: "#d4a017" }} />
            <div>
              <p className="text-[13px] font-black uppercase" style={{ color: "#d4a017" }}>Grand Marshall — Maximum Rank!</p>
              <p className="text-[11px]" style={{ color: "#666" }}>You have reached the highest rank in CrossFire.</p>
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {effectiveCurrentRank && destinationRank && !isMaxRank && (
          <div className="space-y-4">

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {currentExp != null && (
                <div className="rounded-md p-3" style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[9px] font-black uppercase tracking-wide mb-1" style={{ color: "#555" }}>Your EXP</p>
                  <p className="text-[15px] font-black tabular-nums" style={{ color: "#fff" }}>{fmt(currentExp)}</p>
                </div>
              )}
              <div className="rounded-md p-3" style={{ background: "rgba(212,160,23,0.06)", border: "1px solid rgba(212,160,23,0.15)" }}>
                <p className="text-[9px] font-black uppercase tracking-wide mb-1" style={{ color: "#555" }}>EXP Needed</p>
                <p className="text-[15px] font-black tabular-nums" style={{ color: "#d4a017" }}>
                  {expNeeded > 0 ? fmt(expNeeded) : "—"}
                </p>
              </div>
              <div className="rounded-md p-3" style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[9px] font-black uppercase tracking-wide mb-1" style={{ color: "#555" }}>Ranks to Pass</p>
                <p className="text-[15px] font-black tabular-nums" style={{ color: "#fff" }}>{pathRanks.length}</p>
              </div>
              {vipCount > 0 && (
                <div className="rounded-md p-3" style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.2)" }}>
                  <p className="text-[9px] font-black uppercase tracking-wide mb-1" style={{ color: "#555" }}>VIP Boxes</p>
                  <p className="text-[15px] font-black tabular-nums" style={{ color: "#a855f7" }}>{vipCount}</p>
                </div>
              )}
            </div>

            {/* Progress bar */}
            {currentExp != null && destinationExp > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-bold" style={{ color: "#555" }}>
                    Progress: {effectiveCurrentRank.name} → {destinationRank.name}
                  </p>
                  <p className="text-[11px] font-black" style={{ color: "#d4a017" }}>{progressPct}%</p>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(progressPct, 1)}%`, background: "linear-gradient(90deg, #d4a017, #f5c842)" }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px]" style={{ color: "#333" }}>
                    {fmt(currentRankExp)} XP
                  </span>
                  <span className="text-[9px]" style={{ color: "#333" }}>
                    {fmt(destinationExp)} XP
                  </span>
                </div>
              </div>
            )}

            {/* Rank path */}
            {pathRanks.length > 0 && pathRanks.length <= 20 && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: "#555" }}>
                  Progression Path — {pathRanks.length} rank{pathRanks.length !== 1 ? "s" : ""}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {pathRanks.map(r => {
                    const hasVip = (r.bonus || "").toLowerCase().includes("vip");
                    return (
                      <div key={r.id} title={r.bonus || r.name}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded"
                        style={{
                          background: hasVip ? "rgba(168,85,247,0.08)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${hasVip ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.06)"}`,
                        }}>
                        <img src={getRankImage(r)} alt={r.name} className="w-5 h-5 object-contain"
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        <span className="text-[9px] font-bold uppercase tracking-tight"
                          style={{ color: hasVip ? "#a855f7" : "#666" }}>
                          {r.name}
                        </span>
                        {hasVip && <Star className="h-2.5 w-2.5 flex-shrink-0" style={{ color: "#a855f7" }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {pathRanks.length > 20 && (
              <p className="text-[10px]" style={{ color: "#555" }}>
                Passing through {pathRanks.length} ranks — showing rewards only.
              </p>
            )}

            {/* Bonuses */}
            {bonusesOnPath.length > 0 && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: "#555" }}>Rank-Up Rewards</p>
                <div className="flex flex-wrap gap-1.5">
                  {bonusesOnPath.map((b, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#888" }}>
                      <Gift className="h-2.5 w-2.5 flex-shrink-0" style={{ color: "#d4a017" }} />
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI tips */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: "#555" }}>AI Tips</p>
                <button
                  onClick={handleGetTips}
                  disabled={tipsLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide rounded transition-all disabled:opacity-50"
                  style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.25)", color: "#d4a017" }}>
                  {tipsLoading
                    ? <><Loader2 className="h-3 w-3 animate-spin" /> Loading…</>
                    : <><Sparkles className="h-3 w-3" /> Get AI Tips</>}
                </button>
              </div>

              {tipsError && (
                <p className="text-[11px] px-3 py-2 rounded" style={{ background: "rgba(239,68,68,0.07)", color: "#f87171" }}>
                  {tipsError}
                </p>
              )}

              {tips.length > 0 && (
                <div className="rounded-md overflow-hidden" style={{ border: "1px solid rgba(212,160,23,0.15)" }}>
                  <div className="flex items-center gap-2 px-4 py-2"
                    style={{ background: "rgba(212,160,23,0.06)", borderBottom: "1px solid rgba(212,160,23,0.1)" }}>
                    <Sparkles className="h-3 w-3" style={{ color: "#d4a017" }} />
                    <span className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: "#d4a017" }}>
                      Tips for {effectiveCurrentRank.name} → {destinationRank.name}
                    </span>
                  </div>
                  <ul className="p-4 space-y-2.5">
                    {tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded text-[9px] font-black mt-0.5"
                          style={{ background: "rgba(212,160,23,0.12)", color: "#d4a017" }}>{i + 1}</span>
                        <span className="text-[12px] leading-relaxed" style={{ color: "#bbb" }}>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!tips.length && !tipsLoading && !tipsError && (
                <p className="text-[11px] px-3 py-2" style={{ color: "#444" }}>
                  Click "Get AI Tips" for personalized rank-up strategies.
                </p>
              )}
            </div>
          </div>
        )}

        {/* No rank selected yet */}
        {!effectiveCurrentRank && !profile && !currentRankId && (
          <div className="py-8 text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2 opacity-10" style={{ color: "#d4a017" }} />
            <p className="text-[12px]" style={{ color: "#333" }}>
              Look up your profile above, or enter your EXP / select your rank to start calculating.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
