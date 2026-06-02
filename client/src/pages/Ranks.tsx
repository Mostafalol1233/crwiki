import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Search, Image as ImageIcon, Loader2, ArrowUp, ArrowDown, Trophy, Star } from "lucide-react";
import { getRanks } from "@/lib/supabaseApi";
import { useLanguage } from "@/components/LanguageProvider";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/Breadcrumbs";

interface Rank {
  id: string;
  name: string;
  tier?: number;
  emblem?: string;
  image?: string;
  imageUrl?: string;
  description?: string;
  requirements?: string;
  bonus?: string;
  expRequired?: number;
}

const extractExpRequired = (rank: Rank) => {
  if (typeof rank.expRequired === "number" && rank.expRequired > 0) return rank.expRequired;
  const match = String(rank.requirements || "").match(/exp required:\s*([\d,]+)/i);
  return match ? Number(match[1].replace(/,/g, "")) : 0;
};

const extractBonus = (rank: Rank) => {
  if (rank.bonus) return rank.bonus;
  const match = String(rank.requirements || "").match(/bonus:\s*([^|]+)/i);
  return match ? match[1].trim() : "";
};

const getRankImage = (rank: Rank) => rank.emblem || rank.image || rank.imageUrl || "";

const TIER_COLORS: Record<number, { bg: string; border: string; label: string; glow: string }> = {
  1: { bg: "#0a1520", border: "#3a7bd5", label: "Recruit", glow: "rgba(58,123,213,0.3)" },
  2: { bg: "#0d1a10", border: "#2e7d32", label: "Regular", glow: "rgba(46,125,50,0.3)" },
  3: { bg: "#1a1400", border: "#f59e0b", label: "Veteran", glow: "rgba(245,158,11,0.3)" },
  4: { bg: "#1a0800", border: "#f97316", label: "Elite", glow: "rgba(249,115,22,0.3)" },
  5: { bg: "#1a0010", border: "#ec4899", label: "Legend", glow: "rgba(236,72,153,0.3)" },
};

function getTierStyle(idx: number, total: number) {
  const pct = idx / Math.max(total - 1, 1);
  if (pct < 0.2) return TIER_COLORS[1];
  if (pct < 0.4) return TIER_COLORS[2];
  if (pct < 0.6) return TIER_COLORS[3];
  if (pct < 0.8) return TIER_COLORS[4];
  return TIER_COLORS[5];
}

export default function Ranks() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [view, setView] = useState<"grid" | "table">("grid");

  const { data: ranks = [], isLoading } = useQuery<Rank[]>({
    queryKey: ["/api/ranks"],
    queryFn: getRanks,
    staleTime: 1000 * 60 * 5,
  });

  const filteredRanks = useMemo(() => {
    const filtered = ranks.filter((rank) => {
      return (
        rank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rank.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rank.requirements?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
    return filtered.sort((a, b) => {
      const expA = extractExpRequired(a);
      const expB = extractExpRequired(b);
      return sortOrder === "asc" ? expA - expB : expB - expA;
    });
  }, [ranks, searchQuery, sortOrder]);

  const breadcrumbs = [{ name: "Ranks", url: "/ranks" }];

  return (
    <>
      <SEOHead
        title="CrossFire Ranks System - Complete Rank Guide | Crossfire Wiki"
        description="Explore all CrossFire ranks with images and requirements. Learn about the ranking system and progression in CrossFire."
        keywords={["crossfire ranks", "cf ranks", "rank system", "crossfire progression"]}
        canonicalUrl="/ranks"
        schemaType="CollectionPage"
        schemaData={{ name: "CrossFire Ranks", description: "Complete collection of CrossFire ranks" }}
      />

      <div className="min-h-screen py-12 md:py-16" style={{ background: "var(--background)" }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <Breadcrumbs items={breadcrumbs} />

          {/* ── Header ── */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded" style={{ background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.25)" }}>
                <Trophy className="h-6 w-6" style={{ color: "#f5a623" }} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-0.5" style={{ color: "#f5a623" }}>
                  Progression System
                </p>
                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
                  {t("ranks") || "Player Ranks"}
                </h1>
              </div>
            </div>
            <p className="text-sm mt-3" style={{ color: "#666" }}>
              {filteredRanks.length} ranks available — discover requirements and bonuses for each tier
            </p>
          </div>

          {/* ── Toolbar ── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#555" }} />
              <Input
                placeholder="Search ranks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Sort */}
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider rounded transition-all hover:border-[#f5a623] hover:text-[#f5a623]"
                style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.08)", color: "#888" }}
              >
                {sortOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                EXP {sortOrder === "asc" ? "Low→High" : "High→Low"}
              </button>

              {/* View toggle */}
              <div className="flex rounded overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                {(["grid", "table"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-all"
                    style={{
                      background: view === v ? "#f5a623" : "var(--card)",
                      color: view === v ? "#000" : "#666",
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Content ── */}
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#f5a623" }} />
            </div>
          ) : filteredRanks.length === 0 ? (
            <div className="py-20 text-center" style={{ border: "1px dashed rgba(255,255,255,0.08)", borderRadius: "4px" }}>
              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" style={{ color: "#f5a623" }} />
              <p className="text-sm font-bold uppercase tracking-widest" style={{ color: "#444" }}>
                {searchQuery ? "No ranks match your search" : "No ranks available"}
              </p>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredRanks.map((rank, idx) => {
                const tierStyle = getTierStyle(idx, filteredRanks.length);
                const exp = extractExpRequired(rank);
                const bonus = extractBonus(rank);
                return (
                  <div
                    key={rank.id}
                    className="group relative flex flex-col items-center p-4 transition-all duration-300 hover:-translate-y-1 cursor-default"
                    style={{
                      background: tierStyle.bg,
                      border: `1px solid ${tierStyle.border}22`,
                      borderRadius: "4px",
                      boxShadow: `0 2px 16px ${tierStyle.glow}`,
                    }}
                    title={rank.description || rank.name}
                  >
                    {/* Glow top border on hover */}
                    <div
                      className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: tierStyle.border }}
                    />

                    {/* Tier badge */}
                    <div
                      className="absolute top-2 right-2 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5"
                      style={{ background: `${tierStyle.border}22`, color: tierStyle.border, borderRadius: "2px" }}
                    >
                      {tierStyle.label}
                    </div>

                    {/* Rank image */}
                    <div className="mb-3 mt-2 relative">
                      {getRankImage(rank) ? (
                        <img
                          src={getRankImage(rank)}
                          alt={rank.name}
                          className="w-16 h-16 object-contain transition-transform duration-300 group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-16 h-16 flex items-center justify-center rounded" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <ImageIcon className="h-8 w-8" style={{ color: "#333" }} />
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <span
                      className="text-center text-[11px] font-black uppercase tracking-tight leading-tight mb-2"
                      style={{ color: "var(--foreground)" }}
                    >
                      {rank.name}
                    </span>

                    {/* EXP */}
                    {exp > 0 && (
                      <span className="text-[9px] font-bold" style={{ color: tierStyle.border }}>
                        {exp.toLocaleString()} EXP
                      </span>
                    )}

                    {/* Bonus pill */}
                    {bonus && (
                      <span
                        className="mt-1.5 text-[8px] font-bold px-2 py-0.5 text-center"
                        style={{ background: "rgba(255,255,255,0.05)", color: "#666", borderRadius: "2px", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        title={bonus}
                      >
                        {bonus}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── TABLE VIEW ── */
            <div className="overflow-x-auto rounded" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "#f5a623" }}>#</th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "#f5a623" }}>Rank</th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "#f5a623" }}>
                      <button className="flex items-center gap-1.5 hover:text-[#f9c84a] transition-colors" onClick={() => setSortOrder(s => s === "asc" ? "desc" : "asc")}>
                        EXP Required {sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      </button>
                    </th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "#f5a623" }}>Tier</th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "#f5a623" }}>Bonus</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRanks.map((rank, idx) => {
                    const tierStyle = getTierStyle(idx, filteredRanks.length);
                    const exp = extractExpRequired(rank);
                    const bonus = extractBonus(rank);
                    return (
                      <tr
                        key={rank.id}
                        className="transition-colors hover:bg-white/[0.02] group"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      >
                        <td className="px-5 py-3.5 text-[11px] font-bold" style={{ color: "#444" }}>{idx + 1}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {getRankImage(rank) ? (
                              <img src={getRankImage(rank)} alt={rank.name} className="w-10 h-10 object-contain flex-shrink-0 transition-transform group-hover:scale-110" loading="lazy" />
                            ) : (
                              <div className="w-10 h-10 flex items-center justify-center rounded flex-shrink-0" style={{ background: "rgba(255,255,255,0.04)" }}>
                                <Star className="h-4 w-4" style={{ color: "#333" }} />
                              </div>
                            )}
                            <span className="font-black text-sm uppercase tracking-tight" style={{ color: "var(--foreground)" }}>{rank.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-bold tabular-nums" style={{ color: exp > 0 ? tierStyle.border : "#444" }}>
                            {exp > 0 ? exp.toLocaleString() : "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className="text-[9px] font-black uppercase tracking-wider px-2 py-1"
                            style={{ background: `${tierStyle.border}18`, color: tierStyle.border, borderRadius: "2px" }}
                          >
                            {tierStyle.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm" style={{ color: "#666" }}>{bonus || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Legend ── */}
          {!isLoading && filteredRanks.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {Object.values(TIER_COLORS).map((t) => (
                <div key={t.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ background: t.border }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#555" }}>{t.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
