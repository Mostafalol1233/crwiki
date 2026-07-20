import { useState, useMemo } from "react";
import { ChevronDown, Sparkles, Trophy, Zap, Target, Gift, Shield, Loader2, ChevronRight, Star } from "lucide-react";
import { puter } from "@heyputer/puter.js";

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

interface RankCalculatorProps {
  ranks: Rank[];
}

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
  // Split by numbered lines, bullet points, or newlines
  const lines = text
    .split(/\n/)
    .map(l => l.replace(/^[\d]+[\.\)]\s*/, "").replace(/^[-•*]\s*/, "").trim())
    .filter(l => l.length > 10);
  return lines.slice(0, 8);
}

export default function RankCalculator({ ranks }: RankCalculatorProps) {
  const [currentRankId, setCurrentRankId] = useState<string>("");
  const [destinationRankId, setDestinationRankId] = useState<string>("");
  const [showDestPicker, setShowDestPicker] = useState(false);
  const [tips, setTips] = useState<string[]>([]);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [tipsError, setTipsError] = useState<string>("");
  const [currentOpen, setCurrentOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);

  // Sort ranks by tier ascending
  const sortedRanks = useMemo(() =>
    [...ranks].sort((a, b) => (a.tier ?? 0) - (b.tier ?? 0)),
    [ranks]
  );

  const currentRank = sortedRanks.find(r => r.id === currentRankId);
  const currentIdx = currentRank ? sortedRanks.findIndex(r => r.id === currentRankId) : -1;
  const isMaxRank = currentIdx === sortedRanks.length - 1 && currentIdx >= 0;

  // Default destination = next rank
  const defaultDestId = !isMaxRank && currentIdx >= 0 ? sortedRanks[currentIdx + 1]?.id : "";
  const activeDestId = destinationRankId || defaultDestId;
  const destinationRank = sortedRanks.find(r => r.id === activeDestId);
  const destIdx = destinationRank ? sortedRanks.findIndex(r => r.id === activeDestId) : -1;

  // Ranks between current and destination (exclusive of current, inclusive of dest)
  const pathRanks = useMemo(() => {
    if (currentIdx < 0 || destIdx <= currentIdx) return [];
    return sortedRanks.slice(currentIdx + 1, destIdx + 1);
  }, [currentIdx, destIdx, sortedRanks]);

  // EXP needed = sum of exp_required for each rank in path
  const expNeeded = useMemo(() => {
    return pathRanks.reduce((sum, r) => sum + getExp(r), 0);
  }, [pathRanks]);

  const bonusesOnPath = pathRanks
    .filter(r => r.bonus)
    .map(r => r.bonus as string);

  const vipBoxCount = countVipBoxes(pathRanks);

  // Selectable destinations (ranks after current)
  const availableDestinations = currentIdx >= 0
    ? sortedRanks.slice(currentIdx + 1)
    : [];

  const handleGetTips = async () => {
    if (!currentRank || !destinationRank) return;
    setTipsLoading(true);
    setTipsError("");
    setTips([]);
    try {
      const prompt = [
        `A CrossFire player is currently ranked "${currentRank.name}" and wants to reach "${destinationRank.name}".`,
        expNeeded > 0 ? `They need ${expNeeded.toLocaleString()} EXP to reach their goal.` : "",
        vipBoxCount > 0 ? `Along this path they will earn ${vipBoxCount} VIP Weapon Box reward(s).` : "",
        bonusesOnPath.length > 0 ? `Rank-up bonuses on this path: ${bonusesOnPath.slice(0, 5).join(", ")}` : "",
        "",
        "Give 4-5 practical bullet-point tips to earn EXP faster, make the most of the bonus rewards, and any special strategies for their rank tier. Be concise and specific to CrossFire NA gameplay.",
      ].filter(Boolean).join("\n");

      const response = await puter.ai.chat(prompt, { model: "x-ai/grok-4-1-fast" });
      const text: string = response?.message?.content ?? response?.text ?? String(response ?? "");
      if (!text) throw new Error("Empty response from AI");
      setTips(parseTipsToPoints(text));
    } catch (e: any) {
      setTipsError(e.message || "Could not load tips. Try again.");
    } finally {
      setTipsLoading(false);
    }
  };

  const handleCurrentSelect = (id: string) => {
    setCurrentRankId(id);
    setDestinationRankId(""); // reset destination when current changes
    setShowDestPicker(false);
    setTips([]);
    setTipsError("");
    setCurrentOpen(false);
  };

  const handleDestSelect = (id: string) => {
    setDestinationRankId(id);
    setTips([]);
    setTipsError("");
    setDestOpen(false);
  };

  return (
    <div
      className="rounded mb-10 overflow-hidden"
      style={{ border: "1px solid rgba(245,166,35,0.2)", background: "rgba(245,166,35,0.03)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-4"
        style={{ borderBottom: "1px solid rgba(245,166,35,0.12)", background: "rgba(245,166,35,0.06)" }}
      >
        <div className="p-2 rounded" style={{ background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)" }}>
          <Target className="h-5 w-5" style={{ color: "#f5a623" }} />
        </div>
        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.15em]" style={{ color: "#f5a623" }}>
            Rank Progression Calculator
          </h2>
          <p className="text-[11px]" style={{ color: "#666" }}>
            Select your rank and see what you need to advance
          </p>
        </div>
      </div>

      <div className="p-6">
        {/* ── Rank Selectors Row ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 mb-6">
          {/* Current rank */}
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: "#888" }}>
              Your Current Rank
            </label>
            <div className="relative">
              <button
                onClick={() => setCurrentOpen(o => !o)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                style={{
                  background: "var(--card)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "4px",
                  color: currentRank ? "var(--foreground)" : "#555",
                }}
              >
                {currentRank ? (
                  <>
                    <img src={getRankImage(currentRank)} alt={currentRank.name} className="w-8 h-8 object-contain flex-shrink-0"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    <span className="text-[12px] font-black uppercase tracking-tight truncate">{currentRank.name}</span>
                  </>
                ) : (
                  <span className="text-[12px]">— Select your rank —</span>
                )}
                <ChevronDown className="h-4 w-4 ml-auto flex-shrink-0" style={{ color: "#555" }} />
              </button>
              {currentOpen && (
                <div
                  className="absolute left-0 right-0 top-full mt-1 z-50 overflow-y-auto rounded"
                  style={{
                    background: "#0f1419",
                    border: "1px solid rgba(245,166,35,0.25)",
                    maxHeight: "280px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                  }}
                >
                  {sortedRanks.map(rank => (
                    <button
                      key={rank.id}
                      onClick={() => handleCurrentSelect(rank.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      <img src={getRankImage(rank)} alt={rank.name} className="w-7 h-7 object-contain flex-shrink-0"
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                      <span className="text-[11px] font-bold uppercase tracking-tight" style={{ color: rank.id === currentRankId ? "#f5a623" : "var(--foreground)" }}>
                        {rank.name}
                      </span>
                      {getExp(rank) > 0 && (
                        <span className="ml-auto text-[9px] font-bold" style={{ color: "#444" }}>
                          {getExp(rank).toLocaleString()} EXP
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0 pb-1">
            <ChevronRight className="h-5 w-5" style={{ color: "#444" }} />
          </div>

          {/* Destination rank */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "#888" }}>
                Destination Rank
              </label>
              {!isMaxRank && currentRank && availableDestinations.length > 1 && (
                <button
                  onClick={() => setShowDestPicker(s => !s)}
                  className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded transition-colors"
                  style={{
                    color: showDestPicker ? "#f5a623" : "#666",
                    border: `1px solid ${showDestPicker ? "rgba(245,166,35,0.4)" : "rgba(255,255,255,0.08)"}`,
                    background: showDestPicker ? "rgba(245,166,35,0.08)" : "transparent",
                  }}
                >
                  {showDestPicker ? "Auto (Next)" : "Choose Target"}
                </button>
              )}
            </div>

            {isMaxRank ? (
              /* MAX RANK */
              <div
                className="flex items-center gap-3 px-4 py-3 rounded"
                style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.3)" }}
              >
                <Trophy className="h-6 w-6 flex-shrink-0" style={{ color: "#f5a623" }} />
                <div>
                  <p className="text-[12px] font-black uppercase tracking-tight" style={{ color: "#f5a623" }}>
                    Maximum Rank Achieved!
                  </p>
                  <p className="text-[10px]" style={{ color: "#888" }}>
                    You've reached Grand Marshall — the highest rank
                  </p>
                </div>
              </div>
            ) : !currentRank ? (
              <div
                className="flex items-center px-4 py-3 rounded"
                style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="text-[12px]" style={{ color: "#444" }}>Select your current rank first</span>
              </div>
            ) : showDestPicker ? (
              <div className="relative">
                <button
                  onClick={() => setDestOpen(o => !o)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                  style={{
                    background: "var(--card)",
                    border: "1px solid rgba(245,166,35,0.25)",
                    borderRadius: "4px",
                    color: destinationRank ? "var(--foreground)" : "#555",
                  }}
                >
                  {destinationRank ? (
                    <>
                      <img src={getRankImage(destinationRank)} alt={destinationRank.name} className="w-8 h-8 object-contain flex-shrink-0"
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                      <span className="text-[12px] font-black uppercase tracking-tight truncate">{destinationRank.name}</span>
                    </>
                  ) : (
                    <span className="text-[12px]">— Choose target rank —</span>
                  )}
                  <ChevronDown className="h-4 w-4 ml-auto flex-shrink-0" style={{ color: "#555" }} />
                </button>
                {destOpen && (
                  <div
                    className="absolute left-0 right-0 top-full mt-1 z-50 overflow-y-auto rounded"
                    style={{
                      background: "#0f1419",
                      border: "1px solid rgba(245,166,35,0.25)",
                      maxHeight: "280px",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                    }}
                  >
                    {availableDestinations.map(rank => (
                      <button
                        key={rank.id}
                        onClick={() => handleDestSelect(rank.id)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      >
                        <img src={getRankImage(rank)} alt={rank.name} className="w-7 h-7 object-contain flex-shrink-0"
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        <span className="text-[11px] font-bold uppercase tracking-tight" style={{ color: rank.id === activeDestId ? "#f5a623" : "var(--foreground)" }}>
                          {rank.name}
                        </span>
                        {getExp(rank) > 0 && (
                          <span className="ml-auto text-[9px] font-bold" style={{ color: "#444" }}>
                            {getExp(rank).toLocaleString()} EXP
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Auto = next rank, clickable to switch to picker */
              destinationRank && (
                <button
                  onClick={() => { setShowDestPicker(true); setDestOpen(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all group"
                  style={{
                    background: "var(--card)",
                    border: "1px solid rgba(245,166,35,0.2)",
                    borderRadius: "4px",
                  }}
                  title="Click to choose a different destination"
                >
                  <img src={getRankImage(destinationRank)} alt={destinationRank.name} className="w-8 h-8 object-contain flex-shrink-0"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  <div className="flex-1 min-w-0">
                    <span className="block text-[12px] font-black uppercase tracking-tight truncate" style={{ color: "var(--foreground)" }}>
                      {destinationRank.name}
                    </span>
                    <span className="text-[9px]" style={{ color: "#555" }}>Next rank — click to choose further</span>
                  </div>
                  <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#f5a623" }} />
                </button>
              )
            )}
          </div>
        </div>

        {/* ── Stats Row ── */}
        {currentRank && destinationRank && !isMaxRank && pathRanks.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {/* EXP Needed */}
            <div className="rounded p-4" style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.15)" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="h-3.5 w-3.5" style={{ color: "#f5a623" }} />
                <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: "#888" }}>EXP Needed</span>
              </div>
              <p className="text-lg font-black tabular-nums" style={{ color: "#f5a623" }}>
                {expNeeded > 0 ? expNeeded.toLocaleString() : "—"}
              </p>
            </div>

            {/* Ranks to pass */}
            <div className="rounded p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Trophy className="h-3.5 w-3.5" style={{ color: "#888" }} />
                <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: "#888" }}>Ranks to Pass</span>
              </div>
              <p className="text-lg font-black tabular-nums" style={{ color: "var(--foreground)" }}>
                {pathRanks.length}
              </p>
            </div>

            {/* Bonuses */}
            <div className="rounded p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Gift className="h-3.5 w-3.5" style={{ color: "#888" }} />
                <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: "#888" }}>Bonuses</span>
              </div>
              <p className="text-lg font-black tabular-nums" style={{ color: "var(--foreground)" }}>
                {bonusesOnPath.length}
              </p>
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
              <p className="text-lg font-black tabular-nums" style={{ color: vipBoxCount > 0 ? "#a855f7" : "var(--foreground)" }}>
                {vipBoxCount}
              </p>
            </div>
          </div>
        )}

        {/* ── Path Preview ── */}
        {pathRanks.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: "#666" }}>
              Progression Path ({pathRanks.length} rank{pathRanks.length !== 1 ? "s" : ""})
            </p>
            <div className="flex flex-wrap gap-2">
              {pathRanks.map((rank, i) => {
                const hasVip = (rank.bonus || "").toLowerCase().includes("vip");
                return (
                  <div
                    key={rank.id}
                    className="flex items-center gap-2 px-3 py-2 rounded"
                    style={{
                      background: hasVip ? "rgba(168,85,247,0.08)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${hasVip ? "rgba(168,85,247,0.25)" : "rgba(255,255,255,0.07)"}`,
                    }}
                    title={rank.bonus || rank.name}
                  >
                    <img
                      src={getRankImage(rank)}
                      alt={rank.name}
                      className="w-6 h-6 object-contain"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-tight" style={{ color: hasVip ? "#a855f7" : "#aaa" }}>
                      {rank.name}
                    </span>
                    {hasVip && (
                      <Star className="h-3 w-3 flex-shrink-0" style={{ color: "#a855f7" }} />
                    )}
                  </div>
                );
              })}
            </div>
            {vipBoxCount > 0 && (
              <div
                className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded text-[11px]"
                style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.18)" }}
              >
                <Shield className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#a855f7" }} />
                <span style={{ color: "#a855f7" }}>
                  <strong>{vipBoxCount} VIP Weapon Box{vipBoxCount > 1 ? "es" : ""}</strong>
                  <span style={{ color: "#888" }}> — highlighted purple along your path above</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Bonuses List ── */}
        {bonusesOnPath.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: "#666" }}>
              Rewards You'll Earn
            </p>
            <div className="flex flex-wrap gap-2">
              {bonusesOnPath.map((bonus, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#999",
                  }}
                >
                  <Gift className="h-3 w-3 flex-shrink-0" style={{ color: "#f5a623" }} />
                  {bonus}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Grok AI Tips ── */}
        {currentRank && destinationRank && !isMaxRank && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "#666" }}>
                AI Rank Tips
              </p>
              <button
                onClick={handleGetTips}
                disabled={tipsLoading}
                className="flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded transition-all disabled:opacity-50"
                style={{
                  background: tipsLoading ? "rgba(245,166,35,0.1)" : "rgba(245,166,35,0.15)",
                  border: "1px solid rgba(245,166,35,0.35)",
                  color: "#f5a623",
                  cursor: tipsLoading ? "not-allowed" : "pointer",
                }}
              >
                {tipsLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Asking Grok...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Get AI Tips
                  </>
                )}
              </button>
            </div>

            {tipsError && (
              <div className="px-4 py-3 rounded text-[11px]" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
                {tipsError}
              </div>
            )}

            {tips.length > 0 && (
              <div className="rounded overflow-hidden" style={{ border: "1px solid rgba(245,166,35,0.15)", background: "rgba(0,0,0,0.2)" }}>
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: "1px solid rgba(245,166,35,0.1)", background: "rgba(245,166,35,0.05)" }}>
                  <Sparkles className="h-3.5 w-3.5" style={{ color: "#f5a623" }} />
                  <span className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: "#f5a623" }}>
                    Grok Tips: {currentRank.name} → {destinationRank.name}
                  </span>
                </div>
                <ul className="p-4 space-y-3">
                  {tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span
                        className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-[9px] font-black mt-0.5"
                        style={{ background: "rgba(245,166,35,0.15)", color: "#f5a623", border: "1px solid rgba(245,166,35,0.25)" }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-[12px] leading-relaxed" style={{ color: "#ccc" }}>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!tips.length && !tipsLoading && !tipsError && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded text-[11px]"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#555" }}
              >
                <Sparkles className="h-4 w-4 flex-shrink-0" />
                Click "Get AI Tips" to receive personalized CrossFire rank-up advice powered by Grok AI
              </div>
            )}
          </div>
        )}

        {/* Grand Marshall congratulations */}
        {isMaxRank && (
          <div className="text-center py-8">
            <Trophy className="h-16 w-16 mx-auto mb-4" style={{ color: "#f5a623", opacity: 0.8 }} />
            <h3 className="text-xl font-black uppercase tracking-widest mb-2" style={{ color: "#f5a623" }}>
              Grand Marshall
            </h3>
            <p className="text-sm" style={{ color: "#666" }}>
              You've reached the highest rank in CrossFire. No further progression needed — congratulations!
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded" style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)" }}>
              <Gift className="h-4 w-4" style={{ color: "#f5a623" }} />
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#f5a623" }}>
                Bonus: 30 Free Crate Tickets
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
