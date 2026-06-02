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

const STATIC_RANKS: Rank[] = [
  { id: "s1", name: "Major 1", tier: 1, imageUrl: "https://files.catbox.moe/p0s9sk.jpeg", expRequired: 2057701, bonus: "30,000 GP", description: "Major rank tier 1" },
  { id: "s2", name: "Major 2", tier: 2, imageUrl: "https://files.catbox.moe/8nlk6e.jpeg", expRequired: 2107237, bonus: "", description: "Major rank tier 2" },
  { id: "s3", name: "Major 3", tier: 3, imageUrl: "https://files.catbox.moe/1ke9re.jpeg", expRequired: 2339509, bonus: "Mutant Box 30 days", description: "Major rank tier 3" },
  { id: "s4", name: "Major 4", tier: 4, imageUrl: "https://files.catbox.moe/q9q8a4.jpeg", expRequired: 2484517, bonus: "", description: "Major rank tier 4" },
  { id: "s5", name: "Major 5", tier: 5, imageUrl: "https://files.catbox.moe/dy1ycr.jpeg", expRequired: 2632261, bonus: "", description: "Major rank tier 5" },
  { id: "s6", name: "Major 6", tier: 6, imageUrl: "https://files.catbox.moe/u7d8n8.jpeg", expRequired: 2782741, bonus: "CFWE Sniper Ticket 30 days", description: "Major rank tier 6" },
  { id: "s7", name: "Major 7", tier: 7, imageUrl: "https://files.catbox.moe/0at6e0.jpeg", expRequired: 2935957, bonus: "Octane Camo Grenade 30 days", description: "Major rank tier 7" },
  { id: "s8", name: "Major 8", tier: 8, imageUrl: "https://files.catbox.moe/21np4h.jpeg", expRequired: 3091909, bonus: "CFWE MG Ticket 30 days", description: "Major rank tier 8" },
  { id: "s9", name: "Lieutenant Colonel 1", tier: 9, imageUrl: "https://files.catbox.moe/wj32gi.jpeg", expRequired: 3277045, bonus: "", description: "Lieutenant Colonel rank tier 1" },
  { id: "s10", name: "Lieutenant Colonel 2", tier: 10, imageUrl: "https://files.catbox.moe/3upe2i.jpeg", expRequired: 3465373, bonus: "Bulletproof Package 30 days", description: "Lieutenant Colonel rank tier 2" },
  { id: "s11", name: "Lieutenant Colonel 3", tier: 11, imageUrl: "https://files.catbox.moe/pxlhng.jpeg", expRequired: 3673537, bonus: "CFWE SMG Ticket 30 days", description: "Lieutenant Colonel rank tier 3" },
  { id: "s12", name: "Lieutenant Colonel 4", tier: 12, imageUrl: "https://files.catbox.moe/vvf1ob.jpeg", expRequired: 3885178, bonus: "M4A1 Custom-Octane Camo 30 days", description: "Lieutenant Colonel rank tier 4" },
  { id: "s13", name: "Lieutenant Colonel 5", tier: 13, imageUrl: "https://files.catbox.moe/j48qds.jpeg", expRequired: 4100296, bonus: "", description: "Lieutenant Colonel rank tier 5" },
  { id: "s14", name: "Lieutenant Colonel 6", tier: 14, imageUrl: "https://files.catbox.moe/of7bjg.jpeg", expRequired: 4318891, bonus: "CFWE Rifle Ticket 30 days", description: "Lieutenant Colonel rank tier 6" },
  { id: "s15", name: "Lieutenant Colonel 7", tier: 15, imageUrl: "https://files.catbox.moe/fc3xd3.jpeg", expRequired: 4540963, bonus: "", description: "Lieutenant Colonel rank tier 7" },
  { id: "s16", name: "Lieutenant Colonel 8", tier: 16, imageUrl: "https://files.catbox.moe/gry5a6.jpeg", expRequired: 4766512, bonus: "10 Horus Crates", description: "Lieutenant Colonel rank tier 8" },
  { id: "s17", name: "Colonel 1", tier: 17, imageUrl: "https://files.catbox.moe/36u4e0.jpeg", expRequired: 5028199, bonus: "", description: "Colonel rank tier 1" },
  { id: "s18", name: "Colonel 2", tier: 18, imageUrl: "https://files.catbox.moe/irep2l.jpeg", expRequired: 5319184, bonus: "", description: "Colonel rank tier 2" },
  { id: "s19", name: "Colonel 3", tier: 19, imageUrl: "https://files.catbox.moe/n21tw4.jpeg", expRequired: 5614501, bonus: "M4A1-S-Yellow Fractal 60 days", description: "Colonel rank tier 3" },
  { id: "s20", name: "Colonel 4", tier: 20, imageUrl: "https://files.catbox.moe/qp8njf.jpeg", expRequired: 5914150, bonus: "", description: "Colonel rank tier 4" },
  { id: "s21", name: "Colonel 5", tier: 21, imageUrl: "https://files.catbox.moe/1qv6ts.jpeg", expRequired: 6218131, bonus: "BC Axe-Octane Camo 30 days", description: "Colonel rank tier 5" },
  { id: "s22", name: "Brigadier General 1", tier: 22, imageUrl: "https://files.catbox.moe/s7cki2.jpeg", expRequired: 7578037, bonus: "", description: "First brigadier rank" },
  { id: "s23", name: "Brigadier General 2", tier: 23, imageUrl: "https://files.catbox.moe/ysfqm5.jpeg", expRequired: 8026912, bonus: "AK-47-K-Yellow Fractal 60 days", description: "Second brigadier rank" },
  { id: "s24", name: "Brigadier General 3", tier: 24, imageUrl: "https://files.catbox.moe/b28ove.jpeg", expRequired: 8481772, bonus: "", description: "Third brigadier rank" },
  { id: "s25", name: "Brigadier General 4", tier: 25, imageUrl: "https://files.catbox.moe/5kqiv0.jpeg", expRequired: 8964562, bonus: "", description: "Fourth brigadier rank" },
  { id: "s26", name: "Brigadier General 5", tier: 26, imageUrl: "https://files.catbox.moe/dxp982.jpeg", expRequired: 9475852, bonus: "", description: "Fifth brigadier rank" },
  { id: "s27", name: "Brigadier General 6", tier: 27, imageUrl: "https://files.catbox.moe/znkwhf.jpeg", expRequired: 10016212, bonus: "30 x 7th Anniversary Crates", description: "Sixth brigadier rank" },
  { id: "s28", name: "Major General 1", tier: 28, imageUrl: "https://files.catbox.moe/0z7arw.jpeg", expRequired: 10586212, bonus: "", description: "First major general rank" },
  { id: "s29", name: "Major General 2", tier: 29, imageUrl: "https://files.catbox.moe/r5bv00.jpeg", expRequired: 11186422, bonus: "G-Yellow Crystal perm", description: "Second major general rank" },
  { id: "s30", name: "Major General 3", tier: 30, imageUrl: "https://files.catbox.moe/u1u353.jpeg", expRequired: 11817412, bonus: "", description: "Third major general rank" },
  { id: "s31", name: "Major General 4", tier: 31, imageUrl: "https://files.catbox.moe/zvmosb.jpeg", expRequired: 12479752, bonus: "", description: "Fourth major general rank" },
  { id: "s32", name: "Major General 5", tier: 32, imageUrl: "https://files.catbox.moe/r732ah.jpeg", expRequired: 13174012, bonus: "10 Color Blaze Crates", description: "Fifth major general rank" },
  { id: "s33", name: "Major General 6", tier: 33, imageUrl: "https://files.catbox.moe/8n9syh.jpeg", expRequired: 13900762, bonus: "Slaughter Ticket Box", description: "Sixth major general rank" },
  { id: "s34", name: "Lieutenant General 1", tier: 34, imageUrl: "https://files.catbox.moe/a5m2o4.jpeg", expRequired: 14660572, bonus: "", description: "First lieutenant general rank" },
  { id: "s35", name: "Lieutenant General 2", tier: 35, imageUrl: "https://files.catbox.moe/9cz5b0.jpeg", expRequired: 15454012, bonus: "", description: "Second lieutenant general rank" },
  { id: "s36", name: "Lieutenant General 3", tier: 36, imageUrl: "https://files.catbox.moe/pn404m.jpeg", expRequired: 16281652, bonus: "M4A1-S-Yellow Fractal perm", description: "Third lieutenant general rank" },
  { id: "s37", name: "Lieutenant General 4", tier: 37, imageUrl: "https://files.catbox.moe/k4xaa3.jpeg", expRequired: 17144062, bonus: "", description: "Fourth lieutenant general rank" },
  { id: "s38", name: "Lieutenant General 5", tier: 38, imageUrl: "https://files.catbox.moe/pq4ung.jpeg", expRequired: 18041812, bonus: "", description: "Fifth lieutenant general rank" },
  { id: "s39", name: "Lieutenant General 6", tier: 39, imageUrl: "https://files.catbox.moe/34w8kx.jpeg", expRequired: 18975472, bonus: "RPK-Infernal Dragon 30 days", description: "Sixth lieutenant general rank" },
  { id: "s40", name: "General 1", tier: 40, imageUrl: "https://files.catbox.moe/sy65bu.jpeg", expRequired: 19945612, bonus: "", description: "First general rank" },
  { id: "s41", name: "General 2", tier: 41, imageUrl: "https://files.catbox.moe/ehamvu.jpeg", expRequired: 20952802, bonus: "AK-47-K-Yellow Fractal perm", description: "Second general rank" },
  { id: "s42", name: "General 3", tier: 42, imageUrl: "https://files.catbox.moe/136e14.jpeg", expRequired: 21997612, bonus: "", description: "Third general rank" },
  { id: "s43", name: "General 4", tier: 43, imageUrl: "https://files.catbox.moe/3xzm6i.jpeg", expRequired: 23080612, bonus: "AWM-Infernal Dragon 30 days", description: "Fourth general rank" },
  { id: "s44", name: "General 5", tier: 44, imageUrl: "https://files.catbox.moe/q4itad.jpeg", expRequired: 24202372, bonus: "", description: "Fifth general rank" },
  { id: "s45", name: "General 6", tier: 45, imageUrl: "https://files.catbox.moe/ibwcla.jpeg", expRequired: 25363462, bonus: "AK-47 Fury 30 days", description: "Sixth general rank" },
  { id: "s46", name: "Marshall", tier: 46, imageUrl: "https://files.catbox.moe/ibwcla.jpeg", expRequired: 26564452, bonus: "", description: "Marshall rank" },
  { id: "s47", name: "Grand Marshall", tier: 47, imageUrl: "https://files.catbox.moe/eu1zph.jpeg", expRequired: 100000000, bonus: "30 Free Crate Tickets", description: "Highest rank achievable" },
];

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

  const { data: ranksFromSupabase = [], isLoading } = useQuery<Rank[]>({
    queryKey: ["/api/ranks"],
    queryFn: getRanks,
    staleTime: 1000 * 60 * 5,
  });

  // Use static data as fallback when Supabase has no ranks
  const ranks = ranksFromSupabase.length > 0 ? ranksFromSupabase : STATIC_RANKS;

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
