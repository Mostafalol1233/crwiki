import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, FileText, Calendar, Newspaper, Trophy, Crosshair, Target, Shield, Loader2 } from "lucide-react";

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
    if (debouncedQuery) params.set("q", debouncedQuery);
    else params.delete("q");
    const newUrl = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
    window.history.replaceState({}, "", newUrl);
  }, [debouncedQuery]);

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
    return data.filter(item => fields.some(field => String(item[field] || "").toLowerCase().includes(lowerQ)));
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
    ...results.weapons.map(i => ({ ...i, type: "weapon", url: `/weapons` })),
    ...results.modes.map(i => ({ ...i, type: "mode", url: `/modes` })),
    ...results.ranks.map(i => ({ ...i, type: "rank", url: `/ranks` })),
  ];

  const isLoading = !posts && !!debouncedQuery;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "post": return <FileText className="h-3.5 w-3.5" />;
      case "news": return <Newspaper className="h-3.5 w-3.5" />;
      case "event": return <Trophy className="h-3.5 w-3.5" />;
      case "tutorial": return <Target className="h-3.5 w-3.5" />;
      case "weapon": return <Crosshair className="h-3.5 w-3.5" />;
      case "mode": return <Shield className="h-3.5 w-3.5" />;
      case "rank": return <Shield className="h-3.5 w-3.5" />;
      default: return <FileText className="h-3.5 w-3.5" />;
    }
  };

  const tabs = [
    { id: "all", label: "All", count: allResults.length },
    { id: "wiki", label: "Wiki", count: results.weapons.length + results.modes.length + results.ranks.length },
    { id: "articles", label: "Articles", count: results.posts.length + results.news.length + results.tutorials.length },
    { id: "events", label: "Events", count: results.events.length },
  ];

  const getTabResults = () => {
    switch (activeTab) {
      case "wiki": return allResults.filter(i => ['weapon', 'mode', 'rank'].includes(i.type));
      case "articles": return allResults.filter(i => ['post', 'news', 'tutorial'].includes(i.type));
      case "events": return allResults.filter(i => i.type === 'event');
      default: return allResults;
    }
  };

  return (
    <div className="min-h-screen py-12 md:py-16" style={{ background: "var(--background)" }}>
      <div className="max-w-3xl mx-auto px-4 md:px-8 space-y-8">

        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5" style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: "2px" }}>
            <SearchIcon className="h-3 w-3" style={{ color: "#f5a623" }} />
            <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: "#f5a623" }}>Search</span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight mb-4" style={{ color: "var(--foreground)" }}>
            Search <span style={{ color: "#f5a623" }}>Wiki</span>
          </h1>

          {/* Search Input */}
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#555" }} />
            <input
              className="w-full pl-11 pr-4 h-12 text-sm outline-none transition-all"
              style={{
                background: "var(--card)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "3px",
                color: "var(--foreground)",
              }}
              placeholder="Search for guides, weapons, events..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(245,166,35,0.4)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
            />
          </div>
        </div>

        {/* Results */}
        {debouncedQuery && (
          <div className="space-y-5">
            {/* Tab filters */}
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all"
                  style={{
                    background: activeTab === tab.id ? "rgba(245,166,35,0.15)" : "rgba(255,255,255,0.04)",
                    border: activeTab === tab.id ? "1px solid rgba(245,166,35,0.4)" : "1px solid rgba(255,255,255,0.06)",
                    color: activeTab === tab.id ? "#f5a623" : "#666",
                    borderRadius: "2px",
                  }}
                >
                  {tab.label}
                  <span className="text-[9px] px-1 rounded" style={{ background: "rgba(255,255,255,0.06)" }}>{tab.count}</span>
                </button>
              ))}
            </div>

            {/* Results list */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#f5a623" }} />
              </div>
            ) : getTabResults().length > 0 ? (
              <div className="space-y-2">
                {getTabResults().map((item, idx) => (
                  <SearchResultCard key={`${item.type}-${item.id}-${idx}`} item={item} icon={getTypeIcon(item.type)} />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
                <p className="text-sm font-black uppercase tracking-wider" style={{ color: "#444" }}>No results for "{debouncedQuery}"</p>
              </div>
            )}
          </div>
        )}

        {!debouncedQuery && (
          <div className="py-20 text-center">
            <SearchIcon className="h-10 w-10 mx-auto mb-4 opacity-10" style={{ color: "#f5a623" }} />
            <p className="text-sm" style={{ color: "#444" }}>Start typing to search the wiki</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchResultCard({ item, icon }: { item: any; icon: any }) {
  const title = item.title || item.name || "Untitled";
  const desc = item.summary || item.description || item.content || "";
  const cleanDesc = desc.replace(/<[^>]*>/g, '').slice(0, 160) + (desc.length > 160 ? "..." : "");

  const typeColors: Record<string, string> = {
    post: "#60a5fa",
    news: "#f472b6",
    event: "#f5a623",
    tutorial: "#4ade80",
    weapon: "#fb923c",
    mode: "#a78bfa",
    rank: "#38bdf8",
  };

  return (
    <Link href={item.url || "#"}>
      <a className="flex items-start gap-3 p-4 transition-all hover:brightness-105 block" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "3px" }}>
        <div className="w-7 h-7 flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(255,255,255,0.05)", borderRadius: "2px", color: typeColors[item.type] || "#f5a623" }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{title}</span>
            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5" style={{ background: "rgba(255,255,255,0.05)", color: typeColors[item.type] || "#f5a623", borderRadius: "2px" }}>{item.type}</span>
          </div>
          {cleanDesc && <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#666" }}>{cleanDesc}</p>}
        </div>
      </a>
    </Link>
  );
}
