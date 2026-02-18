import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search as SearchIcon, FileText, Calendar, Newspaper, Trophy, Crosshair, Target, Shield, Loader2 } from "lucide-react";

// Mock debounce if not exists
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function SearchPage() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounceValue(query, 500);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (debouncedQuery) {
      params.set("q", debouncedQuery);
    } else {
      params.delete("q");
    }
    const newUrl = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
    window.history.replaceState({}, "", newUrl);
  }, [debouncedQuery]);

  // Fetch all data types
  // Note: ideally backend should have a unified search endpoint, but for now we aggregate client-side
  const { data: posts } = useQuery<any[]>({ queryKey: ["/api/posts"], enabled: !!debouncedQuery });
  const { data: news } = useQuery<any[]>({ queryKey: ["/api/news"], enabled: !!debouncedQuery });
  const { data: events } = useQuery<any[]>({ queryKey: ["/api/events"], enabled: !!debouncedQuery });
  const { data: tutorials } = useQuery<any[]>({ queryKey: ["/api/tutorials"], enabled: !!debouncedQuery });
  const { data: weapons } = useQuery<any[]>({ queryKey: ["/api/weapons"], enabled: !!debouncedQuery });
  const { data: modes } = useQuery<any[]>({ queryKey: ["/api/modes"], enabled: !!debouncedQuery });
  const { data: ranks } = useQuery<any[]>({ queryKey: ["/api/ranks"], enabled: !!debouncedQuery });

  const filterData = (data: any[] | undefined, fields: string[]) => {
    if (!data) return [];
    const lowerQ = debouncedQuery.toLowerCase();
    return data.filter(item =>
      fields.some(field => String(item[field] || "").toLowerCase().includes(lowerQ))
    );
  };

  const results = {
    posts: filterData(posts, ["title", "summary", "content"]),
    news: filterData(news, ["title", "content"]),
    events: filterData(events, ["title", "description"]),
    tutorials: filterData(tutorials, ["title", "description"]),
    weapons: filterData(weapons, ["name", "description", "category"]),
    modes: filterData(modes, ["name", "description"]),
    ranks: filterData(ranks, ["name", "description"]),
  };

  const allResults = [
    ...results.posts.map(i => ({ ...i, type: "post", url: `/posts/${i.post_slug || i.id}` })),
    ...results.news.map(i => ({ ...i, type: "news", url: `/news/${i.news_slug || i.id}` })),
    ...results.events.map(i => ({ ...i, type: "event", url: `/events/${i.event_name_slug || i.id}` })),
    ...results.tutorials.map(i => ({ ...i, type: "tutorial", url: `/tutorials/${i.tutorial_slug || i.id}` })),
    ...results.weapons.map(i => ({ ...i, type: "weapon", url: `/weapons` })), // No specific detail page yet usually
    ...results.modes.map(i => ({ ...i, type: "mode", url: `/modes` })),
    ...results.ranks.map(i => ({ ...i, type: "rank", url: `/ranks` })),
  ];

  const isLoading = !posts && !!debouncedQuery; // Simplified loading state

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "post": return <FileText className="h-4 w-4" />;
      case "news": return <Newspaper className="h-4 w-4" />;
      case "event": return <Trophy className="h-4 w-4" />;
      case "tutorial": return <Target className="h-4 w-4" />;
      case "weapon": return <Crosshair className="h-4 w-4" />;
      case "mode": return <Crosshair className="h-4 w-4" />; // Reusing crosshair or maybe Target
      case "rank": return <Shield className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Search Wiki</h1>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              className="pl-10 h-12 text-lg"
              placeholder="Search for guides, weapons, events..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {debouncedQuery && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent justify-start p-0">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">
                All ({allResults.length})
              </TabsTrigger>
              <TabsTrigger value="wiki" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">
                Wiki ({results.weapons.length + results.modes.length + results.ranks.length})
              </TabsTrigger>
              <TabsTrigger value="articles" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">
                Articles ({results.posts.length + results.news.length + results.tutorials.length})
              </TabsTrigger>
              <TabsTrigger value="events" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">
                Events ({results.events.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : allResults.length > 0 ? (
                allResults.map((item, idx) => (
                  <SearchResultCard key={`${item.type}-${item.id}-${idx}`} item={item} icon={getTypeIcon(item.type)} />
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">No results found for "{debouncedQuery}"</div>
              )}
            </TabsContent>

            <TabsContent value="wiki" className="space-y-4">
              {[...results.weapons, ...results.modes, ...results.ranks].map((item, idx) => {
                let url = "#";
                let type = item.type || 'wiki';
                // Infer type if missing based on which list it came from? 
                // Actually, we can just use the item.type we assigned in filterData if we did... 
                // Wait, filterData didn't assign type. allResults did.
                // We should map the type in the results object or just look it up.
                // Simplest: Check which array it came from or just use the logic from allResults.

                // Better approach: Use allResults filtered by type
                return null;
              })}
              {allResults.filter(i => ['weapon', 'mode', 'rank'].includes(i.type)).map((item, idx) => (
                <SearchResultCard key={`wiki-${idx}`} item={item} icon={getTypeIcon(item.type)} />
              ))}
            </TabsContent>

            <TabsContent value="articles" className="space-y-4">
              {allResults.filter(i => ['post', 'news', 'tutorial'].includes(i.type)).map((item, idx) => (
                <SearchResultCard key={`article-${idx}`} item={item} icon={getTypeIcon(item.type)} />
              ))}
            </TabsContent>

            <TabsContent value="events" className="space-y-4">
              {allResults.filter(i => i.type === 'event').map((item, idx) => (
                <SearchResultCard key={`event-${idx}`} item={item} icon={getTypeIcon('event')} />
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

function SearchResultCard({ item, icon }: { item: any; icon: any }) {
  // Determine title and description based on item structure
  const title = item.title || item.name || "Untitled";
  const desc = item.summary || item.description || item.content || "";
  const cleanDesc = desc.replace(/<[^>]*>/g, '').slice(0, 200) + (desc.length > 200 ? "..." : "");

  return (
    <Link href={item.url || "#"}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-l-4 border-l-transparent hover:border-l-primary">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 bg-muted p-2 rounded-full">
              {icon}
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{title}</h3>
                <Badge variant="outline" className="capitalize text-xs">{item.type}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{cleanDesc}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
