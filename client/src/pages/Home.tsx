import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { HeroSection } from "@/components/HeroSection";
import { ArticleCard, type Article } from "@/components/ArticleCard";
import { EventsRibbon, type Event } from "@/components/EventsRibbon";
import { CategoryFilter, type Category } from "@/components/CategoryFilter";
import { SearchBar } from "@/components/SearchBar";
import { Sidebar } from "@/components/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageProvider";
import tutorialImage from "@assets/generated_images/Tutorial_article_cover_image_2152de25.png";

export default function Home() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");

  const { data: allPosts = [] } = useQuery<Article[]>({
    queryKey: ["/api/posts"],
  });

  const { data: allEvents = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: allNews = [] } = useQuery<any[]>({
    queryKey: ["/api/news"],
  });

  const heroPost = allPosts.find((p) => p.featured) || {
    id: "1",
    title: "Welcome to Bimora Gaming Blog",
    summary:
      "Your source for CrossFire gaming news, character guides, and community updates. Create your first post in the admin dashboard!",
    category: "Tutorials",
    image: tutorialImage,
    author: "Bimora Team",
    date: "Today",
    readingTime: 1,
    views: 0,
    tags: ["Welcome", "Getting Started"],
  };

  const filteredArticles = useMemo(() => {
    return allPosts.filter((article) => {
      // Category filter
      const matchesCategory = selectedCategory === "all" || 
        (selectedCategory === "tutorials" && article.category.toLowerCase() === "tutorials") ||
        (selectedCategory === "events" && article.category.toLowerCase() === "events") ||
        (selectedCategory === "news" && article.category.toLowerCase() === "news");
      
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (article.tags && article.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        ));
      
      return matchesCategory && matchesSearch;
    });
  }, [allPosts, searchQuery, selectedCategory]);

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
      if (post.tags) {
        post.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
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

  return (
    <div className="min-h-screen">
      <HeroSection post={heroPost} />

      {allEvents.length > 0 && <EventsRibbon events={allEvents} />}

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          <main className="lg:col-span-8 space-y-8 md:space-y-12">
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-semibold">
                {t("categories")}
              </h2>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <SearchBar value={searchQuery} onChange={setSearchQuery} />
                </div>
              </div>

              <CategoryFilter
                activeCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                useNavigation={false}
              />
            </div>

            {filteredArticles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No articles found matching your criteria.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {filteredArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}

            {/* News section (show latest news on main page) */}
            {allNews.length > 0 && (
              <div className="space-y-4 pt-12">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl md:text-3xl font-semibold">{t("news")}</h2>
                  <Link href="/category/news">
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allNews.slice(0, 6).map((item: any) => (
                    <Link key={item.id} href={`/news/${item.id}`} className="block" data-testid={`home-news-${item.id}`}>
                      <div className="hover-elevate transition-all bg-card rounded-lg overflow-hidden">
                        <div className="relative aspect-[16/9] overflow-hidden bg-muted/30">
                          <img src={item.image} alt={item.title} className="w-full h-full object-contain" />
                          {item.category && (
                            <div className="absolute top-2 right-2">
                              <Badge variant="secondary" className="text-xs">
                                {item.category}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold line-clamp-2">{item.title}</h3>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.content?.substring(0, 120) || ''}...</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span>{item.dateRange}</span>
                            {item.author && <span>• {item.author}</span>}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Latest Reviews posts (posts with category 'Reviews') */}
            {allPosts.some(p => ((p.category || '').toLowerCase().trim().replace(/s$/, '')) === 'review') && (
              <div className="space-y-4 pt-12">
                <h2 className="text-2xl md:text-3xl font-semibold">{t("reviews")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {allPosts.filter(p => ((p.category || '').toLowerCase().trim().replace(/s$/, '')) === 'review').slice(0,4).map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </div>
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
  );
}
