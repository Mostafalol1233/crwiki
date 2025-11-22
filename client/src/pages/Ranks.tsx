import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Search, Image as ImageIcon, Loader2, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/components/LanguageProvider";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/Breadcrumbs";

interface Rank {
  id: string;
  name: string;
  image: string;
  description?: string;
  requirements?: string;
}

export default function Ranks() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: ranks = [], isLoading } = useQuery<Rank[]>({
    queryKey: ["/api/ranks"],
    queryFn: async () => {
      const data = await apiRequest("/api/ranks", "GET");
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const filteredRanks = useMemo(() => {
    return ranks.filter((rank) => {
      const matchesSearch =
        rank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rank.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rank.requirements?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [ranks, searchQuery]);

  const breadcrumbs = [
    { name: "Ranks", url: "/ranks" },
  ];

  return (
    <>
      <SEOHead
        title="CrossFire Ranks System - Complete Rank Guide | Crossfire Wiki"
        description="Explore all CrossFire ranks with images and requirements. Learn about the ranking system and progression in CrossFire."
        keywords={["crossfire ranks", "cf ranks", "rank system", "crossfire progression"]}
        canonicalUrl="/ranks"
        schemaType="CollectionPage"
        schemaData={{
          name: "CrossFire Ranks",
          description: "Complete collection of CrossFire ranks",
        }}
      />
      <div className="min-h-screen bg-background py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <Breadcrumbs items={breadcrumbs} />
          
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-10 w-10 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold">
                {t("ranks") || "Ranks"}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Discover all available ranks in CrossFire and their requirements
            </p>
          </div>

          {/* Search */}
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ranks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Ranks Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRanks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "No ranks found matching your search."
                    : "No ranks available."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredRanks.map((rank) => (
                <Card
                  key={rank.id}
                  className="h-full hover-elevate transition-all"
                >
                  <div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted/30">
                    {rank.image ? (
                      <img
                        src={rank.image}
                        alt={rank.name}
                        className="w-full h-full object-contain p-4"
                        width="256"
                        height="256"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Shield className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg text-center">
                      {rank.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {rank.description && (
                      <p className="text-sm text-muted-foreground text-center">
                        {rank.description}
                      </p>
                    )}
                    {rank.requirements && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                          Requirements
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {rank.requirements}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredRanks.length > 0 && (
            <div className="mt-8 text-center text-sm text-muted-foreground">
              Showing {filteredRanks.length} of {ranks.length} ranks
            </div>
          )}
        </div>
      </div>
    </>
  );
}

