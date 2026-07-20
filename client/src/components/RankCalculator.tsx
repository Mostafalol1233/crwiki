import { useState, useMemo } from "react";
import {
  ChevronDown, Sparkles, Trophy, Zap, Target, Gift, Shield,
  Loader2, ChevronRight, Star, Search, User, ArrowRight, X
} from "lucide-react";

/* ─── Types ───────────────────────────────────────────────────────────────── */
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
  kdRatio?: number | null;
}

interface RankCalculatorProps {
  ranks: Rank[];
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const Z8 = "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_";

function getRankImage(rank: Rank): string {
  const url = (rank as any).image_url || rank.imageUrl || rank.image || "";
  if (url && (url.startsWith("http") || url.startsWith("/"))) return url;
  if (rank.tier && rank.tier > 0) return `${Z8}${rank.tier}.jpg`;
  return "";
}

function getExp(rank: Rank): number {
  const fromDb = (rank as any).exp_required;
  if (typeof fromDb === "number" && fromDb > 0) return fromDb;
  if (typeof rank.expRequired === "number" && rank.expRequired > 0) return rank.expRequired;
  return 0;
}

function countVipBoxes(ranks: Rank[]): number {
  return ranks.filter(r => (r.bonus || "").toLowerCase().includes("vip")).length;
}

function parseTipsToPoints(text: string): string[] {
  return text
    .split(/\n/)
    .map(l => l.replace(/^[\d]+[\.\)]\s*/, "").replace(/^[-•*]\s*/, "").trim())
    .filter(l => l.length > 10)
    .slice(0, 8);
}

function fmt(n: number) { return n.toLocaleString(); }

/* ─── Puter lazy loader ───────────────────────────────────────────────────── */
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

/* ─── RankDropdown ────────────────────────────────────────────────────────── */
function RankDropdown({
  label, selectedRank, sortedRanks, onSelect, disabled, hint,
}: {
  label: string;
  selectedRank?: Rank;
  sortedRanks: Rank[];
  onSelect: (id: string) => void;
  disabled?: boolean;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex-1 min-w-0">
      <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#888" }}>{label}</label>
      <div className="relative">
        <button
          disabled={disabled}
          onClick={() => !disabled && setOpen(o => !o)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
          style={{
            background: "var(--card)",
            border: `1px solid ${selectedRank ? "rgba(245,166,35,0.3)" : "rgba(255,255,255,0.1)"}`,
            borderRadius: 4,
            color: selectedRank ? "var(--foreground)" : "#555",
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          {selectedRank ? (
            <>
              <img src={getRankImage(selectedRank)} alt={selectedRank.name}
                className="w-8 h-8 object-contain flex-shrink-0"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              <div className="flex-1 min-w-0">
                <span className="block text-[12px] font-bold uppercase tracking-tight truncate">{selectedRank.name}</span>
                {getExp(selectedRank) > 0 && (
                  <span className="text-[10px]" style={{ color: "#f5a623" }}>{fmt(getExp(selectedRank))} EXP</span>
                )}
              </div>
            </>
          ) : (
            <span className="text-[12px]">{hint || "— Select rank —"}</span>
          )}
          <ChevronDown className="h-4 w-4 ml-auto flex-shrink-0" style={{ color: "#555" }} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute left-0 right-0 top-full mt-1 z-50 overflow-y-auto rounded"
              style={{ background: "#0f1419", border: "1px solid rgba(245,166,35,0.25)", maxHeight: 280, boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
              {sortedRanks.map(rank => (
                <button key={rank.id}
                  onClick={() => { onSelect(rank.id); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <img src={getRankImage(rank)} alt={rank.name} className="w-7 h-7 object-contain flex-shrink-0"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  <span className="text-[11px] font-bold uppercase tracking-tight"
                    style={{ color: selectedRank?.id === rank.id ? "#f5a623" : "var(--foreground)" }}>
                    {rank.name}
                  </span>
                  {getExp(rank) > 0 && (
                    <span className="ml-auto text-[9px] font-bold" style={{ color: "#444" }}>{fmt(getExp(rank))} EXP</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function RankCalculator({ ranks }: RankCalculatorProps) {
  /* Lookup state */
  const [lookupInput, setLookupInput] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [profile, setProfile] = useState<PlayerProfile | null>(null);

  /* Manual EXP override */
  const [manualExpInput, setManualExpInput] = useState("");

  /* Rank selector state */
  const [currentRankId, setCurrentRankId] = useState("");
  const [destinationRankId, setDestinationRankId] = useState("");

  /* AI tips */
  const [tips, setTips] = useState<string[]>([]);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [tipsError, setTipsError] = useState("");

  /* Sort ranks ascending by tier */
  const sortedRanks = useMemo(() =>
    [...ranks].sort((a, b) => (a.tier ?? 0) - (b.tier ?? 0)), [ranks]);

  /* ── Effective current EXP ── */
  const manualExp = parseInt(manualExpInput.replace(/,/g, ""), 10);
  const currentExp: number | null = profile?.exp ?? (isNaN(manualExp) ? null : manualExp);

  /* ── Find rank by tier ── */
  const findRankByTier = (tier: number | null) => {
    if (!tier) return null;
    return sortedRanks.find(r => r.tier === tier) || null;
  };

  /* ── Find rank by EXP (highest rank where expRequired <= currentExp) ── */
  const findRankByExp = (exp: number) => {
    const withExp = sortedRanks.filter(r => getExp(r) > 0);
    if (withExp.length === 0) return null;
    let best: Rank | null = null;
    for (const r of withExp) {
      if (getExp(r) <= exp) best = r;
      else break;
    }
    return best;
  };

  /* ── Auto-select current rank from profile ── */
  const autoCurrentRank: Rank | null = useMemo(() => {
    if (!profile) return null;
    if (profile.rankTier) {
      const byTier = findRankByTier(profile.rankTier);
      if (byTier) return byTier;
    }
    if (profile.exp != null) {
      return findRankByExp(profile.exp);
    }
    return null;
  }, [profile, sortedRanks]);

  /* ── Effective current rank ── */
  const currentRank = autoCurrentRank ||
    (currentRankId ? sortedRanks.find(r => r.id === currentRankId) : null);

  const currentIdx = currentRank ? sortedRanks.findIndex(r => r.id === currentRank.id) : -1;
  const isMaxRank = currentIdx === sortedRanks.length - 1 && currentIdx >= 0;
  const availableDestinations = currentIdx >= 0 ? sortedRanks.slice(currentIdx + 1) : [];

  /* ── Destination ── */
  const defaultDestId = !isMaxRank && currentIdx >= 0 ? sortedRanks[currentIdx + 1]?.id : "";
  const activeDestId = destinationRankId || defaultDestId;
  const destinationRank = sortedRanks.find(r => r.id === activeDestId) || null;
  const destIdx = destinationRank ? sortedRanks.findIndex(r => r.id === activeDestId) : -1;

  /* ── Path ranks ── */
  const pathRanks = useMemo(() => {
    if (currentIdx < 0 || destIdx <= currentIdx) return [];
    return sortedRanks.slice(currentIdx + 1, destIdx + 1);
  }, [currentIdx, destIdx, sortedRanks]);

  /* ── EXP calculation ── */
  const destinationExpRequired = destinationRank ? getExp(destinationRank) : 0;
  const hasExpData = destinationExpRequired > 0;

  // EXP needed: destination threshold - current EXP
  const expNeeded = useMemo(() => {
    if (!destinationRank) return 0;
    if (currentExp != null && destinationExpRequired > 0) {
      return Math.max(0, destinationExpRequired - currentExp);
    }
    // Fallback: sum deltas
    return pathRanks.reduce((sum, r) => sum + getExp(r), 0);
  }, [destinationRank, currentExp, destinationExpRequired, pathRanks]);

  const progressPct = useMemo(() => {
    if (!currentRank || !destinationRank) return 0;
    const startExp = getExp(currentRank);
    const endExp = destinationExpRequired;
    if (endExp <= startExp) return 0;
    if (currentExp == null) return 0;
    const done = Math.max(0, currentExp - startExp);
    const total = endExp - startExp;
    return Math.min(100, Math.round((done / total) * 100));
  }, [currentRank, destinationRank, currentExp, destinationExpRequired]);

  const bonusesOnPath = pathRanks.filter(r => r.bonus).map(r => r.bonus as string);
  const vipBoxCount = countVipBoxes(pathRanks);

  /* ── Player lookup ── */
  const handleLookup = async () => {
    const input = lookupInput.trim();
    if (!input) { setLookupError("Enter your in-game nickname or profile URL."); return; }
    setLookupLoading(true);
    setLookupError("");
    setProfile(null);
    setCurrentRankId("");
    setDestinationRankId("");
    try {
      let url = "/api/player/lookup?";
      const isProfileUrl = input.startsWith("http");
      if (isProfileUrl) {
        url += `profileUrl=${encodeURIComponent(input)}`;
      } else {
        url += `nickname=${encodeURIComponent(input)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Player not found. Check your nickname spelling.");
      }
      const p = data.profile;
      setProfile({
        nickname: p.nickname || input,
        exp: typeof p.exp === "number" ? p.exp : (typeof p.TotalExp === "number" ? p.TotalExp : null),
        rank: p.rank || null,
        rankTier: typeof p.rankTier === "number" ? p.rankTier : null,
        kills: p.kills ?? null,
        wins: p.wins ?? null,
        kdRatio: p.kdRatio ?? null,
      });
    } catch (e: any) {
      setLookupError(e.message || "Lookup failed. Try entering your nickname instead.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleClearProfile = () => {
    setProfile(null);
    setLookupInput("");
    setLookupError("");
    setCurrentRankId("");
    setDestinationRankId("");
    setTips([]);
  };

  /* ── AI tips ── */
  const handleGetTips = async () => {
    if (!currentRank || !destinationRank) return;
    setTipsLoading(true);
    setTipsError("");
    setTips([]);
    try {
      const puterInstance = await loadPuter();
      const prompt = [
        `A CrossFire player is currently ranked "${currentRank.name}" and wants to reach "${destinationRank.name}".`,
        currentExp != null ? `They currently have ${fmt(currentExp)} total EXP.` : "",
        expNeeded > 0 ? `They need approximately ${fmt(expNeeded)} more EXP to reach their goal.` : "",
        vipBoxCount > 0 ? `Along this path they will earn ${vipBoxCount} VIP Weapon Box reward(s).` : "",
        bonusesOnPath.length > 0 ? `Rank-up bonuses on this path: ${bonusesOnPath.slice(0, 5).join(", ")}` : "",
        "",
        "Give 4-5 practical bullet-point tips to earn EXP faster, make the most of the bonus rewards, and any special strategies for their rank tier. Be concise and specific to CrossFire gameplay.",
      ].filter(Boolean).join("\n");
      const response = await puterInstance.ai.chat(prompt);
      const text: string = response?.message?.content ?? response?.text ?? String(response ?? "");
      if (!text) throw new Error("Empty response from AI");
      setTips(parseTipsToPoints(text));
    } catch (e: any) {
      setTipsError(e.message || "Could not load tips. Try again.");
    } finally {
      setTipsLoading(false);
    }
  };

  /* ── Render ── */
  return (
    <div className="rounded mb-10 overflow-hidden"
      style={{ border: "1px solid rgba(245,166,35,0.2)", background: "rgba(245,166,35,0.03)" }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4"
        style={{ borderBottom: "1px solid rgba(245,166,35,0.12)", background: "rgba(245,166,35,0.06)" }}>
        <div className="p-2 rounded" style={{ background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)" }}>
          <Target className="h-5 w-5" style={{ color: "#f5a623" }} />
        </div>
        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.15em]" style={{ color: "#f5a623" }}>
            Rank Progression Calculator
          </h2>
          <p className="text-[11px]" style={{ color: "#666" }}>
            Look up your profile or select your rank manually to calculate EXP needed
          </p>
        </div>
      </div>

      <div className="p-6">

        {/* ── Section 1: Player Lookup ── */}
        <div className="mb-6 p-4 rounded" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: "#888" }}>
            Step 1 — Look Up Your Profile
          </p>

          {!profile ? (
            <>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "#555" }} />
                  <input
                    type="text"
                    placeholder="Your in-game nickname  OR  profile URL (z8games.com/profile/...)"
                    value={lookupInput}
                    onChange={e => { setLookupInput(e.target.value); setLookupError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleLookup()}
                    className="w-full pl-10 pr-4 py-2.5 text-[13px] rounded outline-none"
                    style={{
                      background: "var(--card)",
                      border: `1px solid ${lookupError ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"}`,
                      color: "var(--foreground)",
                    }}
                  />
                </div>
                <button
                  onClick={handleLookup}
                  disabled={lookupLoading || !lookupInput.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 text-[11px] font-black uppercase tracking-wider rounded transition-all disabled:opacity-40"
                  style={{ background: "#f5a623", color: "#000", cursor: lookupLoading ? "not-allowed" : "pointer" }}
                >
                  {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  {lookupLoading ? "Searching..." : "Look Up"}
                </button>
              </div>
              {lookupError && (
                <p className="mt-2 text-[11px]" style={{ color: "#ef4444" }}>{lookupError}</p>
              )}
              <p className="mt-2 text-[10px]" style={{ color: "#444" }}>
                Enter your exact in-game nickname (case-sensitive) or paste your profile page URL.
                Can't find your profile? Use manual selection below instead.
              </p>
            </>
          ) : (
            /* Profile card */
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                {autoCurrentRank && (
                  <img src={getRankImage(autoCurrentRank)} alt={autoCurrentRank.name}
                    className="w-12 h-12 object-contain flex-shrink-0"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-3.5 w-3.5" style={{ color: "#f5a623" }} />
                    <span className="text-[13px] font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>
                      {profile.nickname}
                    </span>
                  </div>
                  {autoCurrentRank && (
                    <p className="text-[11px] font-bold" style={{ color: "#f5a623" }}>{autoCurrentRank.name}</p>
                  )}
                  {profile.exp != null && (
                    <p className="text-[11px]" style={{ color: "#777" }}>
                      Total EXP: <strong style={{ color: "var(--foreground)" }}>{fmt(profile.exp)}</strong>
                    </p>
                  )}
                  {profile.kills != null && (
                    <p className="text-[10px]" style={{ color: "#555" }}>
                      Kills: {fmt(profile.kills)}
                      {profile.kdRatio != null && ` · K/D: ${profile.kdRatio}`}
                    </p>
                  )}
                </div>
              </div>
              <button onClick={handleClearProfile}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
                <X className="h-3 w-3" /> Clear
              </button>
            </div>
          )}
        </div>

        {/* ── Manual EXP entry (if no profile lookup) ── */}
        {!profile && (
          <div className="mb-6 p-4 rounded" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: "#888" }}>
              Or enter your EXP manually
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#777" }}>
                  Your Total EXP
                </label>
                <input
                  type="text"
                  placeholder="e.g. 800000"
                  value={manualExpInput}
                  onChange={e => setManualExpInput(e.target.value.replace(/[^0-9,]/g, ""))}
                  className="w-full px-4 py-2.5 text-[13px] rounded outline-none"
                  style={{
                    background: "var(--card)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--foreground)",
                  }}
                />
              </div>

              {/* Manual current rank selector */}
              <RankDropdown
                label="Your Current Rank"
                selectedRank={sortedRanks.find(r => r.id === currentRankId)}
                sortedRanks={sortedRanks}
                onSelect={id => { setCurrentRankId(id); setDestinationRankId(""); setTips([]); }}
                hint="— Select your rank —"
              />
            </div>
          </div>
        )}

        {/* ── Section 2: Destination Rank ── */}
        {(currentRank || (!profile && currentRankId)) && !isMaxRank && (
          <div className="mb-6 p-4 rounded" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: "#888" }}>
              Step 2 — Choose Destination Rank
            </p>
            <div className="flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1 flex items-end gap-4">
                {currentRank && (
                  <div className="flex items-center gap-2 mb-1 flex-shrink-0">
                    <img src={getRankImage(currentRank)} alt={currentRank.name}
                      className="w-10 h-10 object-contain"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "#555" }}>Current</p>
                      <p className="text-[11px] font-black uppercase" style={{ color: "var(--foreground)" }}>{currentRank.name}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 flex-shrink-0 mx-2" style={{ color: "#444" }} />
                  </div>
                )}
                <RankDropdown
                  label="Target Rank"
                  selectedRank={destinationRank || undefined}
                  sortedRanks={availableDestinations}
                  onSelect={id => { setDestinationRankId(id); setTips([]); }}
                  hint="— Choose target —"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Max rank ── */}
        {isMaxRank && (
          <div className="mb-6 flex items-center gap-3 px-5 py-4 rounded"
            style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.3)" }}>
            <Trophy className="h-7 w-7 flex-shrink-0" style={{ color: "#f5a623" }} />
            <div>
              <p className="text-[13px] font-black uppercase tracking-tight" style={{ color: "#f5a623" }}>Maximum Rank Achieved!</p>
              <p className="text-[11px]" style={{ color: "#888" }}>Grand Marshall — the highest rank in CrossFire</p>
            </div>
          </div>
        )}

        {/* ── Section 3: Results ── */}
        {currentRank && destinationRank && !isMaxRank && (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {/* EXP you have */}
              {currentExp != null && (
                <div className="rounded p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap className="h-3.5 w-3.5" style={{ color: "#888" }} />
                    <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: "#888" }}>Your EXP</span>
                  </div>
                  <p className="text-base font-black tabular-nums" style={{ color: "var(--foreground)" }}>
                    {fmt(currentExp)}
                  </p>
                </div>
              )}

              {/* EXP needed */}
              <div className="rounded p-4" style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.15)" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Target className="h-3.5 w-3.5" style={{ color: "#f5a623" }} />
                  <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: "#888" }}>EXP Needed</span>
                </div>
                <p className="text-base font-black tabular-nums" style={{ color: "#f5a623" }}>
                  {expNeeded > 0 ? fmt(expNeeded) : "—"}
                </p>
              </div>

              {/* Ranks to pass */}
              <div className="rounded p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Trophy className="h-3.5 w-3.5" style={{ color: "#888" }} />
                  <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: "#888" }}>Ranks to Pass</span>
                </div>
                <p className="text-base font-black tabular-nums" style={{ color: "var(--foreground)" }}>{pathRanks.length}</p>
              </div>

              {/* VIP Boxes */}
              <div className="rounded p-4" style={{
                background: vipBoxCount > 0 ? "rgba(168,85,247,0.06)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${vipBoxCount > 0 ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.07)"}`,
              }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Shield className="h-3.5 w-3.5" style={{ color: vipBoxCount > 0 ? "#a855f7" : "#888" }} />
                  <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: "#888" }}>VIP Boxes</span>
                </div>
                <p className="text-base font-black tabular-nums" style={{ color: vipBoxCount > 0 ? "#a855f7" : "var(--foreground)" }}>
                  {vipBoxCount}
                </p>
              </div>
            </div>

            {/* Progress bar (only when we have current EXP and destination has exp_required) */}
            {currentExp != null && destinationExpRequired > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold" style={{ color: "#666" }}>
                    Progress toward {destinationRank.name}
                  </span>
                  <span className="text-[10px] font-black" style={{ color: "#f5a623" }}>{progressPct}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${progressPct}%`, background: "linear-gradient(to right, #f5a623, #e89020)" }}
                  />
                </div>
                {getExp(currentRank) > 0 && (
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px]" style={{ color: "#444" }}>{fmt(getExp(currentRank))} EXP</span>
                    <span className="text-[9px]" style={{ color: "#444" }}>{fmt(destinationExpRequired)} EXP</span>
                  </div>
                )}
              </div>
            )}

            {/* EXP data missing notice */}
            {!hasExpData && expNeeded === 0 && (
              <div className="mb-5 px-4 py-3 rounded text-[11px]"
                style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.15)", color: "#888" }}>
                EXP threshold data not set for these ranks. Go to Admin → Ranks to add exp_required values for accurate calculations.
              </div>
            )}

            {/* Path preview */}
            {pathRanks.length > 0 && (
              <div className="mb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: "#666" }}>
                  Progression Path ({pathRanks.length} rank{pathRanks.length !== 1 ? "s" : ""})
                </p>
                <div className="flex flex-wrap gap-2">
                  {pathRanks.map(rank => {
                    const hasVip = (rank.bonus || "").toLowerCase().includes("vip");
                    return (
                      <div key={rank.id}
                        className="flex items-center gap-2 px-3 py-2 rounded"
                        style={{
                          background: hasVip ? "rgba(168,85,247,0.08)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${hasVip ? "rgba(168,85,247,0.25)" : "rgba(255,255,255,0.07)"}`,
                        }}
                        title={rank.bonus || rank.name}>
                        <img src={getRankImage(rank)} alt={rank.name} className="w-6 h-6 object-contain"
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        <span className="text-[10px] font-bold uppercase tracking-tight"
                          style={{ color: hasVip ? "#a855f7" : "#aaa" }}>{rank.name}</span>
                        {hasVip && <Star className="h-3 w-3 flex-shrink-0" style={{ color: "#a855f7" }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bonuses */}
            {bonusesOnPath.length > 0 && (
              <div className="mb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: "#666" }}>
                  Rewards You'll Earn
                </p>
                <div className="flex flex-wrap gap-2">
                  {bonusesOnPath.map((bonus, i) => (
                    <span key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#999" }}>
                      <Gift className="h-3 w-3 flex-shrink-0" style={{ color: "#f5a623" }} />
                      {bonus}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI tips */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "#666" }}>AI Rank Tips</p>
                <button
                  onClick={handleGetTips}
                  disabled={tipsLoading}
                  className="flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded transition-all disabled:opacity-50"
                  style={{ background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.35)", color: "#f5a623" }}>
                  {tipsLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Asking...</> : <><Sparkles className="h-3.5 w-3.5" /> Get AI Tips</>}
                </button>
              </div>
              {tipsError && (
                <div className="px-4 py-3 rounded text-[11px]"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
                  {tipsError}
                </div>
              )}
              {tips.length > 0 && (
                <div className="rounded overflow-hidden" style={{ border: "1px solid rgba(245,166,35,0.15)", background: "rgba(0,0,0,0.2)" }}>
                  <div className="flex items-center gap-2 px-4 py-2.5"
                    style={{ borderBottom: "1px solid rgba(245,166,35,0.1)", background: "rgba(245,166,35,0.05)" }}>
                    <Sparkles className="h-3.5 w-3.5" style={{ color: "#f5a623" }} />
                    <span className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: "#f5a623" }}>
                      Tips: {currentRank.name} → {destinationRank.name}
                    </span>
                  </div>
                  <ul className="p-4 space-y-3">
                    {tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-[9px] font-black mt-0.5"
                          style={{ background: "rgba(245,166,35,0.15)", color: "#f5a623", border: "1px solid rgba(245,166,35,0.25)" }}>
                          {i + 1}
                        </span>
                        <span className="text-[12px] leading-relaxed" style={{ color: "#ccc" }}>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!tips.length && !tipsLoading && !tipsError && (
                <div className="flex items-center gap-3 px-4 py-3 rounded text-[11px]"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#555" }}>
                  <Sparkles className="h-4 w-4 flex-shrink-0" />
                  Click "Get AI Tips" for personalized CrossFire rank-up advice
                </div>
              )}
            </div>
          </>
        )}

        {/* No rank selected yet */}
        {!currentRank && !profile && !currentRankId && (
          <div className="py-6 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-20" style={{ color: "#f5a623" }} />
            <p className="text-[12px]" style={{ color: "#444" }}>
              Look up your profile above, or enter your EXP and select your current rank to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
