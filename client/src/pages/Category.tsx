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

export default function Category() {
  const { t } = useLanguage();
  const { category } = useParams<{ category: string }>();

  const { data: allPosts = [], isLoading } = useQuery<Article[]>({
    queryKey: ["/api/posts"],
  });

  const { data: allEvents = [] } = useQuery<any[]>({
    queryKey: ["/api/events"],
  });

  const { data: allNews = [] } = useQuery<any[]>({
    queryKey: ["/api/news"],
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

  return (
    <>
      <PageSEO
        title={`Category — ${categoryTitle} | CrossFire Wiki`}
        description={`Browse ${categoryTitle} articles and updates.`}
        canonicalPath={`/category/${category || ""}`}
      />
      <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          <main className="lg:col-span-8 space-y-8 md:space-y-12">
            <div className="space-y-6">
              <h1 
                className="text-3xl md:text-4xl font-bold"
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
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {allEvents.map((event: any) => (
                    <Link key={event.id} href={`/events/${event.id}`} className="block">
                      <Card className="h-full hover-elevate transition-all">
                        {event.image && (
                          <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg bg-muted/30">
                            <img
                              src={event.image}
                              alt={event.title}
                              className="w-full h-full object-contain"
                            />
                            <Badge
                              variant={event.type === "upcoming" ? "default" : "secondary"}
                              className="absolute top-2 right-2"
                            >
                              {event.type}
                            </Badge>
                          </div>
                        )}
                        <CardContent className="p-6">
                          <h3 className="text-xl font-semibold mb-2 line-clamp-2">{event.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <Calendar className="h-4 w-4" />
                            <span>{event.date}</span>
                          </div>
                          {event.description && (
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {event.description.replace(/<[^>]*>/g, '').substring(0, 150)}...
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
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
                            className="w-full h-full object-contain"
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
        </div>
      </div>
    </div>
    </>
  );
}
