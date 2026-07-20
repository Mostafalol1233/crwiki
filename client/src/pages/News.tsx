import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/LanguageProvider";
import { Globe, ImageIcon, Flame, TrendingUp, Clock, User, Search, X } from "lucide-react";
import { Link } from "wouter";
import { useMemo, useState, useEffect } from "react";
import { getNews, getPosts } from "@/lib/supabaseApi";
import PageSEO from "@/components/PageSEO";

type NewsItemBase = {
  id: string;
  title: string;
  dateRange?: string;
  date?: string;
  image: string;
  category: string;
  content: string;
  summary?: string;
  author: string;
  featured?: boolean;
  createdAt?: string;
};

type NewsItemNews = NewsItemBase & { type: "news"; titleAr?: string; contentAr?: string; news_slug?: string };
type NewsItemPost = NewsItemBase & { type: "post"; post_slug?: string };
type NewsItem = NewsItemNews | NewsItemPost;

const CATEGORIES = ["All", "News", "Events", "Tutorials", "Updates", "Article"];

export default function News() {
  const { t, language, toggleLanguage } = useLanguage();
  const [page, setPage] = useState(1);
  const limit = 20;
  const [allLoadedNews, setAllLoadedNews] = useState<NewsItem[]>([]);
  const [allLoadedPosts, setAllLoadedPosts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");

  const normalizeAuthor = (author?: string) => {
    const raw = String(author || "").trim();
    if (!raw) return "Wiki Updates";
    if (/forum\s*scraper/i.test(raw)) return "Wiki Updates";
    if (/scraper/i.test(raw)) return "Community News";
    return raw;
  };

  const buildExcerpt = (item: any) => {
    const raw =
      (language === "ar" && item?.contentAr ? item.contentAr : "") ||
      item?.summary ||
      item?.content || "";
    return String(raw).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
  };

  const { data: newsData, isLoading: newsLoading } = useQuery<{ items: NewsItem[]; total: number }>({
    queryKey: ["/api/news", page],
    queryFn: () => getNews({ limit, offset: (page - 1) * limit }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: postsData, isLoading: postsLoading } = useQuery<{ items: any[]; total: number }>({
    queryKey: ["/api/posts", "news-page"],
    queryFn: () => getPosts({ limit: 50, offset: 0 }),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const pageItems = newsData?.items;
    if (!Array.isArray(pageItems) || pageItems.length === 0) return;
    setAllLoadedNews((prev) => {
      const seen = new Set(prev.map((p: any) => String(p?.id || "")));
      const next = [...prev];
      for (const it of pageItems) {
        const id = String((it as any)?.id || "");
        if (!id || seen.has(id)) continue;
        seen.add(id);
        next.push(it as any);
      }
      return next;
    });
  }, [newsData?.items]);

  useEffect(() => {
    const items = postsData?.items;
    if (!Array.isArray(items)) return;
    setAllLoadedPosts(items);
  }, [postsData?.items]);

  const allNews = useMemo(() => {
    const newsWithType = allLoadedNews.map((item) => ({ ...item, type: "news" as const }));
    const postsWithType = allLoadedPosts.map((post) => ({
      id: post.id,
      title: post.title,
      dateRange: post.date || "Recent",
      image: post.image,
      category: post.category || "Article",
      content: post.content,
      summary: post.summary,
      author: post.author,
      featured: post.featured,
      post_slug: post.post_slug,
      createdAt: post.createdAt,
      type: "post" as const,
    }));
    return [...newsWithType, ...postsWithType].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      const da = new Date((a as any).createdAt || 0).getTime();
      const db = new Date((b as any).createdAt || 0).getTime();
      return db - da;
    });
  }, [allLoadedNews, allLoadedPosts]);

  const filtered = useMemo(() => {
    return allNews.filter((item) => {
      const matchCat = activeCat === "All" || (item.category ?? "").toLowerCase().includes(activeCat.toLowerCase()) || (activeCat === "Article" && item.type === "post");
      const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || buildExcerpt(item).toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [allNews, activeCat, search, language]);

  const featuredItem = filtered.find((i) => i.featured) || filtered[0];
  const restItems = filtered.filter((i) => i !== featuredItem);

  const total = newsData?.total || 0;
  const hasMore = allLoadedNews.length < total;

  const isLoading = newsLoading || postsLoading;

  const getItemHref = (item: NewsItem) =>
    item.type === "post"
      ? `/posts/${(item as NewsItemPost).post_slug || item.id}`
      : `/news/${(item as NewsItemNews).news_slug || item.id}`;

  const getTitle = (item: NewsItem) =>
    language === "ar" && "titleAr" in item && (item as NewsItemNews).titleAr
      ? (item as NewsItemNews).titleAr!
      : item.title;

  const formatDate = (item: any) => {
    const raw = item.createdAt || item.dateRange || item.date;
    const d = raw && !isNaN(Date.parse(raw)) ? new Date(raw) : null;
    try {
      return d
        ? new Intl.DateTimeFormat(language === "ar" ? "ar" : undefined, { year: "numeric", month: "short", day: "numeric" }).format(d)
        : item.dateRange || "";
    } catch {
      return item.dateRange || "";
    }
  };

  const getCatColor = (cat: string) => {
    const c = String(cat || "").toLowerCase();
    if (c.includes("event")) return { bg: "rgba(245,166,35,0.12)", color: "#f5a623" };
    if (c.includes("tutorial") || c.includes("guide")) return { bg: "rgba(99,102,241,0.12)", color: "#818cf8" };
    if (c.includes("update")) return { bg: "rgba(34,197,94,0.12)", color: "#4ade80" };
    return { bg: "rgba(156,163,175,0.12)", color: "#9ca3af" };
  };

  return (
    <>
      <PageSEO
        title="News & Updates — CrossFire Wiki"
        description="Latest CrossFire news, posts, and updates from the community and official sources."
        canonicalPath="/news"
      />

      <div className="min-h-screen" style={{ background: "var(--background)" }} dir={language === "ar" ? "rtl" : "ltr"}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">

          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-1" style={{ color: "#f5a623" }}>
                Latest Updates
              </p>
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
                News & Updates
              </h1>
            </div>
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-bold uppercase tracking-wider rounded transition-all hover:text-[#f5a623]"
              style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#666", background: "var(--card)" }}
              title={language === "en" ? "العربية" : "English"}
            >
              <Globe className="h-3.5 w-3.5" />
              {language === "en" ? "AR" : "EN"}
            </button>
          </div>

          {/* ── Filters ── */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "#555" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search news..."
                className="w-full h-9 pl-9 pr-8 text-[12px] outline-none rounded-sm"
                style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--foreground)" }}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: "#555" }}>
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Categories */}
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all"
                  style={{
                    background: activeCat === cat ? "#f5a623" : "var(--card)",
                    color: activeCat === cat ? "#000" : "#666",
                    border: `1px solid ${activeCat === cat ? "#f5a623" : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 rounded-full border-2 border-[#f5a623] border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center" style={{ border: "1px dashed rgba(255,255,255,0.07)", borderRadius: "4px" }}>
              <Flame className="h-10 w-10 mx-auto mb-3 opacity-20" style={{ color: "#f5a623" }} />
              <p className="text-sm font-bold uppercase tracking-widest" style={{ color: "#444" }}>No articles found</p>
            </div>
          ) : (
            <>
              {/* ── Featured Article ── */}
              {featuredItem && (
                <Link href={getItemHref(featuredItem)} className="group block mb-6">
                  <div
                    className="relative overflow-hidden transition-all duration-300"
                    style={{ background: "var(--card)", border: "1px solid rgba(245,166,35,0.15)", borderRadius: "4px" }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(to right, #f5a623, transparent)" }} />
                    <div className="grid md:grid-cols-[1fr_420px] gap-0">
                      {/* Image */}
                      <div className="relative overflow-hidden" style={{ minHeight: "260px" }}>
                        {featuredItem.image ? (
                          <img
                            src={featuredItem.image}
                            alt={getTitle(featuredItem)}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            style={{ minHeight: "260px" }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: "hsl(var(--card))", minHeight: "260px" }}>
                            <ImageIcon className="h-12 w-12" style={{ color: "#222" }} />
                          </div>
                        )}
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, transparent 60%, var(--card) 100%)" }} />

                        {/* Featured badge */}
                        <div className="absolute top-4 left-4">
                          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5" style={{ background: "#f5a623", color: "#000" }}>
                            <Flame className="h-2.5 w-2.5" /> Featured
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 md:p-8 flex flex-col justify-center" style={{ borderLeft: "1px solid rgba(255,255,255,0.05)" }}>
                        {/* Category & type */}
                        <div className="flex items-center gap-2 mb-4">
                          <span
                            className="text-[9px] font-black uppercase tracking-widest px-2 py-1"
                            style={{ background: getCatColor(featuredItem.category).bg, color: getCatColor(featuredItem.category).color, borderRadius: "2px" }}
                          >
                            {featuredItem.category || (featuredItem.type === "post" ? "Article" : "News")}
                          </span>
                          {featuredItem.type === "post" && (
                            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "#444" }}>Editorial</span>
                          )}
                        </div>

                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-tight mb-3" style={{ color: "var(--foreground)" }}>
                          {getTitle(featuredItem)}
                        </h2>

                        <p className="text-sm leading-relaxed mb-5 line-clamp-3" style={{ color: "#666" }}>
                          {buildExcerpt(featuredItem) || "Click to read the full story."}
                        </p>

                        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: "#555" }}>
                          {featuredItem.author && (
                            <span className="flex items-center gap-1"><User className="h-3 w-3" />{normalizeAuthor(featuredItem.author)}</span>
                          )}
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(featuredItem)}</span>
                        </div>

                        <div className="mt-5">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all group-hover:gap-2.5" style={{ color: "#f5a623" }}>
                            Read More →
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* ── Article Grid ── */}
              {restItems.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {restItems.map((item) => (
                    <Link key={item.id} href={getItemHref(item)} className="group block">
                      <div
                        className="h-full overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
                        style={{
                          background: "var(--card)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "3px",
                          boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
                        }}
                      >
                        {/* Image */}
                        <div className="relative overflow-hidden aspect-[16/9]" style={{ background: "hsl(var(--card))" }}>
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={getTitle(item)}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-8 w-8" style={{ color: "#222" }} />
                            </div>
                          )}
                          {item.featured && (
                            <div className="absolute top-2.5 left-2.5">
                              <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 flex items-center gap-1" style={{ background: "#f5a623", color: "#000" }}>
                                <TrendingUp className="h-2.5 w-2.5" /> Hot
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)" }} />
                        </div>

                        {/* Body */}
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-2.5">
                            <span
                              className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5"
                              style={{ background: getCatColor(item.category).bg, color: getCatColor(item.category).color, borderRadius: "2px" }}
                            >
                              {item.category || (item.type === "post" ? "Article" : "News")}
                            </span>
                            <span className="text-[9px] font-medium" style={{ color: "#555" }}>{formatDate(item)}</span>
                          </div>

                          <h3 className="font-black text-sm uppercase tracking-tight leading-snug line-clamp-2 mb-2" style={{ color: "var(--foreground)" }}>
                            {getTitle(item)}
                          </h3>

                          <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: "#555" }}>
                            {buildExcerpt(item) || "Read the full update →"}
                          </p>

                          <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                            <User className="h-3 w-3 flex-shrink-0" style={{ color: "#444" }} />
                            <span className="text-[9px] font-bold uppercase tracking-wider truncate" style={{ color: "#555" }}>
                              {normalizeAuthor(item.author)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Load more */}
              {hasMore && (
                <div className="flex justify-center mt-10">
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    className="flex items-center gap-2 px-8 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:bg-[#f5a623] hover:text-black hover:border-[#f5a623]"
                    style={{ border: "1px solid rgba(255,255,255,0.12)", color: "#888", borderRadius: "2px" }}
                  >
                    Load More Articles
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
