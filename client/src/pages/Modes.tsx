import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Search, Image as ImageIcon, Loader2, ExternalLink, Target, Swords, Zap, Gamepad2, ChevronRight } from "lucide-react";
import { getModes } from "@/lib/supabaseApi";
import { useLanguage } from "@/components/LanguageProvider";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const bundledModeImages = import.meta.glob("@assets/modes/*", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const modeImageByFilename = Object.fromEntries(
  Object.entries(bundledModeImages).map(([path, url]) => [path.split("/").pop()?.toLowerCase() || "", url])
);

const allBundledModeImages = Object.values(modeImageByFilename);
const defaultModeImage = modeImageByFilename["tdm_train_05.jpg.jpeg"] || allBundledModeImages[0] || "";

type ModeCategoryTab = "competitive" | "cooperative" | "event";

interface Mode {
  id: string;
  name: string;
  image: string;
  description?: string;
  type?: string;
  category?: string;
}

type NormalizedMode = Mode & {
  label: string;
  imageResolved: string;
  category: ModeCategoryTab;
  maps: string[];
  sourceLinks: string[];
};

type FandomModeDetail = {
  extract: string;
  thumbnail?: string;
  sourceUrl: string;
};

type OfficialMode = {
  id: string;
  name: string;
  type: string;
  description: string;
  category: ModeCategoryTab;
  objective: string;
};

const officialModesCatalog: OfficialMode[] = [
  { id: "official-tdm", name: "Team Deathmatch", type: "PvP", category: "competitive", description: "Classic team-vs-team combat. Eliminate opponents and reach the target score before the enemy team.", objective: "First team to reach the kill limit wins." },
  { id: "official-snd", name: "Search & Destroy", type: "Objective", category: "competitive", description: "Attackers plant C4 at bomb sites while defenders stop the plant or defuse in time.", objective: "Win rounds by detonation, defuse, or eliminating the enemy team." },
  { id: "official-ghost", name: "Ghost Mode", type: "Stealth", category: "competitive", description: "Ghosts are mostly invisible and use melee attacks while soldiers use firearms and detection.", objective: "Ghosts win by planting C4 or eliminations; soldiers win by elimination or defuse." },
  { id: "official-ffa", name: "Free For All", type: "PvP", category: "competitive", description: "Every player fights independently with no teams.", objective: "Reach the highest kill count before the round ends." },
  { id: "official-elimination", name: "Elimination", type: "PvP", category: "competitive", description: "Players respawn each round with fixed loadouts, emphasizing consistency.", objective: "Win by out-scoring the opposing team across rounds." },
  { id: "official-zm", name: "Zombie Mode", type: "Co-op", category: "cooperative", description: "Co-op survival against waves of infected enemies and bosses.", objective: "Survive waves and defeat the final boss objective." },
  { id: "official-mutation", name: "Mutation Mode", type: "Asymmetrical", category: "cooperative", description: "Humans battle mutating enemies with special abilities in infection-style rounds.", objective: "Humans survive to timer end or mutants convert/eliminate all humans." },
  { id: "official-hero", name: "Hero Mode", type: "Asymmetrical", category: "cooperative", description: "One side transforms into powerful heroes while others fight to survive.", objective: "Complete side objectives through elimination and timed survival." },
  { id: "official-escape", name: "Escape Mode", type: "Objective", category: "event", description: "A team must escape through routes and checkpoints while defenders stop their advance.", objective: "Reach extraction points before defenders wipe the attacking team." },
  { id: "official-ai", name: "AI Mode", type: "PvE", category: "event", description: "Players complete scripted PvE encounters with mission objectives.", objective: "Finish mission objectives and survive scenario phases." },
];

function normalizeModeName(name: string) {
  return String(name || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
}

const modeFallbackByKeyword: Array<{ key: string; file: string; label: string }> = [
  { key: "zombie", file: "zm1_metalrage_01.jpg.jpeg", label: "Zombie Mode" },
  { key: "bio", file: "zm1_evilden_01.jpg.jpeg", label: "Zombie Mode" },
  { key: "mutation", file: "zm4_forbiddenzone_01.jpg.jpeg", label: "Mutation Mode" },
  { key: "ghost", file: "tdm_halloween_05.jpg.jpeg", label: "Ghost Mode" },
  { key: "search", file: "sin_laboratory_05.jpg.jpeg", label: "Search & Destroy" },
  { key: "destroy", file: "sin_laboratory_05.jpg.jpeg", label: "Search & Destroy" },
  { key: "sniper", file: "tdm_stadium_05.jpg.jpeg", label: "Sniper Mode" },
  { key: "team", file: "tdm_train_05.jpg.jpeg", label: "Team Deathmatch" },
  { key: "tdm", file: "tdm_train_05.jpg.jpeg", label: "Team Deathmatch" },
  { key: "escape", file: "em_christmas_03.jpg.jpeg", label: "Escape Mode" },
  { key: "ai", file: "aim_aimmaster_01.jpg.jpeg", label: "AI / PvE Mode" },
  { key: "aim", file: "aim_aimmaster_01.jpg.jpeg", label: "AI / PvE Mode" },
  { key: "ffa", file: "ffa_farm.jpg.jpeg", label: "Free For All" },
  { key: "knife", file: "km_classic_knife01.jpg.jpeg", label: "Knife Mode" },
  { key: "hero", file: "hmx_hero_x_03.jpg.jpeg", label: "Hero Mode" },
  { key: "sky", file: "sky_skyblock_01.jpg.jpeg", label: "Sky Mode" },
];

function hashString(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

function pickMapThumbs(seed: string, count = 3) {
  if (allBundledModeImages.length === 0) return [] as string[];
  const start = hashString(seed) % allBundledModeImages.length;
  const out: string[] = [];
  for (let i = 0; i < allBundledModeImages.length && out.length < count; i++) {
    const img = allBundledModeImages[(start + i) % allBundledModeImages.length];
    if (!out.includes(img)) out.push(img);
  }
  return out;
}

function classifyModeCategory(haystack: string): ModeCategoryTab {
  if (/(zombie|bio|mutation|hero|escape|ai|coop|pve)/i.test(haystack)) return "cooperative";
  if (/(event|guess|sky|void|treasure|lucid|roadmap|special)/i.test(haystack)) return "event";
  return "competitive";
}

function resolveModeMeta(mode: Mode): Pick<NormalizedMode, "label" | "imageResolved" | "category" | "maps" | "sourceLinks"> {
  const raw = String(mode.image || "").trim();
  const normalized = raw.replace(/\\/g, "/").replace(/\?.*$/, "").replace(/#.*$/, "");
  const filename = normalized.split("/").pop()?.toLowerCase() || "";
  const haystack = `${mode.name || ""} ${mode.type || ""} ${mode.description || ""}`.toLowerCase();
  const rule = modeFallbackByKeyword.find((m) => haystack.includes(m.key));
  const imageResolved = /^https?:\/\//i.test(raw)
    ? raw
    : (filename && modeImageByFilename[filename]) || (rule && modeImageByFilename[rule.file]) || defaultModeImage;
  const label = rule?.label || mode.type || "Game Mode";
  const category = classifyModeCategory(`${label} ${haystack}`);
  const maps = pickMapThumbs(`${mode.name}-${label}-${mode.id}`);
  return {
    label,
    imageResolved,
    category,
    maps,
    sourceLinks: [
      `https://crossfire.z8games.com/modes.html`,
      `https://crossfirefps.fandom.com/wiki/Special:Search?query=${encodeURIComponent(mode.name)}`,
    ],
  };
}

const CAT_META: Record<ModeCategoryTab, { label: string; icon: any; color: string; desc: string }> = {
  competitive: { label: "Competitive", icon: Swords, color: "#f87171", desc: "PvP modes — team-based or solo combat" },
  cooperative: { label: "Co-op / Survival", icon: Zap, color: "#4ade80", desc: "Team up to fight monsters and bosses" },
  event: { label: "Event", icon: Gamepad2, color: "#fbbf24", desc: "Limited-time and seasonal game modes" },
};

export default function Modes() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ModeCategoryTab>("competitive");
  const [selectedModeId, setSelectedModeId] = useState<string>("");

  const { data: modes = [], isLoading } = useQuery<Mode[]>({
    queryKey: ["/api/modes"],
    queryFn: getModes,
    staleTime: 1000 * 60 * 5,
  });

  const normalizedModes: NormalizedMode[] = useMemo(() => {
    const apiModes = Array.isArray(modes) ? modes.filter((m) => String(m?.name || "").trim().length >= 3) : [];
    const merged: Mode[] = [];
    for (const official of officialModesCatalog) {
      const match = apiModes.find((m) => {
        const left = normalizeModeName(m.name);
        const right = normalizeModeName(official.name);
        return left === right || left.includes(right) || right.includes(left);
      });
      merged.push({
        id: match?.id || official.id,
        name: official.name,
        image: String(match?.image || ""),
        description: String(match?.description || official.description),
        type: String(match?.type || official.type),
        category: official.category,
      });
    }
    for (const mode of apiModes) {
      const exists = merged.some((m) => normalizeModeName(m.name) === normalizeModeName(mode.name));
      if (!exists) merged.push(mode);
    }
    return merged.map((mode) => ({ ...mode, ...resolveModeMeta(mode) }));
  }, [modes]);

  const filteredModes = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return normalizedModes.filter((mode) => {
      const hay = `${mode.name} ${mode.description || ""} ${mode.type || ""} ${mode.label}`.toLowerCase();
      return hay.includes(q);
    });
  }, [normalizedModes, searchQuery]);

  const tabModes = useMemo(() => filteredModes.filter((m) => m.category === activeTab), [filteredModes, activeTab]);

  const selectedMode = useMemo(() => {
    if (!tabModes.length) return null;
    return tabModes.find((m) => m.id === selectedModeId) || tabModes[0];
  }, [tabModes, selectedModeId]);

  const { data: fandomDetail, isLoading: isFandomLoading } = useQuery<FandomModeDetail | null>({
    queryKey: ["fandom-mode", selectedMode?.name],
    enabled: !!selectedMode?.name,
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      if (!selectedMode?.name) return null;
      const fetchDetails = async (title: string) => {
        const apiUrl = `https://crossfirefps.fandom.com/api.php?action=query&prop=extracts|pageimages&piprop=thumbnail&pithumbsize=900&exintro=1&explaintext=1&redirects=1&titles=${encodeURIComponent(title)}&format=json&origin=*`;
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`Fandom API ${res.status}`);
        const json = await res.json();
        const pages = json?.query?.pages || {};
        const page = Object.values(pages)[0] as any;
        return {
          extract: String(page?.extract || "").trim(),
          thumbnail: String(page?.thumbnail?.source || "").trim(),
          sourceUrl: `https://crossfirefps.fandom.com/wiki/${encodeURIComponent(title.replace(/\s+/g, "_"))}`,
        };
      };
      try {
        const primary = await fetchDetails(selectedMode.name);
        if (primary.extract.length > 20) return primary;
        const fallback = await fetchDetails(`${selectedMode.name} Mode`);
        return fallback.extract.length > 20 ? fallback : primary;
      } catch { return null; }
    },
  });

  const breadcrumbs = [{ name: "Game Modes", url: "/modes" }];
  const catMeta = CAT_META[activeTab];
  const officialObj = officialModesCatalog.find((m) => selectedMode && normalizeModeName(m.name) === normalizeModeName(selectedMode.name));

  return (
    <>
      <SEOHead
        title="CrossFire Game Modes — Complete Guide | Crossfire Wiki"
        description="Explore all CrossFire game modes including Zombie Mode, Ghost Mode, and more. Complete guide with images and descriptions."
        keywords={["crossfire modes", "zombie mode", "ghost mode", "cf game modes"]}
        canonicalUrl="/modes"
        schemaType="CollectionPage"
        schemaData={{ name: "CrossFire Game Modes", description: "Complete collection of CrossFire game modes" }}
      />

      <div className="min-h-screen py-10 md:py-14" style={{ background: "var(--background)" }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <Breadcrumbs items={breadcrumbs} />

          {/* ── Header ── */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded" style={{ background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.25)" }}>
                <Target className="h-6 w-6" style={{ color: "#f5a623" }} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-0.5" style={{ color: "#f5a623" }}>Combat Mechanics</p>
                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
                  {t("gameModes") || "Game Modes"}
                </h1>
              </div>
            </div>
            <p className="text-sm mt-2" style={{ color: "#666" }}>
              {filteredModes.length} modes across 3 categories
            </p>
          </div>

          {/* ── Search ── */}
          <div className="relative max-w-md mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#555" }} />
            <Input
              placeholder="Search mode name, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>

          {/* ── Category tabs ── */}
          <div className="flex gap-2 mb-8 flex-wrap">
            {(Object.entries(CAT_META) as [ModeCategoryTab, typeof CAT_META["competitive"]][]).map(([key, meta]) => {
              const Icon = meta.icon;
              const count = filteredModes.filter((m) => m.category === key).length;
              return (
                <button
                  key={key}
                  onClick={() => { setActiveTab(key); setSelectedModeId(""); }}
                  className="flex items-center gap-2 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider rounded transition-all"
                  style={{
                    background: activeTab === key ? meta.color : "var(--card)",
                    color: activeTab === key ? "#000" : "#666",
                    border: `1px solid ${activeTab === key ? meta.color : "rgba(255,255,255,0.08)"}`,
                    boxShadow: activeTab === key ? `0 0 16px ${meta.color}40` : "none",
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {meta.label}
                  <span
                    className="ml-1 px-1.5 py-0.5 text-[8px] font-black rounded-sm"
                    style={{ background: activeTab === key ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.06)", color: activeTab === key ? "#000" : "#555" }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#f5a623" }} />
            </div>
          ) : !tabModes.length ? (
            <div className="py-20 text-center" style={{ border: "1px dashed rgba(255,255,255,0.06)", borderRadius: "4px" }}>
              <Gamepad2 className="h-12 w-12 mx-auto mb-3 opacity-20" style={{ color: "#f5a623" }} />
              <p className="text-sm font-bold uppercase tracking-widest" style={{ color: "#444" }}>No modes found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
              {/* ── Mode list sidebar ── */}
              <div className="space-y-1 lg:max-h-[70vh] lg:overflow-y-auto lg:pr-1" style={{ scrollbarWidth: "thin" }}>
                {/* Category label */}
                <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {(() => { const Icon = catMeta.icon; return <Icon className="h-3.5 w-3.5" style={{ color: catMeta.color }} />; })()}
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: catMeta.color }}>
                    {catMeta.label} • {tabModes.length} modes
                  </span>
                </div>

                {tabModes.map((mode) => {
                  const isSelected = selectedMode?.id === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setSelectedModeId(mode.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all rounded"
                      style={{
                        background: isSelected ? `${catMeta.color}15` : "transparent",
                        border: `1px solid ${isSelected ? catMeta.color + "40" : "transparent"}`,
                      }}
                    >
                      {/* Thumbnail */}
                      <div className="w-12 h-8 flex-shrink-0 overflow-hidden rounded" style={{ background: "hsl(var(--muted))" }}>
                        <img
                          src={mode.imageResolved}
                          alt={mode.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { if (defaultModeImage) (e.currentTarget as HTMLImageElement).src = defaultModeImage; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span
                          className="text-[11px] font-black uppercase tracking-tight block truncate"
                          style={{ color: isSelected ? catMeta.color : "var(--foreground)" }}
                        >
                          {mode.name}
                        </span>
                        <span className="text-[9px]" style={{ color: "#555" }}>{mode.type}</span>
                      </div>
                      {isSelected && <ChevronRight className="h-3 w-3 flex-shrink-0" style={{ color: catMeta.color }} />}
                    </button>
                  );
                })}
              </div>

              {/* ── Mode detail panel ── */}
              {selectedMode && (
                <div className="space-y-4">
                  {/* ── Hero image ── */}
                  <div
                    className="relative overflow-hidden"
                    style={{ height: "280px", background: "hsl(var(--background))", borderRadius: "4px" }}
                  >
                    <img
                      src={selectedMode.imageResolved}
                      alt={selectedMode.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { if (defaultModeImage) (e.currentTarget as HTMLImageElement).src = defaultModeImage; }}
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)" }} />
                    <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(to right, ${catMeta.color}, transparent)` }} />

                    {/* Mode info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1"
                          style={{ background: `${catMeta.color}20`, color: catMeta.color, borderRadius: "2px" }}
                        >
                          {selectedMode.type}
                        </span>
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1"
                          style={{ background: "rgba(0,0,0,0.5)", color: "#888", borderRadius: "2px" }}
                        >
                          {catMeta.label}
                        </span>
                      </div>
                      <h2 className="text-white text-3xl md:text-4xl font-black uppercase tracking-tight leading-tight">
                        {selectedMode.name}
                      </h2>
                    </div>
                  </div>

                  {/* ── Description card ── */}
                  <div className="p-5" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
                    {/* Description */}
                    <div className="mb-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: "#f5a623" }}>Description</p>
                      <p className="text-sm leading-relaxed" style={{ color: "#888" }}>
                        {fandomDetail?.extract || selectedMode.description || "Detailed gameplay description coming soon."}
                      </p>
                      {isFandomLoading && (
                        <p className="text-[10px] mt-1.5 flex items-center gap-1" style={{ color: "#555" }}>
                          <Loader2 className="h-3 w-3 animate-spin" /> Loading extra details from CrossFire Fandom…
                        </p>
                      )}
                    </div>

                    {/* Fandom thumbnail */}
                    {fandomDetail?.thumbnail && (
                      <div className="mb-4 overflow-hidden rounded" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                        <img src={fandomDetail.thumbnail} alt={`${selectedMode.name} details`} className="w-full max-h-[240px] object-cover" />
                      </div>
                    )}

                    {/* Objective */}
                    {officialObj && (
                      <div className="p-3.5 mb-4 rounded" style={{ background: `${catMeta.color}08`, border: `1px solid ${catMeta.color}20` }}>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-1.5" style={{ color: catMeta.color }}>Win Condition</p>
                        <p className="text-[12px]" style={{ color: "#888" }}>{officialObj.objective}</p>
                      </div>
                    )}

                    {/* Source links */}
                    <div className="flex flex-wrap gap-2">
                      {selectedMode.sourceLinks.map((link) => (
                        <a
                          key={link}
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-all hover:text-[#f5a623]"
                          style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#555", borderRadius: "2px" }}
                        >
                          <ExternalLink className="h-3 w-3" /> Source
                        </a>
                      ))}
                      {fandomDetail?.sourceUrl && (
                        <a
                          href={fandomDetail.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-all hover:text-[#f5a623]"
                          style={{ border: "1px solid rgba(245,166,35,0.2)", color: "#f5a623", borderRadius: "2px" }}
                        >
                          <ExternalLink className="h-3 w-3" /> Fandom Wiki
                        </a>
                      )}
                    </div>
                  </div>

                  {/* ── Map thumbnails ── */}
                  {selectedMode.maps.length > 0 && (
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: "#f5a623" }}>Map Previews</p>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedMode.maps.map((img, idx) => (
                          <div
                            key={`${selectedMode.id}-${idx}`}
                            className="overflow-hidden"
                            style={{ borderRadius: "3px", border: "1px solid rgba(255,255,255,0.06)" }}
                          >
                            <img
                              src={img}
                              alt={`${selectedMode.name} map ${idx + 1}`}
                              className="w-full h-28 object-cover"
                              onError={(e) => { if (defaultModeImage) (e.currentTarget as HTMLImageElement).src = defaultModeImage; }}
                            />
                            <div className="text-[8px] font-bold text-center py-1.5 uppercase tracking-wider" style={{ color: "#555", background: "var(--card)" }}>
                              Map {idx + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
