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

// Build the full 104-tier name+image list
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
    // Brigadier General 1-6: tiers 76-81  (BG4=79, BG6=81 confirmed)
    ...Array.from({ length: 6 }, (_, i) => ({ tier: 76 + i, name: `Brigadier General ${i + 1}` })),
    // Major General 1-6: tiers 82-87  (MG2=83, MG5=86, MG6=87 confirmed)
    ...Array.from({ length: 6 }, (_, i) => ({ tier: 82 + i, name: `Major General ${i + 1}` })),
    // Lieutenant General 1-6: tiers 88-93  (LTG3=90, LTG6=93 confirmed)
    ...Array.from({ length: 6 }, (_, i) => ({ tier: 88 + i, name: `Lieutenant General ${i + 1}` })),
    // General 1-10: tiers 94-103  (Gen2=95, Gen4=97, Gen6=99 confirmed)
    ...Array.from({ length: 10 }, (_, i) => ({ tier: 94 + i, name: `General ${i + 1}` })),
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

/* ─── EXP threshold map (tier → cumulative EXP) ─────────────────────────────
   Formula: EXP(t) = round(487 * t^2.5, 1000)
   Calibrated so tier 79 (BG4) ≈ 27,000,000  — matches real player data.
   tier 104 (Grand Marshal) ≈ 53,700,000.
*/
const CF_EXP_THRESHOLDS: Record<number, number> = (() => {
  const m: Record<number, number> = {};
  for (let t = 1; t <= 104; t++) {
    m[t] = t === 1 ? 0 : Math.round((487 * Math.pow(t, 2.5)) / 1000) * 1000;
  }
  return m;
})();

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

  // For every CF rank, prefer DB data but fill in missing ones
  return CF_ALL_RANKS.map(fallback => {
    const db = byTier.get(fallback.tier!);
    const bonus = db?.bonus || (db as any)?.bonus || BONUS_MAP[fallback.tier!] || fallback.bonus || "";
    const expDb = db ? ((db as any).exp_required ?? db.expRequired ?? 0) : 0;
    const exp = expDb > 0 ? expDb : CF_EXP_THRESHOLDS[fallback.tier!] ?? 0;

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
  const db = (r as any).exp_required;
  if (typeof db === "number" && db > 0) return db;
  if (typeof r.expRequired === "number" && r.expRequired > 0) return r.expRequired;
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

  // Auto-detect rank from profile lookup
  const autoCurrentRank = useMemo<Rank | null>(() => {
    if (!profile) return null;
    // Match by tier first (most accurate)
    if (profile.rankTier) {
      const r = sortedRanks.find(r => r.tier === profile.rankTier);
      if (r) return r;
    }
    // Match by rank name from API (fuzzy: includes)
    if (profile.rank) {
      const nameL = profile.rank.toLowerCase().trim();
      const r = sortedRanks.find(r => r.name.toLowerCase() === nameL);
      if (r) return r;
      // Partial match
      const r2 = sortedRanks.find(r => r.name.toLowerCase().includes(nameL) || nameL.includes(r.name.toLowerCase()));
      if (r2) return r2;
    }
    // Match by EXP: highest rank where expRequired <= currentExp
    if (profile.exp != null) {
      let best: Rank | null = null;
      for (const r of sortedRanks) {
        if (getExp(r) <= profile.exp!) best = r;
        else break;
      }
      return best;
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

  // EXP needed
  const destinationExp = destinationRank ? getExp(destinationRank) : 0;
  const currentRankExp = effectiveCurrentRank ? getExp(effectiveCurrentRank) : 0;

  const expNeeded = useMemo(() => {
    if (!destinationRank) return 0;
    if (currentExp != null && destinationExp > 0) return Math.max(0, destinationExp - currentExp);
    return 0;
  }, [destinationRank, currentExp, destinationExp]);

  const progressPct = useMemo(() => {
    if (!effectiveCurrentRank || !destinationRank || currentExp == null) return 0;
    const start = currentRankExp;
    const end = destinationExp;
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
    if (!input) { setLookupError("Enter your nickname or profile URL."); return; }
    setLookupLoading(true);
    setLookupError("");
    setProfile(null);
    setCurrentRankId("");
    setDestinationRankId("");
    setTips([]);
    try {
      const isUrl = input.startsWith("http");
      const qs = isUrl ? `profileUrl=${encodeURIComponent(input)}` : `nickname=${encodeURIComponent(input)}`;
      const res = await fetch(`/api/player/lookup?${qs}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Player not found. Check the nickname spelling.");
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
      setLookupError(e.message || "Lookup failed. Try entering your nickname instead.");
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
            Look up your profile or manually enter EXP — works for all {sortedRanks.length} ranks
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
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: "#444" }} />
                  <input
                    type="text"
                    placeholder="In-game nickname  OR  z8games.com/profile/… URL"
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
                  {lookupLoading ? "Looking up…" : "Look Up"}
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
                  {expNeeded > 0 ? fmt(expNeeded) : destinationExp > 0 ? fmt(destinationExp) : "—"}
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
                    {fmt(currentRankExp)} EXP
                  </span>
                  <span className="text-[9px]" style={{ color: "#333" }}>
                    {fmt(destinationExp)} EXP
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
