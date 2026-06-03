import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PageSEO from "@/components/PageSEO";
import { EventsRibbon } from "@/components/EventsRibbon";
import { getEvents, getNews, getSiteSettings } from "@/lib/supabaseApi";
import { HighlightsSection } from "@/components/HighlightsSection";
import { GMSection } from "@/components/GMSection";
import { Search, ArrowRight, Zap, Shield, Target, Users, Globe, ChevronRight, Calendar, Newspaper } from "lucide-react";
import { useLocation } from "wouter";

const ACCENT = "#d4a017";
const ACCENT_DIM = "rgba(212,160,23,0.15)";
const BORDER = "rgba(255,255,255,0.08)";
const BORDER_HOVER = "rgba(212,160,23,0.4)";
const BG = "#0a0a0a";
const CARD = "#111111";
const CARD2 = "#161616";

function stripHtml(html: string): string {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function DotGrid() {
  return (
    <div style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)`,
      backgroundSize: "28px 28px",
    }} />
  );
}

function GlowLine({ top = false }: { top?: boolean }) {
  return (
    <div style={{
      position: "absolute",
      [top ? "top" : "bottom"]: 0,
      left: "50%",
      transform: "translateX(-50%)",
      width: "60%",
      height: "1px",
      background: `linear-gradient(to right, transparent, ${ACCENT}55, transparent)`,
    }} />
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px",
      background: ACCENT_DIM,
      border: `1px solid rgba(212,160,23,0.3)`,
      borderRadius: 999,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
      color: ACCENT, fontFamily: "Inter, system-ui, sans-serif",
      textTransform: "uppercase",
    }}>
      {label}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <div style={{ width: 16, height: 1, background: ACCENT, opacity: 0.6 }} />
      <span style={{
        fontSize: 11, fontWeight: 600, letterSpacing: "0.14em",
        color: ACCENT, fontFamily: "Inter, system-ui, sans-serif",
        textTransform: "uppercase",
      }}>
        {children}
      </span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: 700,
      fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
      color: "#ffffff",
      margin: 0,
      letterSpacing: "-0.02em",
      lineHeight: 1.2,
    }}>
      {children}
    </h2>
  );
}

function ViewAllLink({ href, label = "View all" }: { href: string; label?: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 13, fontWeight: 500,
        color: hovered ? ACCENT : "rgba(255,255,255,0.5)",
        textDecoration: "none",
        fontFamily: "Inter, system-ui, sans-serif",
        transition: "color 0.2s",
      }}>
      {label} <ArrowRight size={14} />
    </a>
  );
}

function StatCard({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <div style={{
      background: CARD, border: `1px solid ${BORDER}`,
      borderRadius: 12, padding: "20px 24px",
      display: "flex", alignItems: "center", gap: 16,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: ACCENT_DIM, border: `1px solid rgba(212,160,23,0.25)`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={18} color={ACCENT} strokeWidth={1.5} />
      </div>
      <div>
        <p style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0, fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.02em" }}>{value}</p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0, fontFamily: "Inter, system-ui, sans-serif", fontWeight: 500 }}>{label}</p>
      </div>
    </div>
  );
}

function EventCard({ event, featured = false }: { event: any; featured?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const href = event.event_name_slug ? `/events/${event.event_name_slug}` : `/events/${event.id}`;
  const dateStr = event.date ? new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

  return (
    <a href={href} style={{ textDecoration: "none", display: "block", height: "100%" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      <div style={{
        background: hovered ? CARD2 : CARD,
        border: `1px solid ${hovered ? BORDER_HOVER : BORDER}`,
        borderRadius: 12,
        overflow: "hidden",
        height: "100%",
        transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
        boxShadow: hovered ? `0 0 0 1px rgba(212,160,23,0.15), 0 8px 32px rgba(0,0,0,0.4)` : "none",
      }}>
        {event.image && (
          <div style={{ height: featured ? 220 : 160, overflow: "hidden", position: "relative" }}>
            <img src={event.image} alt={event.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s", transform: hovered ? "scale(1.04)" : "scale(1)" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" }} />
            <div style={{ position: "absolute", top: 12, left: 12 }}>
              <Tag label={event.type || "Event"} />
            </div>
          </div>
        )}
        <div style={{ padding: featured ? "20px 24px" : "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Calendar size={12} color="rgba(255,255,255,0.35)" />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "Inter, system-ui, sans-serif" }}>{dateStr}</span>
          </div>
          <h3 style={{
            fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600,
            fontSize: featured ? "1.05rem" : "0.9rem",
            color: "#fff", margin: "0 0 8px",
            lineHeight: 1.4, letterSpacing: "-0.01em",
          }}>
            {event.title}
          </h3>
          {event.description && (
            <p style={{
              fontFamily: "Inter, system-ui, sans-serif", fontSize: 13,
              color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.6,
            }}>
              {stripHtml(event.description).slice(0, featured ? 120 : 80)}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 12 }}>
            <span style={{ fontSize: 12, color: ACCENT, fontFamily: "Inter, system-ui, sans-serif", fontWeight: 500 }}>Read more</span>
            <ChevronRight size={12} color={ACCENT} />
          </div>
        </div>
      </div>
    </a>
  );
}

function NewsCard({ item }: { item: any }) {
  const [hovered, setHovered] = useState(false);
  const href = item.news_slug ? `/news/${item.news_slug}` : `/news/${item.id}`;
  const excerpt = stripHtml(String(item.summary || item.content || "")).trim().slice(0, 90);

  return (
    <a href={href} style={{ textDecoration: "none", display: "block" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      <div style={{
        background: hovered ? CARD2 : "transparent",
        border: `1px solid ${hovered ? BORDER_HOVER : BORDER}`,
        borderRadius: 10, padding: "16px",
        display: "flex", gap: 14, alignItems: "flex-start",
        transition: "all 0.2s",
      }}>
        {item.image ? (
          <div style={{ width: 64, height: 64, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
            <img src={item.image} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ) : (
          <div style={{ width: 64, height: 64, borderRadius: 8, background: CARD2, border: `1px solid ${BORDER}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Newspaper size={20} color="rgba(255,255,255,0.2)" />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {item.category && (
            <span style={{ fontSize: 10, fontWeight: 600, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "Inter, system-ui, sans-serif", display: "block", marginBottom: 4 }}>
              {item.category}
            </span>
          )}
          <h4 style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600, fontSize: 13, color: "#fff", margin: "0 0 4px", lineHeight: 1.4, letterSpacing: "-0.01em" }}>
            {item.title}
          </h4>
          {excerpt && (
            <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.5 }}>
              {excerpt}
            </p>
          )}
        </div>
        <ChevronRight size={14} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0, marginTop: 2 }} />
      </div>
    </a>
  );
}

function QuickLinkCard({ icon: Icon, label, href, desc }: { icon: any; label: string; href: string; desc: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a href={href} style={{ textDecoration: "none" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      <div style={{
        background: hovered ? CARD2 : CARD,
        border: `1px solid ${hovered ? BORDER_HOVER : BORDER}`,
        borderRadius: 12, padding: "20px",
        transition: "all 0.2s",
        boxShadow: hovered ? `0 0 0 1px rgba(212,160,23,0.1)` : "none",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: hovered ? ACCENT_DIM : "rgba(255,255,255,0.05)",
          border: `1px solid ${hovered ? "rgba(212,160,23,0.3)" : BORDER}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 12, transition: "all 0.2s",
        }}>
          <Icon size={16} color={hovered ? ACCENT : "rgba(255,255,255,0.5)"} strokeWidth={1.5} />
        </div>
        <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600, fontSize: 14, color: "#fff", margin: "0 0 4px" }}>{label}</p>
        <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.5 }}>{desc}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 12 }}>
          <span style={{ fontSize: 11, color: hovered ? ACCENT : "rgba(255,255,255,0.3)", fontFamily: "Inter, system-ui, sans-serif", fontWeight: 500, transition: "color 0.2s" }}>Explore</span>
          <ArrowRight size={11} color={hovered ? ACCENT : "rgba(255,255,255,0.3)"} style={{ transition: "color 0.2s" }} />
        </div>
      </div>
    </a>
  );
}

function HeroSearch() {
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();
  const [focused, setFocused] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setLocation(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <form onSubmit={handleSearch} style={{ position: "relative", maxWidth: 480, width: "100%" }}>
      <div style={{
        display: "flex", alignItems: "center",
        background: "rgba(255,255,255,0.05)",
        border: `1px solid ${focused ? "rgba(212,160,23,0.5)" : "rgba(255,255,255,0.12)"}`,
        borderRadius: 10, overflow: "hidden",
        transition: "border-color 0.2s",
        boxShadow: focused ? `0 0 0 3px rgba(212,160,23,0.08)` : "none",
      }}>
        <Search size={16} color="rgba(255,255,255,0.3)" style={{ marginLeft: 16, flexShrink: 0 }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search weapons, maps, mercenaries..."
          style={{
            flex: 1, padding: "13px 12px",
            background: "transparent", border: "none", outline: "none",
            color: "#fff", fontSize: 14,
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        />
        <button type="submit" style={{
          padding: "10px 18px", margin: 4,
          background: ACCENT, border: "none", borderRadius: 7,
          color: "#000", fontWeight: 600, fontSize: 13,
          fontFamily: "Inter, system-ui, sans-serif",
          cursor: "pointer", whiteSpace: "nowrap",
        }}>
          Search
        </button>
      </div>
    </form>
  );
}

export default function Home() {
  const { data: siteSettingsData } = useQuery({
    queryKey: ["site-settings-home"],
    queryFn: () => getSiteSettings(),
    staleTime: 2 * 60 * 1000,
  });
  const siteSettings = siteSettingsData as any;
  const heroImage = siteSettings?.heroImage || "/cf-heroes-bg.png";

  const { data: eventsData } = useQuery<{ items: any[]; total: number }>({
    queryKey: ["/api/events", { limit: 10 }],
    queryFn: () => getEvents({ limit: 10 }),
  });
  const allEvents = eventsData?.items || [];
  const displayEvents = useMemo(() =>
    allEvents.filter((e: any) => !e.rawHtmlContent && String(e.title || "").trim()).slice(0, 7),
    [allEvents]
  );
  const ribbonEvents = allEvents.filter((e: any) => !e.rawHtmlContent).slice(0, 10);

  const { data: latestNewsData } = useQuery<{ items: any[]; total: number }>({
    queryKey: ["/api/news", { limit: 8, home: true }],
    queryFn: () => getNews({ limit: 8, offset: 0 }),
    staleTime: 5 * 60 * 1000,
  });
  const latestNews = latestNewsData?.items || [];

  const featuredEvent = displayEvents[0] || null;
  const gridEvents = displayEvents.slice(1, 4);

  return (
    <>
      <PageSEO
        title="CrossFire Wiki — Guides, Weapons, Modes & Community"
        description="CrossFire Wiki: weapons, modes, tutorials, ranks, events, and community resources."
      />

      <div style={{ background: BG, minHeight: "100vh", color: "#fff" }}>

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <div style={{ position: "relative", overflow: "hidden" }}>
          {heroImage && (
            <img src={heroImage} alt="CrossFire"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", opacity: 0.18 }} />
          )}
          <DotGrid />
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,160,23,0.08) 0%, transparent 70%)` }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, transparent 60%, ${BG} 100%)` }} />
          <GlowLine top />

          <div style={{ position: "relative", maxWidth: 1100, margin: "0 auto", padding: "100px 24px 80px" }}>

            {/* Badge */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "6px 14px",
                background: ACCENT_DIM,
                border: `1px solid rgba(212,160,23,0.3)`,
                borderRadius: 999,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT, boxShadow: `0 0 8px ${ACCENT}` }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: ACCENT, fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "0.06em" }}>
                  The Definitive CrossFire Resource
                </span>
              </div>
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 800, fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
              color: "#ffffff", textAlign: "center",
              margin: "0 0 20px", letterSpacing: "-0.04em", lineHeight: 1.05,
            }}>
              CrossFire Wiki
            </h1>

            <p style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
              color: "rgba(255,255,255,0.5)",
              textAlign: "center", marginBottom: 40,
              maxWidth: 520, marginLeft: "auto", marginRight: "auto",
              lineHeight: 1.6,
            }}>
              Weapons, mercenaries, ranks, maps, events — everything you need to dominate.
            </p>

            {/* Search */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <HeroSearch />
            </div>
          </div>
        </div>

        {/* ── EVENTS RIBBON ────────────────────────────────────────────── */}
        {ribbonEvents.length > 0 && (
          <div style={{
            borderTop: `1px solid ${BORDER}`,
            borderBottom: `1px solid ${BORDER}`,
            background: "rgba(255,255,255,0.02)",
            backdropFilter: "blur(8px)",
          }}>
            <EventsRibbon events={ribbonEvents} />
          </div>
        )}

        {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px" }}>

          {/* ── EVENTS ─────────────────────────────────────────────────── */}
          {displayEvents.length > 0 && (
            <section style={{ marginBottom: 80 }}>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
                <div>
                  <SectionLabel>Latest</SectionLabel>
                  <SectionTitle>Events & Announcements</SectionTitle>
                </div>
                <ViewAllLink href="/events" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="events-main-grid">
                {/* Featured large */}
                {featuredEvent && (
                  <div style={{ gridColumn: "1", gridRow: "1 / 3" }}>
                    <EventCard event={featuredEvent} featured />
                  </div>
                )}
                {/* Side 2 events */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {gridEvents.slice(0, 2).map((ev: any) => (
                    <EventCard key={ev.id} event={ev} />
                  ))}
                </div>
              </div>

              {/* Bottom row */}
              {displayEvents.slice(3, 6).length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 16 }} className="events-bottom-grid">
                  {displayEvents.slice(3, 6).map((ev: any) => (
                    <EventCard key={ev.id} event={ev} />
                  ))}
                </div>
              )}
              <style>{`
                @media(max-width:768px){
                  .events-main-grid{grid-template-columns:1fr!important;}
                  .events-bottom-grid{grid-template-columns:1fr!important;}
                }
              `}</style>
            </section>
          )}

          {/* ── DIVIDER ─────────────────────────────────────────────────── */}
          <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${BORDER} 20%, ${BORDER} 80%, transparent)`, marginBottom: 80 }} />

          {/* ── LATEST NEWS ─────────────────────────────────────────────── */}
          {latestNews.length > 0 && (
            <section style={{ marginBottom: 80 }}>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                  <SectionLabel>Stay Informed</SectionLabel>
                  <SectionTitle>Latest News</SectionTitle>
                </div>
                <ViewAllLink href="/news" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }} className="news-grid-home">
                {latestNews.slice(0, 8).map((item: any) => (
                  <NewsCard key={item.id} item={item} />
                ))}
              </div>
              <style>{`@media(max-width:640px){.news-grid-home{grid-template-columns:1fr!important;}}`}</style>
            </section>
          )}

          {/* ── DIVIDER ─────────────────────────────────────────────────── */}
          <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${BORDER} 20%, ${BORDER} 80%, transparent)`, marginBottom: 80 }} />

          {/* ── QUICK LINKS / WIKI SECTIONS ─────────────────────────────── */}
          <section style={{ marginBottom: 80 }}>
            <div style={{ marginBottom: 28 }}>
              <SectionLabel>Explore</SectionLabel>
              <SectionTitle>Wiki Sections</SectionTitle>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              <QuickLinkCard icon={Target} label="Weapons" href="/weapons" desc="Complete database of all CF weapons, stats & variants" />
              <QuickLinkCard icon={Shield} label="Game Modes" href="/modes" desc="Every game mode explained with strategies" />
              <QuickLinkCard icon={Globe} label="Maps" href="/maps" desc="All maps with layouts and callout locations" />
              <QuickLinkCard icon={Users} label="Mercenaries" href="/mercenaries" desc="Character profiles, skills and voice lines" />
              <QuickLinkCard icon={Zap} label="Ranks" href="/ranks" desc="Full ranking system from Private to Hero" />
              <QuickLinkCard icon={Newspaper} label="Tutorials" href="/tutorials" desc="Tips, guides and strategies for all skill levels" />
            </div>
          </section>

          {/* ── DIVIDER ─────────────────────────────────────────────────── */}
          <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${BORDER} 20%, ${BORDER} 80%, transparent)`, marginBottom: 80 }} />

          {/* ── HIGHLIGHTS ──────────────────────────────────────────────── */}
          <section style={{ marginBottom: 80 }}>
            <div style={{ marginBottom: 28 }}>
              <SectionLabel>Archive</SectionLabel>
              <SectionTitle>Monthly Highlights</SectionTitle>
            </div>
            <HighlightsSection hideHeader />
          </section>

          {/* ── DIVIDER ─────────────────────────────────────────────────── */}
          <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${BORDER} 20%, ${BORDER} 80%, transparent)`, marginBottom: 80 }} />

          {/* ── GAME MASTERS ────────────────────────────────────────────── */}
          <section style={{ marginBottom: 80 }}>
            <div style={{ marginBottom: 28 }}>
              <SectionLabel>Official Staff</SectionLabel>
              <SectionTitle>Game Masters</SectionTitle>
            </div>
            <GMSection hideHeader />
          </section>

          {/* ── CTA BANNER ──────────────────────────────────────────────── */}
          <section>
            <div style={{
              position: "relative", overflow: "hidden",
              background: CARD, border: `1px solid ${BORDER}`,
              borderRadius: 16, padding: "48px 40px",
              textAlign: "center",
            }}>
              <DotGrid />
              <GlowLine top />
              <div style={{ position: "relative" }}>
                <Tag label="Community" />
                <h2 style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontWeight: 700, fontSize: "clamp(1.4rem, 3vw, 2rem)",
                  color: "#fff", margin: "16px 0 10px", letterSpacing: "-0.02em",
                }}>
                  Join the CrossFire Wiki Discord
                </h2>
                <p style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 15, color: "rgba(255,255,255,0.45)",
                  margin: "0 auto 28px", maxWidth: 440, lineHeight: 1.6,
                }}>
                  Hundreds of players sharing strategies, loadouts, and event alerts in real time.
                </p>
                <a href="https://discord.gg/7AbuDrNNJM" target="_blank" rel="noopener noreferrer" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "12px 24px",
                  background: "#5865f2",
                  borderRadius: 8, textDecoration: "none",
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontWeight: 600, fontSize: 14, color: "#fff",
                }}>
                  Join Discord Server <ArrowRight size={16} />
                </a>
              </div>
              <GlowLine />
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
