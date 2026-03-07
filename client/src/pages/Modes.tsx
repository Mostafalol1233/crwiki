import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Search, Image as ImageIcon, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/components/LanguageProvider";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/Breadcrumbs";

interface Mode {
  id: string;
  name: string;
  image: string;
  description?: string;
  type?: string;
}

const modeImageFallbackByKeyword: Array<{ key: string; url: string }> = [
  { key: "zombie", url: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/ZM1_MetalRage_01.jpg.jpeg" },
  { key: "bio", url: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/ZM1_EvilDen_01.jpg.jpeg" },
  { key: "mutation", url: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/ZM4_ForbiddenZone_01.jpg.jpeg" },
  { key: "search", url: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/SIN_Laboratory_05.jpg.jpeg" },
  { key: "sniper", url: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_Stadium_05.jpg.jpeg" },
  { key: "team", url: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_Train_05.jpg.jpeg" },
  { key: "tdm", url: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_Train_05.jpg.jpeg" },
  { key: "ghost", url: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_Halloween_05.jpg.jpeg" },
  { key: "escape", url: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/EM_Christmas_03.jpg.jpeg" },
  { key: "ai", url: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/AIM_AimMaster_01.jpg.jpeg" },
  { key: "aim", url: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/AIM_AimMaster_01.jpg.jpeg" },
];

function resolveModeImage(mode: Mode) {
  const input = String(mode.image || "").trim();
  if (/^https?:\/\//i.test(input)) return input;
  if (input.startsWith('/attached_assets/modes/')) {
    return `https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full${input}`;
  }

  const haystack = `${mode.name || ""} ${mode.type || ""} ${mode.description || ""}`.toLowerCase();
  const match = modeImageFallbackByKeyword.find((m) => haystack.includes(m.key));
  return match?.url || "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_Train_05.jpg.jpeg";
}

export default function Modes() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: modes = [], isLoading } = useQuery<Mode[]>({
    queryKey: ["/api/modes"],
    queryFn: async () => {
      const data = await apiRequest("/api/modes", "GET");
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const filteredModes = useMemo(() => {
    return modes.filter((mode) => {
      const matchesSearch =
        mode.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mode.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mode.type?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [modes, searchQuery]);

  const breadcrumbs = [
    { name: "Game Modes", url: "/modes" },
  ];

  return (
    <>
      <SEOHead
        title="CrossFire Game Modes - Complete Guide | Crossfire Wiki"
        description="Explore all CrossFire game modes with detailed descriptions and images. Learn about different gameplay modes available in CrossFire."
        keywords={["crossfire modes", "cf game modes", "game modes guide", "crossfire gameplay"]}
        canonicalUrl="/modes"
        schemaType="CollectionPage"
        schemaData={{
          name: "CrossFire Game Modes",
          description: "Complete collection of CrossFire game modes",
        }}
      />
      <div className="min-h-screen bg-background py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <Breadcrumbs items={breadcrumbs} />
          
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t("gameModes") || "Game Modes"}
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover all available game modes in CrossFire
            </p>
          </div>

          {/* Search */}
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search game modes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Modes Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredModes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "No game modes found matching your search."
                    : "No game modes available."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredModes.map((mode) => (
                <Card
                  key={mode.id}
                  className="h-full hover-elevate transition-all"
                >
                  <div className="relative aspect-video overflow-hidden rounded-t-lg bg-muted/30">
                    {mode.image ? (
                      <img
                        src={resolveModeImage(mode)}
                        alt={mode.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_Train_05.jpg.jpeg"; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    {mode.type && (
                      <Badge
                        variant="secondary"
                        className="absolute top-2 right-2"
                      >
                        {mode.type}
                      </Badge>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl">{mode.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {mode.description && (
                      <p className="text-sm text-muted-foreground">
                        {mode.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredModes.length > 0 && (
            <div className="mt-8 text-center text-sm text-muted-foreground">
              Showing {filteredModes.length} of {modes.length} game modes
            </div>
          )}
        </div>
      </div>
    </>
  );
}

