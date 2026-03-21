import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/LanguageProvider";
import { Globe } from "lucide-react";
import { Link } from "wouter";
import { useMemo, useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import PageSEO from "@/components/PageSEO";
import { ImageIcon } from "lucide-react";

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
};

type NewsItemNews = NewsItemBase & {
  type: 'news';
  titleAr?: string;
  contentAr?: string;
};

type NewsItemPost = NewsItemBase & {
  type: 'post';
};

type NewsItem = NewsItemNews | NewsItemPost;

export default function News() {
  const { t, language, toggleLanguage } = useLanguage();

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
      item?.content ||
      "";
    return String(raw).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);
  };

  const [page, setPage] = useState(1);
  const limit = 20;

  const [allLoadedNews, setAllLoadedNews] = useState<NewsItem[]>([]);
  const [allLoadedPosts, setAllLoadedPosts] = useState<any[]>([]);

  const { data: newsData, isLoading: newsLoading, error: newsError } = useQuery<{ items: NewsItem[], total: number }>({
    queryKey: ["/api/news", page],
    queryFn: () => apiRequest(`/api/news?limit=${limit}&offset=${(page - 1) * limit}`, "GET"),
    staleTime: 5 * 60 * 1000,
  });
  const newsItems = allLoadedNews;
  const total = newsData?.total || 0;

  const hasMore = newsItems.length < total;

  const { data: postsData, isLoading: postsLoading, error: postsError } = useQuery<{ items: any[], total: number }>({
    queryKey: ["/api/posts", "news-page"],
    queryFn: () => apiRequest("/api/posts?limit=50&offset=0", "GET"),
    staleTime: 5 * 60 * 1000,
  });
  const posts = allLoadedPosts;

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
    const newsWithType = newsItems.map(item => ({ ...item, type: 'news' as const }));
    const postsWithType = posts.map(post => ({
      id: post.id,
      title: post.title,
      dateRange: post.date || 'Recent',
      image: post.image,
      category: post.category,
      content: post.content,
      summary: post.summary,
      author: post.author,
      featured: post.featured,
      post_slug: post.post_slug,
      type: 'post' as const
    }));

    return [...newsWithType, ...postsWithType].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
  }, [newsItems, posts]);

  const grouped = useMemo(() => {
    const map = new Map<string, NewsItem[]>();
    const getKey = (item: any) => {
      const d = (item as any).createdAt ? new Date((item as any).createdAt) : new Date();
      return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    };
    for (const it of allNews) {
      const k = getKey(it as any);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(it);
    }
    return Array.from(map.entries()).sort((a, b) => {
      const ad = new Date(a[0] + ' 1');
      const bd = new Date(b[0] + ' 1');
      return bd.getTime() - ad.getTime();
    });
  }, [allNews]);

  if (newsLoading || postsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-muted-foreground">{t("loading")}</div>
      </div>
    );
  }
  if (newsError || postsError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-destructive">Error loading</div>
      </div>
    );
  }

  return (
    <>
      <PageSEO
        title={"News & Updates — CrossFire Wiki"}
        description={"Latest CrossFire news, posts, and updates from the community and official sources."}
        canonicalPath="/news"
      />
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20" dir={language === "ar" ? "rtl" : "ltr"}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
          <div className="flex items-center justify-between mb-12">
            <h1 className="text-3xl md:text-4xl font-bold">
              {t("newsAndUpdates")}
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              title={language === "en" ? "العربية" : "English"}
              aria-label={language === "en" ? "Switch to Arabic" : "Switch to English"}
              className="rounded-none"
              data-testid="button-language-toggle-news"
            >
              <Globe className="h-5 w-5" />
            </Button>
          </div>
          <div className="space-y-12 mb-12">
            {grouped.map(([group, items]) => (
              <div key={group}>
                <div className="sticky top-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mb-4">
                  <h2 className="text-2xl font-bold py-3">{group}</h2>
                </div>
                <div className="space-y-6">
                  {items.map((item) => {
                    const href = item.type === 'post' ? `/posts/${(item as any).post_slug || item.id}` : `/news/${(item as any).news_slug || item.id}`;
                    const titleText = language === "ar" && "titleAr" in item && item.titleAr ? item.titleAr : item.title;
                    const dateText = (() => {
                      const raw = (item as any).createdAt || item.dateRange || (item as any).date;
                      const d = raw && !isNaN(Date.parse(raw)) ? new Date(raw) : null;
                      try {
                        return d ? new Intl.DateTimeFormat(language === 'ar' ? 'ar' : undefined, { year: 'numeric', month: 'long', day: 'numeric' }).format(d) : (item.dateRange || '');
                      } catch {
                        return item.dateRange || '';
                      }
                    })();
                    const gradientClass = (() => {
                      const cat = String((item as any).category || '').toLowerCase();
                      if (cat.includes('fire')) return 'bg-gradient-to-r from-red-600 via-orange-500 to-yellow-300 text-transparent bg-clip-text drop-shadow';
                      if (cat.includes('ice') || cat.includes('snow')) return 'bg-gradient-to-r from-blue-500 via-indigo-400 to-white text-transparent bg-clip-text drop-shadow';
                      return 'bg-gradient-to-r from-indigo-500 via-blue-400 to-white text-transparent bg-clip-text drop-shadow';
                    })();
                    return (
                      <Link key={item.id} href={href}>
                        <Card
                          className="overflow-hidden border border-border/60 bg-card/70 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                          data-testid={`card-news-${item.id}`}
                        >
                          <div className="grid gap-4 p-4 md:grid-cols-[220px_minmax(0,1fr)] md:p-5">
                            <div className="relative overflow-hidden rounded-xl border bg-muted/30 aspect-[16/10]">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={titleText}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                  <ImageIcon className="h-8 w-8" />
                                </div>
                              )}
                              {item.featured && (
                                <Badge className="absolute left-3 top-3">Featured</Badge>
                              )}
                            </div>

                            <div className={`space-y-3 ${language === 'ar' ? 'text-right' : ''}`}>
                              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                                <Badge variant="outline">{item.type === "post" ? "Article" : item.category || "News"}</Badge>
                                <span className={`date-text ${gradientClass}`}>{dateText}</span>
                              </div>
                              <h3 className="text-xl font-semibold md:text-2xl">{titleText}</h3>
                              <p className="text-sm leading-6 text-muted-foreground">
                                {buildExcerpt(item) || "Open this update to read the full story, official details, and related CrossFire coverage."}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">{normalizeAuthor(item.author)}</span>
                                <span>•</span>
                                <span>{item.type === "post" ? "Editorial" : "News Update"}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
                <div className="border-t mt-8" />
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <Button
                size="lg"
                variant="outline"
                className="backdrop-blur-sm"
                onClick={() => setPage(p => p + 1)}
                data-testid="button-read-more-news"
              >
                {t("readMoreNews").toUpperCase()}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
