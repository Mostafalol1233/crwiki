import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { HeroSection } from "@/components/HeroSection";
import PageSEO from "@/components/PageSEO";
import { ArticleCard, type Article } from "@/components/ArticleCard";
import { Sidebar } from "@/components/Sidebar";
import { EventsRibbon } from "@/components/EventsRibbon";
import RawHtmlPreview from "@/components/RawHtmlPreview";
import { useLanguage } from "@/components/LanguageProvider";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ThumbsUp, Play, Flame, Calendar, ExternalLink, Globe, User, Crosshair, Shield } from "lucide-react";
import tutorialImage from "@assets/generated_images/Tutorial_article_cover_image_2152de25.png";
import weaponCategoryImage from "@assets/feature-weap.jpg";
import mercCategoryImage from "@assets/merc-sisterhood.jpg";
import mapsCategoryImage from "@assets/modes/TDM_Mexico2_05.jpg.jpeg";
import type { Tutorial } from "@shared/mongodb-schema";

type HomeWeapon = {
  id: string;
  name: string;
  image?: string;
  imageUrl?: string;
  category?: string;
  stats?: Record<string, any>;
};

export default function Home() {
  function RatioBox({ src, alt, mdHeightClass = "", children }: { src: string; alt: string; mdHeightClass?: string; children?: React.ReactNode }) {
    const [ratio, setRatio] = useState<number>(9 / 16);
    return (
      <div
        className={`relative w-full overflow-hidden rounded-md bg-transparent p-0 md:p-1 ${mdHeightClass}`}
        style={{ paddingTop: `${ratio * 100}%` }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-contain rounded-xl transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth > 0) setRatio(img.naturalHeight / img.naturalWidth);
            }}
          />
        </div>
        {children}
      </div>
    );
  }
  const { t } = useLanguage();

  const { data: postsData } = useQuery<{ items: Article[], total: number }>({
    queryKey: ["/api/posts", { limit: 50 }],
    queryFn: () => apiRequest("/api/posts?limit=50", "GET"),
  });
  const allPosts = postsData?.items || [];

  const { data: eventsData } = useQuery<{ items: any[], total: number }>({
    queryKey: ["/api/events", { limit: 10 }],
    queryFn: () => apiRequest("/api/events?limit=10", "GET"),
  });
  const allEvents = eventsData?.items || [];
  const displayEvents = useMemo(() => {
    return allEvents
      .filter((e: any) => !e.rawHtmlContent)
      .filter((e: any) => (String(e.title || "").trim().length > 0) && (String(e.description || e.content || "").trim().length > 0))
      .slice(0, 7);
  }, [allEvents]);

  const { data: newsData } = useQuery<{ items: any[], total: number }>({
    queryKey: ["/api/news", { limit: 20 }],
    queryFn: () => apiRequest("/api/news?limit=20", "GET"),
  });
  const allNews = newsData?.items || [];

  const { data: tutorialsData } = useQuery<{ items: Tutorial[], total: number }>({
    queryKey: ["/api/tutorials"],
  });
  const allTutorials = tutorialsData?.items || [];

  const { data: recentWeaponsData } = useQuery<{ items: HomeWeapon[]; total: number }>({
    queryKey: ["/api/weapons/search", "home-recent"],
    queryFn: () => apiRequest("/api/weapons/search?page=1&pageSize=4&sort=date&order=desc", "GET"),
  });
  const recentWeapons = recentWeaponsData?.items || [];

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

  const [heroBgUrl, setHeroBgUrl] = useState<string>("");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiRequest("/api/public/settings/site", "GET");
        const url = String(data?.backgroundImageUrl || "").trim();
        if (!cancelled) setHeroBgUrl(url);
      } catch { }
    })();
    return () => { cancelled = true; };
  }, []);

  const showPortalSections = false;

  const latestArticles = useMemo(() => {
    return allPosts.filter((p: any) => p.previewOnHome !== false).slice(0, 4);
  }, [allPosts]);

  const recentPosts = useMemo(() => {
    return allPosts.slice(0, 3).map((post) => ({
      id: post.id,
      post_slug: post.post_slug,
      title: post.title,
      image: post.image,
      date: post.date,
    }));
  }, [allPosts]);

  const mostViewed = useMemo(() => {
    return [...allPosts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
  }, [allPosts]);

  const popularTags = useMemo(() => {
    const tagsMap: Record<string, number> = {};
    allPosts.forEach((post) => {
      post.tags?.forEach((tag) => {
        tagsMap[tag] = (tagsMap[tag] || 0) + 1;
      });
    });
    return Object.entries(tagsMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [allPosts]);

  const bimoraPicks = useMemo(() => {
    return allPosts
      .filter((post: any) => post.featured && post.previewOnHome !== false)
      .slice(0, 2)
      .map((post: any) => ({
        id: post.id,
        post_slug: post.post_slug,
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
      />

      <div className="min-h-screen">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-4 md:px-8">
          <HeroSection post={heroPost} bgImageUrl={heroBgUrl} />
          
          <div className="py-8 md:py-12 space-y-12 md:space-y-16">
            {/* Events Navigation Menu moved to top */}
            <div className="wiki-content-card rounded-xl md:rounded-2xl overflow-hidden border-b border-primary/10 pb-8">
              <EventsRibbon events={allEvents.filter((e: any) => !e.rawHtmlContent).slice(7, 15)} />
            </div>

            {/* 1. Scraped Events (Raw HTML) - TOP PRIORITY */}
            {allEvents.filter(e => e.rawHtmlContent).map((event: any) => (
              <Card key={event.id} className="overflow-hidden border-2 border-primary/20 shadow-xl md:shadow-2xl">
                <div className="bg-primary/5 px-4 md:px-6 py-3 md:py-4 border-b border-primary/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-primary animate-pulse" />
                    <span className="font-bold uppercase tracking-widest text-xs md:text-sm text-primary">Forum Announcement</span>
                  </div>
                  <Badge variant="outline" className="bg-background text-xs md:text-sm">{event.date}</Badge>
                </div>
                <CardContent className="p-0">
                  <div className="p-4 sm:p-6 md:p-10">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 md:mb-6 uppercase tracking-tight italic text-primary">
                      {event.title}
                    </h2>
                    <RawHtmlPreview 
                      html={event.rawHtmlContent} 
                      className="min-h-[150px] md:min-h-[200px]"
                    />
                  </div>
                  {event.image && (
                    <div className="w-full h-48 sm:h-64 md:h-96 relative">
                      <img 
                        src={event.image} 
                        alt={event.title} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* 2. Events Grid (Enhanced readability + stronger visual hierarchy) */}
            <section className="space-y-6 md:space-y-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 md:gap-3">
                  <Calendar className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight italic">
                    Latest Events
                  </h2>
                </div>
                <Link href="/category/events">
                  <Button variant="outline" className="rounded-xl font-bold uppercase tracking-wide text-xs sm:text-sm">
                    View All Events
                  </Button>
                </Link>
              </div>

              {displayEvents.length === 0 ? (
                <Card className="border border-primary/20 bg-card/70">
                  <CardContent className="py-10 text-center text-muted-foreground font-semibold">
                    No events published yet. New events will appear here soon.
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Top Row: 4 Cards - Responsive Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {displayEvents.slice(0, 4).map((event: any) => (
                      <Link key={event.id} href={event.event_name_slug ? `/events/${event.event_name_slug}` : `/events/${event.id}`}>
                        <Card className="group relative overflow-hidden border border-primary/10 rounded-xl md:rounded-2xl cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col h-full bg-black/5 hover:border-primary/40 hover:-translate-y-1">
                          <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
                            <img
                              src={event.image || 'https://files.catbox.moe/wof38b.jpeg'}
                              alt={event.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-70 group-hover:opacity-85 transition-opacity" />
                            <Badge className="absolute top-3 left-3 rounded-md text-[10px] uppercase tracking-widest bg-primary/90 text-primary-foreground">
                              {event.type === 'upcoming' ? 'Upcoming' : 'Event'}
                            </Badge>
                          </div>
                          <div className="p-4 md:p-5 space-y-2 md:space-y-3 flex-grow bg-card min-h-[120px] md:min-h-[150px]">
                            <h3 className="font-extrabold text-base sm:text-lg md:text-xl uppercase tracking-tight line-clamp-2 text-foreground leading-tight">
                              {event.title}
                            </h3>
                            <p className="text-muted-foreground text-xs sm:text-sm font-bold uppercase tracking-widest">
                              {event.date}
                            </p>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>

                  {/* Bottom Row: 3 Cards - Better Mobile Layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                    {displayEvents.slice(4, 7).map((event: any) => (
                      <Link key={event.id} href={event.event_name_slug ? `/events/${event.event_name_slug}` : `/events/${event.id}`}>
                        <Card className="group relative overflow-hidden border border-primary/10 rounded-xl md:rounded-2xl cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col h-full bg-black/5 hover:border-primary/40 hover:-translate-y-1">
                          <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
                            <img
                              src={event.image || 'https://files.catbox.moe/wof38b.jpeg'}
                              alt={event.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-70 group-hover:opacity-85 transition-opacity" />
                            <Badge className="absolute top-3 left-3 rounded-md text-[10px] uppercase tracking-widest bg-primary/90 text-primary-foreground">
                              {event.type === 'upcoming' ? 'Upcoming' : 'Event'}
                            </Badge>
                          </div>
                          <div className="p-4 md:p-5 space-y-2 md:space-y-3 flex-grow bg-card min-h-[120px] md:min-h-[150px]">
                            <h3 className="font-extrabold text-base sm:text-lg md:text-xl uppercase tracking-tight line-clamp-2 text-foreground leading-tight">
                              {event.title}
                            </h3>
                            <p className="text-muted-foreground text-xs sm:text-sm font-bold uppercase tracking-widest">
                              {event.date}
                            </p>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </section>

            <section className="space-y-6 md:space-y-10 pt-8 border-t border-primary/10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 md:gap-3">
                  <Crosshair className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight italic">
                    Latest Weapons
                  </h2>
                </div>
                <Link href="/weapons">
                  <Button variant="outline" className="rounded-xl font-bold uppercase tracking-wide text-xs sm:text-sm">
                    Explore Weapons
                  </Button>
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {recentWeapons.map((weapon) => {
                  const image = weapon.image || weapon.imageUrl || "";
                  const damage = weapon.stats?.damage ?? weapon.stats?.Damage;
                  const recoil = weapon.stats?.recoil ?? weapon.stats?.Recoil;
                  return (
                    <Card key={weapon.id} className="overflow-hidden border border-primary/10 bg-card/80 shadow-lg">
                      <div className="aspect-[4/3] bg-muted/30">
                        {image ? (
                          <img
                            src={image}
                            alt={weapon.name}
                            className="h-full w-full object-contain p-4"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            <Shield className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <CardContent className="space-y-3 p-4">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-primary">
                            {weapon.category || "Weapon"}
                          </p>
                          <h3 className="mt-1 text-lg font-bold line-clamp-2">{weapon.name}</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="rounded-lg border bg-muted/20 p-2">
                            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Damage</p>
                            <p className="font-semibold">{damage ?? "—"}</p>
                          </div>
                          <div className="rounded-lg border bg-muted/20 p-2">
                            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Recoil</p>
                            <p className="font-semibold">{recoil ?? "—"}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* 3. Categories Section */}
            <section className="space-y-6 md:space-y-10 pt-8 border-t border-primary/10">
              <div className="flex items-center gap-2 md:gap-3">
                <Globe className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight italic">
                  Explore Categories
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                {[
                  { title: "Maps", image: "/images/categories/maps.jpg", fallback: mapsCategoryImage, link: "/maps" },
                  { title: "Weapons", image: "/images/categories/weapons.jpg", fallback: weaponCategoryImage, link: "/weapons" },
                  { title: "Mercenaries", image: "/images/categories/mercenaries.jpg", fallback: mercCategoryImage, link: "/mercenaries" }
                ].map((cat) => (
                  <Link key={cat.title} href={cat.link}>
                    <Card className="group relative overflow-hidden aspect-[16/9] border-0 rounded-xl cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-500">
                      <img 
                        src={cat.image} 
                        alt={cat.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          if (!img.src.includes(cat.fallback)) img.src = cat.fallback;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <h3 className="text-white font-black text-2xl md:text-4xl uppercase tracking-tighter italic group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl">
                          {cat.title}
                        </h3>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
