import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { Link } from "wouter";
import { useMemo, useState, useEffect } from "react";
import { getPosts } from "@/lib/supabaseApi";
import PageSEO from "@/components/PageSEO";
import ContentImage from "@/components/ContentImage";
import { Loader2, BookOpen, ChevronRight, User, Clock, Star } from "lucide-react";

interface PostItem {
  id: string;
  title: string;
  date?: string;
  image: string;
  category: string;
  content: string;
  summary?: string;
  author: string;
  featured?: boolean;
  post_slug?: string;
}

const CAT_COLORS: Record<string, string> = {
  tutorials: "#818cf8",
  events: "#f5a623",
  weapons: "#f87171",
  news: "#4ade80",
  guides: "#38bdf8",
  article: "#a78bfa",
  updates: "#fbbf24",
};

function getCatColor(cat?: string): string {
  const key = (cat || "").toLowerCase();
  return CAT_COLORS[key] || "#888";
}

const FALLBACK = "/portal/modes.jpg";

export default function Posts() {
  const { t } = useLanguage();
  const [page, setPage] = useState(1);
  const limit = 12;
  const [allLoadedPosts, setAllLoadedPosts] = useState<any[]>([]);

  const { data: postsData, isLoading } = useQuery<{ items: any[]; total: number }>({
    queryKey: ["/api/posts", page],
    queryFn: () => getPosts({ limit, offset: (page - 1) * limit }),
  });

  const total = postsData?.total || 0;

  useEffect(() => {
    const items = postsData?.items;
    if (!Array.isArray(items) || !items.length) return;
    setAllLoadedPosts((prev) => {
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
  }, [postsData?.items]);

  const hasMore = allLoadedPosts.length < total;

  const allPosts = useMemo(() => {
    return [...allLoadedPosts].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    }) as PostItem[];
  }, [allLoadedPosts]);

  const featuredPost = allPosts[0];
  const restPosts = allPosts.slice(1);

  return (
    <>
      <PageSEO
        title="Posts — CrossFire Wiki"
        description="Browse CrossFire posts, guides, and tutorials from our community and editors."
        canonicalPath="/posts"
      />

      <div className="min-h-screen py-10 md:py-14" style={{ background: "var(--background)" }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8">

          {/* ── Header ── */}
          <div className="mb-8 flex items-center gap-3">
            <div className="p-2.5 rounded" style={{ background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.25)" }}>
              <BookOpen className="h-6 w-6" style={{ color: "#f5a623" }} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-0.5" style={{ color: "#f5a623" }}>Community</p>
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
                {t("posts") || "Posts"}
              </h1>
            </div>
          </div>

          {isLoading && allLoadedPosts.length === 0 ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#f5a623" }} />
            </div>
          ) : allPosts.length === 0 ? (
            <div className="py-20 text-center" style={{ border: "1px dashed rgba(255,255,255,0.06)", borderRadius: "4px" }}>
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-20" style={{ color: "#f5a623" }} />
              <p className="text-sm font-bold uppercase tracking-widest" style={{ color: "#444" }}>No posts yet — check back soon</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* ── Featured post (large) ── */}
              {featuredPost && (
                <Link href={`/posts/${featuredPost.post_slug || featuredPost.id}`} className="group block">
                  <div
                    className="relative overflow-hidden"
                    style={{ background: "var(--card)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "4px", boxShadow: "0 4px 30px rgba(245,166,35,0.06)" }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(to right, #f5a623, transparent)" }} />

                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-[55%] relative overflow-hidden" style={{ background: "hsl(var(--muted))", minHeight: "260px" }}>
                        <ContentImage
                          src={featuredPost.image || FALLBACK}
                          alt={featuredPost.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          style={{ minHeight: "260px" }}
                        />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, transparent, var(--card))" }} />
                        {featuredPost.featured && (
                          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 text-[8px] font-black uppercase tracking-widest" style={{ background: "#f5a623", color: "#000" }}>
                            <Star className="h-2.5 w-2.5" /> Featured
                          </div>
                        )}
                      </div>

                      <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-3">
                          <span
                            className="text-[8px] font-black uppercase tracking-widest px-2 py-1"
                            style={{ background: `${getCatColor(featuredPost.category)}15`, color: getCatColor(featuredPost.category), borderRadius: "2px" }}
                          >
                            {featuredPost.category}
                          </span>
                          {featuredPost.date && (
                            <span className="text-[9px]" style={{ color: "#555" }}>{featuredPost.date}</span>
                          )}
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight mb-3 line-clamp-3" style={{ color: "var(--foreground)" }}>
                          {featuredPost.title}
                        </h2>
                        {featuredPost.summary && (
                          <p className="text-sm leading-relaxed line-clamp-2 mb-4" style={{ color: "#666" }}>{featuredPost.summary}</p>
                        )}
                        <div className="flex items-center gap-4">
                          {featuredPost.author && (
                            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: "#555" }}>
                              <User className="h-3 w-3" /> {featuredPost.author}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-all group-hover:gap-2.5" style={{ color: "#f5a623" }}>
                            Read More <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* ── Remaining posts grid ── */}
              {restPosts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {restPosts.map((post) => (
                    <Link key={post.id} href={`/posts/${post.post_slug || post.id}`} className="group block">
                      <div
                        className="h-full overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
                        style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "3px", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}
                      >
                        {/* Image */}
                        <div className="relative overflow-hidden aspect-[16/9]" style={{ background: "hsl(var(--muted))" }}>
                          <ContentImage
                            src={post.image || FALLBACK}
                            alt={post.title}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          <div
                            className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: `linear-gradient(to right, ${getCatColor(post.category)}, transparent)` }}
                          />
                          {post.featured && (
                            <div
                              className="absolute top-2 left-2 text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 flex items-center gap-1"
                              style={{ background: "#f5a623", color: "#000" }}
                            >
                              <Star className="h-2 w-2" /> Featured
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-3.5">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5"
                              style={{ background: `${getCatColor(post.category)}12`, color: getCatColor(post.category), borderRadius: "2px" }}
                            >
                              {post.category}
                            </span>
                            {post.date && <span className="text-[9px]" style={{ color: "#444" }}>{post.date}</span>}
                          </div>
                          <h3 className="font-black text-sm uppercase tracking-tight leading-snug line-clamp-2 mb-1.5" style={{ color: "var(--foreground)" }}>
                            {post.title}
                          </h3>
                          {post.author && (
                            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider" style={{ color: "#555" }}>
                              <User className="h-2.5 w-2.5" /> {post.author}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* ── Load more ── */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2.5 text-[11px] font-black uppercase tracking-wider transition-all hover:brightness-110 disabled:opacity-50"
                    style={{ background: "var(--card)", color: "#f5a623", border: "1px solid rgba(245,166,35,0.25)", borderRadius: "3px" }}
                  >
                    {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    {t("readMorePosts") || "Load More Posts"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
