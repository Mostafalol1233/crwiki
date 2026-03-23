import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { HeroSection } from "@/components/HeroSection";
import PageSEO from "@/components/PageSEO";
import { type Article } from "@/components/ArticleCard";
import { EventsRibbon } from "@/components/EventsRibbon";
import RawHtmlPreview from "@/components/RawHtmlPreview";
import { useLanguage } from "@/components/LanguageProvider";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Calendar, Crosshair, Globe, ChevronRight, Zap, Shield, ArrowRight } from "lucide-react";
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

function SectionHeading({ icon, label, href, linkLabel }: { icon: React.ReactNode; label: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between mb-6 md:mb-8">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/15 text-primary">
          {icon}
        </div>
        <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest text-foreground">
          {label}
        </h2>
        <span className="hidden sm:block h-px flex-1 min-w-[40px] bg-primary/20" />
      </div>
      {href && linkLabel && (
        <Link href={href}>
          <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors group">
            {linkLabel}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      )}
    </div>
  );
}

export default function Home() {
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

  const { data: recentWeaponsData } = useQuery<{ items: HomeWeapon[]; total: number }>({
    queryKey: ["/api/weapons/search", "home-recent"],
    queryFn: () => apiRequest("/api/weapons/search?page=1&pageSize=4&sort=date&order=desc", "GET"),
  });
  const recentWeapons = recentWeaponsData?.items || [];

  const heroPost = allPosts.filter((p: any) => p.previewOnHome !== false).find((p) => p.featured) || {
    id: "1",
    title: "Bimora Gaming — Quick, Simple & Massive",
    summary: "Play CrossFire with the ultimate Bimora hub for news, events, guides and community highlights. Jump in and start exploring now.",
    category: "Tutorials",
    image: tutorialImage,
    author: "Bimora Team",
    date: "Today",
    readingTime: 1,
    views: 0,
    tags: ["Welcome", "Getting Started"],
  };

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

  const scrapedEvents = allEvents.filter((e: any) => e.rawHtmlContent);
  const ribbonEvents = allEvents.filter((e: any) => !e.rawHtmlContent).slice(7, 15);

  const featuredEvent = displayEvents[0];
  const secondaryEvents = displayEvents.slice(1, 4);
  const remainingEvents = displayEvents.slice(4, 7);

  return (
    <>
      <PageSEO
        title={"CrossFire Wiki — Guides, Weapons, Modes & Community"}
        description={"CrossFire Wiki: weapons, modes, tutorials, ranks, events, and community resources. Master Crossfire with up-to-date guides, maps and competitive intel."}
      />

      <div className="min-h-screen">
        {/* ── Hero ── */}
        <HeroSection post={heroPost} bgImageUrl={heroBgUrl} />

        {/* ── Events Ribbon ── */}
        <div className="border-y border-primary/10 bg-card/60">
          <EventsRibbon events={ribbonEvents} />
        </div>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 py-10 md:py-16 space-y-16 md:space-y-24">

          {/* ── Scraped/Forum Events ── */}
          {scrapedEvents.map((event: any) => (
            <section key={event.id} className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <div className="relative px-5 md:px-8 py-4 border-b border-primary/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  <span className="font-black uppercase tracking-widest text-xs text-primary">Forum Announcement</span>
                </div>
                <Badge variant="outline" className="text-xs font-bold">{event.date}</Badge>
              </div>
              <div className="relative p-5 sm:p-8 md:p-12">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground mb-6">
                  {event.title}
                </h2>
                <RawHtmlPreview html={event.rawHtmlContent} className="min-h-[150px]" />
              </div>
              {event.image && (
                <div className="relative w-full h-56 sm:h-80 md:h-[420px]">
                  <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent" />
                </div>
              )}
            </section>
          ))}

          {/* ── Latest Events ── */}
          <section>
            <SectionHeading
              icon={<Calendar className="h-4 w-4" />}
              label="Latest Events"
              href="/category/events"
              linkLabel="View All"
            />

            {displayEvents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-primary/20 py-16 text-center text-muted-foreground font-semibold">
                No events published yet. New events will appear here soon.
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6">
                {/* Magazine layout: 1 big + 3 stacked */}
                {featuredEvent && (
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
                    {/* Featured large card */}
                    <Link href={featuredEvent.event_name_slug ? `/events/${featuredEvent.event_name_slug}` : `/events/${featuredEvent.id}`}
                      className="lg:col-span-3 group relative overflow-hidden rounded-2xl cursor-pointer block">
                      <div className="relative w-full aspect-[16/9] lg:aspect-auto lg:h-full min-h-[260px]">
                        <img
                          src={featuredEvent.image || 'https://files.catbox.moe/wof38b.jpeg'}
                          alt={featuredEvent.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/5" />
                        <div className="absolute top-4 left-4">
                          <span className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
                            <Zap className="h-3 w-3" />
                            {featuredEvent.type === 'upcoming' ? 'Upcoming' : 'Featured'}
                          </span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
                          <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">{featuredEvent.date}</p>
                          <h3 className="text-white font-black text-xl md:text-2xl lg:text-3xl uppercase tracking-tight leading-tight line-clamp-3">
                            {featuredEvent.title}
                          </h3>
                        </div>
                      </div>
                    </Link>

                    {/* 3 stacked secondary cards */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                      {secondaryEvents.map((event: any) => (
                        <Link key={event.id} href={event.event_name_slug ? `/events/${event.event_name_slug}` : `/events/${event.id}`}
                          className="group relative overflow-hidden rounded-xl cursor-pointer flex-1 block min-h-[110px]">
                          <div className="relative w-full h-full min-h-[110px] md:min-h-[130px]">
                            <img
                              src={event.image || 'https://files.catbox.moe/wof38b.jpeg'}
                              alt={event.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/10" />
                            <div className="absolute inset-0 flex flex-col justify-center px-4 md:px-5">
                              <Badge className="w-fit mb-1.5 text-[9px] uppercase tracking-widest bg-primary/80 rounded-sm">
                                {event.type === 'upcoming' ? 'Upcoming' : 'Event'}
                              </Badge>
                              <h3 className="text-white font-black text-sm md:text-base uppercase tracking-tight line-clamp-2 leading-tight">
                                {event.title}
                              </h3>
                              <p className="text-white/50 text-[10px] font-bold mt-1 uppercase tracking-widest">{event.date}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom row: remaining 3 cards */}
                {remainingEvents.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                    {remainingEvents.map((event: any) => (
                      <Link key={event.id} href={event.event_name_slug ? `/events/${event.event_name_slug}` : `/events/${event.id}`}
                        className="group relative overflow-hidden rounded-xl cursor-pointer block">
                        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                          <img
                            src={event.image || 'https://files.catbox.moe/wof38b.jpeg'}
                            alt={event.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                          <Badge className="absolute top-3 left-3 text-[9px] uppercase tracking-widest bg-primary/80 rounded-sm">
                            {event.type === 'upcoming' ? 'Upcoming' : 'Event'}
                          </Badge>
                          <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                            <h3 className="text-white font-black text-sm uppercase tracking-tight line-clamp-2 leading-tight">
                              {event.title}
                            </h3>
                            <p className="text-white/50 text-[10px] font-bold mt-1 uppercase tracking-widest">{event.date}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── Latest Weapons ── */}
          <section>
            <SectionHeading
              icon={<Crosshair className="h-4 w-4" />}
              label="Latest Weapons"
              href="/weapons"
              linkLabel="Explore All"
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
              {recentWeapons.map((weapon) => {
                const image = weapon.image || weapon.imageUrl || "";
                const damage = weapon.stats?.damage ?? weapon.stats?.Damage;
                const recoil = weapon.stats?.recoil ?? weapon.stats?.Recoil;
                const dmgNum = parseFloat(damage) || 0;
                const recoilNum = parseFloat(recoil) || 0;

                return (
                  <Link key={weapon.id} href={`/weapons`} className="group block">
                    <div className="relative overflow-hidden rounded-xl border border-primary/10 bg-card hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 h-full">
                      {/* Weapon image */}
                      <div className="relative bg-gradient-to-b from-muted/40 to-muted/10 aspect-[4/3] overflow-hidden">
                        {image ? (
                          <img
                            src={image}
                            alt={weapon.name}
                            className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground/40">
                            <Shield className="h-10 w-10" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            {weapon.category || "Weapon"}
                          </span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-3 md:p-4 space-y-3">
                        <h3 className="font-black text-sm md:text-base uppercase tracking-tight line-clamp-2 leading-tight">
                          {weapon.name}
                        </h3>

                        {/* Stat bars */}
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Damage</span>
                              <span className="text-[10px] font-black text-foreground">{damage ?? "—"}</span>
                            </div>
                            <div className="h-1 rounded-full bg-muted/40 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all duration-700"
                                style={{ width: `${Math.min(dmgNum, 100)}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recoil</span>
                              <span className="text-[10px] font-black text-foreground">{recoil ?? "—"}</span>
                            </div>
                            <div className="h-1 rounded-full bg-muted/40 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-orange-500 transition-all duration-700"
                                style={{ width: `${Math.min(recoilNum, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ── Explore Categories ── */}
          <section>
            <SectionHeading
              icon={<Globe className="h-4 w-4" />}
              label="Explore Categories"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {[
                { title: "Maps", subtitle: "Battle Arenas", image: "/images/categories/maps.jpg", fallback: mapsCategoryImage, link: "/maps", color: "from-blue-900/80" },
                { title: "Weapons", subtitle: "Arsenal & Stats", image: "/images/categories/weapons.jpg", fallback: weaponCategoryImage, link: "/weapons", color: "from-primary/80" },
                { title: "Mercenaries", subtitle: "Elite Operators", image: "/images/categories/mercenaries.jpg", fallback: mercCategoryImage, link: "/mercenaries", color: "from-purple-900/80" },
              ].map((cat) => (
                <Link key={cat.title} href={cat.link} className="group block">
                  <div className="relative overflow-hidden rounded-2xl aspect-[16/9] cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                    <img
                      src={cat.image}
                      alt={cat.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        if (!img.src.includes(String(cat.fallback))) img.src = String(cat.fallback);
                      }}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} via-black/20 to-transparent`} />

                    {/* Bottom content */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 flex items-end justify-between">
                      <div>
                        <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">{cat.subtitle}</p>
                        <h3 className="text-white font-black text-2xl md:text-3xl uppercase tracking-tighter leading-none drop-shadow-lg">
                          {cat.title}
                        </h3>
                      </div>
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white transition-all duration-300 group-hover:bg-white/20 group-hover:scale-110">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
