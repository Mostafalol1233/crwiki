import { useMemo, useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import PageSEO from "@/components/PageSEO";
import { EventsRibbon } from "@/components/EventsRibbon";
import { getEvents, getNews, getSiteSettings, getPortalImages } from "@/lib/supabaseApi";
import { HighlightsSection } from "@/components/HighlightsSection";
import { GMSection } from "@/components/GMSection";
import {
  Search, ArrowRight, Zap, Shield, Target, Users, Globe, ChevronRight,
  Calendar, Newspaper, MapPin, Star, BookOpen, MessageSquare, Clock,
  TrendingUp, Sword, Info,
} from "lucide-react";
import { useLocation, Link } from "wouter";

// ─── Constants ────────────────────────────────────────────────────────────────
const GOLD = "#f5a623";
const GOLD_DIM = "rgba(245,166,35,0.08)";
const BORDER = "rgba(255,255,255,0.07)";
const CARD = "#111111";
const CARD2 = "#161616";
const BG = "#0a0a0a";

function stripHtml(html: string) {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

// ─── Wiki Portal Grid ─────────────────────────────────────────────────────────
const PORTALS = [
  {
    label: "Weapons",
    settingsKey: "portal_img_weapons",
    desc: "Rifles, pistols, snipers & melee",
    href: "/weapons",
    img: "/portal/weapons.png",
    imgFit: "cover" as const,
    imgBg: "#0a0800",
    imgPos: "center top",
  },
  {
    label: "Maps",
    settingsKey: "portal_img_maps",
    desc: "Battle arenas and layouts",
    href: "/maps",
    img: "/portal/maps.jpg",
    imgFit: "cover" as const,
    imgBg: "#0a0c10",
    imgPos: "center center",
  },
  {
    label: "Mercenaries",
    settingsKey: "portal_img_mercenaries",
    desc: "Elite playable operators",
    href: "/mercenaries",
    img: "/portal/mercenaries.png",
    imgFit: "cover" as const,
    imgBg: "#0a0a0a",
    imgPos: "center top",
  },
  {
    label: "Game Modes",
    settingsKey: "portal_img_modes",
    desc: "Every mode with strategies",
    href: "/modes",
    img: "/portal/modes.png",
    imgFit: "cover" as const,
    imgBg: "#0a0808",
    imgPos: "center center",
  },
  {
    label: "Ranks",
    settingsKey: "portal_img_ranks",
    desc: "Rank tiers, EXP & progression",
    href: "/ranks",
    img: "/portal/ranks.png",
    imgFit: "cover" as const,
    imgBg: "#0a0a0c",
    imgPos: "center center",
  },
  {
    label: "Events",
    settingsKey: "portal_img_events",
    desc: "Tournaments & limited-time ops",
    href: "/events",
    img: "/portal/events.jpg",
    imgFit: "cover" as const,
    imgBg: "#0a080a",
    imgPos: "center center",
  },
];

function PortalCard({ portal }: { portal: typeof PORTALS[0] }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={portal.href}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: portal.imgBg,
          border: `1px solid ${hovered ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)"}`,
          borderRadius: 8,
          cursor: "pointer",
          transition: "all 0.22s",
          position: "relative",
          overflow: "hidden",
          height: 200,
          boxShadow: hovered ? "0 8px 32px rgba(0,0,0,0.6)" : "0 2px 8px rgba(0,0,0,0.4)",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
        }}
      >
        {/* Category image */}
        <img
          src={portal.img}
          alt={portal.label}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: portal.imgFit,
            objectPosition: portal.imgPos || "center top",
            transition: "transform 0.35s ease",
            transform: hovered ? "scale(1.06)" : "scale(1)",
          }}
          onError={(e) => { e.currentTarget.style.opacity = "0"; }}
        />

        {/* Gradient overlay — bottom fade for text */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.88) 100%)",
          pointerEvents: "none",
        }} />

        {/* Top shimmer on hover */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: "rgba(255,255,255,0.4)",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.2s",
        }} />

        {/* Text at bottom */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "12px 14px",
        }}>
          <p style={{
            fontWeight: 800, fontSize: 14, color: "#fff",
            margin: "0 0 2px", letterSpacing: "-0.01em",
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
          }}>
            {portal.label}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{
              fontSize: 10, color: hovered ? "#fff" : "rgba(255,255,255,0.5)",
              fontWeight: 600, transition: "color 0.2s",
              textShadow: "0 1px 4px rgba(0,0,0,0.8)",
            }}>
              Browse
            </span>
            <ArrowRight size={10} color={hovered ? "#fff" : "rgba(255,255,255,0.4)"} style={{ transition: "color 0.2s" }} />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Hero Search ──────────────────────────────────────────────────────────────
function HeroSearch() {
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();
  const [focused, setFocused] = useState(false);
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setLocation(`/search?q=${encodeURIComponent(query.trim())}`);
  };
  return (
    <form onSubmit={handleSearch} style={{ position: "relative", maxWidth: 520, width: "100%" }}>
      <div style={{
        display: "flex", alignItems: "center",
        background: "rgba(255,255,255,0.06)",
        border: `1px solid ${focused ? "rgba(245,166,35,0.5)" : "rgba(255,255,255,0.12)"}`,
        borderRadius: 8, overflow: "hidden",
        boxShadow: focused ? `0 0 0 3px rgba(245,166,35,0.08)` : "none",
        transition: "all 0.2s",
      }}>
        <Search size={15} color="rgba(255,255,255,0.3)" style={{ marginLeft: 14, flexShrink: 0 }} />
        <input
          type="text" value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search weapons, maps, mercenaries, modes..."
          style={{
            flex: 1, padding: "12px 10px",
            background: "transparent", border: "none", outline: "none",
            color: "#fff", fontSize: 14, fontFamily: "Inter, system-ui, sans-serif",
          }}
        />
        <button type="submit" style={{
          padding: "9px 18px", margin: "3px",
          background: GOLD, border: "none", borderRadius: 5,
          color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}>
          Search
        </button>
      </div>
    </form>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────
function EventCard({ event, featured = false }: { event: any; featured?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const href = event.event_name_slug ? `/events/${event.event_name_slug}` : `/events/${event.id}`;
  const dateStr = event.date ? new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  const img = event.image || event.imageUrl || event.image_url;

  return (
    <Link href={href}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? CARD2 : CARD,
          border: `1px solid ${hovered ? "rgba(245,166,35,0.3)" : BORDER}`,
          borderRadius: 6, overflow: "hidden", height: "100%",
          transition: "all 0.2s",
          boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.4)" : "none",
        }}
      >
        {img && (
          <div style={{ height: featured ? 200 : 150, overflow: "hidden", position: "relative", background: "#050505" }}>
            <img src={img} alt={event.title} style={{
              width: "100%", height: "100%", objectFit: "contain",
              transition: "transform 0.4s",
              transform: hovered ? "scale(1.04)" : "scale(1)",
            }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" }} />
            <div style={{ position: "absolute", top: 10, left: 10 }}>
              <span style={{
                display: "inline-block", fontSize: 9, fontWeight: 800, letterSpacing: "0.1em",
                textTransform: "uppercase", padding: "3px 8px",
                background: "rgba(0,0,0,0.75)", color: GOLD, borderRadius: 2,
                backdropFilter: "blur(4px)", border: `1px solid rgba(245,166,35,0.3)`,
              }}>
                {event.type || "Event"}
              </span>
            </div>
          </div>
        )}
        <div style={{ padding: featured ? "16px 18px" : "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
            <Calendar size={10} color="rgba(255,255,255,0.3)" />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{dateStr}</span>
          </div>
          <h3 style={{ fontWeight: 700, fontSize: featured ? 14 : 12, color: "#fff", margin: "0 0 6px", lineHeight: 1.4, letterSpacing: "-0.01em" }}>
            {event.title}
          </h3>
          {event.description && featured && (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 8px", lineHeight: 1.5 }}>
              {stripHtml(event.description).slice(0, 100)}…
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 11, color: GOLD, fontWeight: 600 }}>Read more</span>
            <ChevronRight size={11} color={GOLD} />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── News List Item ───────────────────────────────────────────────────────────
function NewsListItem({ item }: { item: any }) {
  const [hovered, setHovered] = useState(false);
  const href = item.news_slug ? `/news/${item.news_slug}` : item.post_slug ? `/posts/${item.post_slug}` : `/news/${item.id}`;
  const excerpt = stripHtml(String(item.summary || item.content || "")).slice(0, 80);
  const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

  return (
    <Link href={href}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex", gap: 12, padding: "12px 0",
          borderBottom: `1px solid ${BORDER}`,
          cursor: "pointer", transition: "all 0.15s",
        }}
      >
        {item.image || item.imageUrl ? (
          <div style={{ width: 60, height: 60, borderRadius: 4, overflow: "hidden", flexShrink: 0 }}>
            <img src={item.image || item.imageUrl} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ) : (
          <div style={{ width: 60, height: 60, borderRadius: 4, background: CARD2, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${BORDER}` }}>
            <Newspaper size={18} color="rgba(255,255,255,0.15)" />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            {item.category && (
              <span style={{ fontSize: 9, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.category}</span>
            )}
            {dateStr && <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>· {dateStr}</span>}
          </div>
          <h4 style={{ fontWeight: 600, fontSize: 13, color: hovered ? GOLD : "#fff", margin: "0 0 3px", lineHeight: 1.4, transition: "color 0.15s" }}>
            {item.title}
          </h4>
          {excerpt && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.4 }}>{excerpt}</p>}
        </div>
      </div>
    </Link>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ eyebrow, title, href }: { eyebrow: string; title: string; href?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 4px" }}>{eyebrow}</p>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>{title}</h2>
      </div>
      {href && (
        <Link href={href}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            View all <ArrowRight size={13} />
          </span>
        </Link>
      )}
    </div>
  );
}

// ─── Sidebar Block ────────────────────────────────────────────────────────────
function SidebarBlock({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div style={{
      background: CARD, border: `1px solid ${BORDER}`,
      borderRadius: 6, overflow: "hidden", marginBottom: 16,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 14px",
        borderBottom: `1px solid ${BORDER}`,
        background: "rgba(255,255,255,0.02)",
      }}>
        <Icon size={13} color={GOLD} strokeWidth={2} />
        <span style={{ fontSize: 10, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.12em" }}>{title}</span>
      </div>
      <div style={{ padding: "12px 14px" }}>
        {children}
      </div>
    </div>
  );
}

// ─── Did You Know entries ─────────────────────────────────────────────────────
const DYK_FACTS = [
  "CrossFire has over 650 million registered players worldwide, making it one of the most-played FPS games in history.",
  "The AK-47 was the first weapon ever introduced in CrossFire and remains one of the most iconic.",
  "Hero rank requires reaching the maximum EXP threshold — fewer than 1% of players ever achieve it.",
  "The Ghost Mode game type is unique to CrossFire, where one team plays as invisible ghost operatives.",
  "CrossFire has been licensed in over 80 countries across six continents.",
  "The Barrett M82A1 is considered by many to be the most powerful sniper rifle in CrossFire, capable of one-shot kills from extreme range.",
  "Black List and Global Risk have been at war since the game's launch — and their conflict forms the narrative backbone of every match.",
  "Zombie Mode (ZM) was originally introduced as a limited-time event before becoming one of the most popular permanent modes.",
  "CrossFire's Search & Destroy mode inspired competitive scenes in multiple countries, spawning national leagues and world championships.",
  "The in-game currency ZP (Nexon Points) lets players rent or purchase premium weapons, while GP is earned through gameplay.",
  "CrossFire has a dedicated esports circuit — the CrossFire Stars (CFS) — with finals held annually and prize pools reaching millions.",
  "Some weapons in CrossFire have holiday-exclusive skins that are only available for a limited window each year.",
  "The SAS, S.W.A.T., and OMOH are among the oldest playable characters in CrossFire, available since the game's early days.",
  "Ghost Mode maps are specifically designed so ghosts cannot use weapons — they win by knife-killing all Global Risk players.",
  "Mutation Mode introduced a player-versus-mutants format where one infected player starts and spreads the mutation to others.",
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Home() {
  const [dykIndex] = useState(() => Math.floor(Math.random() * DYK_FACTS.length));

  const { data: siteSettingsData } = useQuery({ queryKey: ["site-settings-home"], queryFn: getSiteSettings, staleTime: 2 * 60 * 1000 });
  const siteSettings = siteSettingsData as any;
  const heroImage = siteSettings?.heroImage || "/cf-heroes-bg.png";

  const { data: portalImages = {} } = useQuery<Record<string, string>>({
    queryKey: ["portal-images"],
    queryFn: getPortalImages,
    staleTime: 5 * 60 * 1000,
  });

  const { data: eventsData } = useQuery<{ items: any[]; total: number }>({
    queryKey: ["/api/events", { limit: 12 }],
    queryFn: () => getEvents({ limit: 12 }),
  });
  const allEvents = eventsData?.items || [];
  const displayEvents = useMemo(() =>
    allEvents.filter((e: any) => !e.rawHtmlContent && String(e.title || "").trim()).slice(0, 8),
    [allEvents]
  );
  const ribbonEvents = allEvents.filter((e: any) => !e.rawHtmlContent).slice(0, 10);

  const { data: latestNewsData } = useQuery<{ items: any[]; total: number }>({
    queryKey: ["/api/news", { limit: 8, home: true }],
    queryFn: () => getNews({ limit: 8, offset: 0 }),
    staleTime: 5 * 60 * 1000,
  });
  const latestNews = latestNewsData?.items || [];

  const newsItems = latestNews.length > 0 ? latestNews : displayEvents.slice(3).map((e: any) => ({
    ...e, category: e.type || "Event", news_slug: null, post_slug: null,
    summary: e.description, image: e.image || e.imageUrl,
  }));

  const featuredEvent = displayEvents[0] || null;
  const sideEvents = displayEvents.slice(1, 4);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <>
      <PageSEO
        title="CrossFire Wiki — Weapons, Modes, Maps & Community"
        description="The definitive CrossFire encyclopedia: weapons, maps, mercenaries, game modes, and community resources."
      />
      <div style={{ background: BG, minHeight: "100vh", color: "#fff" }}>

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <div style={{ position: "relative", overflow: "hidden", paddingBottom: 0 }}>
          {heroImage && (
            <img src={heroImage} alt="CrossFire Wiki hero background — elite mercenaries in action" style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "center top", opacity: 0.15,
            }} />
          )}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245,166,35,0.07) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, #0a0a0a 100%)" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(to right, transparent, rgba(245,166,35,0.2) 30%, rgba(245,166,35,0.2) 70%, transparent)` }} />

          <div style={{ position: "relative", maxWidth: 1140, margin: "0 auto", padding: "80px 24px 60px", textAlign: "center" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px",
              background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)",
              borderRadius: 999, marginBottom: 20,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, boxShadow: `0 0 8px ${GOLD}` }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: GOLD, letterSpacing: "0.08em" }}>The Definitive CrossFire Encyclopedia</span>
            </div>

            <h1 style={{
              fontWeight: 900, fontSize: "clamp(2.8rem, 7vw, 5rem)",
              color: "#fff", margin: "0 0 16px", letterSpacing: "-0.04em", lineHeight: 1.0,
            }}>
              CrossFire Wiki
            </h1>
            <p style={{ fontSize: "clamp(0.95rem, 2vw, 1.1rem)", color: "rgba(255,255,255,0.45)", margin: "0 auto 32px", maxWidth: 480, lineHeight: 1.6 }}>
              Weapons · Mercenaries · Maps · Game Modes — everything you need to dominate.
            </p>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <HeroSearch />
            </div>
          </div>
        </div>

        {/* ── EVENTS RIBBON ─────────────────────────────────────────────────── */}
        {ribbonEvents.length > 0 && (
          <div style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.015)" }}>
            <EventsRibbon events={ribbonEvents} />
          </div>
        )}

        {/* ── PORTAL HUB ───────────────────────────────────────────────────── */}
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "52px 24px 0" }}>
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 6px" }}>Explore The Wiki</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>Category Portals</h2>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0 }}>Jump to any section</p>
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
          }} className="portal-grid">
            {PORTALS.map((p) => {
              const dynamicImg = (portalImages as Record<string, string>)[p.settingsKey];
              return <PortalCard key={p.label} portal={dynamicImg ? { ...p, img: dynamicImg } : p} />;
            })}
          </div>

          <style>{`
            @media(max-width:900px){.portal-grid{grid-template-columns:repeat(2,1fr)!important;}}
            @media(max-width:480px){.portal-grid{grid-template-columns:1fr!important;}}
          `}</style>
        </div>


        {/* ── FACTIONS & CURRENCY ──────────────────────────────────────────── */}
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "40px 24px 0" }}>
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 4px" }}>The War</p>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>Factions & Currency</h2>
          </div>

          {/* Factions banner */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, alignItems: "center", background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "20px 28px", marginBottom: 10 }} className="factions-grid">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#3b82f6", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Global Risk</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>Counter-terrorism force</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: GOLD, letterSpacing: "-0.04em", lineHeight: 1 }}>VS</span>
              <div style={{ width: 1, height: 36, background: `linear-gradient(to bottom, transparent, ${BORDER}, transparent)` }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <img src="/black-list-logo.png" alt="Black List" style={{ height: 72, objectFit: "contain", filter: "drop-shadow(0 0 14px rgba(245,166,35,0.45))" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: GOLD, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Black List</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>Elite mercenary army</p>
              </div>
            </div>
          </div>
          <style>{`@media(max-width:480px){.factions-grid{grid-template-columns:1fr!important;gap:12px!important;}}`}</style>

          {/* Currency row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="currency-grid">
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "12px 16px" }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 800, color: "#a78bfa", margin: "0 0 1px", letterSpacing: "0.02em" }}>ZP — Zen Points</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0, lineHeight: 1.4 }}>Premium currency · crates, mercs & exclusive weapons</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "12px 16px" }}>
              <img src="/gp-icon.svg" alt="GP" style={{ width: 34, height: 34, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 800, color: GOLD, margin: "0 0 1px", letterSpacing: "0.02em" }}>GP — Game Points</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0, lineHeight: 1.4 }}>Free currency · earned from matches &amp; rank rewards</p>
              </div>
            </div>
          </div>
          <style>{`@media(max-width:480px){.currency-grid{grid-template-columns:1fr!important;}}`}</style>
        </div>

        {/* ── MAIN CONTENT (Two-column wiki layout) ─────────────────────────── */}
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "48px 24px 64px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 28, alignItems: "start" }} className="main-content-grid">

            {/* ── LEFT COLUMN ── */}
            <div>

              {/* FEATURED EVENT - wiki spotlight */}
              {featuredEvent && (
                <section style={{ marginBottom: 48 }}>
                  <SectionHeader eyebrow="Featured" title="Event Spotlight" href="/events" />
                  <Link href={featuredEvent.event_name_slug ? `/events/${featuredEvent.event_name_slug}` : `/events/${featuredEvent.id}`}>
                    <div style={{
                      background: CARD, border: `1px solid rgba(245,166,35,0.2)`,
                      borderRadius: 6, overflow: "hidden", cursor: "pointer",
                      transition: "box-shadow 0.2s",
                    }} className="featured-hover">
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(to right, ${GOLD}, transparent)` }} className="featured-bar" />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", position: "relative" }} className="featured-inner">
                        {/* Image */}
                        <div style={{ position: "relative", overflow: "hidden", minHeight: 240 }}>
                          {(featuredEvent.image || featuredEvent.imageUrl) ? (
                            <img src={featuredEvent.image || featuredEvent.imageUrl} alt={featuredEvent.title}
                              style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center", minHeight: 240, background: "#0a0a0a" }} />
                          ) : (
                            <div style={{ width: "100%", minHeight: 240, background: CARD2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Calendar size={40} color="rgba(255,255,255,0.1)" />
                            </div>
                          )}
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 50%, rgba(17,17,17,0.9) 100%)" }} />
                          <div style={{ position: "absolute", top: 12, left: 12 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 8px", background: GOLD, color: "#000", fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", borderRadius: 2 }}>
                              <Zap size={9} /> Featured Event
                            </span>
                          </div>
                        </div>
                        {/* Content */}
                        <div style={{ padding: "24px 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                          {featuredEvent.type && (
                            <span style={{ display: "inline-block", fontSize: 9, fontWeight: 800, color: GOLD, background: GOLD_DIM, border: `1px solid rgba(245,166,35,0.2)`, padding: "3px 8px", borderRadius: 2, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, width: "fit-content" }}>
                              {featuredEvent.type}
                            </span>
                          )}
                          <h2 style={{ fontWeight: 800, fontSize: 20, color: "#fff", margin: "0 0 10px", lineHeight: 1.3, letterSpacing: "-0.02em" }}>
                            {featuredEvent.title}
                          </h2>
                          {featuredEvent.description && (
                            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "0 0 14px", lineHeight: 1.6 }}>
                              {stripHtml(featuredEvent.description).slice(0, 130)}…
                            </p>
                          )}
                          {featuredEvent.date && (
                            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 14 }}>
                              <Calendar size={11} color={GOLD} />
                              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                                {new Date(featuredEvent.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                              </span>
                            </div>
                          )}
                          <span style={{ fontSize: 12, color: GOLD, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                            View Event <ChevronRight size={13} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <style>{`
                    .featured-hover:hover{box-shadow:0 12px 40px rgba(0,0,0,0.5);}
                    .featured-bar{display:block;}
                    @media(max-width:640px){.featured-inner{grid-template-columns:1fr!important;}}
                  `}</style>
                </section>
              )}

              {/* EVENTS GRID */}
              {sideEvents.length > 0 && (
                <section style={{ marginBottom: 48 }}>
                  <SectionHeader eyebrow="Latest" title="Recent Events" href="/events" />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }} className="events-mini-grid">
                    {sideEvents.map((ev: any) => <EventCard key={ev.id} event={ev} />)}
                  </div>
                  <style>{`@media(max-width:640px){.events-mini-grid{grid-template-columns:1fr!important;}}`}</style>
                </section>
              )}

              {/* DIVIDER */}
              <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${BORDER} 20%, ${BORDER} 80%, transparent)`, marginBottom: 48 }} />

              {/* NEWS FEED */}
              {newsItems.length > 0 && (
                <section style={{ marginBottom: 48 }}>
                  <SectionHeader eyebrow="Stay Informed" title="News & Updates" href="/news" />
                  <div>
                    {newsItems.slice(0, 7).map((item: any) => <NewsListItem key={item.id} item={item} />)}
                  </div>
                </section>
              )}

              {/* DIVIDER */}
              <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${BORDER} 20%, ${BORDER} 80%, transparent)`, marginBottom: 48 }} />

              {/* HIGHLIGHTS */}
              <section style={{ marginBottom: 48 }}>
                <SectionHeader eyebrow="Archive" title="Monthly Highlights" />
                <HighlightsSection hideHeader />
              </section>

              {/* DIVIDER */}
              <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${BORDER} 20%, ${BORDER} 80%, transparent)`, marginBottom: 48 }} />

              {/* GAME MASTERS */}
              <section>
                <SectionHeader eyebrow="Official Staff" title="Game Masters" />
                <GMSection hideHeader />
              </section>
            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <aside style={{ position: "sticky", top: 80 }}>

              {/* On This Wiki */}
              <SidebarBlock title="On This Wiki" icon={BookOpen}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 12px", lineHeight: 1.6 }}>
                  CrossFire Wiki is a community resource covering every aspect of the CrossFire FPS game. Explore weapons, maps, ranks, mercenaries and more.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 8px", background: CARD2, borderRadius: 4, border: `1px solid ${BORDER}` }}>
                  <Clock size={11} color="rgba(255,255,255,0.3)" />
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{today}</span>
                </div>
              </SidebarBlock>

              {/* Did You Know */}
              <SidebarBlock title="Did You Know?" icon={Info}>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.7, fontStyle: "italic" }}>
                  "{DYK_FACTS[dykIndex]}"
                </p>
              </SidebarBlock>

              {/* Quick Navigation */}
              <SidebarBlock title="Quick Navigation" icon={Globe}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {[
                    { label: "Download CrossFire", href: "/download" },
                    { label: "Rank Calculator",    href: "/ranks" },
                    { label: "Weapon Database",    href: "/weapons" },
                    { label: "All Game Modes",     href: "/modes" },
                    { label: "Mercenaries",        href: "/mercenaries" },
                    { label: "Event Calendar",     href: "/events" },
                    { label: "Community Reviews",  href: "/reviews" },
                    { label: "Support Center",     href: "/support" },
                  ].map(({ label, href }) => (
                    <Link key={href} href={href}>
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "7px 8px", borderRadius: 4,
                        background: "transparent", cursor: "pointer",
                        transition: "background 0.15s",
                      }} className="nav-item">
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{label}</span>
                        <ChevronRight size={12} color="rgba(255,255,255,0.2)" />
                      </div>
                    </Link>
                  ))}
                </div>
                <style>{`.nav-item:hover{background:rgba(255,255,255,0.04)!important;}`}</style>
              </SidebarBlock>

              {/* Discord CTA */}
              <SidebarBlock title="Community" icon={MessageSquare}>
                <div style={{
                  background: "rgba(88,101,242,0.12)", border: "1px solid rgba(88,101,242,0.25)",
                  borderRadius: 5, padding: "14px", marginBottom: 10, textAlign: "center",
                }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>Join our Discord</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 12px", lineHeight: 1.5 }}>
                    Hundreds of active CF players
                  </p>
                  <a href="https://discord.gg/7AbuDrNNJM" target="_blank" rel="noopener noreferrer" style={{
                    display: "block", padding: "8px", background: "#5865f2",
                    borderRadius: 4, color: "#fff", fontSize: 12, fontWeight: 700,
                    textDecoration: "none", textAlign: "center",
                  }}>
                    Join Now
                  </a>
                </div>
                <Link href="/chat">
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 10px", background: CARD2, border: `1px solid ${BORDER}`,
                    borderRadius: 4, cursor: "pointer",
                  }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Live Chat</span>
                    <ChevronRight size={12} color="rgba(255,255,255,0.2)" />
                  </div>
                </Link>
              </SidebarBlock>

            </aside>
          </div>

          <style>{`@media(max-width:900px){.main-content-grid{grid-template-columns:1fr!important;}}`}</style>
        </div>
      </div>
    </>
  );
}
