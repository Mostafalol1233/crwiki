import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { HeroSection } from "@/components/HeroSection";
import PageSEO from "@/components/PageSEO";
import { type Article } from "@/components/ArticleCard";
import { EventsRibbon } from "@/components/EventsRibbon";
import RawHtmlPreview from "@/components/RawHtmlPreview";
import { useLanguage } from "@/components/LanguageProvider";
import { getPosts, getEvents, getWeapons, getSiteSettings, getNews } from "@/lib/supabaseApi";
import { ArrowRight, Shield, ChevronRight, Clock, User, Flame } from "lucide-react";
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

function CFSectionHeader({
  label,
  title,
  linkHref,
  linkLabel = "View All",
}: {
  label: string;
  title: string;
  linkHref?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between mb-8 pb-0">
      <div className="flex items-stretch gap-4">
        {/* Left golden accent bar */}
        <div className="w-1 rounded-full flex-shrink-0" style={{ background: "linear-gradient(to bottom, #f5a623, #c96f00)" }} />
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-1" style={{ color: "#f5a623" }}>
            {label}
          </p>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
            {title}
          </h2>
        </div>
      </div>
      {linkHref && (
        <Link href={linkHref}>
          <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] transition-all hover:gap-2.5 group" style={{ color: "#666" }}>
            {linkLabel}
            <ArrowRight className="h-3.5 w-3.5 group-hover:text-[#f5a623] transition-colors" />
          </span>
        </Link>
      )}
    </div>
  );
}

function StatBar({ label, value }: { label: string; value: number | string }) {
  const num = Math.min(parseFloat(String(value)) || 0, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#666" }}>{label}</span>
        <span className="text-[11px] font-black tabular-nums" style={{ color: "#f5a623" }}>{value ?? "—"}</span>
      </div>
      <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: "#1a1a1a" }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${num}%`, background: "linear-gradient(to right, #c96f00, #f5a623)" }}
        />
      </div>
    </div>
  );
}

export default function Home() {
  const { t } = useLanguage();

  const { data: postsData } = useQuery<{ items: Article[]; total: number }>({
    queryKey: ["/api/posts", { limit: 50 }],
    queryFn: () => getPosts({ limit: 50 }),
  });
  const allPosts = postsData?.items || [];

  const { data: eventsData } = useQuery<{ items: any[]; total: number }>({
    queryKey: ["/api/events", { limit: 10 }],
    queryFn: () => getEvents({ limit: 10 }),
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
    queryFn: () => getWeapons({ page: 1, pageSize: 4 }),
  });
  const recentWeapons = recentWeaponsData?.items || [];

  const { data: sitePublicSettings } = useQuery<any>({
    queryKey: ["/api/public/settings/site"],
    queryFn: getSiteSettings,
    staleTime: 30 * 1000,
  });
  const featuredWeaponIds = (sitePublicSettings as any)?.featured_weapons || (sitePublicSettings as any)?.featuredWeapons || [];

  const { data: latestNewsData } = useQuery<{ items: any[]; total: number }>({
    queryKey: ["/api/news", { limit: 6, home: true }],
    queryFn: () => getNews({ limit: 6, offset: 0 }),
    staleTime: 5 * 60 * 1000,
  });
  const latestNews = latestNewsData?.items || [];

  const displayWeapons = recentWeapons;

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

  const scrapedEvents = allEvents.filter((e: any) => e.rawHtmlContent);
  const ribbonEvents = allEvents.filter((e: any) => !e.rawHtmlContent).slice(0, 10);
  const [featuredEvent, ...restEvents] = displayEvents;
  const secondaryEvents = restEvents.slice(0, 3);
  const bottomRowEvents = restEvents.slice(3, 6);

  const categories = [
    { title: "Maps", subtitle: "Battle Arenas", image: "/images/categories/maps.jpg", fallback: mapsCategoryImage, link: "/maps", color: "#2563eb" },
    { title: "Weapons", subtitle: "Full Arsenal & Stats", image: "/images/categories/weapons.jpg", fallback: weaponCategoryImage, link: "/weapons", color: "#f5a623" },
    { title: "Mercenaries", subtitle: "Elite Operators", image: "/images/categories/mercenaries.jpg", fallback: mercCategoryImage, link: "/mercenaries", color: "#7c3aed" },
  ];

  return (
    <>
      <PageSEO
        title="CrossFire Wiki — Guides, Weapons, Modes & Community"
        description="CrossFire Wiki: weapons, modes, tutorials, ranks, events, and community resources."
      />

      <div className="min-h-screen" style={{ background: "var(--background)" }}>

        {/* HERO */}
        <HeroSection post={heroPost} bgImageUrl={heroBgUrl} />

        {/* EVENTS RIBBON */}
        <div className="sticky top-0 z-20 shadow-md shadow-black/30" style={{ borderTop: "1px solid rgba(245,166,35,0.15)", borderBottom: "1px solid rgba(245,166,35,0.15)", background: "rgba(var(--background), 0.97)", backdropFilter: "blur(8px)" }}>
          <EventsRibbon events={ribbonEvents} />
        </div>

        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 md:px-10">

          {/* Forum/Scraped Announcements */}
          {scrapedEvents.map((event: any) => (
            <div key={event.id} className="mt-10 md:mt-14 relative overflow-hidden" style={{ background: "var(--card)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "4px" }}>
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(to right, #f5a623, transparent)" }} />
              <div className="flex items-center justify-between px-5 md:px-8 py-3" style={{ borderBottom: "1px solid rgba(245,166,35,0.1)" }}>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "#f5a623" }}>Forum Announcement</span>
                <span className="text-[10px] font-bold" style={{ color: "#666" }}>{event.date}</span>
              </div>
              <div className="p-5 sm:p-8 md:p-12">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight mb-6" style={{ color: "var(--foreground)" }}>
                  {event.title}
                </h2>
                <RawHtmlPreview html={event.rawHtmlContent} className="min-h-[150px]" />
              </div>
              {event.image && (
                <div className="relative w-full h-56 sm:h-80">
                  <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, var(--card) 0%, transparent 60%)" }} />
                </div>
              )}
            </div>
          ))}

          {/* ── EVENTS ── */}
          <section className="mt-14 md:mt-20">
            <CFSectionHeader label="Latest" title="Events & News" linkHref="/category/events" linkLabel="All Events" />

            {displayEvents.length === 0 ? (
              <div className="py-16 text-center text-sm font-bold uppercase tracking-widest" style={{ color: "#555", border: "1px dashed #2a2a2a", borderRadius: "4px" }}>
                No events yet — check back soon.
              </div>
            ) : (
              <div className="space-y-3">

                {/* ── Featured event (full-width horizontal card) ── */}
                {featuredEvent && (
                  <Link
                    href={featuredEvent.event_name_slug ? `/events/${featuredEvent.event_name_slug}` : `/events/${featuredEvent.id}`}
                    className="group block"
                  >
                    <div className="relative overflow-hidden flex flex-col sm:flex-row" style={{ borderRadius: "4px", background: "#0d0d0d", border: "1px solid rgba(245,166,35,0.15)" }}>
                      <div className="absolute top-0 left-0 right-0 h-[2px] z-10" style={{ background: "linear-gradient(to right, #f5a623, transparent)" }} />
                      {/* Image */}
                      <div className="sm:w-[45%] flex-shrink-0 overflow-hidden" style={{ background: "#070707" }}>
                        <img
                          src={featuredEvent.image || featuredEvent.imageUrl || FALLBACK_EVENT_IMG}
                          alt={featuredEvent.title}
                          className="w-full h-48 sm:h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          style={{ display: "block" }}
                          onError={(e) => { const img = e.currentTarget; if (img.src !== FALLBACK_EVENT_IMG) img.src = FALLBACK_EVENT_IMG; }}
                        />
                      </div>
                      {/* Content */}
                      <div className="flex-1 p-5 sm:p-6 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-black text-[9px] font-black uppercase tracking-widest px-2.5 py-1" style={{ background: "linear-gradient(180deg, #f9c84a 0%, #e08a00 100%)" }}>
                            {featuredEvent.type === "upcoming" ? "Upcoming" : "Featured"}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#666" }}>{featuredEvent.date}</span>
                        </div>
                        <h3 className="text-white font-black text-xl md:text-2xl uppercase tracking-tight leading-tight mb-4 line-clamp-3">{featuredEvent.title}</h3>
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest transition-all group-hover:gap-3" style={{ color: "#f5a623" }}>
                          View Event <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                )}

                {/* ── Remaining events in equal 3-column grid ── */}
                {restEvents.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {restEvents.slice(0, 6).map((event: any) => (
                      <Link
                        key={event.id}
                        href={event.event_name_slug ? `/events/${event.event_name_slug}` : `/events/${event.id}`}
                        className="group block"
                      >
                        <div className="relative overflow-hidden h-full" style={{ borderRadius: "3px", background: "#0d0d0d", border: "1px solid rgba(245,166,35,0.1)" }}>
                          <div className="absolute top-0 left-0 right-0 h-[2px] z-10" style={{ background: "linear-gradient(to right, #f5a623, transparent)" }} />
                          <div className="aspect-[16/9] w-full overflow-hidden" style={{ background: "#070707" }}>
                            <img
                              src={event.image || event.imageUrl || FALLBACK_EVENT_IMG}
                              alt={event.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              style={{ display: "block" }}
                              onError={(e) => { const img = e.currentTarget; if (img.src !== FALLBACK_EVENT_IMG) img.src = FALLBACK_EVENT_IMG; }}
                            />
                          </div>
                          <div className="px-3 py-2.5" style={{ borderTop: "1px solid rgba(245,166,35,0.1)", background: "rgba(0,0,0,0.9)" }}>
                            <span className="text-[9px] font-black uppercase tracking-widest block mb-1" style={{ color: "#f5a623" }}>
                              {event.type === "upcoming" ? "Upcoming" : "Event"}
                            </span>
                            <h3 className="text-white font-black text-sm uppercase tracking-tight line-clamp-2 leading-snug">{event.title}</h3>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── LATEST NEWS ── */}
          {latestNews.length > 0 && (
            <section className="mt-14 md:mt-20">
              <CFSectionHeader label="Breaking" title="Latest News" linkHref="/news" linkLabel="All News" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {latestNews.slice(0, 6).map((item: any, idx: number) => {
                  const href = item.news_slug ? `/news/${item.news_slug}` : `/news/${item.id}`;
                  const title = item.title || "News";
                  const excerpt = String(item.summary || item.content || "").replace(/<[^>]+>/g, " ").trim().slice(0, 100);
                  const cat = item.category || "News";
                  const isFirst = idx === 0;
                  const catBg = cat.toLowerCase().includes("event") ? "rgba(245,166,35,0.12)" : cat.toLowerCase().includes("tutorial") ? "rgba(99,102,241,0.12)" : "rgba(156,163,175,0.1)";
                  const catColor = cat.toLowerCase().includes("event") ? "#f5a623" : cat.toLowerCase().includes("tutorial") ? "#818cf8" : "#9ca3af";
                  return (
                    <Link key={item.id} href={href} className="group block">
                      <div
                        className="h-full overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
                        style={{
                          background: "var(--card)",
                          border: isFirst ? "1px solid rgba(245,166,35,0.2)" : "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "3px",
                          boxShadow: isFirst ? "0 4px 20px rgba(245,166,35,0.08)" : "0 2px 10px rgba(0,0,0,0.3)",
                        }}
                      >
                        {/* Top accent */}
                        <div className="h-[2px]" style={{ background: isFirst ? "linear-gradient(to right, #f5a623, transparent)" : "transparent" }} />
                        {item.image && (
                          <div className="relative overflow-hidden aspect-[16/9]" style={{ background: "#0d0d0d" }}>
                            <img
                              src={item.image}
                              alt={title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)" }} />
                            {isFirst && (
                              <div className="absolute top-2.5 left-2.5">
                                <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-2 py-1" style={{ background: "#f5a623", color: "#000" }}>
                                  <Flame className="h-2.5 w-2.5" /> Latest
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5" style={{ background: catBg, color: catColor, borderRadius: "2px" }}>{cat}</span>
                            {item.dateRange && <span className="text-[9px]" style={{ color: "#444" }}>{item.dateRange}</span>}
                          </div>
                          <h3 className="font-black text-sm uppercase tracking-tight leading-snug line-clamp-2 mb-1.5" style={{ color: "var(--foreground)" }}>{title}</h3>
                          {excerpt && <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: "#555" }}>{excerpt}</p>}
                          {item.author && (
                            <div className="flex items-center gap-1.5 mt-2.5 pt-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                              <User className="h-3 w-3 flex-shrink-0" style={{ color: "#444" }} />
                              <span className="text-[9px] font-bold uppercase tracking-wider truncate" style={{ color: "#555" }}>{item.author}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── WEAPONS ── */}
          <section className="mt-14 md:mt-20">
            <CFSectionHeader label="Arsenal" title="Latest Weapons" linkHref="/weapons" linkLabel="Full Arsenal" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {displayWeapons.length === 0
                ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-64 animate-pulse" style={{ background: "#111", borderRadius: "2px" }} />
                ))
                : displayWeapons.map((weapon) => {
                  const image = weapon.image || weapon.imageUrl || "";
                  const damage = weapon.stats?.damage ?? weapon.stats?.Damage;
                  const recoil = weapon.stats?.recoil ?? weapon.stats?.Recoil;
                  return (
                    <Link key={weapon.id} href="/weapons" className="group block">
                      <div
                        className="relative overflow-hidden transition-all duration-300 hover:-translate-y-1"
                        style={{
                          background: "var(--card)",
                          border: "1px solid rgba(245,166,35,0.1)",
                          borderRadius: "2px",
                          boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
                        }}
                      >
                        {/* Top accent on hover */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "linear-gradient(to right, #f5a623, transparent)" }} />

                        {/* Image */}
                        <div className="relative aspect-[5/4] overflow-hidden" style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #141414 100%)" }}>
                          {image ? (
                            <img
                              src={image}
                              alt={weapon.name}
                              className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Shield className="h-10 w-10" style={{ color: "#2a2a2a" }} />
                            </div>
                          )}
                          <span
                            className="absolute bottom-2 right-2 text-[9px] font-black uppercase tracking-widest px-2 py-0.5"
                            style={{ background: "rgba(245,166,35,0.12)", color: "#f5a623", border: "1px solid rgba(245,166,35,0.2)" }}
                          >
                            {weapon.category || "Weapon"}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="px-3 pt-3 pb-4 space-y-3">
                          <h3 className="font-black text-sm uppercase tracking-tight line-clamp-1 leading-tight" style={{ color: "var(--foreground)" }}>
                            {weapon.name}
                          </h3>
                          <div className="space-y-2">
                            <StatBar label="Damage" value={damage ?? "—"} />
                            <StatBar label="Recoil" value={recoil ?? "—"} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </section>

          {/* ── CATEGORIES ── */}
          <section className="mt-14 md:mt-20 mb-16 md:mb-24">
            <CFSectionHeader label="Database" title="Explore Categories" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {categories.map((cat) => (
                <Link key={cat.title} href={cat.link} className="group block">
                  <div className="relative overflow-hidden aspect-[4/3] cursor-pointer" style={{ borderRadius: "2px" }}>
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
                    <div className="absolute inset-0 transition-opacity duration-300" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)" }} />

                    {/* Top golden accent that appears on hover */}
                    <div
                      className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: `linear-gradient(to right, ${cat.color}, transparent)` }}
                    />

                    {/* Bottom-left accent line */}
                    <div
                      className="absolute bottom-0 left-0 top-0 w-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: `linear-gradient(to bottom, transparent, ${cat.color})` }}
                    />

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {cat.subtitle}
                      </p>
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-black text-2xl md:text-3xl uppercase tracking-tighter leading-none">
                          {cat.title}
                        </h3>
                        <div
                          className="w-8 h-8 flex items-center justify-center transition-all duration-300 group-hover:translate-x-1"
                          style={{ border: "1px solid rgba(255,255,255,0.2)" }}
                        >
                          <ChevronRight className="h-4 w-4 text-white/60 group-hover:text-white transition-colors" />
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
