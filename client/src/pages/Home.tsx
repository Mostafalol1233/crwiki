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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThumbsUp, Calendar, Play, ExternalLink, Flame, TrendingUp, Sparkles } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import tutorialImage from "@assets/generated_images/Tutorial_article_cover_image_2152de25.png";
import type { Tutorial } from "@shared/mongodb-schema";

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

  const { data: allTutorials = [] } = useQuery<Tutorial[]>({
    queryKey: ["tutorials"],
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/80">
      <HeroSection post={heroPost} />

      {allEvents.length > 0 && <EventsRibbon events={allEvents} />}

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
        {/* Featured & Trending Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
          {/* Trending News Card */}
          {allNews.length > 0 && (
            <div className="lg:col-span-1">
              <Link href={`/news/${allNews[0]?.id}`} className="block h-full">
                <Card className="hover-elevate cursor-pointer h-full overflow-hidden group bg-gradient-to-br from-card to-card/50 border-primary/20 hover:border-primary/50 transition-all duration-300">
                  <div className="relative aspect-[3/4] overflow-hidden bg-muted/30">
                    <img src={allNews[0]?.image} alt={allNews[0]?.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Flame className="h-4 w-4 text-red-500" />
                        <Badge variant="destructive" className="text-xs">Trending</Badge>
                      </div>
                      <h3 className="font-bold text-white line-clamp-3 text-sm">{allNews[0]?.title}</h3>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          )}

          {/* Top 2 Featured Posts */}
          {allPosts.filter(p => p.featured).slice(0, 2).map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`} className="block">
              <Card className="hover-elevate cursor-pointer h-full overflow-hidden group bg-gradient-to-br from-card to-card/50 border-amber-500/20 hover:border-amber-500/50 transition-all duration-300">
                <div className="relative aspect-video overflow-hidden bg-muted/30">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2 left-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <Badge variant="secondary" className="text-xs bg-amber-500/80 text-white">Featured</Badge>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="line-clamp-2 text-base group-hover:text-primary transition-colors">{post.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{post.readingTime} min read</span>
                    <span>•</span>
                    <span>{post.date}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          <main className="lg:col-span-8 space-y-8 md:space-y-12">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl md:text-3xl font-semibold flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  {t("categories")}
                </h2>
              </div>

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
            {allNews.length > 1 && (
              <div className="space-y-4 pt-12 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl md:text-3xl font-semibold">{t("news")}</h2>
                  <Link href="/category/news">
                    <Button variant="ghost" size="sm" className="hover:text-primary">
                      View All →
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allNews.slice(1, 7).map((item: any) => (
                    <Link key={item.id} href={`/news/${item.id}`} className="block" data-testid={`home-news-${item.id}`}>
                      <div className="hover-elevate transition-all bg-gradient-to-b from-card to-card/50 rounded-lg overflow-hidden border border-border/50 hover:border-primary/50">
                        <div className="relative aspect-[16/9] overflow-hidden bg-muted/30">
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                          {item.category && (
                            <div className="absolute top-2 right-2">
                              <Badge variant="secondary" className="text-xs">
                                {item.category}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">{item.title}</h3>
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

            {/* Featured Tutorials Section */}
            {allTutorials.length > 0 && (
              <div className="space-y-4 pt-12 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl md:text-3xl font-semibold">Featured Tutorials</h2>
                  <Link href="/tutorials">
                    <Button variant="ghost" size="sm" className="hover:text-primary">
                      View All →
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allTutorials.slice(0, 6).map((tutorial) => (
                    <Link key={tutorial.id} href={`/tutorials/${tutorial.id}`} className="block">
                      <Card className="hover-elevate cursor-pointer h-full group bg-gradient-to-br from-card to-card/50 border-border/50 hover:border-primary/50 transition-all duration-300">
                        <div className="aspect-video w-full bg-black rounded-t-lg overflow-hidden relative">
                          <img
                            src={`https://img.youtube.com/vi/${tutorial.youtubeId}/maxresdefault.jpg`}
                            alt={tutorial.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${tutorial.youtubeId}/default.jpg`;
                            }}
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                            <Play className="h-12 w-12 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <CardHeader>
                          <CardTitle className="line-clamp-2 text-lg group-hover:text-primary transition-colors">
                            {tutorial.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {tutorial.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                              {tutorial.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <ThumbsUp className="h-4 w-4" />
                                <span>{tutorial.likes || 0}</span>
                              </div>
                              {tutorial.createdAt && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{new Date(tutorial.createdAt).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              Tutorial
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Latest Reviews posts (posts with category 'Reviews') */}
            {allPosts.some(p => ((p.category || '').toLowerCase().trim().replace(/s$/, '')) === 'review') && (
              <div className="space-y-4 pt-12 border-t border-border/50">
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
