import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Search, Image as ImageIcon, Loader2, Filter, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/components/LanguageProvider";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  { id: "official-elimination", name: "Elimination", type: "PvP", category: "competitive", description: "Players respawn each round with fixed loadouts, emphasizing consistency and economy-free fights.", objective: "Win by out-scoring the opposing team across rounds." },
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
  { key: "free for all", file: "ffa_farm.jpg.jpeg", label: "Free For All" },
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

export default function Modes() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ModeCategoryTab>("competitive");
  const [selectedModeId, setSelectedModeId] = useState<string>("");

  const { data: modes = [], isLoading } = useQuery<Mode[]>({
    queryKey: ["/api/modes"],
    queryFn: async () => {
      const data = await apiRequest("/api/modes", "GET");
      return data || [];
    },
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

  const tabModes = useMemo(
    () => filteredModes.filter((m) => m.category === activeTab),
    [filteredModes, activeTab]
  );

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
        const extract = String(page?.extract || "").trim();
        const thumbnail = String(page?.thumbnail?.source || "").trim();
        return {
          extract,
          thumbnail,
          sourceUrl: `https://crossfirefps.fandom.com/wiki/${encodeURIComponent(title.replace(/\s+/g, "_"))}`,
        };
      };

      try {
        const primary = await fetchDetails(selectedMode.name);
        if (primary.extract.length > 20) return primary;
        const fallback = await fetchDetails(`${selectedMode.name} Mode`);
        return fallback.extract.length > 20 ? fallback : primary;
      } catch {
        return null;
      }
    },
  });

  const breadcrumbs = [{ name: "Game Modes", url: "/modes" }];

  return (
    <>
      <SEOHead
        title="CrossFire Game Modes - Complete Guide | Crossfire Wiki"
        description="Explore all CrossFire game modes including Zombie Mode, Ghost Mode, and more. Complete guide with images and descriptions."
        keywords={["crossfire modes", "zombie mode", "ghost mode", "cf game modes", "game modes guide"]}
        canonicalUrl="/modes"
        schemaType="CollectionPage"
        schemaData={{
          name: "CrossFire Game Modes",
          description: "Complete collection of CrossFire game modes with detailed classification",
        }}
      />

      <div className="min-h-screen bg-background py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <Breadcrumbs items={breadcrumbs} />

          <div className="mb-6 md:mb-8 rounded-2xl border bg-card overflow-hidden">
            <div className="bg-muted/50 px-4 md:px-6 py-5 border-b">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-center uppercase">/ {t("gameModes") || "Modes"} /</h1>
            </div>

            <div className="p-4 md:p-6">
              <div className="mb-4">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search mode name, type, label..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                <Button size="sm" variant={activeTab === "competitive" ? "default" : "outline"} onClick={() => setActiveTab("competitive")}>Competitive Modes</Button>
                <Button size="sm" variant={activeTab === "cooperative" ? "default" : "outline"} onClick={() => setActiveTab("cooperative")}>Cooperative Modes</Button>
                <Button size="sm" variant={activeTab === "event" ? "default" : "outline"} onClick={() => setActiveTab("event")}>Event Modes</Button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : !tabModes.length ? (
                <div className="text-sm text-muted-foreground py-10">No modes found for this category/search.</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-6">
                  <aside className="border rounded-xl bg-background/60 p-2 max-h-[70vh] overflow-auto">
                    {tabModes.map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setSelectedModeId(mode.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors ${selectedMode?.id === mode.id ? "bg-foreground text-background font-semibold" : "hover:bg-muted"}`}
                      >
                        {mode.name}
                      </button>
                    ))}
                  </aside>

                  {selectedMode && (
                    <section className="space-y-4">
                      <div className="rounded-xl border p-4 md:p-6 bg-card">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                          <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tight">{selectedMode.name}</h2>
                          <Badge variant="secondary">{selectedMode.type || selectedMode.label}</Badge>
                        </div>
                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                          {fandomDetail?.extract || selectedMode.description || "Detailed gameplay description is being prepared. You can still browse maps and source links below."}
                        </p>
                        {isFandomLoading && (
                          <p className="text-xs text-muted-foreground mt-2">Loading extra mode details from CrossFire Fandom…</p>
                        )}
                        {fandomDetail?.thumbnail && (
                          <div className="mt-3 rounded-lg overflow-hidden border bg-muted/20">
                            <img
                              src={fandomDetail.thumbnail}
                              alt={`${selectedMode.name} details`}
                              className="w-full max-h-[260px] object-cover"
                            />
                          </div>
                        )}
                        <div className="mt-3 p-3 rounded-lg border bg-muted/40 text-sm">
                          <div className="font-semibold mb-1">Win Conditions</div>
                          <div>{officialModesCatalog.find((m) => normalizeModeName(m.name) === normalizeModeName(selectedMode.name))?.objective || "Play objective rules for this mode and complete the category goal (kills, mission objective, or survival)."}</div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedMode.sourceLinks.map((link) => (
                            <a key={link} href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs underline underline-offset-2">
                              Source <ExternalLink className="h-3 w-3" />
                            </a>
                          ))}
                          {fandomDetail?.sourceUrl && (
                            <a href={fandomDetail.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs underline underline-offset-2">
                              Fandom Details <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedMode.maps.map((img, idx) => (
                          <div key={`${selectedMode.id}-${idx}`} className="rounded-lg border overflow-hidden bg-muted/20">
                            <img src={img} alt={`${selectedMode.name} map ${idx + 1}`} className="w-full h-40 object-cover" onError={(e) => { if (defaultModeImage) (e.currentTarget as HTMLImageElement).src = defaultModeImage; }} />
                            <div className="text-xs text-center py-2 text-muted-foreground">Map Preview {idx + 1}</div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}

              <div className="mt-6 text-sm text-muted-foreground">Showing {filteredModes.length} of {normalizedModes.length} modes.</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
