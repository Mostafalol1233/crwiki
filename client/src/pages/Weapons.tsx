import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Image as ImageIcon, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Weapon {
  id: string;
  name: string;
  image: string;
  imageUrl?: string;
  backgroundUrl?: string;
  category?: string;
  description?: string;
  stats?: Record<string, any>;
  highlightedName?: string;
}

const normalizeWeapon = (weapon: Partial<Weapon> & Record<string, any>): Weapon => ({
  id: String(weapon.id || weapon._id || weapon.name || ""),
  name: String(weapon.name || "Unknown weapon"),
  image: String(weapon.image || weapon.imageUrl || ""),
  imageUrl: String(weapon.imageUrl || weapon.image || ""),
  backgroundUrl: String(weapon.backgroundUrl || weapon.background || ""),
  category: String(weapon.category || "Uncategorized"),
  description: String(weapon.description || ""),
  stats: weapon.stats || {},
  highlightedName: weapon.highlightedName,
});

export default function Weapons() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [letter, setLetter] = useState<string>("");
  const [sort, setSort] = useState<"alpha" | "date">("alpha");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [results, setResults] = useState<Weapon[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const debounceRef = useRef<number | null>(null);

  const fetchWeapons = async (opts?: { reset?: boolean; pageOverride?: number }) => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      const params = new URLSearchParams();
      const effectivePage = typeof opts?.pageOverride === "number" ? opts.pageOverride : page;
      params.set("page", String(effectivePage));
      params.set("pageSize", String(pageSize));
      if (searchQuery) params.set("q", searchQuery);
      if (letter) params.set("letter", letter);
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      params.set("sort", sort);
      params.set("order", order);
      const res = await fetch(`/api/weapons/search?${params.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const data: { items: Weapon[]; total: number; page: number; pageSize: number } = await res.json();
      const normalizedItems = (data.items || []).map(normalizeWeapon);
      setTotal(data.total || 0);
      if (opts?.reset) {
        setResults(normalizedItems);
      } else {
        setResults((prev) => [...prev, ...normalizedItems]);
      }
    } catch (e: any) {
      setIsError(true);
      setError(new Error(e?.message || "Failed to load weapons"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setPage(1);
      fetchWeapons({ reset: true, pageOverride: 1 });
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, letter, sort, order]);

  useEffect(() => {
    fetchWeapons({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    results.forEach((weapon) => {
      if (weapon.category) cats.add(weapon.category);
    });
    return ["all", ...Array.from(cats).sort()];
  }, [results]);

  const filteredWeapons = useMemo(() => {
    return results;
  }, [results]);

  const sortedWeapons = useMemo(() => {
    if (sort === "date") {
      return [...filteredWeapons].sort((a: any, b: any) => {
        const av = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bv = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return order === "desc" ? bv - av : av - bv;
      });
    }
    return [...filteredWeapons].sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return order === "desc" ? -cmp : cmp;
    });
  }, [filteredWeapons, sort, order]);

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

          <div className="mb-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search weapons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {isLoading && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((ch) => (
                <Badge
                  key={ch}
                  variant={letter === ch ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    setLetter(letter === ch ? "" : ch);
                  }}
                >
                  {ch}
                </Badge>
              ))}
            </div>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
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
            <div className="flex gap-2 items-center">
              <Badge
                variant={sort === "alpha" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSort("alpha")}
              >
                Name
              </Badge>
              <Badge
                variant={sort === "date" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSort("date")}
              >
                Date
              </Badge>
              <Badge
                variant={"outline"}
                className="cursor-pointer"
                onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
              >
                {order === "asc" ? "Asc" : "Desc"}
              </Badge>
            </div>
          </div>

          {/* Weapons Grid */}
          {isLoading && results.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <Card>
              <CardContent className="py-12 text-center space-y-3">
                <p className="text-muted-foreground">
                  {(error as Error)?.message || "Failed to load weapons."}
                </p>
                <Badge variant="outline" className="cursor-pointer" onClick={() => fetchWeapons({ reset: true, pageOverride: 1 })}>Retry</Badge>
              </CardContent>
            </Card>
          ) : sortedWeapons.length === 0 ? (
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
              {sortedWeapons.map((weapon) => (
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
                            width={600}
                            height={600}
                            loading="lazy"
                            decoding="async"
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
                      {weapon.highlightedName ? (
                        <span dangerouslySetInnerHTML={{ __html: weapon.highlightedName }} />
                      ) : (
                        weapon.name
                      )}
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
                                .map(([key, value]) => (
                                  <div
                                    key={key}
                                    className="flex justify-between text-xs"
                                  >
                                    <span className="text-muted-foreground capitalize">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}:
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
                      <DialogTitle className="text-2xl">
                        {weapon.highlightedName ? (
                          <span dangerouslySetInnerHTML={{ __html: weapon.highlightedName }} />
                        ) : (
                          weapon.name
                        )}
                      </DialogTitle>
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
                              loading="lazy"
                              decoding="async"
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
                          <h3 className="text-lg font-semibold mb-4">Weapon Stats</h3>
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(weapon.stats).map(([key, value]) => (
                              <div
                                key={key}
                                className="p-3 bg-muted rounded-lg"
                              >
                                <p className="text-xs text-muted-foreground uppercase mb-1 font-semibold">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </p>
                                <p className="text-lg font-bold text-foreground">
                                  {String(value)}
                                </p>
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

          {results.length < total && (
            <div className="flex items-center justify-center mt-8">
              <Button
                variant="outline"
                onClick={async () => {
                  const next = page + 1;
                  setPage(next);
                  await fetchWeapons({ pageOverride: next });
                }}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}

          {filteredWeapons.length > 0 && (
            <div className="mt-8 text-center text-sm text-muted-foreground">
              Showing {filteredWeapons.length} of {total} weapons
            </div>
          )}
        </div>
      </div>
    </>
  );
}
