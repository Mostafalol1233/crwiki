import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, FileText, Calendar, Newspaper, Trophy, Crosshair, Shield, Loader2, MapPin, Users } from "lucide-react";
import { getEvents, getWeapons, getModes, getRanks, getPosts, getNews, getMaps, getMercenaries } from "@/lib/supabaseApi";
import { useLanguage } from "@/components/LanguageProvider";

function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

/** Handles all shapes the API can return — array, {items}, {data} */
function normalizeToArray(d: any): any[] {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  if (Array.isArray(d.items)) return d.items;
  if (Array.isArray(d.data)) return d.data;
  return [];
}

export default function SearchPage() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounceValue(query, 400);
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (debouncedQuery) params.set("q", debouncedQuery);
    else params.delete("q");
    window.history.replaceState({}, "", window.location.pathname + (params.toString() ? "?" + params.toString() : ""));
    setPage(1); // reset page on query change
  }, [debouncedQuery]);

  useEffect(() => { setPage(1); }, [activeTab]); // reset page on tab change

  const enabled = !!debouncedQuery;

  const { data: rawPosts,    isLoading: lPosts    } = useQuery({ queryKey: ["search-posts"],    queryFn: () => getPosts({ limit: 200 }),         enabled, staleTime: 60_000 });
  const { data: rawNews,     isLoading: lNews     } = useQuery({ queryKey: ["search-news"],     queryFn: () => getNews({ limit: 200 }),          enabled, staleTime: 60_000 });
  const { data: rawEvents,   isLoading: lEvents   } = useQuery({ queryKey: ["search-events"],   queryFn: () => getEvents({ limit: 200 }),        enabled, staleTime: 60_000 });
  const { data: rawWeapons,  isLoading: lWeapons  } = useQuery({ queryKey: ["search-weapons"],  queryFn: () => getWeapons({ pageSize: 9999 }),   enabled, staleTime: 60_000 });
  const { data: rawModes,    isLoading: lModes    } = useQuery({ queryKey: ["search-modes"],    queryFn: () => getModes(),                       enabled, staleTime: 60_000 });
  const { data: rawRanks,    isLoading: lRanks    } = useQuery({ queryKey: ["search-ranks"],    queryFn: () => getRanks(),                       enabled, staleTime: 60_000 });
  const { data: rawMaps,     isLoading: lMaps     } = useQuery({ queryKey: ["search-maps"],     queryFn: () => getMaps(),                        enabled, staleTime: 60_000 });
  const { data: rawMercs,    isLoading: lMercs    } = useQuery({ queryKey: ["search-mercs"],    queryFn: () => getMercenaries(),                 enabled, staleTime: 60_000 });

  const isLoading = enabled && (lPosts || lNews || lEvents || lWeapons || lModes || lRanks || lMaps || lMercs);

  const posts      = normalizeToArray(rawPosts);
  const news       = normalizeToArray(rawNews);
  const events     = normalizeToArray(rawEvents);
  const weapons    = normalizeToArray(rawWeapons);
  const modes      = normalizeToArray(rawModes);
  const ranks      = normalizeToArray(rawRanks);
  const maps       = normalizeToArray(rawMaps);
  const mercs      = normalizeToArray(rawMercs);

  const normalizeSearchText = (value: unknown) => String(value || "")
    .toLocaleLowerCase()
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/ـ/g, "")
    .trim();

  const scoreMatch = (item: any, fields: string[]) => {
    const needle = normalizeSearchText(debouncedQuery);
    if (!needle) return 0;
    const titleFields = new Set(["title", "title_ar", "titleAr", "name", "name_ar", "nameAr"]);
    let score = 0;
    for (const field of fields) {
      const value = normalizeSearchText(item[field]);
      if (!value || !value.includes(needle)) continue;
      const titleWeight = titleFields.has(field) ? 3 : 1;
      score = Math.max(score, value === needle ? 120 * titleWeight : value.startsWith(needle) ? 90 * titleWeight : 55 * titleWeight);
    }
    const tokens = needle.split(/\s+/).filter(Boolean);
    if (tokens.length > 1) {
      const haystack = fields.map((field) => normalizeSearchText(item[field])).join(" ");
      score += tokens.filter((token) => haystack.includes(token)).length * 4;
    }
    return score;
  };

  const filterData = (data: any[], fields: string[]) => {
    if (!data.length || !debouncedQuery) return [];
    return data
      .map((item) => ({ item, score: scoreMatch(item, fields) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item, score }) => ({ ...item, _searchScore: score }));
  };

  const entityUrl = (path: string, item: any) => {
    const value = item.id || item.slug || item.name || item.title;
    return value ? `${path}?q=${encodeURIComponent(String(value))}` : path;
  };

  const results = {
    posts:       filterData(posts,   ["title", "title_ar", "summary", "summary_ar", "content", "content_ar"]),
    news:        filterData(news,    ["title", "title_ar", "titleAr", "content", "content_ar", "contentAr", "summary", "summary_ar"]),
    events:      filterData(events,  ["title", "title_ar", "description", "description_ar"]),
    weapons:     filterData(weapons, ["name", "name_ar", "nameAr", "description", "description_ar", "category", "category_ar"]),
    modes:       filterData(modes,   ["name", "name_ar", "nameAr", "description", "description_ar", "type", "category"]),
    ranks:       filterData(ranks,   ["name", "name_ar", "nameAr", "description", "description_ar", "tier"]),
    maps:        filterData(maps,    ["name", "name_ar", "nameAr", "description", "description_ar", "mode", "category"]),
    mercenaries: filterData(mercs,   ["name", "name_ar", "nameAr", "role", "role_ar", "description", "description_ar"]),
  };

  const allResults = [
    ...results.posts.map(i       => ({ ...i, _type: "post",       url: `/posts/${i.post_slug || i.id}` })),
    ...results.news.map(i        => ({ ...i, _type: "news",       url: `/news/${i.news_slug || i.id}` })),
    ...results.events.map(i      => ({ ...i, _type: "event",      url: `/events/${i.event_name_slug || i.id}` })),
    ...results.weapons.map(i     => ({ ...i, _type: "weapon",     url: entityUrl("/weapons", i) })),
    ...results.modes.map(i       => ({ ...i, _type: "mode",       url: entityUrl("/modes", i) })),
    ...results.ranks.map(i       => ({ ...i, _type: "rank",       url: entityUrl("/ranks", i) })),
    ...results.maps.map(i        => ({ ...i, _type: "map",        url: entityUrl("/maps", i) })),
    ...results.mercenaries.map(i => ({ ...i, _type: "mercenary",  url: entityUrl("/mercenaries", i) })),
  ];

  const typeColors: Record<string, string> = {
    post: "#60a5fa", news: "#f472b6", event: "#f5a623",
    weapon: "#fb923c", mode: "#a78bfa", rank: "#38bdf8",
    map: "#34d399", mercenary: "#c084fc",
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "post":      return <FileText size={13} />;
      case "news":      return <Newspaper size={13} />;
      case "event":     return <Calendar size={13} />;
      case "weapon":    return <Crosshair size={13} />;
      case "mode":      return <Shield size={13} />;
      case "rank":      return <Trophy size={13} />;
      case "map":       return <MapPin size={13} />;
      case "mercenary": return <Users size={13} />;
      default:          return <FileText size={13} />;
    }
  };

  const tabs = [
    { id: "all",      label: t("all"),             count: allResults.length },
    { id: "wiki",     label: t("searchTabWiki"),   count: results.weapons.length + results.modes.length + results.ranks.length + results.maps.length + results.mercenaries.length },
    { id: "articles", label: t("searchTabArticles"), count: results.posts.length + results.news.length },
    { id: "events",   label: t("events"),          count: results.events.length },
  ];

  const getTabResults = () => {
    switch (activeTab) {
      case "wiki":     return allResults.filter(i => ["weapon", "mode", "rank", "map", "mercenary"].includes(i._type));
      case "articles": return allResults.filter(i => ["post", "news"].includes(i._type));
      case "events":   return allResults.filter(i => i._type === "event");
      default:         return allResults;
    }
  };

  const GOLD = "#f5a623";
  const BG = "var(--background)";
  const CARD = "var(--card)";
  const BORDER = "rgba(255,255,255,0.06)";

  return (
    <div style={{ minHeight: "100vh", background: BG, paddingTop: 48, paddingBottom: 80 }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: 3, marginBottom: 12 }}>
            <SearchIcon size={11} color={GOLD} />
            <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.3em", color: GOLD }}>{t("search")}</span>
          </div>
          <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 900, letterSpacing: "-0.03em", color: "var(--foreground)", margin: "0 0 20px" }}>
            {t("searchWikiTitle")}
          </h1>

          {/* Search input */}
          <div style={{ position: "relative" }}>
            <SearchIcon size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", pointerEvents: "none" }} />
            <input
              autoFocus
              type="text"
              placeholder={t("searchInputPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: "100%", height: 48, paddingLeft: 44, paddingRight: 16,
                background: CARD, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4,
                color: "var(--foreground)", fontSize: 14, outline: "none", boxSizing: "border-box",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(245,166,35,0.4)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
            />
          </div>
        </div>

        {/* Results area */}
        {debouncedQuery ? (
          <div>
            {/* Tab bar */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em",
                  background: activeTab === tab.id ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.04)",
                  border: activeTab === tab.id ? "1px solid rgba(245,166,35,0.35)" : `1px solid ${BORDER}`,
                  color: activeTab === tab.id ? GOLD : "rgba(255,255,255,0.4)",
                  borderRadius: 3, cursor: "pointer",
                }}>
                  {tab.label}
                  <span style={{ fontSize: 9, padding: "1px 5px", background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>{tab.count}</span>
                </button>
              ))}
            </div>

            {isLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
                <Loader2 size={24} color={GOLD} style={{ animation: "spin 0.8s linear infinite" }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            ) : getTabResults().length > 0 ? (
              <div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {getTabResults().slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((item, idx) => {
                  const title = item.title || item.name || "Untitled";
                  const desc = item.summary || item.description || item.content || "";
                  const cleanDesc = desc.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim().slice(0, 160);
                  const img = item.image || item.imageUrl || item.image_url;
                  const color = typeColors[item._type] || GOLD;

                  return (
                    <Link key={`${item._type}-${item.id}-${idx}`} href={item.url || "#"}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "12px 16px", background: CARD, border: `1px solid ${BORDER}`,
                        borderRadius: 4, cursor: "pointer", transition: "border-color 0.15s",
                      }} className="search-result-card">
                        {/* Thumbnail or icon */}
                        {img ? (
                          <div style={{ width: 48, height: 36, flexShrink: 0, borderRadius: 3, overflow: "hidden", background: "#050505" }}>
                            <img src={img} alt={title} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                          </div>
                        ) : (
                          <div style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 3, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", color }}>
                            {getTypeIcon(item._type)}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 700, fontSize: 13, color: "var(--foreground)" }}>{title}</span>
                            <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", padding: "2px 6px", background: `${color}18`, color, borderRadius: 2 }}>{item._type}</span>
                          </div>
                          {cleanDesc && (
                            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {cleanDesc}
                            </p>
                          )}
                        </div>
                        <div style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              {/* Pagination controls */}
              {getTabResults().length > PAGE_SIZE && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, padding: "10px 14px", background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4 }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      padding: "6px 16px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em",
                      background: page === 1 ? "rgba(255,255,255,0.03)" : "rgba(245,166,35,0.1)",
                      color: page === 1 ? "rgba(255,255,255,0.2)" : "#f5a623",
                      border: `1px solid ${page === 1 ? "rgba(255,255,255,0.06)" : "rgba(245,166,35,0.3)"}`,
                      borderRadius: 3, cursor: page === 1 ? "default" : "pointer",
                    }}
                  >{t("searchPrev")}</button>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>
                    {t("searchPageLabel")} {page} / {Math.ceil(getTabResults().length / PAGE_SIZE)}
                    <span style={{ color: "rgba(255,255,255,0.15)", marginLeft: 8 }}>({getTabResults().length})</span>
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(Math.ceil(getTabResults().length / PAGE_SIZE), p + 1))}
                    disabled={page === Math.ceil(getTabResults().length / PAGE_SIZE)}
                    style={{
                      padding: "6px 16px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em",
                      background: page === Math.ceil(getTabResults().length / PAGE_SIZE) ? "rgba(255,255,255,0.03)" : "rgba(245,166,35,0.1)",
                      color: page === Math.ceil(getTabResults().length / PAGE_SIZE) ? "rgba(255,255,255,0.2)" : "#f5a623",
                      border: `1px solid ${page === Math.ceil(getTabResults().length / PAGE_SIZE) ? "rgba(255,255,255,0.06)" : "rgba(245,166,35,0.3)"}`,
                      borderRadius: 3, cursor: page === Math.ceil(getTabResults().length / PAGE_SIZE) ? "default" : "pointer",
                    }}
                  >{t("searchNext")}</button>
                </div>
              )}
              </div>
            ) : (
              <div style={{ padding: "60px 20px", textAlign: "center", background: CARD, border: `1px solid ${BORDER}`, borderRadius: 4 }}>
                <SearchIcon size={32} color="rgba(255,255,255,0.08)" style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.25)" }}>{t("searchNoResultsFor")} "{debouncedQuery}"</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.15)", marginTop: 4 }}>{t("searchTryDifferent")}</p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ paddingTop: 80, textAlign: "center" }}>
            <SearchIcon size={40} color="rgba(255,255,255,0.06)" style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.2)" }}>{t("searchStartTyping")}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 24 }}>
              {["Barrett M82A1", "Sniper Week", "Ghost Mode", "Zombie Mode", "Mercenaries"].map((hint) => (
                <button key={hint} onClick={() => setQuery(hint)} style={{
                  padding: "6px 14px", fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 500,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 999, cursor: "pointer",
                }}>
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}

        <style>{`.search-result-card:hover{border-color:rgba(245,166,35,0.2)!important;}`}</style>
      </div>
    </div>
  );
}
