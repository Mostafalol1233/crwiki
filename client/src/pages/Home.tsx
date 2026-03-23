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
import {
  Sparkles, Calendar, Crosshair, Globe,
  ChevronRight, Zap, Shield, ArrowUpRight,
  Swords, MapPin, Users
} from "lucide-react";
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

const FALLBACK_EVENT_IMG = "https://files.catbox.moe/wof38b.jpeg";

function StatBar({ label, value, color = "bg-primary" }: { label: string; value: number | string; color?: string }) {
  const num = Math.min(parseFloat(String(value)) || 0, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
        <span className="text-[11px] font-black tabular-nums text-foreground">{value ?? "—"}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted/30 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-1000`}
          style={{ width: `${num}%` }}
        />
      </div>
    </div>
  );
}

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-primary">{icon}</span>
      <span className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">{children}</span>
    </div>
  );
}

export default function Home() {
  const { t } = useLanguage();

  const { data: postsData } = useQuery<{ items: Article[]; total: number }>({
    queryKey: ["/api/posts", { limit: 50 }],
    queryFn: () => apiRequest("/api/posts?limit=50", "GET"),
  });
  const allPosts = postsData?.items || [];

  const { data: eventsData } = useQuery<{ items: any[]; total: number }>({
    queryKey: ["/api/events", { limit: 10 }],
    queryFn: () => apiRequest("/api/events?limit=10", "GET"),
  });
  const allEvents = eventsData?.items || [];

  const displayEvents = useMemo(() =>
    allEvents
      .filter((e: any) => !e.rawHtmlContent)
      .filter((e: any) => String(e.title || "").trim() && String(e.description || e.content || "").trim())
      .slice(0, 7),
    [allEvents]
  );

  const { data: recentWeaponsData } = useQuery<{ items: HomeWeapon[]; total: number }>({
    queryKey: ["/api/weapons/search", "home-recent"],
    queryFn: () => apiRequest("/api/weapons/search?page=1&pageSize=4&sort=date&order=desc", "GET"),
  });
  const recentWeapons = recentWeaponsData?.items || [];

  const heroPost = allPosts.filter((p: any) => p.previewOnHome !== false).find((p) => p.featured) || {
    id: "1",
    title: "Bimora Gaming — Quick, Simple & Massive",
    summary: "Play CrossFire with the ultimate Bimora hub for news, events, guides and community highlights.",
    category: "Tutorials",
    image: tutorialImage,
    author: "Bimora Team",
    date: "Today",
    readingTime: 1,
    views: 0,
    tags: ["Welcome"],
  };

  const [heroBgUrl, setHeroBgUrl] = useState("");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiRequest("/api/public/settings/site", "GET");
        const url = String(data?.backgroundImageUrl || "").trim();
        if (!cancelled && url) setHeroBgUrl(url);
      } catch { }
    })();
    return () => { cancelled = true; };
  }, []);

  const scrapedEvents = allEvents.filter((e: any) => e.rawHtmlContent);
  const ribbonEvents = allEvents.filter((e: any) => !e.rawHtmlContent).slice(7, 15);

  const [featuredEvent, ...restEvents] = displayEvents;
  const secondaryEvents = restEvents.slice(0, 3);
  const bottomRowEvents = restEvents.slice(3, 6);

  const categories = [
    { title: "Maps", subtitle: "Battle Arenas", icon: <MapPin className="h-5 w-5" />, image: "/images/categories/maps.jpg", fallback: mapsCategoryImage, link: "/maps", accent: "#2563eb" },
    { title: "Weapons", subtitle: "Arsenal & Stats", icon: <Swords className="h-5 w-5" />, image: "/images/categories/weapons.jpg", fallback: weaponCategoryImage, link: "/weapons", accent: "var(--primary)" },
    { title: "Mercenaries", subtitle: "Elite Operators", icon: <Users className="h-5 w-5" />, image: "/images/categories/mercenaries.jpg", fallback: mercCategoryImage, link: "/mercenaries", accent: "#7c3aed" },
  ];

  return (
    <>
      <PageSEO
        title="CrossFire Wiki — Guides, Weapons, Modes & Community"
        description="CrossFire Wiki: weapons, modes, tutorials, ranks, events, and community resources. Master Crossfire with up-to-date guides, maps and competitive intel."
      />

      <div className="min-h-screen bg-background">

        {/* ────────────────────────── HERO ────────────────────────── */}
        <HeroSection post={heroPost} bgImageUrl={heroBgUrl} />

        {/* ────────────────────────── RIBBON ────────────────────────── */}
        <div className="sticky top-0 z-20 border-y border-primary/20 bg-background/95 backdrop-blur-sm shadow-md shadow-black/20">
          <EventsRibbon events={ribbonEvents} />
        </div>

        {/* ────────────────────────── MAIN CONTENT ────────────────────────── */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10">

          {/* ── Forum / Scraped Announcements ── */}
          {scrapedEvents.map((event: any) => (
            <div key={event.id} className="mt-10 md:mt-14 relative overflow-hidden rounded-2xl border border-primary/25 bg-card">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-transparent" />
              <div className="flex items-center justify-between px-5 md:px-8 py-3.5 border-b border-primary/10">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Forum Announcement</span>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground">{event.date}</span>
              </div>
              <div className="p-5 sm:p-8 md:p-12">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight mb-6 text-foreground">
                  {event.title}
                </h2>
                <RawHtmlPreview html={event.rawHtmlContent} className="min-h-[150px]" />
              </div>
              {event.image && (
                <div className="relative w-full h-56 sm:h-80">
                  <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                </div>
              )}
            </div>
          ))}

          {/* ────────── EVENTS ────────── */}
          <section className="mt-14 md:mt-20">
            {/* Section header */}
            <div className="flex items-end justify-between mb-6 md:mb-8 pb-4 border-b border-border/60">
              <div>
                <SectionLabel icon={<Calendar className="h-3.5 w-3.5" />}>Latest Events</SectionLabel>
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground leading-none mt-1">
                  What's Happening
                </h2>
              </div>
              <Link href="/category/events">
                <span className="hidden sm:flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors group">
                  All Events
                  <ArrowUpRight className="h-3.5 w-3.5 group-hover:text-primary transition-colors" />
                </span>
              </Link>
            </div>

            {displayEvents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-muted py-16 text-center text-muted-foreground text-sm font-semibold">
                No events yet — check back soon.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Big + stacked magazine row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Featured big card */}
                  {featuredEvent && (
                    <Link
                      href={featuredEvent.event_name_slug ? `/events/${featuredEvent.event_name_slug}` : `/events/${featuredEvent.id}`}
                      className="lg:col-span-7 group block"
                    >
                      <div className="relative overflow-hidden rounded-2xl h-full min-h-[280px] md:min-h-[380px] cursor-pointer">
                        <img
                          src={featuredEvent.image || FALLBACK_EVENT_IMG}
                          alt={featuredEvent.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {/* Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                        {/* Badge */}
                        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm">
                          <Zap className="h-3 w-3" />
                          {featuredEvent.type === "upcoming" ? "Upcoming" : "Featured"}
                        </div>

                        {/* Text overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                          <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-2">
                            {featuredEvent.date}
                          </p>
                          <h3 className="text-white font-black text-xl md:text-2xl lg:text-3xl uppercase tracking-tight leading-tight line-clamp-3 drop-shadow-lg">
                            {featuredEvent.title}
                          </h3>
                          <div className="mt-4 inline-flex items-center gap-1.5 text-white/60 text-xs font-bold uppercase tracking-widest group-hover:text-white transition-colors">
                            View Event <ArrowUpRight className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* 3 stacked secondary cards */}
                  <div className="lg:col-span-5 flex flex-col gap-3 md:gap-4">
                    {secondaryEvents.map((event: any) => (
                      <Link
                        key={event.id}
                        href={event.event_name_slug ? `/events/${event.event_name_slug}` : `/events/${event.id}`}
                        className="group block flex-1"
                      >
                        <div className="relative overflow-hidden rounded-xl flex-1 h-full min-h-[100px] md:min-h-[115px] cursor-pointer">
                          <img
                            src={event.image || FALLBACK_EVENT_IMG}
                            alt={event.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/10" />
                          <div className="absolute inset-0 flex flex-col justify-center px-4 md:px-5">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="bg-primary/80 text-primary-foreground text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm">
                                {event.type === "upcoming" ? "Upcoming" : "Event"}
                              </span>
                            </div>
                            <h3 className="text-white font-black text-sm md:text-base uppercase tracking-tight line-clamp-2 leading-snug">
                              {event.title}
                            </h3>
                            <p className="text-white/40 text-[10px] font-bold mt-1 uppercase tracking-widest">{event.date}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Bottom 3-card row */}
                {bottomRowEvents.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                    {bottomRowEvents.map((event: any) => (
                      <Link
                        key={event.id}
                        href={event.event_name_slug ? `/events/${event.event_name_slug}` : `/events/${event.id}`}
                        className="group block"
                      >
                        <div className="relative overflow-hidden rounded-xl aspect-video cursor-pointer">
                          <img
                            src={event.image || FALLBACK_EVENT_IMG}
                            alt={event.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                          <span className="absolute top-3 left-3 bg-primary/80 text-primary-foreground text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm">
                            {event.type === "upcoming" ? "Upcoming" : "Event"}
                          </span>
                          <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                            <h3 className="text-white font-black text-sm uppercase tracking-tight line-clamp-2 leading-snug">
                              {event.title}
                            </h3>
                            <p className="text-white/40 text-[10px] font-bold mt-1 uppercase tracking-widest">{event.date}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ────────── WEAPONS ────────── */}
          <section className="mt-14 md:mt-20">
            <div className="flex items-end justify-between mb-6 md:mb-8 pb-4 border-b border-border/60">
              <div>
                <SectionLabel icon={<Crosshair className="h-3.5 w-3.5" />}>Arsenal</SectionLabel>
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground leading-none mt-1">
                  Latest Weapons
                </h2>
              </div>
              <Link href="/weapons">
                <span className="hidden sm:flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors group">
                  Full Arsenal
                  <ArrowUpRight className="h-3.5 w-3.5 group-hover:text-primary" />
                </span>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {recentWeapons.length === 0
                ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-64 rounded-xl bg-muted/20 animate-pulse" />
                ))
                : recentWeapons.map((weapon) => {
                  const image = weapon.image || weapon.imageUrl || "";
                  const damage = weapon.stats?.damage ?? weapon.stats?.Damage;
                  const recoil = weapon.stats?.recoil ?? weapon.stats?.Recoil;
                  return (
                    <Link key={weapon.id} href="/weapons" className="group block">
                      <div className="relative overflow-hidden rounded-xl border border-border/40 bg-card hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
                        {/* Image */}
                        <div className="relative bg-gradient-to-b from-muted/20 to-transparent aspect-[5/4] overflow-hidden">
                          {image ? (
                            <img
                              src={image}
                              alt={weapon.name}
                              className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Shield className="h-10 w-10 text-muted-foreground/20" />
                            </div>
                          )}
                          {/* Category tag */}
                          <span className="absolute top-2.5 left-2.5 text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-sm">
                            {weapon.category || "Weapon"}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="px-3 pt-2 pb-4 space-y-3">
                          <h3 className="font-black text-sm uppercase tracking-tight line-clamp-2 leading-tight text-foreground">
                            {weapon.name}
                          </h3>
                          <div className="space-y-2">
                            <StatBar label="Damage" value={damage ?? "—"} color="bg-primary" />
                            <StatBar label="Recoil" value={recoil ?? "—"} color="bg-orange-500" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </section>

          {/* ────────── CATEGORIES ────────── */}
          <section className="mt-14 md:mt-20 mb-16 md:mb-24">
            <div className="flex items-end justify-between mb-6 md:mb-8 pb-4 border-b border-border/60">
              <div>
                <SectionLabel icon={<Globe className="h-3.5 w-3.5" />}>Database</SectionLabel>
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground leading-none mt-1">
                  Explore Categories
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              {categories.map((cat) => (
                <Link key={cat.title} href={cat.link} className="group block">
                  <div className="relative overflow-hidden rounded-2xl aspect-[4/3] cursor-pointer">
                    <img
                      src={cat.image}
                      alt={cat.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.src.includes(String(cat.fallback))) img.src = String(cat.fallback);
                      }}
                    />
                    {/* Dark overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/10 transition-opacity duration-300 group-hover:opacity-90" />

                    {/* Top accent line with category color */}
                    <div
                      className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: `linear-gradient(to right, ${cat.accent}, transparent)` }}
                    />

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-between p-5 md:p-6">
                      {/* Icon top-right */}
                      <div className="self-end">
                        <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white/70 group-hover:bg-white/20 group-hover:text-white transition-all duration-300">
                          {cat.icon}
                        </div>
                      </div>

                      {/* Title bottom */}
                      <div>
                        <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.15em] mb-1">
                          {cat.subtitle}
                        </p>
                        <div className="flex items-center justify-between">
                          <h3 className="text-white font-black text-2xl md:text-3xl uppercase tracking-tighter leading-none">
                            {cat.title}
                          </h3>
                          <ChevronRight className="h-5 w-5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                        </div>
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
