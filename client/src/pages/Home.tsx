import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { HeroSection } from "@/components/HeroSection";
import { ArticleCard, type Article } from "@/components/ArticleCard";
import { EventsRibbon } from "@/components/EventsRibbon";
import { Sidebar } from "@/components/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThumbsUp, Calendar, Play, ExternalLink, Flame, Sparkles } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import tutorialImage from "@assets/generated_images/Tutorial_article_cover_image_2152de25.png";
import type { Tutorial } from "@shared/mongodb-schema";

export default function Home() {
  const { t } = useLanguage();

  const { data: allPosts = [] } = useQuery<Article[]>({
    queryKey: ["/api/posts"],
  });

  const { data: allEvents = [] } = useQuery<any[]>({
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
    title: "Bimora Gaming — Quick, Simple & Massive",
    summary:
      "Play CrossFire with the ultimate Bimora hub for news, events, guides and community highlights. Jump in and start exploring now.",
    category: "Tutorials",
    image: tutorialImage,
    author: "Bimora Team",
    date: "Today",
    readingTime: 1,
    views: 0,
    tags: ["Welcome", "Getting Started"],
  };

  const hasFeaturedPost = allPosts.some((p) => p.featured);

  const showPortalSections = false;

  const latestArticles = useMemo(() => {
    return allPosts.slice(0, 4);
  }, [allPosts]);

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
    <div className="relative min-h-screen bg-gradient-to-b from-background via-background to-background/80">
      {/* Fire sparks / glow at the edges of the interface */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-24 w-72 h-72 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.9),transparent_60%)] opacity-40 blur-3xl mix-blend-screen fire-glow-strong" />
        <div className="absolute -bottom-32 -right-24 w-80 h-80 bg-[radial-gradient(circle_at_center,rgba(252,211,77,0.9),transparent_60%)] opacity-40 blur-3xl mix-blend-screen fire-glow-soft" />
        <div className="absolute top-1/2 -right-10 w-40 h-40 bg-[radial-gradient(circle_at_center,rgba(248,250,252,0.45),transparent_70%)] opacity-30 blur-2xl mix-blend-screen fire-glow-flicker" />
      </div>

      <HeroSection post={heroPost} isPlaceholder={!hasFeaturedPost} />

      {allEvents.length > 0 && <EventsRibbon events={allEvents} />}

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">

        {allEvents.length > 0 && (
          <section className="space-y-4 mb-12">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl md:text-3xl font-semibold flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                Featured Events
              </h2>
              <Link href="/category/events">
                <Button variant="ghost" size="sm" className="hover:text-primary">
                  View All →
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Left: Featured + below items */}
              <div className="md:col-span-2 flex flex-col gap-4">
                {allEvents[0] && (
                  <Link href={`/events/${allEvents[0].id}`} className="block" data-testid={`home-event-featured-${allEvents[0].id}`}>
                    <Card className="relative overflow-hidden group hover-elevate transition-all duration-300 cursor-pointer bg-card border-border/60 h-full">
                      <div className="relative w-full h-full min-h-[420px] md:min-h-[520px] overflow-hidden rounded-md">
                        {allEvents[0].image && (
                          <img
                            src={allEvents[0].image}
                            alt={allEvents[0].title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                        {/* Gentle bottom gradient only (reduced opacity so image stays clear) */}
                        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute top-3 left-3 flex items-center gap-1">
                          {allEvents[0].type && (
                            <Badge className="backdrop-blur-sm bg-primary/85 text-primary-foreground border-primary/20 text-[10px] uppercase font-bold">
                              {allEvents[0].type === "upcoming" ? "Upcoming" : "Trending"}
                            </Badge>
                          )}
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 p-2 text-white">
                          <h3 className="font-bold mb-1 text-lg md:text-xl line-clamp-3">
                            {allEvents[0].title}
                          </h3>
                          {allEvents[0].date && (
                            <p className="text-sm text-white/85 flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {allEvents[0].date}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                )}

                {/* Below the featured: show next few events in a compact grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {allEvents.slice(3, 9).map((event: any) => (
                    <Link href={`/events/${event.id}`} className="block" key={event.id} data-testid={`home-event-below-${event.id}`}>
                      <Card className="hover-elevate transition-all duration-300 cursor-pointer h-36 overflow-hidden bg-card border-border/50">
                        <div className="relative w-full h-full overflow-hidden rounded-md">
                          {event.image && (
                            <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                          <div className="absolute bottom-2 left-3 right-3 text-white">
                            <h4 className="font-semibold text-sm line-clamp-2">{event.title}</h4>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Right: two stacked equal cards */}
              <div className="md:col-span-1 flex flex-col gap-4">
                {allEvents.slice(1, 3).map((event: any) => (
                  <Link href={`/events/${event.id}`} className="block" key={event.id} data-testid={`home-event-right-${event.id}`}>
                    <Card className="relative overflow-hidden group hover-elevate transition-all duration-300 cursor-pointer bg-card border-border/60 h-52">
                      <div className="relative w-full h-full overflow-hidden rounded-md">
                        {event.image && (
                          <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/35 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <h4 className="font-semibold text-sm line-clamp-2">{event.title}</h4>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CrossFire-style feature strip */}
        <section className="space-y-6 mb-12">
          {/* Modes & Weapons feature tiles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Competitive Modes */}
            <Link href="/modes" className="block">
              <div className="relative h-40 md:h-52 lg:h-64 overflow-hidden rounded-md border border-border group">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage:
                      "url(https://z8games.akamaized.net/cfna/templates/assets/images/feature-comp.jpg)",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="relative h-full flex flex-col justify-end p-5 text-white">
                  <h4 className="text-xl md:text-2xl font-extrabold tracking-wide mb-3">
                    COMPETITIVE MODES
                  </h4>
                  <button
                    className="inline-flex items-center border border-white px-4 py-1.5 text-[11px] md:text-xs font-semibold tracking-wide uppercase bg-black/40 group-hover:bg-white/10 transition-colors"
                  >
                    Explore Modes
                  </button>
                </div>
              </div>
            </Link>

            {/* Weapons */}
            <Link href="/weapons" className="block">
              <div className="relative h-40 md:h-52 lg:h-64 overflow-hidden rounded-md border border-border group">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage:
                      "url(https://z8games.akamaized.net/cfna/web/image/feature-weap.jpg)",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="relative h-full flex flex-col justify-end p-5 text-white">
                  <h4 className="text-xl md:text-2xl font-extrabold tracking-wide mb-3">
                    WEAPONS
                  </h4>
                  <button
                    className="inline-flex items-center border border-white px-4 py-1.5 text-[11px] md:text-xs font-semibold tracking-wide uppercase bg-black/40 group-hover:bg-white/10 transition-colors"
                  >
                    Explore Weapons
                  </button>
                </div>
              </div>
            </Link>

            {/* Cooperative Modes */}
            <Link href="/modes" className="block">
              <div className="relative h-40 md:h-52 lg:h-64 overflow-hidden rounded-md border border-border group">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage:
                      "url(https://z8games.akamaized.net/cfna/templates/assets/images/feature-coop.jpg)",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="relative h-full flex flex-col justify-end p-5 text-white">
                  <h4 className="text-xl md:text-2xl font-extrabold tracking-wide mb-3">
                    COOPERATIVE MODES
                  </h4>
                  <button
                    className="inline-flex items-center border border-white px-4 py-1.5 text-[11px] md:text-xs font-semibold tracking-wide uppercase bg-black/40 group-hover:bg-white/10 transition-colors"
                  >
                    Explore Modes
                  </button>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {showPortalSections && (
          <>
        {/* Latest Updates portal-style section */}
        {(allNews.length > 0 || allEvents.length > 0 || allPosts.length > 0) && (
          <section className="mb-12 md:mb-16">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-2xl md:text-3xl font-semibold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-destructive" />
                Latest Updates
              </h2>
              <div className="hidden md:flex gap-3 text-xs md:text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Flame className="h-4 w-4 text-red-500" /> Hot news</span>
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> New events</span>
                <span className="flex items-center gap-1"><ExternalLink className="h-4 w-4" /> Latest articles</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {allNews[0] && (
                <Link href={`/news/${allNews[0].id}`} className="block" data-testid="home-latest-news">
                  <Card className="hover-elevate h-full group overflow-hidden bg-gradient-to-br from-card to-card/70 border-primary/20 hover:border-primary/60 transition-all duration-300">
                    <div className="relative aspect-[3/2] overflow-hidden bg-muted/30">
                      <img
                        src={allNews[0].image}
                        alt={allNews[0].title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-3 md:p-4">
                        <Badge variant="destructive" className="mb-1 text-[10px] md:text-xs">News</Badge>
                        <h3 className="font-semibold text-white text-sm md:text-base line-clamp-2">
                          {allNews[0].title}
                        </h3>
                        {allNews[0].dateRange && (
                          <span className="text-[10px] md:text-xs text-white/80 mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {allNews[0].dateRange}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              )}
              {allEvents[0] && (
                <Link href={`/events/${allEvents[0].id}`} className="block" data-testid="home-latest-event">
                  <Card className="hover-elevate h-full group overflow-hidden bg-gradient-to-br from-card to-card/70 border-primary/20 hover:border-primary/60 transition-all duration-300">
                    <div className="relative aspect-[3/2] overflow-hidden bg-muted/30">
                      <img
                        src={allEvents[0].image}
                        alt={allEvents[0].title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-3 md:p-4">
                        <Badge variant="secondary" className="mb-1 text-[10px] md:text-xs bg-primary/90 text-primary-foreground">Event</Badge>
                        <h3 className="font-semibold text-white text-sm md:text-base line-clamp-2">
                          {allEvents[0].title}
                        </h3>
                        {allEvents[0].date && (
                          <span className="text-[10px] md:text-xs text-white/80 mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {allEvents[0].date}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              )}
              {allPosts[0] && (
                <Link href={`/article/${allPosts[0].id}`} className="block" data-testid="home-latest-post">
                  <Card className="hover-elevate h-full group overflow-hidden bg-gradient-to-br from-card to-card/70 border-destructive/20 hover:border-destructive/60 transition-all duration-300">
                    <div className="relative aspect-[3/2] overflow-hidden bg-muted/30">
                      <img
                        src={allPosts[0].image}
                        alt={allPosts[0].title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-3 md:p-4">
                        <Badge variant="secondary" className="mb-1 text-[10px] md:text-xs bg-destructive/90 text-white">Article</Badge>
                        <h3 className="font-semibold text-white text-sm md:text-base line-clamp-2">
                          {allPosts[0].title}
                        </h3>
                        <span className="text-[10px] md:text-xs text-white/80 mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {allPosts[0].date}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              )}
            </div>
          </section>
        )}
        {/* Featured & Trending Section (hidden when showPortalSections is false) */}
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
            <Link key={post.id} href={`/article/${post.id}`} className="block">
                  <Card className="hover-elevate cursor-pointer h-full overflow-hidden group bg-gradient-to-br from-card to-card/50 border-destructive/20 hover:border-destructive/50 transition-all duration-300">
                <div className="relative aspect-video overflow-hidden bg-muted/30">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2 left-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-destructive" />
                    <Badge variant="secondary" className="text-xs bg-destructive/80 text-white">Featured</Badge>
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
            {/* Latest Articles */}
            <section className="space-y-4 pt-6 border-t border-border/50">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl md:text-3xl font-semibold flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-amber-500" />
                  Latest Articles
                </h2>
                <Link href="/posts">
                  <Button variant="ghost" size="sm" className="hover:text-primary">
                    View All →
                  </Button>
                </Link>
              </div>
              {latestArticles.length === 0 ? (
                <div className="text-muted-foreground text-sm">
                  No articles have been published yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {latestArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              )}
            </section>

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
                                  <span>{format(new Date(tutorial.createdAt), "MMM d, yyyy")}</span>
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
          </>
        )}
      </div>
    </div>
  );
}
