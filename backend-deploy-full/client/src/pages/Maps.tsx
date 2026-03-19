import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Search, Map as MapIcon, Loader2, Filter, Info, Calendar, User, Layout, Crosshair } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/components/LanguageProvider";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface GameMap {
  id: string;
  _id?: string;
  name: string;
  image?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  minimapUrl?: string;
  description?: string;
  lore?: string;
  releaseDate?: string;
  designer?: string;
  mode?: string;
  category?: string;
  supportedModes?: string[];
  modeDetails?: Record<string, any>;
}

export default function Maps() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedMap, setSelectedMap] = useState<GameMap | null>(null);

  const { data: maps = [], isLoading } = useQuery<GameMap[]>({
    queryKey: ["/api/maps"],
    queryFn: async () => {
      const data = await apiRequest("/api/maps", "GET");
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const categories = useMemo(() => {
    const cats = new Set(maps.map(m => m.category).filter(Boolean));
    return ["all", ...Array.from(cats)];
  }, [maps]);

  const filteredMaps = useMemo(() => {
    return maps.filter((map) => {
      const matchesSearch =
        map.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        map.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        map.mode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        map.supportedModes?.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = activeCategory === "all" || map.category === activeCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [maps, searchQuery, activeCategory]);

  const breadcrumbs = [
    { name: "Maps", url: "/maps" },
  ];

  return (
    <>
      <SEOHead
        title="CrossFire Maps - Complete Guide | Crossfire Wiki"
        description="Browse all CrossFire maps with detailed images, lore, and minimaps. Find your favorite maps from various game modes like Search & Destroy and Team Deathmatch."
        keywords={["crossfire maps", "cf maps", "crossfire maps guide", "fps maps", "black widow map", "ship map"]}
        canonicalUrl="/maps"
        schemaType="CollectionPage"
        schemaData={{
          name: "CrossFire Maps",
          description: "Complete collection of CrossFire game maps with exhaustive details",
        }}
      />
      <div className="min-h-screen bg-background py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <Breadcrumbs items={breadcrumbs} />
          
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              {t("maps") || "Maps"}
            </h1>
            <p className="text-lg text-muted-foreground">
              Explore all locations and battlefields in CrossFire
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8 items-start md:items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search maps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-auto">
                <TabsList className="bg-muted/50 border border-border/50">
                  {categories.map(cat => (
                    <TabsTrigger key={cat} value={cat || ""} className="capitalize px-4 py-1.5 text-sm">
                      {cat === "all" ? "All Maps" : cat}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Loading maps...</p>
              </div>
            </div>
          ) : filteredMaps.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-24 text-center">
                <MapIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-xl font-medium text-muted-foreground">
                  {searchQuery
                    ? "No maps found matching your search."
                    : "No maps available in this category."}
                </p>
                <button 
                  onClick={() => {setSearchQuery(""); setActiveCategory("all");}}
                  className="mt-4 text-primary hover:underline text-sm font-medium"
                >
                  Clear all filters
                </button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredMaps.map((map) => (
                <Dialog key={map.id || map._id} onOpenChange={(open) => open && setSelectedMap(map)}>
                  <DialogTrigger asChild>
                    <Card
                      className="group h-full overflow-hidden border-border/50 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
                    >
                      <div className="relative aspect-video overflow-hidden bg-muted/20">
                        {(map.imageUrl || map.image) ? (
                          <img
                            src={map.imageUrl || map.image}
                            alt={map.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MapIcon className="h-12 w-12 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                          <span className="text-white text-xs font-medium uppercase tracking-wider flex items-center gap-2">
                            <Info className="h-4 w-4" /> View Map Details
                          </span>
                        </div>
                        {map.category && (
                          <Badge
                            variant="default"
                            className="absolute top-3 left-3 bg-primary/90 hover:bg-primary shadow-lg backdrop-blur-sm border-none"
                          >
                            {map.category}
                          </Badge>
                        )}
                        {(map.mode || map.supportedModes?.[0]) && (
                          <Badge
                            variant="outline"
                            className="absolute top-3 right-3 bg-background/80 shadow-sm backdrop-blur-sm"
                          >
                            {map.mode || map.supportedModes?.[0]}
                          </Badge>
                        )}
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors">
                          {map.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {map.description && (
                          <p className="text-muted-foreground leading-relaxed line-clamp-3 text-sm">
                            {map.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-3xl font-bold flex items-center gap-3">
                        {map.name}
                        {map.category && <Badge>{map.category}</Badge>}
                      </DialogTitle>
                      <DialogDescription className="text-lg">
                        Detailed information and gameplay data
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                      <div className="space-y-6">
                        <div className="rounded-xl overflow-hidden border">
                          <img 
                            src={map.imageUrl || map.image} 
                            alt={map.name} 
                            className="w-full aspect-video object-cover"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-muted/30 rounded-lg flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold">Release Date</p>
                              <p className="text-sm font-medium">{map.releaseDate || "Unknown"}</p>
                            </div>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-lg flex items-center gap-3">
                            <User className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold">Designer</p>
                              <p className="text-sm font-medium">{map.designer || "Z8Games"}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-bold flex items-center gap-2">
                            <Crosshair className="h-4 w-4 text-primary" /> Supported Modes
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {(map.supportedModes || (map.mode ? [map.mode] : [])).map(m => (
                              <Badge key={m} variant="secondary">{m}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {map.minimapUrl && (
                          <div className="space-y-3">
                            <h4 className="font-bold flex items-center gap-2">
                              <Layout className="h-4 w-4 text-primary" /> Minimap Layout
                            </h4>
                            <div className="bg-black/90 p-4 rounded-xl flex items-center justify-center border border-primary/20">
                              <img src={map.minimapUrl} alt="Minimap" className="max-h-64 object-contain" />
                            </div>
                          </div>
                        )}

                        <div className="space-y-3">
                          <h4 className="font-bold">Description</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {map.description}
                          </p>
                        </div>

                        {map.lore && (
                          <div className="space-y-3">
                            <h4 className="font-bold italic">Lore & Background</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed italic border-l-2 pl-4 border-primary/30">
                              {map.lore}
                            </p>
                          </div>
                        )}

                        {map.modeDetails && Object.keys(map.modeDetails).length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-bold">Mode Specifics</h4>
                            {Object.entries(map.modeDetails).map(([mode, details]: [string, any]) => (
                              <div key={mode} className="text-xs p-3 bg-primary/5 rounded border border-primary/10">
                                <p className="font-bold text-primary mb-1 uppercase">{mode}</p>
                                {details.bombSites && (
                                  <p><span className="text-muted-foreground">Bomb Sites:</span> {details.bombSites.join(", ")}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}

          {filteredMaps.length > 0 && (
            <div className="mt-12 text-center text-sm text-muted-foreground bg-muted/30 py-3 rounded-full border border-border/50 max-w-xs mx-auto">
              Showing <span className="font-bold text-foreground">{filteredMaps.length}</span> of <span className="font-bold text-foreground">{maps.length}</span> maps
            </div>
          )}
        </div>
      </div>
    </>
  );
}