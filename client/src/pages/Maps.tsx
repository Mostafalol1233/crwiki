import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Search, MapPin, Loader2, Filter, Grid3X3, List } from "lucide-react";
import { getMaps } from "@/lib/supabaseApi";
import { useLanguage } from "@/components/LanguageProvider";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/Breadcrumbs";

interface GameMap {
  id: string;
  name: string;
  image: string;
  imageUrl?: string;
  description?: string;
  mode?: string;
  category?: string;
}

const MODE_COLORS: Record<string, string> = {
  tdm: "#f87171",
  "team deathmatch": "#f87171",
  snd: "#fb923c",
  "search": "#fb923c",
  ghost: "#818cf8",
  zombie: "#4ade80",
  mutation: "#a78bfa",
  escape: "#fbbf24",
  sniper: "#38bdf8",
  ffa: "#f43f5e",
};

function getModeColor(mode?: string, cat?: string): string {
  const key = (mode || cat || "").toLowerCase();
  for (const [k, v] of Object.entries(MODE_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "#f5a623";
}

export default function Maps() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: maps = [], isLoading } = useQuery<GameMap[]>({
    queryKey: ["/api/maps"],
    queryFn: getMaps,
    staleTime: 1000 * 60 * 5,
  });

  const categories = useMemo(() => {
    const cats = new Set(maps.map((m) => m.category).filter(Boolean));
    return ["all", ...Array.from(cats)] as string[];
  }, [maps]);

  const filteredMaps = useMemo(() => {
    return maps.filter((map) => {
      const matchesSearch =
        map.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        map.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        map.mode?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "all" || map.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [maps, searchQuery, activeCategory]);

  const breadcrumbs = [{ name: "Maps", url: "/maps" }];

  return (
    <>
      <SEOHead
        title="CrossFire Maps — Complete Guide | Crossfire Wiki"
        description="Browse all CrossFire maps with detailed images and descriptions. Find your favorite battlefields from every game mode."
        keywords={["crossfire maps", "cf maps", "crossfire maps guide", "fps maps"]}
        canonicalUrl="/maps"
        schemaType="CollectionPage"
        schemaData={{ name: "CrossFire Maps", description: "Complete collection of CrossFire game maps" }}
      />

      <div className="min-h-screen py-10 md:py-14" style={{ background: "var(--background)" }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <Breadcrumbs items={breadcrumbs} />

          {/* ── Header ── */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded" style={{ background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.25)" }}>
                  <MapPin className="h-6 w-6" style={{ color: "#f5a623" }} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-0.5" style={{ color: "#f5a623" }}>Battle Arenas</p>
                  <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
                    {t("maps") || "Maps"}
                  </h1>
                </div>
              </div>
              {!isLoading && (
                <p className="text-sm ml-1" style={{ color: "#666" }}>
                  {filteredMaps.length} {filteredMaps.length === maps.length ? `of ${maps.length}` : `/ ${maps.length}`} maps
                </p>
              )}
            </div>

            {/* View mode toggle */}
            <div className="flex items-center gap-1 p-1 rounded" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <button
                onClick={() => setViewMode("grid")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all"
                style={{
                  background: viewMode === "grid" ? "#f5a623" : "transparent",
                  color: viewMode === "grid" ? "#000" : "#555",
                }}
              >
                <Grid3X3 className="h-3 w-3" /> Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all"
                style={{
                  background: viewMode === "list" ? "#f5a623" : "transparent",
                  color: viewMode === "list" ? "#000" : "#555",
                }}
              >
                <List className="h-3 w-3" /> List
              </button>
            </div>
          </div>

          {/* ── Search + Category filter ── */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#555" }} />
              <Input
                placeholder="Search maps by name, mode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
            </div>

            {categories.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <Filter className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#444" }} />
                {categories.map((cat) => {
                  const count = cat === "all" ? maps.length : maps.filter((m) => m.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded transition-all"
                      style={{
                        background: activeCategory === cat ? "#f5a623" : "var(--card)",
                        color: activeCategory === cat ? "#000" : "#555",
                        border: `1px solid ${activeCategory === cat ? "#f5a623" : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      {cat === "all" ? "All" : cat}
                      <span
                        className="text-[8px] px-1 py-0.5 rounded-sm"
                        style={{ background: activeCategory === cat ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.05)", color: activeCategory === cat ? "#000" : "#444" }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Content ── */}
          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#f5a623" }} />
            </div>
          ) : filteredMaps.length === 0 ? (
            <div className="py-20 text-center" style={{ border: "1px dashed rgba(255,255,255,0.06)", borderRadius: "4px" }}>
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-20" style={{ color: "#f5a623" }} />
              <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: "#444" }}>No maps found</p>
              <button
                onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}
                className="text-[11px] font-bold uppercase tracking-wider mt-1 transition-colors hover:text-[#f5a623]"
                style={{ color: "#555" }}
              >
                Clear filters
              </button>
            </div>
          ) : viewMode === "grid" ? (
            /* ── Grid view ── */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredMaps.map((map) => {
                const accent = getModeColor(map.mode, map.category);
                return (
                  <div
                    key={map.id}
                    className="group overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      background: "var(--card)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "3px",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
                    }}
                  >
                    {/* Image */}
                    <div className="relative overflow-hidden aspect-video" style={{ background: "hsl(var(--muted))" }}>
                      {map.image || map.imageUrl ? (
                        <img
                          src={map.image || map.imageUrl}
                          alt={map.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <MapPin className="h-10 w-10 opacity-15" style={{ color: "#f5a623" }} />
                        </div>
                      )}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }}
                      />
                      <div
                        className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: `linear-gradient(to right, ${accent}, transparent)` }}
                      />
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {map.category && (
                          <span
                            className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5"
                            style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}40`, borderRadius: "2px", backdropFilter: "blur(4px)" }}
                          >
                            {map.category}
                          </span>
                        )}
                      </div>
                      {map.mode && (
                        <span
                          className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5"
                          style={{ background: "rgba(0,0,0,0.6)", color: "#888", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "2px", backdropFilter: "blur(4px)" }}
                        >
                          {map.mode}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="px-3 py-3">
                      <h3
                        className="font-black text-sm uppercase tracking-tight leading-tight line-clamp-1 mb-1 transition-colors"
                        style={{ color: "var(--foreground)" }}
                      >
                        {map.name}
                      </h3>
                      {map.description && (
                        <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: "#555" }}>
                          {map.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── List view ── */
            <div className="space-y-1.5">
              {filteredMaps.map((map) => {
                const accent = getModeColor(map.mode, map.category);
                return (
                  <div
                    key={map.id}
                    className="group flex items-center gap-3 p-3 transition-all duration-200 hover:-translate-x-0.5"
                    style={{
                      background: "var(--card)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "3px",
                      borderLeft: `3px solid transparent`,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderLeftColor = accent; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderLeftColor = "transparent"; }}
                  >
                    <div className="w-20 h-12 flex-shrink-0 overflow-hidden rounded" style={{ background: "hsl(var(--muted))" }}>
                      {map.image || map.imageUrl ? (
                        <img
                          src={map.image || map.imageUrl}
                          alt={map.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <MapPin className="h-5 w-5 opacity-20" style={{ color: accent }} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-sm uppercase tracking-tight truncate mb-0.5 transition-colors group-hover:text-[#f5a623]" style={{ color: "var(--foreground)" }}>
                        {map.name}
                      </h3>
                      {map.description && (
                        <p className="text-[11px] truncate" style={{ color: "#555" }}>{map.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {map.category && (
                        <span
                          className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5"
                          style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}30`, borderRadius: "2px" }}
                        >
                          {map.category}
                        </span>
                      )}
                      {map.mode && (
                        <span className="text-[9px] font-bold" style={{ color: "#444" }}>{map.mode}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Footer count ── */}
          {filteredMaps.length > 0 && (
            <div className="mt-10 text-center">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] px-5 py-2 rounded" style={{ color: "#444", background: "var(--card)", border: "1px solid rgba(255,255,255,0.05)" }}>
                Showing {filteredMaps.length} of {maps.length} maps
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
