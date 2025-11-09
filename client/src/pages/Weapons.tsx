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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Weapon {
  id: string;
  name: string;
  image: string;
  category?: string;
  description?: string;
  stats?: Record<string, any>;
}

export default function Weapons() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: weapons = [], isLoading } = useQuery<Weapon[]>({
    queryKey: ["/api/weapons"],
    queryFn: async () => {
      const data = await apiRequest("/api/weapons", "GET");
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const categories = useMemo(() => {
    const cats = new Set<string>();
    weapons.forEach((weapon) => {
      if (weapon.category) {
        cats.add(weapon.category);
      }
    });
    return Array.from(cats).sort();
  }, [weapons]);

  const filteredWeapons = useMemo(() => {
    return weapons.filter((weapon) => {
      const matchesSearch =
        weapon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        weapon.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || weapon.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [weapons, searchQuery, selectedCategory]);

  const breadcrumbs = [
    { name: "Weapons", url: "/weapons" },
  ];

  return (
    <>
      <SEOHead
        title="CrossFire Weapons - Complete Weapon Guide | Crossfire Wiki"
        description="Explore all CrossFire weapons with detailed stats, images, and descriptions. Find the best weapons for your gameplay style."
        keywords={["crossfire weapons", "cf weapons", "weapon guide", "weapon stats"]}
        canonicalUrl="/weapons"
        schemaType="CollectionPage"
        schemaData={{
          name: "CrossFire Weapons",
          description: "Complete collection of CrossFire weapons",
        }}
      />
      <div className="min-h-screen bg-background py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <Breadcrumbs items={breadcrumbs} />
          
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t("weapons") || "Weapons"}
            </h1>
            <p className="text-lg text-muted-foreground">
              Explore all available weapons in CrossFire with detailed information
            </p>
          </div>

          {/* Search and Filter */}
          <div className="mb-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search weapons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory("all")}
                >
                  All
                </Badge>
                {categories.map((cat) => (
                  <Badge
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Weapons Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredWeapons.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "No weapons found matching your search."
                    : "No weapons available."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredWeapons.map((weapon) => (
                <Dialog key={weapon.id}>
                  <DialogTrigger asChild>
                    <Card
                      className="h-full hover-elevate transition-all cursor-pointer"
                    >
                      <div
                        className="relative aspect-square overflow-hidden rounded-t-lg bg-cover bg-center"
                        style={{
                          backgroundImage: `url('/assets/cfw-weaponbg-vip.png')`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        {weapon.image ? (
                          <img
                            src={weapon.image}
                            alt={weapon.name}
                            className="w-full h-full object-contain p-4 transform transition-transform duration-300 hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        {weapon.category && (
                          <Badge
                            variant="secondary"
                            className="absolute top-2 right-2"
                          >
                            {weapon.category}
                          </Badge>
                        )}
                      </div>
                      <CardHeader>
                        <CardTitle className="text-lg line-clamp-2">
                          {weapon.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {weapon.description && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {weapon.description}
                          </p>
                        )}
                        {weapon.stats && Object.keys(weapon.stats).length > 0 && (
                          <div className="space-y-1 pt-2 border-t">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">
                              Stats
                            </p>
                            <div className="space-y-1">
                              {Object.entries(weapon.stats)
                                .slice(0, 3)
                                .map(([key, value]) => (
                                  <div
                                    key={key}
                                    className="flex justify-between text-xs"
                                  >
                                    <span className="text-muted-foreground">
                                      {key}:
                                    </span>
                                    <span className="font-medium">{String(value)}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">{weapon.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="flex justify-center">
                        <div
                          className="relative w-64 h-64 overflow-hidden rounded-lg bg-cover bg-center"
                          style={{
                            backgroundImage: `url('/assets/cfw-weaponbg-vip.png')`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        >
                          {weapon.image ? (
                            <img
                              src={weapon.image}
                              alt={weapon.name}
                              className="w-full h-full object-contain p-4"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-16 w-16 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </div>

                      {weapon.category && (
                        <div className="text-center">
                          <Badge variant="secondary" className="text-sm">
                            {weapon.category}
                          </Badge>
                        </div>
                      )}

                      {weapon.description && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Description</h3>
                          <p className="text-muted-foreground">{weapon.description}</p>
                        </div>
                      )}

                      {weapon.stats && Object.keys(weapon.stats).length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3">Weapon Stats</h3>
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(weapon.stats).map(([key, value]) => (
                              <div
                                key={key}
                                className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                              >
                                <span className="font-medium capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                                </span>
                                <span className="text-lg font-bold">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}

          {filteredWeapons.length > 0 && (
            <div className="mt-8 text-center text-sm text-muted-foreground">
              Showing {filteredWeapons.length} of {weapons.length} weapons
            </div>
          )}
        </div>
      </div>
    </>
  );
}

