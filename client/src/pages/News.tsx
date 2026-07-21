import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { Globe, ImageIcon, Flame, Clock, User, Search, X, ChevronRight, Tag, TrendingUp, BookOpen, Calendar, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useMemo, useState, useEffect } from "react";
import { getNews, getPosts, getEvents } from "@/lib/supabaseApi";
import PageSEO from "@/components/PageSEO";

// ─── Constants ────────────────────────────────────────────────────────────────
const GOLD = "#f5a623";
const BORDER = "rgba(255,255,255,0.07)";
const CARD = "var(--card)";
const CARD2 = "rgba(255,255,255,0.025)";

const CATEGORIES = ["All", "News", "Events", "Tutorials", "Updates", "Article"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalizeAuthor(a?: string) {
  const raw = String(a || "").trim();
  if (!raw || /forum\s*scraper|scraper/i.test(raw)) return "Wiki Updates";
  return raw;
}

function getCatStyle(cat: string) {
  const c = String(cat || "").toLowerCase();
  if (c.includes("event"))    return { bg: "rgba(245,166,35,0.1)",  color: GOLD };
  if (c.includes("tutorial")) return { bg: "rgba(99,102,241,0.1)",  color: "#818cf8" };
  if (c.includes("update"))   return { bg: "rgba(52,211,153,0.1)",  color: "#34d399" };
  if (c.includes("news"))     return { bg: "rgba(248,113,113,0.1)", color: "#f87171" };
  return { bg: "rgba(156,163,175,0.1)", color: "#9ca3af" };
}

// ─── Featured Article ─────────────────────────────────────────────────────────
function FeaturedArticle({ item, href, title, excerpt, date, author, cat }: any) {
  const cs = getCatStyle(cat);
  return (
    <Link href={href} className="group block">
      <div style={{
        background: CARD, border: "1px solid rgba(245,166,35,0.18)",
        borderRadius: 6, overflow: "hidden", position: "relative",
        transition: "box-shadow 0.3s",
      }} className="feat-card">
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(to right, ${GOLD}, transparent)` }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px" }} className="feat-grid">
          {/* Image */}
          <div style={{ position: "relative", overflow: "hidden", minHeight: 280 }}>
            {item.image || item.imageUrl ? (
              <img
                src={item.image || item.imageUrl}
                alt={title}
                className="group-hover:scale-105 transition-transform duration-700"
                style={{ width: "100%", height: "100%", objectFit: "cover", minHeight: 280 }}
              />
            ) : (
              <div style={{ width: "100%", minHeight: 280, background: "#0d1117", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ImageIcon size={40} color="rgba(255,255,255,0.08)" />
              </div>
            )}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 50%, var(--card) 100%)" }} />
            <div style={{ position: "absolute", top: 12, left: 12 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", background: GOLD, color: "#000", fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", borderRadius: 2 }}>
                <Flame size={9} /> Featured
              </span>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: "28px 28px", display: "flex", flexDirection: "column", justifyContent: "center", borderLeft: `1px solid ${BORDER}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", padding: "3px 8px", background: cs.bg, color: cs.color, borderRadius: 2 }}>
                {cat || "Article"}
              </span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: "var(--foreground)", margin: "0 0 10px", lineHeight: 1.25 }}>
              {title}
            </h2>
            <p style={{ fontSize: 13, color: "#666", margin: "0 0 16px", lineHeight: 1.65, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {excerpt || "Click to read the full article."}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 10, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
              {author && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><User size={11} />{normalizeAuthor(author)}</span>}
              {date && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} />{date}</span>}
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 800, color: GOLD, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Read More <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </div>
        <style>{`
          .feat-card:hover{box-shadow:0 12px 40px rgba(0,0,0,0.5)!important;}
          @media(max-width:700px){.feat-grid{grid-template-columns:1fr!important;}}
        `}</style>
      </div>
    </Link>
  );
}

// ─── Article Card ─────────────────────────────────────────────────────────────
function ArticleCard({ item, href, title, excerpt, date, cat, author }: any) {
  const cs = getCatStyle(cat);
  return (
    <Link href={href} className="group block h-full">
      <div style={{
        height: "100%", background: CARD, border: `1px solid ${BORDER}`,
        borderRadius: 5, overflow: "hidden", transition: "all 0.2s",
      }} className="art-card">
        {/* Thumbnail */}
        <div style={{ position: "relative", overflow: "hidden", paddingTop: "55%" }}>
          {item.image || item.imageUrl ? (
            <img src={item.image || item.imageUrl} alt={title} loading="lazy"
              className="group-hover:scale-105 transition-transform duration-500"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ position: "absolute", inset: 0, background: "#0d1117", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ImageIcon size={24} color="rgba(255,255,255,0.08)" />
            </div>
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)", opacity: 0, transition: "opacity 0.2s" }} className="art-overlay" />
          {item.featured && (
            <div style={{ position: "absolute", top: 8, left: 8 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 8, fontWeight: 800, padding: "2px 7px", background: GOLD, color: "#000", textTransform: "uppercase", letterSpacing: "0.1em", borderRadius: 2 }}>
                <TrendingUp size={8} /> Hot
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 8, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", padding: "2px 6px", background: cs.bg, color: cs.color, borderRadius: 2 }}>
              {cat || "Article"}
            </span>
            {date && <span style={{ fontSize: 10, color: "#444" }}>{date}</span>}
          </div>

          <h3 className="group-hover:text-[#f5a623] transition-colors" style={{
            fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: "-0.01em",
            color: "var(--foreground)", margin: "0 0 6px", lineHeight: 1.35,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {title}
          </h3>

          {excerpt && (
            <p style={{ fontSize: 11, color: "#555", margin: "0 0 10px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {excerpt}
            </p>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 4, paddingTop: 8, borderTop: `1px solid ${BORDER}` }}>
            <User size={10} color="#444" />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {normalizeAuthor(author)}
            </span>
          </div>
        </div>
        <style>{`
          .art-card:hover{border-color:rgba(245,166,35,0.2)!important;transform:translateY(-2px);box-shadow:0 4px 20px rgba(0,0,0,0.4);}
          .group:hover .art-overlay{opacity:1!important;}
        `}</style>
      </div>
    </Link>
  );
}

// ─── Sidebar Section ──────────────────────────────────────────────────────────
function SideSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 5, overflow: "hidden", marginBottom: 16 }}>
      <div style={{ padding: "9px 14px", background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${BORDER}` }}>
        <p style={{ fontSize: 9, fontWeight: 800, color: GOLD, textTransform: "uppercase", letterSpacing: "0.2em", margin: 0 }}>{title}</p>
      </div>
      <div style={{ padding: "12px 14px" }}>{children}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function News() {
  const { t, language, toggleLanguage } = useLanguage();
  const [page, setPage] = useState(1);
  const limit = 30;
  const [allLoadedNews, setAllLoadedNews] = useState<any[]>([]);
  const [allLoadedPosts, setAllLoadedPosts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");

  const buildExcerpt = (item: any) => {
    const raw = (language === "ar" && item?.contentAr ? item.contentAr : "") || item?.summary || item?.content || "";
    return String(raw).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);
  };

  const { data: newsData, isLoading: newsLoading } = useQuery<{ items: any[]; total: number }>({
    queryKey: ["/api/news", page],
    queryFn: () => getNews({ limit, offset: (page - 1) * limit }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: postsData, isLoading: postsLoading } = useQuery<{ items: any[]; total: number }>({
    queryKey: ["/api/posts", "news-page"],
    queryFn: () => getPosts({ limit: 50, offset: 0 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: eventsData } = useQuery<{ items: any[]; total: number }>({
    queryKey: ["/api/events", { limit: 20 }],
    queryFn: () => getEvents({ limit: 20 }),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const items = newsData?.items;
    if (!Array.isArray(items) || items.length === 0) return;
    setAllLoadedNews((prev) => {
      const seen = new Set(prev.map((p: any) => String(p?.id || "")));
      const next = [...prev];
      for (const it of items) {
        const id = String((it as any)?.id || "");
        if (!id || seen.has(id)) continue;
        seen.add(id);
        next.push(it);
      }
      return next;
    });
  }, [newsData?.items]);

  useEffect(() => {
    const items = postsData?.items;
    if (Array.isArray(items)) setAllLoadedPosts(items);
  }, [postsData?.items]);

  // Build combined news feed — always include events as news if available
  const allItems = useMemo(() => {
    const newsWithType = allLoadedNews.map((item) => ({ ...item, _type: "news" }));
    const postsWithType = allLoadedPosts.map((p) => ({
      id: p.id, title: p.title, dateRange: p.date || "Recent",
      image: p.image || p.image_url, imageUrl: p.image_url, category: p.category || "Article",
      content: p.content, summary: p.summary, author: p.author, featured: p.featured,
      post_slug: p.post_slug, createdAt: p.createdAt, _type: "post",
    }));
    const eventsAsNews = (eventsData?.items || []).map((e: any) => ({
      id: `ev-${e.id}`, title: e.title,
      image: e.image || e.image_url || e.imageUrl, imageUrl: e.image_url || e.imageUrl,
      category: "Events", content: e.description, summary: e.description,
      author: "CrossFire", featured: e.featured || false,
      createdAt: e.date, _type: "event",
      _eventSlug: e.event_name_slug || e.id,
    }));

    const combined = [...newsWithType, ...postsWithType];
    // Only add events if we have less than 5 real articles
    if (combined.length < 5) combined.push(...eventsAsNews);

    return combined.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      const da = new Date((a as any).createdAt || 0).getTime();
      const db = new Date((b as any).createdAt || 0).getTime();
      return db - da;
    });
  }, [allLoadedNews, allLoadedPosts, eventsData?.items]);

  const filtered = useMemo(() => {
    return allItems.filter((item) => {
      const cat = (item.category ?? "").toLowerCase();
      const matchCat =
        activeCat === "All" ||
        cat.includes(activeCat.toLowerCase()) ||
        (activeCat === "Article" && item._type === "post") ||
        (activeCat === "Events" && item._type === "event");
      const matchSearch = !search ||
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        buildExcerpt(item).toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [allItems, activeCat, search, language]);

  const featuredItem = filtered.find((i) => i.featured) || filtered[0];
  const restItems = filtered.filter((i) => i !== featuredItem);

  const total = newsData?.total || 0;
  const hasMore = allLoadedNews.length < total;
  const isLoading = newsLoading && postsLoading;

  const getItemHref = (item: any) => {
    if (item._type === "event") return `/events/${item._eventSlug}`;
    if (item._type === "post") return `/posts/${item.post_slug || item.id}`;
    return `/news/${item.news_slug || item.id}`;
  };

  const getTitle = (item: any) =>
    language === "ar" && item.titleAr ? item.titleAr : item.title;

  const formatDate = (item: any) => {
    const raw = item.createdAt || item.dateRange || item.date;
    const d = raw && !isNaN(Date.parse(raw)) ? new Date(raw) : null;
    try {
      return d
        ? new Intl.DateTimeFormat(language === "ar" ? "ar" : undefined, { year: "numeric", month: "short", day: "numeric" }).format(d)
        : item.dateRange || "";
    } catch { return item.dateRange || ""; }
  };

  // Category counts
  const catCounts = useMemo(() => {
    const map: Record<string, number> = { All: allItems.length };
    allItems.forEach((i) => {
      const c = i.category || (i._type === "post" ? "Article" : "News");
      map[c] = (map[c] || 0) + 1;
    });
    return map;
  }, [allItems]);

  return (
    <>
      <PageSEO
        title="CrossFire News & Updates — Latest Events, Patches & Community | CrossFire Wiki"
        description="Latest CrossFire news, patch notes, esports events, community posts and game updates. Stay up-to-date with everything happening in CrossFire Z8Games."
        image="https://z8games.akamaized.net/cfna/web/main/carousel/CFNA_NewsUpdate_Carousel.jpg"
        canonicalPath="/news"
      />

      <div style={{ minHeight: "100vh", background: "var(--background)" }}>

        {/* ── PAGE HEADER ── */}
        <div style={{
          position: "relative", overflow: "hidden",
          borderBottom: `1px solid ${BORDER}`,
          background: "linear-gradient(to bottom, rgba(245,166,35,0.03) 0%, transparent 100%)",
          padding: "36px 0 28px",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(to right, ${GOLD}, rgba(245,166,35,0.2) 60%, transparent)` }} />

          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <Link href="/"><span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", cursor: "pointer", fontWeight: 600 }}>Home</span></Link>
              <ChevronRight size={12} color="rgba(255,255,255,0.2)" />
              <span style={{ fontSize: 11, color: GOLD, fontWeight: 700 }}>News & Updates</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, color: GOLD, textTransform: "uppercase", letterSpacing: "0.2em", margin: "0 0 4px" }}>Latest Updates</p>
                <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em", color: "var(--foreground)", margin: 0 }}>
                  News & Updates
                </h1>
              </div>
              <button
                onClick={toggleLanguage}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "7px 12px", fontSize: 11, fontWeight: 700,
                  background: CARD, border: `1px solid ${BORDER}`,
                  color: "#666", borderRadius: 3, cursor: "pointer",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                }}
              >
                <Globe size={13} />
                {language === "en" ? "AR" : "EN"}
              </button>
            </div>

            {/* Search + Category filters */}
            <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "relative", minWidth: 200 }}>
                <Search size={13} color="#555" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search articles..."
                  style={{
                    width: "100%", height: 34, paddingLeft: 30, paddingRight: search ? 28 : 10,
                    fontSize: 12, background: CARD, border: `1px solid ${BORDER}`,
                    color: "var(--foreground)", borderRadius: 3, outline: "none",
                  }}
                />
                {search && (
                  <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "#555", background: "none", border: "none", cursor: "pointer" }}>
                    <X size={12} />
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {CATEGORIES.filter((cat) => cat === "All" || (catCounts[cat] ?? 0) > 0).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCat(cat)}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "5px 11px", fontSize: 10, fontWeight: 800,
                      textTransform: "uppercase", letterSpacing: "0.1em",
                      background: activeCat === cat ? GOLD : "transparent",
                      color: activeCat === cat ? "#000" : "rgba(255,255,255,0.4)",
                      border: `1px solid ${activeCat === cat ? GOLD : BORDER}`,
                      borderRadius: 3, cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {cat}
                    {catCounts[cat] > 0 && <span style={{ fontSize: 9, opacity: 0.7 }}>{catCounts[cat]}</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 64px" }}>
          {isLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", border: `2px solid ${GOLD}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }} className="news-layout">

              {/* ── MAIN COLUMN ── */}
              <div style={{ flex: 1, minWidth: 0 }}>

                {filtered.length === 0 ? (
                  <div style={{ padding: "60px 24px", textAlign: "center", border: `1px dashed rgba(245,166,35,0.1)`, borderRadius: 6 }}>
                    <Flame size={36} color="rgba(255,255,255,0.1)" style={{ marginBottom: 12 }} />
                    <p style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#444" }}>
                      No articles found
                    </p>
                    <p style={{ fontSize: 12, color: "#333", marginTop: 4 }}>
                      {search ? "Try a different search term" : "Check back soon for updates"}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Featured */}
                    {featuredItem && (
                      <div style={{ marginBottom: 28 }}>
                        <FeaturedArticle
                          item={featuredItem}
                          href={getItemHref(featuredItem)}
                          title={getTitle(featuredItem)}
                          excerpt={buildExcerpt(featuredItem)}
                          date={formatDate(featuredItem)}
                          author={featuredItem.author}
                          cat={featuredItem.category || (featuredItem._type === "post" ? "Article" : "News")}
                        />
                      </div>
                    )}

                    {/* Grid */}
                    {restItems.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }} className="art-grid">
                        {restItems.map((item) => (
                          <ArticleCard
                            key={item.id}
                            item={item}
                            href={getItemHref(item)}
                            title={getTitle(item)}
                            excerpt={buildExcerpt(item)}
                            date={formatDate(item)}
                            cat={item.category || (item._type === "post" ? "Article" : "News")}
                            author={item.author}
                          />
                        ))}
                      </div>
                    )}

                    {/* Load more */}
                    {hasMore && (
                      <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
                        <button
                          onClick={() => setPage((p) => p + 1)}
                          style={{
                            padding: "10px 28px", fontSize: 11, fontWeight: 800,
                            textTransform: "uppercase", letterSpacing: "0.12em",
                            background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.25)",
                            color: GOLD, borderRadius: 3, cursor: "pointer",
                          }}
                        >
                          Load More Articles
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* ── SIDEBAR ── */}
              <aside style={{ width: 280, flexShrink: 0 }} className="news-sidebar">
                <div style={{ position: "sticky", top: 76 }}>

                  {/* Categories */}
                  <SideSection title="Categories">
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {CATEGORIES.filter(cat => cat === "All" || (catCounts[cat] ?? 0) > 0).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setActiveCat(cat)}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "7px 8px", borderRadius: 3, cursor: "pointer",
                            background: activeCat === cat ? "rgba(245,166,35,0.08)" : "transparent",
                            border: `1px solid ${activeCat === cat ? "rgba(245,166,35,0.2)" : "transparent"}`,
                            transition: "all 0.15s",
                          }}
                        >
                          <span style={{ fontSize: 12, color: activeCat === cat ? GOLD : "rgba(255,255,255,0.5)", fontWeight: activeCat === cat ? 700 : 500 }}>{cat}</span>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{catCounts[cat] || 0}</span>
                        </button>
                      ))}
                    </div>
                  </SideSection>

                  {/* Popular topics */}
                  <SideSection title="Quick Access">
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {[
                        { label: "All Events",      href: "/events" },
                        { label: "Weapons DB",      href: "/weapons" },
                        { label: "Rank Calculator", href: "/ranks" },
                        { label: "Game Modes",      href: "/modes" },
                        { label: "Mercenaries",     href: "/mercenaries" },
                      ].map(({ label, href }) => (
                        <Link key={href} href={href}>
                          <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "7px 6px", borderRadius: 3, cursor: "pointer",
                          }} className="side-link">
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{label}</span>
                            <ChevronRight size={12} color="rgba(255,255,255,0.2)" />
                          </div>
                        </Link>
                      ))}
                    </div>
                    <style>{`.side-link:hover{background:rgba(255,255,255,0.04)!important;}`}</style>
                  </SideSection>

                  {/* Stats */}
                  <SideSection title="Wiki Stats">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      {[
                        { label: "Articles", value: String(allItems.length) },
                        { label: "Weapons",  value: "3,589" },
                        { label: "Maps",     value: "312" },
                        { label: "Events",   value: String(eventsData?.total || 0) },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ padding: "8px 10px", background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 4 }}>
                          <p style={{ fontSize: 15, fontWeight: 800, color: GOLD, margin: 0, letterSpacing: "-0.02em" }}>{value}</p>
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                        </div>
                      ))}
                    </div>
                  </SideSection>

                  {/* About */}
                  <SideSection title="About This Wiki">
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 10px", lineHeight: 1.7 }}>
                      CrossFire Wiki is the most complete community resource for CrossFire players worldwide.
                    </p>
                    <Link href="/about">
                      <span style={{ fontSize: 12, color: GOLD, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                        Learn More <ChevronRight size={12} />
                      </span>
                    </Link>
                  </SideSection>
                </div>
              </aside>
            </div>
          )}

          <style>{`
            @media(max-width:1024px){.news-sidebar{display:none!important;}}
            @media(max-width:700px){.art-grid{grid-template-columns:1fr!important;}}
            @media(max-width:900px){.art-grid{grid-template-columns:repeat(2,1fr)!important;}}
          `}</style>
        </div>
      </div>
    </>
  );
}
