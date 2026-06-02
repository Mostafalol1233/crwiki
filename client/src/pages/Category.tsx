import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArticleCard, type Article } from "@/components/ArticleCard";
import { Sidebar } from "@/components/Sidebar";
import { useLanguage } from "@/components/LanguageProvider";
import { CategoryFilter, type Category } from "@/components/CategoryFilter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";
import PageSEO from "@/components/PageSEO";
import { getPosts, getEvents, getNews } from "@/lib/supabaseApi";

export default function Category() {
  const { t } = useLanguage();
  const { category } = useParams<{ category: string }>();

  const cap = 200;

  const { data: postsResp, isLoading } = useQuery<{ items: Article[]; total: number }>({
    queryKey: ["/api/posts", "category-cap"],
    queryFn: () => getPosts({ limit: cap }),
  });
  const allPosts = postsResp?.items || [];

  const { data: allEvents = [] } = useQuery<any[]>({
    queryKey: ["/api/events", "category-cap"],
    queryFn: async () => {
      const { items } = await getEvents({ limit: cap });
      return items;
    }
  });

  const { data: allNews = [] } = useQuery<any[]>({
    queryKey: ["/api/news", "category-cap"],
    queryFn: async () => {
      const { items } = await getNews({ limit: cap });
      return items;
    }
  });

  const filteredArticles = useMemo(() => {
    if (!category) return [];
    // normalize categories (case-insensitive, trim, treat singular/plural as equal)
    const normalize = (s: string) => (s || "").toLowerCase().trim().replace(/s$/, "");
    const target = normalize(category);

    return allPosts.filter((article) => {
      return normalize(article.category) === target;
    });
  }, [allPosts, category]);

  const recentPosts = useMemo(() => {
    return allPosts.slice(0, 3).map((post) => ({
      id: post.id,
      post_slug: post.post_slug,
      title: post.title,
      image: post.image,
      date: post.date,
    }));
  }, [allPosts]);

  const popularTags = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    allPosts.forEach((post) => {
      post.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [allPosts]);

  const mostViewed = useMemo(() => {
    return [...allPosts]
      .sort((a, b) => b.views - a.views)
      .slice(0, 3)
      .map((post) => ({
        id: post.id,
        post_slug: post.post_slug,
        title: post.title,
        views: post.views,
      }));
  }, [allPosts]);

  const bimoraPicks = useMemo(() => {
    return allPosts
      .filter((post) => post.featured)
      .slice(0, 2)
      .map((post) => ({
        id: post.id,
        post_slug: post.post_slug,
        title: post.title,
        image: post.image,
        date: post.date,
      }));
  }, [allPosts]);

  const categoryTitle = category
    ? category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
    : "";

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
          <div className="text-center">
            <p className="text-muted-foreground">{t("loading") || "Loading..."}</p>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = typeof window !== "undefined" && !!localStorage.getItem("adminToken");

  return (
    <>
      <PageSEO
        title={`Category — ${categoryTitle} | CrossFire Wiki`}
        description={`Browse ${categoryTitle} articles and updates.`}
        canonicalPath={`/category/${category || ""}`}
      />
      <div className="min-h-screen">
      <div className="w-full max-w-[1600px] mx-auto px-4 md:px-10 py-8 md:py-14">
        <div className={`grid grid-cols-1 ${isAdmin ? "lg:grid-cols-12" : ""} gap-8 md:gap-12`}>
          <main className={`${isAdmin ? "lg:col-span-8" : ""} space-y-8 md:space-y-12`}>
            <div className="space-y-6">
              <h1 
                className="text-3xl md:text-5xl font-bold"
                data-testid="heading-category"
              >
                {categoryTitle}
              </h1>
              
              <p 
                className="text-muted-foreground"
                data-testid="text-category-description"
              >
                {t("browsing")} {categoryTitle.toLowerCase()} {t("articles")}
              </p>
              
              <CategoryFilter
                activeCategory={category?.toLowerCase() as Category || "all"}
                useNavigation={true}
              />
            </div>

            {/* Show Events if category is Events */}
            {category?.toLowerCase() === "events" && allEvents.length > 0 && (
              <div className="space-y-5">
                {/* Featured first event */}
                {(() => {
                  const [featured, ...rest] = allEvents;
                  const FALLBACK = "https://files.catbox.moe/wof38b.jpeg";
                  return (
                    <>
                      {featured && (
                        <Link href={featured.event_name_slug ? `/events/${featured.event_name_slug}` : `/events/${featured.id}`} className="group block">
                          <div className="relative overflow-hidden rounded-2xl h-96 md:h-[520px] cursor-pointer">
                            <img
                              src={featured.image || featured.imageUrl || FALLBACK}
                              alt={featured.title}
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              onError={(e) => { const i = e.currentTarget; if (i.src !== FALLBACK) i.src = FALLBACK; }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                            <div className="absolute top-4 left-4">
                              <Badge className="bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-2.5 py-1">
                                {featured.type === "upcoming" ? "Upcoming" : "Featured"}
                              </Badge>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                              <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-2">{featured.date}</p>
                              <h3 className="text-white font-black text-2xl md:text-4xl uppercase tracking-tight leading-tight line-clamp-2 drop-shadow-lg">
                                {featured.title}
                              </h3>
                              {featured.description && (
                                <p className="text-white/60 text-sm mt-2 line-clamp-2">
                                  {featured.description.replace(/<[^>]*>/g, '').substring(0, 120)}
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      )}
                      {rest.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {rest.map((event: any) => (
                            <Link key={event.id} href={event.event_name_slug ? `/events/${event.event_name_slug}` : `/events/${event.id}`} className="group block">
                              <div className="relative overflow-hidden rounded-xl aspect-video cursor-pointer border border-border/30 hover:border-primary/40 transition-colors">
                                <img
                                  src={event.image || event.imageUrl || FALLBACK}
                                  alt={event.title}
                                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  onError={(e) => { const i = e.currentTarget; if (i.src !== FALLBACK) i.src = FALLBACK; }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />
                                <div className="absolute top-2.5 left-2.5">
                                  <span className="bg-primary/80 text-primary-foreground text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm">
                                    {event.type === "upcoming" ? "Upcoming" : "Event"}
                                  </span>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                                  <h3 className="text-white font-black text-sm uppercase tracking-tight line-clamp-2 leading-snug">
                                    {event.title}
                                  </h3>
                                  <p className="text-white/40 text-[10px] font-bold mt-1 uppercase tracking-widest flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {event.date}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* Show News if category is News */}
            {category?.toLowerCase() === "news" && allNews.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">News</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allNews.map((item: any) => (
                    <Link key={item.id} href={`/news/${item.id}`} className="block">
                      <Card className="h-full hover-elevate transition-all">
                        <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg bg-muted/30">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover rounded-xl"
                          />
                          {item.featured && (
                            <Badge variant="default" className="absolute top-2 left-2">
                              {t("featured")}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="absolute top-2 right-2">
                            {item.category}
                          </Badge>
                        </div>
                        <CardContent className="p-6">
                          <h3 className="text-xl font-semibold mb-2 line-clamp-2">{item.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                            <Calendar className="h-3 w-3" />
                            <span>{item.dateRange}</span>
                            <span>•</span>
                            <User className="h-3 w-3" />
                            <span>{item.author}</span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {item.content?.replace(/<[^>]*>/g, '').substring(0, 150)}...
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Show Posts/Articles for other categories */}
            {category?.toLowerCase() !== "events" && category?.toLowerCase() !== "news" && (
              <>
                {filteredArticles.length === 0 ? (
                  <div 
                    className="text-center py-12"
                    data-testid="container-no-posts"
                  >
                    <p className="text-muted-foreground">
                      {t("noArticlesFound") || `No ${categoryTitle.toLowerCase()} articles found.`}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {filteredArticles.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                )}
              </>
            )}
          </main>

          {isAdmin && (
            <aside className="lg:col-span-4">
              <div className="lg:sticky lg:top-24">
                <Sidebar
                  recentPosts={recentPosts}
                  popularTags={popularTags}
                  mostViewed={mostViewed}
                  bimoraPicks={bimoraPicks}
                />
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
