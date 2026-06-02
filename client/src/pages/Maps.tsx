import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Search, Map as MapIcon, Loader2, Filter } from "lucide-react";
import { getMaps } from "@/lib/supabaseApi";
import { useLanguage } from "@/components/LanguageProvider";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GameMap {
  id: string;
  name: string;
  image: string;
  imageUrl?: string;
  description?: string;
  mode?: string;
  category?: string;
}

export default function Maps() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: maps = [], isLoading } = useQuery<GameMap[]>({
    queryKey: ["/api/maps"],
    queryFn: getMaps,
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
        map.mode?.toLowerCase().includes(searchQuery.toLowerCase());
      
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
        description="Browse all CrossFire maps with detailed images and descriptions. Find your favorite maps from various game modes."
        keywords={["crossfire maps", "cf maps", "crossfire maps guide", "fps maps"]}
        canonicalUrl="/maps"
        schemaType="CollectionPage"
        schemaData={{
          name: "CrossFire Maps",
          description: "Complete collection of CrossFire game maps",
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
                <Card
                  key={map.id}
                  className="group h-full overflow-hidden border-border/50 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300"
                >
                  <div className="relative aspect-video overflow-hidden bg-muted/20">
                    {map.image ? (
                      <img
                        src={map.image}
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
                      <span className="text-white text-xs font-medium uppercase tracking-wider">
                        View Map Details
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
                    {map.mode && (
                      <Badge
                        variant="outline"
                        className="absolute top-3 right-3 bg-background/80 shadow-sm backdrop-blur-sm"
                      >
                        {map.mode}
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
                      <p className="text-muted-foreground leading-relaxed line-clamp-3">
                        {map.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
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
