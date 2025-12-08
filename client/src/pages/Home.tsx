import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { HeroSection } from "@/components/HeroSection";
import PageSEO from "@/components/PageSEO";
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
  const displayEvents = useMemo(() => {
    return allEvents.filter((e: any) => (String(e.title || "").trim().length > 0) && (String(e.description || e.content || "").trim().length > 0));
  }, [allEvents]);

  const { data: allNews = [] } = useQuery<any[]>({
    queryKey: ["/api/news"],
  });

  const { data: allTutorials = [] } = useQuery<Tutorial[]>({
    queryKey: ["/api/tutorials"],
  });

  const [zoom, setZoom] = useState(1);

  const heroPost = allPosts.filter((p: any) => p.previewOnHome !== false).find((p) => p.featured) || {
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
    return allPosts.filter((p: any) => p.previewOnHome !== false).slice(0, 4);
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
      .filter((post: any) => post.featured && post.previewOnHome !== false)
      .slice(0, 2)
      .map((post: any) => ({
        id: post.id,
        title: post.title,
        image: post.image,
        date: post.date,
      }));
  }, [allPosts]);

  const featuredNews = useMemo(() => {
    return allNews.filter((n: any) => n.featured);
  }, [allNews]);
  const featuredNewsHome = useMemo(() => {
    return allNews.filter((n: any) => n.featured && (n.previewOnHome !== false));
  }, [allNews]);

  return (
    <>
      <PageSEO
        title={"CrossFire Wiki — Guides, Weapons, Modes & Community"}
        description={"CrossFire Wiki: weapons, modes, tutorials, ranks, events, and community resources. Master Crossfire with up-to-date guides, maps and competitive intel."}
        keywords={[
          "CrossFire",
          "CrossFire wiki",
          "CrossFire events",
          "CrossFire tournaments",
          "CrossFire competitive modes",
          "weapons",
          "modes",
          "tutorials",
        ]}
        canonicalPath="/"
        image={"https://crossfire.wiki/images/og-image.jpg"}
        schemaType="Organization"
        schemaData={{
          name: "CrossFire Wiki",
          url: (typeof window !== 'undefined' ? window.location.origin : 'https://crossfire.wiki'),
          logo: "https://files.catbox.moe/cxen8x.png",
          sameAs: [
            "https://twitter.com/crossfire",
            "https://www.facebook.com/crossfire",
            "https://www.youtube.com/",
          ],
        }}
      />
      <div className="relative min-h-screen bg-gradient-to-b from-background via-background to-background/80">
      {/* Fire sparks / glow at the edges of the interface */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-24 w-72 h-72 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.9),transparent_60%)] opacity-40 blur-3xl mix-blend-screen fire-glow-strong" />
        <div className="absolute -bottom-32 -right-24 w-80 h-80 bg-[radial-gradient(circle_at_center,rgba(252,211,77,0.9),transparent_60%)] opacity-40 blur-3xl mix-blend-screen fire-glow-soft" />
        <div className="absolute top-1/2 -right-10 w-40 h-40 bg-[radial-gradient(circle_at_center,rgba(248,250,252,0.45),transparent_70%)] opacity-30 blur-2xl mix-blend-screen fire-glow-flicker" />
      </div>

      <HeroSection post={heroPost} isPlaceholder={!hasFeaturedPost} />

      {displayEvents.length > 0 && <EventsRibbon events={displayEvents} />}

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">

        {displayEvents.length > 0 && (
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
            {/* CrossFire style: 1 large right, 2 square left, 2 square bottom left, 1 large bottom right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left column: 2 square cards stacked */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                {displayEvents[0] && (
                  <Link href={displayEvents[0].event_name_slug ? `/events/${displayEvents[0].event_name_slug}` : `/events/${displayEvents[0].id}`} className="block" key={displayEvents[0].id} data-testid={`home-event-left-top-${displayEvents[0].id}`}>
                    <Card className="relative overflow-hidden group hover-elevate transition-all duration-300 cursor-pointer bg-card border-border/60 h-64 w-full">
                      <div className="relative w-full h-full overflow-hidden rounded-md flex items-center justify-center bg-black">
                        {displayEvents[0].image && (
                          <img
                            src={displayEvents[0].image}
                            alt={displayEvents[0].title}
                            className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                            width="400"
                            height="256"
                            loading="lazy"
                            decoding="async"
                            fetchPriority="high"
                          />
                        )}
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                        {displayEvents[0].type && (
                          <div className="absolute top-3 left-3">
                            <Badge className="backdrop-blur-sm bg-primary/85 text-primary-foreground border-primary/20 text-xs uppercase font-bold">
                              {displayEvents[0].type === "upcoming" ? "Upcoming" : "Trending"}
                            </Badge>
                          </div>
                        )}
                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <h4 className="font-semibold text-sm line-clamp-2">{displayEvents[0].title}</h4>
                          {displayEvents[0].date && (
                            <p className="text-xs text-white/85 flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              {displayEvents[0].date}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                )}
                
                {displayEvents[1] && (
                  <Link href={displayEvents[1].event_name_slug ? `/events/${displayEvents[1].event_name_slug}` : `/events/${displayEvents[1].id}`} className="block" key={displayEvents[1].id} data-testid={`home-event-left-bottom-${displayEvents[1].id}`}>
                    <Card className="relative overflow-hidden group hover-elevate transition-all duration-300 cursor-pointer bg-card border-border/60 h-64 w-full">
                      <div className="relative w-full h-full overflow-hidden rounded-md flex items-center justify-center bg-black">
                        {displayEvents[1].image && (
                          <img
                            src={displayEvents[1].image}
                            alt={displayEvents[1].title}
                            className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                            width="400"
                            height="256"
                            loading="lazy"
                            decoding="async"
                            fetchPriority="high"
                          />
                        )}
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                        {displayEvents[1].type && (
                          <div className="absolute top-3 left-3">
                            <Badge className="backdrop-blur-sm bg-primary/85 text-primary-foreground border-primary/20 text-xs uppercase font-bold">
                              {displayEvents[1].type === "upcoming" ? "Upcoming" : "Trending"}
                            </Badge>
                          </div>
                        )}
                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <h4 className="font-semibold text-sm line-clamp-2">{displayEvents[1].title}</h4>
                          {displayEvents[1].date && (
                            <p className="text-xs text-white/85 flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              {displayEvents[1].date}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                )}
              </div>

              {/* Right column: 1 large card */}
              <div className="lg:col-span-2">
                {displayEvents[2] && (
                  <Link href={displayEvents[2].event_name_slug ? `/events/${displayEvents[2].event_name_slug}` : `/events/${displayEvents[2].id}`} className="block" key={displayEvents[2].id} data-testid={`home-event-right-featured-${displayEvents[2].id}`}>
                    <Card className="relative overflow-hidden group hover-elevate transition-all duration-300 cursor-pointer bg-card border-border/60 h-[544px] w-full">
                      <div className="relative w-full h-full overflow-hidden rounded-md flex items-center justify-center bg-black">
                        {displayEvents[2].image && (
                          <img
                            src={displayEvents[2].image}
                            alt={displayEvents[2].title}
                            className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                            width="800"
                            height="544"
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                        {displayEvents[2].type && (
                          <div className="absolute top-4 left-4">
                            <Badge className="backdrop-blur-sm bg-primary/85 text-primary-foreground border-primary/20 text-sm uppercase font-bold px-3 py-1">
                              {displayEvents[2].type === "upcoming" ? "Upcoming" : "Featured"}
                            </Badge>
                          </div>
                        )}
                        <div className="absolute bottom-4 left-4 right-4 text-white">
                          <h3 className="font-bold text-lg md:text-xl line-clamp-3 mb-2">{displayEvents[2].title}</h3>
                          {displayEvents[2].date && (
                            <p className="text-sm text-white/90 flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {displayEvents[2].date}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                )}
              </div>
            </div>

            {/* Bottom row: 2 squares left, 1 large right */}
            {(displayEvents[3] || displayEvents[4] || displayEvents[5]) && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                {/* Left: 2 squares */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                  {displayEvents[3] && (
                    <Link href={displayEvents[3].event_name_slug ? `/events/${displayEvents[3].event_name_slug}` : `/events/${displayEvents[3].id}`} className="block" key={displayEvents[3].id} data-testid={`home-event-bottom-left-top-${displayEvents[3].id}`}>
                      <Card className="relative overflow-hidden group hover-elevate transition-all duration-300 cursor-pointer bg-card border-border/60 h-64">
                        <div className="relative w-full h-full overflow-hidden rounded-md flex items-center justify-center bg-black">
                          {displayEvents[3].image && (
                            <img
                              src={displayEvents[3].image}
                              alt={displayEvents[3].title}
                              className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                              width="400"
                              height="256"
                              loading="lazy"
                              decoding="async"
                            />
                          )}
                          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3 text-white">
                            <h4 className="font-semibold text-sm line-clamp-2">{displayEvents[3].title}</h4>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  )}
                  
                  {displayEvents[4] && (
                    <Link href={displayEvents[4].event_name_slug ? `/events/${displayEvents[4].event_name_slug}` : `/events/${displayEvents[4].id}`} className="block" key={displayEvents[4].id} data-testid={`home-event-bottom-left-bottom-${displayEvents[4].id}`}>
                      <Card className="relative overflow-hidden group hover-elevate transition-all duration-300 cursor-pointer bg-card border-border/60 h-64">
                        <div className="relative w-full h-full overflow-hidden rounded-md flex items-center justify-center bg-black">
        {displayEvents[4].image && (
          <img
            src={displayEvents[4].image}
            alt={displayEvents[4].title}
            className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
            width="400"
            height="256"
            loading="lazy"
            decoding="async"
          />
        )}
                          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3 text-white">
                            <h4 className="font-semibold text-sm line-clamp-2">{displayEvents[4].title}</h4>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  )}
                </div>

                {/* Right: 1 large */}
                <div className="lg:col-span-2">
                  {displayEvents[5] && (
                    <Link href={displayEvents[5].event_name_slug ? `/events/${displayEvents[5].event_name_slug}` : `/events/${displayEvents[5].id}`} className="block" key={displayEvents[5].id} data-testid={`home-event-bottom-right-${displayEvents[5].id}`}>
                      <Card className="relative overflow-hidden group hover-elevate transition-all duration-300 cursor-pointer bg-card border-border/60 h-[544px]">
                        <div className="relative w-full h-full overflow-hidden rounded-md flex items-center justify-center bg-black">
        {displayEvents[5].image && (
          <img
            src={displayEvents[5].image}
            alt={displayEvents[5].title}
            className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
            width="800"
            height="544"
            loading="lazy"
            decoding="async"
          />
        )}
                          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                          <div className="absolute bottom-4 left-4 right-4 text-white">
                            <h3 className="font-bold text-lg md:text-xl line-clamp-3">{displayEvents[5].title}</h3>
                            {displayEvents[5].date && (
                              <p className="text-sm text-white/90 flex items-center gap-2 mt-2">
                                <Calendar className="h-4 w-4" />
                                {displayEvents[5].date}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  )}
                </div>
              </div>
            )}
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

        {displayEvents.length > 0 && (
          <section className="mb-12">
            <div className="max-w-[1400px] mx-auto px-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-[12px] lg:gap-[16px]">
                {displayEvents.slice(0, 12).map((ev: any) => (
                  <Link
                    href={ev.event_name_slug ? `/events/${ev.event_name_slug}` : `/events/${ev.id}`}
                    key={ev.id}
                    className="block"
                  >
                    <div className="relative overflow-hidden rounded-lg cursor-pointer transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl aspect-[16/9]">
                      <img
                        src={ev.image}
                        alt={ev.title}
                        className="w-full h-full object-cover object-center block"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/70 via-black/35 to-transparent" />
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        {ev.type && (
                          <Badge className="backdrop-blur-sm bg-primary/85 text-primary-foreground border-primary/20 text-xs uppercase font-bold">
                            {ev.type === 'trending' ? 'HOT' : 'NEW'}
                          </Badge>
                        )}
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <h4 className="font-semibold text-base md:text-lg line-clamp-2">{ev.title}</h4>
                        {ev.date && (
                          <p className="text-xs md:text-sm text-white/85 flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            {ev.date}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

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
                        width="400"
                        height="267"
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
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
                        className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                        width="400"
                        height="267"
                        loading="lazy"
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
                <Link href={`/article/${(allPosts[0] as any).post_slug || allPosts[0].id}`} className="block" data-testid="home-latest-post">
                  <Card className="hover-elevate h-full group overflow-hidden bg-gradient-to-br from-card to-card/70 border-destructive/20 hover:border-destructive/60 transition-all duration-300">
                    <div className="relative aspect-[3/2] overflow-hidden bg-muted/30">
                      <img
                        src={allPosts[0].image}
                        alt={allPosts[0].title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        width="400"
                        height="267"
                        loading="lazy"
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
              <Link href={`/news/${(featuredNewsHome[0] || allNews.find((n: any) => n.previewOnHome !== false) || allNews[0])?.id}`} className="block h-full">
                <div className="cursor-pointer h-full overflow-hidden group">
                  <div className="relative aspect-[3/4] overflow-hidden bg-muted/30">
                    <img src={(featuredNewsHome[0] || allNews.find((n: any) => n.previewOnHome !== false) || allNews[0])?.image} alt={(featuredNewsHome[0] || allNews.find((n: any) => n.previewOnHome !== false) || allNews[0])?.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" width="300" height="400" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Flame className="h-4 w-4 text-red-500" />
                        <Badge variant="destructive" className="text-xs">Trending</Badge>
                      </div>
                      <h3 className="font-bold text-white line-clamp-3 text-sm">{(featuredNewsHome[0] || allNews.find((n: any) => n.previewOnHome !== false) || allNews[0])?.title}</h3>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Top 2 Featured Posts */}
          {allPosts.filter((p: any) => p.featured && p.previewOnHome !== false).slice(0, 2).map((post: any) => (
            <Link key={post.id} href={`/article/${(post as any).post_slug || post.id}`} className="block">
              <div className="cursor-pointer h-full overflow-hidden group">
                <div className="relative aspect-video overflow-hidden bg-muted/30">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" width="400" height="225" loading="lazy" />
                  <div className="absolute top-2 left-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-destructive" />
                    <Badge variant="secondary" className="text-xs bg-destructive/80 text-white">Featured</Badge>
                  </div>
                </div>
                <div className="pt-2">
                  <h3 className="line-clamp-2 text-base group-hover:text-primary transition-colors">{post.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{post.readingTime} min read</span>
                    <span>•</span>
                    <span>{post.date}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          <div className="flex items-center justify-end gap-2 mb-4 lg:col-span-12">
            <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))} data-testid="button-zoom-out">−</Button>
            <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))} data-testid="button-zoom-in">+</Button>
          </div>
          <main className="lg:col-span-8 space-y-8 md:space-y-12" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
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
                <div
                  className="overflow-x-auto -mx-4 md:mx-0"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  <div className="flex gap-6 md:gap-8 px-4">
                    {latestArticles.map((article) => (
                      <div key={article.id} className="min-w-[280px] sm:min-w-[320px] lg:min-w-[360px]">
                        <ArticleCard article={article} />
                      </div>
                    ))}
                  </div>
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
                <div className="md:hidden overflow-x-auto -mx-4 md:mx-0" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <div className="flex gap-4 px-4">
                    {(featuredNewsHome.length > 0 ? allNews.filter((n: any) => !n.featured) : allNews).filter((n: any) => n.previewOnHome !== false).slice(0, 6).map((item: any) => (
                      <Link key={item.id} href={`/news/${item.id}`} className="block min-w-[280px] sm:min-w-[320px]" data-testid={`home-news-${item.id}`}>
                        <div className="overflow-hidden">
                          <div className="relative aspect-[16/9] overflow-hidden bg-muted/30">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" width="400" height="225" loading="lazy" decoding="async" />
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
                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(featuredNewsHome.length > 0 ? allNews.filter((n: any) => !n.featured) : allNews).filter((n: any) => n.previewOnHome !== false).slice(0, 6).map((item: any) => (
                    <Link key={item.id} href={`/news/${item.id}`} className="block" data-testid={`home-news-${item.id}`}>
                      <div className="overflow-hidden">
                        <div className="relative aspect-[16/9] overflow-hidden bg-muted/30">
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" width="400" height="225" loading="lazy" decoding="async" />
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
                      <div className="cursor-pointer h-full group overflow-hidden">
                        <div className="aspect-video w-full bg-black overflow-hidden relative">
                          <img
                            src={`https://img.youtube.com/vi/${tutorial.youtubeId}/maxresdefault.jpg`}
                            alt={tutorial.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            width="400"
                            height="225"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${tutorial.youtubeId}/default.jpg`;
                            }}
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                            <Play className="h-12 w-12 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="line-clamp-2 text-lg group-hover:text-primary transition-colors">
                            {tutorial.title}
                          </h3>
                          {tutorial.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                              {tutorial.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                  {allEvents[0] && (
                                    <Link href={`/events/${allEvents[0].event_name_slug || allEvents[0].id}`} className="block" data-testid={`home-event-featured-${allEvents[0].id}`}>
                                      <div className="relative overflow-hidden group cursor-pointer h-[400px]">
                                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                                          {allEvents[0].image && (
                                            <img src={allEvents[0].image} alt={allEvents[0].title} className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105" width="400" height="256" />
                                          )}
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/30 to-transparent" />
                                        <div className="absolute bottom-4 left-4 right-4 text-white">
                                          <h3 className="font-bold mb-1 text-lg md:text-xl line-clamp-3">{allEvents[0].title}</h3>
                                          {allEvents[0].date && (
                                            <p className="text-sm text-white/85 inline-flex items-center gap-1"><Calendar className="h-4 w-4" />{allEvents[0].date}</p>
                                          )}
                                        </div>
                                      </div>
                                    </Link>
                                  )}
                                </div>

                                <div className="md:col-span-1 flex flex-col gap-4">
                                  {allEvents[1] && (
                                    <Link href={`/events/${allEvents[1].event_name_slug || allEvents[1].id}`} className="block" data-testid={`home-event-right-top-${allEvents[1].id}`}>
                                      <div className="relative overflow-hidden group cursor-pointer h-[195px]">
                                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                                          {allEvents[1].image && (
                                            <img src={allEvents[1].image} alt={allEvents[1].title} className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105" width="400" height="256" />
                                          )}
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
                                        <div className="absolute bottom-3 left-3 right-3 text-white">
                                          <h4 className="font-semibold text-sm line-clamp-2">{allEvents[1].title}</h4>
                                        </div>
                                      </div>
                                    </Link>
                                  )}

                                  {allEvents[2] && (
                                    <Link href={`/events/${allEvents[2].event_name_slug || allEvents[2].id}`} className="block" data-testid={`home-event-right-bottom-${allEvents[2].id}`}>
                                      <div className="relative overflow-hidden group cursor-pointer h-[195px]">
                                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                                          {allEvents[2].image && (
                                            <img src={allEvents[2].image} alt={allEvents[2].title} className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105" width="400" height="256" />
                                          )}
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
                                        <div className="absolute bottom-3 left-3 right-3 text-white">
                                          <h4 className="font-semibold text-sm line-clamp-2">{allEvents[2].title}</h4>
                                        </div>
                                      </div>
                                    </Link>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {allEvents[3] && (
                                    <Link href={`/events/${allEvents[3].event_name_slug || allEvents[3].id}`} className="block" data-testid={`home-event-2-left-1-${allEvents[3].id}`}>
                                      <div className="relative overflow-hidden group cursor-pointer h-[400px]">
                                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                                          {allEvents[3].image && (
                                            <img src={allEvents[3].image} alt={allEvents[3].title} className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105" width="400" height="256" />
                                          )}
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/30 to-transparent" />
                                        <div className="absolute bottom-4 left-4 right-4 text-white">
                                          <h4 className="font-semibold text-base line-clamp-2">{allEvents[3].title}</h4>
                                        </div>
                                      </div>
                                    </Link>
                                  )}

                                  {allEvents[4] && (
                                    <Link href={`/events/${allEvents[4].event_name_slug || allEvents[4].id}`} className="block" data-testid={`home-event-2-left-2-${allEvents[4].id}`}>
                                      <div className="relative overflow-hidden group cursor-pointer h-[400px]">
                                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                                          {allEvents[4].image && (
                                            <img src={allEvents[4].image} alt={allEvents[4].title} className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105" width="400" height="256" />
                                          )}
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/30 to-transparent" />
                                        <div className="absolute bottom-4 left-4 right-4 text-white">
                                          <h4 className="font-semibold text-base line-clamp-2">{allEvents[4].title}</h4>
                                        </div>
                                      </div>
                                    </Link>
                                  )}
                                </div>

                                <div className="md:col-span-1">
                                  {allEvents[5] && (
                                    <Link href={`/events/${allEvents[5].event_name_slug || allEvents[5].id}`} className="block" data-testid={`home-event-2-right-large-${allEvents[5].id}`}>
                                      <div className="relative overflow-hidden group cursor-pointer h-[400px]">
                                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                                          {allEvents[5].image && (
                                            <img src={allEvents[5].image} alt={allEvents[5].title} className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105" width="400" height="256" />
                                          )}
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/30 to-transparent" />
                                        <div className="absolute bottom-4 left-4 right-4 text-white">
                                          <h3 className="font-bold mb-1 text-lg md:text-xl line-clamp-2">{allEvents[5].title}</h3>
                                        </div>
                                      </div>
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </main>

          <aside className="lg:col-span-4 space-y-6 md:space-y-8">
            {/* Most Viewed */}
            {mostViewed.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Flame className="h-5 w-5 text-red-500" />
                  Most Viewed
                </h3>
                <ul className="space-y-2">
                  {mostViewed.map((post) => (
                    <li key={post.id}>
                      <Link href={`/article/${(post as any).post_slug || post.id}`} className="text-sm hover:text-primary transition-colors">
                        <div className="line-clamp-2">{post.title}</div>
                        <div className="text-xs text-muted-foreground">{post.views} views</div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Popular Tags */}
            {popularTags.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Popular Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <Link key={tag.name} href={`/posts?tag=${tag.name}`}>
                      <Badge variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                        {tag.name} <span className="text-xs ml-1">({tag.count})</span>
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Posts */}
            {recentPosts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Recent Posts</h3>
                <ul className="space-y-3">
                  {recentPosts.map((post) => (
                    <li key={post.id}>
                      <Link href={`/article/${(post as any).post_slug || post.id}`} className="block group">
                        <div className="relative aspect-video overflow-hidden rounded-md bg-muted/30 mb-2">
                          <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            width="400"
                            height="225"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                        <h4 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </h4>
                        <div className="text-xs text-muted-foreground mt-1">{post.date}</div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
        </>
        )}
      </div>
      </div>
    </>
  );
}
