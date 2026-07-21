import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Search, Image as ImageIcon, Loader2, ArrowUp, ArrowDown, Trophy, Star } from "lucide-react";
import { getRanks } from "@/lib/supabaseApi";
import { useLanguage } from "@/components/LanguageProvider";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import RankCalculator from "@/components/RankCalculator";

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

const Z8 = "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_";

// EXP formula calibrated so tier 79 (Brigadier General 4) ≈ 27,000,000
// matching real player data. Grand Marshal (tier 104) ≈ 53,700,000.
const CF_EXP: Record<number, number> = (() => {
  const m: Record<number, number> = {};
  for (let t = 1; t <= 104; t++) {
    m[t] = t === 1 ? 0 : Math.round((487 * Math.pow(t, 2.5)) / 1000) * 1000;
  }
  return m;
})();

const RANK_BONUSES: Record<number, string> = {
  2: "Smile Grenade 7 days", 3: "Boost Box 3 days", 4: "Starter Weapon Box 3 days",
  5: "Pottery Boost Box 7 days", 6: "Camo Box 7 days", 9: "30,000 GP",
  10: "Red Dragon Box 7 days", 13: "VIP Weapon Box 3 days", 15: "Red SMOKE 30 days",
  17: "30,000 GP", 19: "AK-47-K-Yellow Fractal 14 days", 21: "B.C-Axe-Ares 7 days",
  23: "M4A1-S-Yellow Fractal 14 days", 25: "Barrett M82A1-Royal Dragon 7 days", 27: "Sidearm Box 7 days",
  29: "M4A1-S-Yellow Fractal 30 days", 31: "Throw Weapon Box 30 days", 33: "KAC Chainsaw-Ancient Dragon 30 days",
  35: "Kukri-Royal Dragon 30 days", 37: "AK-47-K-Yellow Fractal 30 days", 39: "Bulletproof Package 30 days",
  41: "Rifle Box 30 days", 42: "Blue Muzzle Flame 30 days", 45: "30,000 GP",
  47: "CFWE Pistol Ticket 30 days", 49: "Yellow Smoke 30 days", 51: "Green Muzzle Flame 30 days",
  52: "30,000 GP", 54: "Mutant Box 30 days", 57: "CFWE Sniper Ticket 30 days",
  58: "Octane Camo Grenade 30 days", 59: "CFWE MG Ticket 30 days", 61: "Bulletproof Package 30 days",
  62: "CFWE SMG Ticket 30 days", 63: "M4A1 Custom-Octane Camo 30 days", 65: "CFWE Rifle Ticket 30 days",
  67: "10 Horus Crates", 70: "M4A1-S-Yellow Fractal 60 days", 72: "BC Axe-Octane Camo 30 days",
  74: "Character Box 30 days", 75: "10 Octane Crates", 79: "AK-47-K-Yellow Fractal 60 days",
  81: "30 x 7th Anniversary Crates", 83: "G-Yellow Crystal perm", 86: "10 Color Blaze Crates",
  87: "Slaughter Ticket Box", 90: "M4A1-S-Yellow Fractal perm", 93: "RPK-Infernal Dragon 30 days",
  95: "AK-47-K-Yellow Fractal perm", 97: "AWM-Infernal Dragon 30 days", 99: "AK-47 Fury 30 days",
  104: "30 Free Crate Tickets",
};

// Generate complete 104-tier rank list
function buildFullRankList(): Rank[] {
  const entries: Array<{ tier: number; name: string }> = [
    { tier: 1, name: "Trainee 1" }, { tier: 2, name: "Trainee 2" },
    { tier: 3, name: "Private" }, { tier: 4, name: "Private First Class" }, { tier: 5, name: "Corporal" },
    ...Array.from({ length: 4 }, (_, i) => ({ tier: 6 + i, name: `Sergeant ${i + 1}` })),
    ...Array.from({ length: 6 }, (_, i) => ({ tier: 10 + i, name: `Staff Sergeant ${i + 1}` })),
    ...Array.from({ length: 6 }, (_, i) => ({ tier: 16 + i, name: `Sergeant First Class ${i + 1}` })),
    ...Array.from({ length: 6 }, (_, i) => ({ tier: 22 + i, name: `Master Sergeant ${i + 1}` })),
    ...Array.from({ length: 8 }, (_, i) => ({ tier: 28 + i, name: `Second Lieutenant ${i + 1}` })),
    ...Array.from({ length: 8 }, (_, i) => ({ tier: 36 + i, name: `First Lieutenant ${i + 1}` })),
    ...Array.from({ length: 8 }, (_, i) => ({ tier: 44 + i, name: `Captain ${i + 1}` })),
    ...Array.from({ length: 8 }, (_, i) => ({ tier: 52 + i, name: `Major ${i + 1}` })),
    ...Array.from({ length: 8 }, (_, i) => ({ tier: 60 + i, name: `Lieutenant Colonel ${i + 1}` })),
    ...Array.from({ length: 8 }, (_, i) => ({ tier: 68 + i, name: `Colonel ${i + 1}` })),
    ...Array.from({ length: 6 }, (_, i) => ({ tier: 76 + i, name: `Brigadier General ${i + 1}` })),
    ...Array.from({ length: 6 }, (_, i) => ({ tier: 82 + i, name: `Major General ${i + 1}` })),
    ...Array.from({ length: 6 }, (_, i) => ({ tier: 88 + i, name: `Lieutenant General ${i + 1}` })),
    ...Array.from({ length: 10 }, (_, i) => ({ tier: 94 + i, name: `General ${i + 1}` })),
    { tier: 104, name: "Grand Marshall" },
  ];
  return entries.map(e => ({
    id: `cf${e.tier}`,
    name: e.name,
    tier: e.tier,
    imageUrl: `${Z8}${e.tier}.jpg`,
    bonus: RANK_BONUSES[e.tier] || "",
    expRequired: CF_EXP[e.tier] ?? 0,
  }));
}

const STATIC_RANKS: Rank[] = buildFullRankList(); // 104 complete ranks

const extractExpRequired = (rank: Rank) => {
  const fromDb = (rank as any).exp_required;
  if (typeof fromDb === "number" && fromDb > 0) return fromDb;
  if (typeof rank.expRequired === "number" && rank.expRequired > 0) return rank.expRequired;
  const match = String(rank.requirements || "").match(/exp required:\s*([\d,]+)/i);
  if (match) return Number(match[1].replace(/,/g, ""));
  // Tier-based EXP fallback
  if (rank.tier && rank.tier > 0) return CF_EXP[rank.tier] ?? 0;
  return 0;
};

const extractBonus = (rank: Rank) => {
  if (rank.bonus) return rank.bonus;
  const match = String(rank.requirements || "").match(/bonus:\s*([^|]+)/i);
  return match ? match[1].trim() : "";
};

const getRankImage = (rank: Rank): string => {
  const url = rank.image_url || rank.emblem || rank.image || rank.imageUrl || "";
  if (url && (url.startsWith("http") || url.startsWith("/"))) return url;
  // Fallback: build z8games CDN URL from tier number
  if (rank.tier && rank.tier > 0) return `${Z8}${rank.tier}.jpg`;
  return "";
};

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

  const { data: ranksFromSupabase = [], isLoading } = useQuery<Rank[]>({
    queryKey: ["/api/ranks"],
    queryFn: getRanks,
    staleTime: 1000 * 60 * 5,
  });

  // Merge Supabase ranks with the full 104-tier static list.
  // DB entries win for any tier that appears; missing tiers are filled from STATIC_RANKS.
  const ranks = useMemo(() => {
    if (ranksFromSupabase.length === 0) return STATIC_RANKS;
    const byTier = new Map<number, Rank>();
    for (const r of ranksFromSupabase) { if (r.tier) byTier.set(r.tier, r); }
    return STATIC_RANKS.map(fallback => {
      const db = byTier.get(fallback.tier!);
      if (!db) return fallback;
      return {
        ...fallback,
        ...db,
        // ensure EXP is filled in from formula when DB has 0
        expRequired: ((db as any).exp_required > 0 ? (db as any).exp_required : db.expRequired ?? 0) || fallback.expRequired,
        imageUrl: (db as any).image_url || db.imageUrl || fallback.imageUrl,
        bonus: db.bonus || fallback.bonus,
      };
    });
  }, [ranksFromSupabase]);

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
        title="CrossFire Ranks System — Complete Rank Guide | CrossFire Wiki"
        description="Explore all 104 CrossFire ranks with images, EXP requirements and bonuses. Full progression guide from Private to Grand Marshal."
        keywords={["crossfire ranks", "cf ranks", "rank system", "crossfire progression", "grand marshal", "crossfire exp"]}
        canonicalUrl="https://crossfire.wiki/ranks"
        ogImage="https://static.wikia.nocookie.net/crossfirefps/images/0/0f/NA_class_1.png/revision/latest?cb=20130706213819"
        ogImageAlt="CrossFire Ranks — Full Progression System"
        ogImageWidth={512}
        ogImageHeight={512}
        schemaType="CollectionPage"
        schemaData={{ name: "CrossFire Ranks", description: "Complete 104-tier CrossFire rank system with EXP requirements and rewards" }}
        breadcrumbs={[
          { name: "CrossFire Wiki", url: "https://crossfire.wiki/" },
          { name: "Ranks", url: "https://crossfire.wiki/ranks" },
        ]}
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

          {/* ── Tier Legend ── */}
          <div className="flex flex-wrap gap-4 mb-6 px-3 py-2.5 rounded" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-[9px] font-black uppercase tracking-widest self-center" style={{ color: "#444" }}>Tier Key:</span>
            {Object.values(TIER_COLORS).map((tc) => (
              <div key={tc.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: tc.border, boxShadow: `0 0 6px ${tc.glow}` }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#666" }}>{tc.label}</span>
              </div>
            ))}
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
                const tierStyle = getTierStyle((rank.tier || idx + 1) - 1, ranks.length || 104);
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
                          onError={(e) => {
                            const el = e.currentTarget;
                            if (rank.tier && !el.src.includes("z8games")) {
                              el.src = `${Z8}${rank.tier}.jpg`;
                            } else {
                              el.style.display = "none";
                            }
                          }}
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
                      <div className="flex flex-col items-center gap-0">
                        <span className="text-[9px] font-bold" style={{ color: tierStyle.border }}>
                          {exp.toLocaleString()} EXP
                        </span>
                        <span className="text-[7px]" style={{ color: "#444" }}>to advance</span>
                      </div>
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
                    const tierStyle = getTierStyle((rank.tier || idx + 1) - 1, ranks.length || 104);
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
                              <img
                                src={getRankImage(rank)}
                                alt={rank.name}
                                className="w-10 h-10 object-contain flex-shrink-0 transition-transform group-hover:scale-110"
                                loading="lazy"
                                onError={(e) => {
                                  const el = e.currentTarget;
                                  if (rank.tier && !el.src.includes("z8games")) {
                                    el.src = `${Z8}${rank.tier}.jpg`;
                                  } else {
                                    el.style.display = "none";
                                  }
                                }}
                              />
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


          {/* ── Rank Calculator ── */}
          {!isLoading && ranks.length > 0 && (
            <div className="mt-12">
              <RankCalculator ranks={ranks} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
