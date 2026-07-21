import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { getEvents } from "@/lib/supabaseApi";
import PageSEO from "@/components/PageSEO";
import { DiscordWidget } from "@/components/DiscordWidget";
import {
  Calendar, Clock, MapPin, ChevronRight, Loader2, Zap, Filter,
  Flame, Star, Archive, CheckCircle2, BookOpen, Globe,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const GOLD = "#f5a623";
const BORDER = "rgba(255,255,255,0.07)";
const CARD = "var(--card)";
const CARD2 = "rgba(255,255,255,0.02)";
const FALLBACK = "/cf-heroes-bg.png";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d: string) {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return d; }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
}

function classifyEvent(dateStr: string): "active" | "upcoming" | "past" {
  if (!dateStr) return "past";
  const d = new Date(dateStr);
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (d < sevenDaysAgo) return "past";
  if (d > thirtyDaysAhead) return "upcoming";
  return "active";
}

function getStatusStyle(status: string) {
  if (status === "active") return { bg: "rgba(52,211,153,0.12)", color: "#34d399", border: "rgba(52,211,153,0.25)", label: "Active" };
  if (status === "upcoming") return { bg: "rgba(245,166,35,0.12)", color: GOLD, border: "rgba(245,166,35,0.25)", label: "Upcoming" };
  return { bg: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "rgba(255,255,255,0.08)", label: "Ended" };
}

// ─── Countdown Timer ──────────────────────────────────────────────────────────
function Countdown({ dateStr }: { dateStr: string }) {
  const [parts, setParts] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    function calc() {
      const diff = new Date(dateStr).getTime() - Date.now();
      if (diff <= 0) return setParts({ d: 0, h: 0, m: 0, s: 0 });
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setParts({ d, h, m, s });
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [dateStr]);

  const cells = [
    { v: parts.d, l: "Days" },
    { v: parts.h, l: "Hrs" },
    { v: parts.m, l: "Min" },
    { v: parts.s, l: "Sec" },
  ];

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {cells.map(({ v, l }) => (
        <div key={l} style={{ textAlign: "center" }}>
          <div style={{
            minWidth: 34, padding: "4px 6px",
            background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.2)",
            borderRadius: 4, fontSize: 14, fontWeight: 800, color: GOLD, lineHeight: 1,
          }}>
            {String(v).padStart(2, "0")}
          </div>
          <p style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>{l}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Featured Event Card ──────────────────────────────────────────────────────
function FeaturedCard({ ev }: { ev: any }) {
  const slug = ev.event_name_slug || ev.id;
  const img = ev.image_url || ev.image || ev.imageUrl || FALLBACK;
  const status = classifyEvent(ev.date);
  const statusStyle = getStatusStyle(status);

  return (
    <Link href={`/events/${slug}`} className="group block">
      <div style={{
        background: CARD, border: "1px solid rgba(245,166,35,0.22)",
        borderRadius: 6, overflow: "hidden",
        boxShadow: "0 4px 30px rgba(0,0,0,0.4)",
        transition: "box-shadow 0.3s",
        position: "relative",
      }} className="featured-card">
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(to right, ${GOLD}, transparent)` }} />

        <div className="featured-inner" style={{ display: "grid", gridTemplateColumns: "55% 1fr" }}>
          {/* Image */}
          <div style={{ position: "relative", overflow: "hidden", minHeight: 300 }}>
            <img src={img} alt={ev.title}
              className="group-hover:scale-105 transition-transform duration-700"
              style={{ width: "100%", height: "100%", objectFit: "cover", minHeight: 300 }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK; }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 55%, var(--card) 100%)" }} />
            <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", background: GOLD, color: "#000", fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", borderRadius: 2 }}>
                <Zap size={9} /> Featured
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", borderRadius: 2 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: statusStyle.color, display: "inline-block" }} />
                {statusStyle.label}
              </span>
            </div>
          </div>

          {/* Info */}
          <div style={{ padding: "28px 28px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {ev.type && (
              <span style={{
                display: "inline-block", marginBottom: 10, fontSize: 9, fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.12em", padding: "3px 8px", borderRadius: 2,
                background: "rgba(245,166,35,0.1)", color: GOLD, width: "fit-content",
              }}>
                {ev.type}
              </span>
            )}
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--foreground)", margin: "0 0 10px", lineHeight: 1.25, letterSpacing: "-0.02em", textTransform: "uppercase" }}>
              {ev.title}
            </h2>
            {ev.description && (
              <p style={{ fontSize: 13, color: "#666", margin: "0 0 16px", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {stripHtml(ev.description)}
              </p>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
              {ev.date && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  <Calendar size={12} color={GOLD} />
                  {formatDate(ev.date)}
                </span>
              )}
              {ev.location && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "#666" }}>
                  <MapPin size={12} color={GOLD} />
                  {ev.location}
                </span>
              )}
            </div>

            {status === "upcoming" && ev.date && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px" }}>Starts In</p>
                <Countdown dateStr={ev.date} />
              </div>
            )}

            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: GOLD }}>
              View Event <ChevronRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </div>
        <style>{`
          .featured-card:hover{box-shadow:0 12px 50px rgba(0,0,0,0.6)!important;}
          @media(max-width:680px){.featured-inner{grid-template-columns:1fr!important;}}
        `}</style>
      </div>
    </Link>
  );
}

// ─── Regular Event Card ───────────────────────────────────────────────────────
function EventCard({ ev }: { ev: any }) {
  const slug = ev.event_name_slug || ev.id;
  const img = ev.image_url || ev.image || ev.imageUrl || FALLBACK;
  const status = classifyEvent(ev.date);
  const statusStyle = getStatusStyle(status);

  return (
    <Link href={`/events/${slug}`} className="group block h-full">
      <div style={{
        height: "100%", background: CARD, border: `1px solid ${BORDER}`,
        borderRadius: 5, overflow: "hidden",
        transition: "all 0.25s",
      }} className="ev-card">
        {/* Image */}
        <div style={{ position: "relative", overflow: "hidden", paddingTop: "56.25%" }}>
          <img src={img} alt={ev.title}
            loading="lazy"
            className="group-hover:scale-105 transition-transform duration-500"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK; }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
          {/* Status badge */}
          <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 4 }}>
            {ev.type && (
              <span style={{ fontSize: 8, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", padding: "2px 6px", background: "rgba(0,0,0,0.7)", color: GOLD, borderRadius: 2, backdropFilter: "blur(4px)" }}>
                {ev.type}
              </span>
            )}
            <span style={{ fontSize: 8, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", padding: "2px 6px", background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, borderRadius: 2, backdropFilter: "blur(4px)", display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: statusStyle.color, display: "inline-block" }} />
              {statusStyle.label}
            </span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "12px 14px" }}>
          <h3 className="group-hover:text-[#f5a623] transition-colors" style={{ fontWeight: 800, fontSize: 13, color: "var(--foreground)", margin: "0 0 6px", lineHeight: 1.35, textTransform: "uppercase", letterSpacing: "-0.01em", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {ev.title}
          </h3>
          {ev.description && (
            <p style={{ fontSize: 11, color: "#555", margin: "0 0 10px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {stripHtml(ev.description)}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {ev.date ? (
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <Calendar size={10} color={GOLD} />
                {formatDate(ev.date)}
              </span>
            ) : <span />}
            <ChevronRight size={14} color="rgba(245,166,35,0.35)" className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
        <style>{`.ev-card:hover{border-color:rgba(245,166,35,0.25)!important;box-shadow:0 4px 20px rgba(0,0,0,0.4);transform:translateY(-2px);}`}</style>
      </div>
    </Link>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────
function Tab({ label, icon: Icon, count, active, onClick }: any) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "8px 14px", fontSize: 11, fontWeight: 800,
      textTransform: "uppercase", letterSpacing: "0.1em",
      background: active ? GOLD : "transparent",
      color: active ? "#000" : "rgba(255,255,255,0.4)",
      border: `1px solid ${active ? GOLD : BORDER}`,
      borderRadius: 3, cursor: "pointer", transition: "all 0.15s",
    }}>
      <Icon size={12} />
      {label}
      {count > 0 && (
        <span style={{
          fontSize: 9, fontWeight: 800,
          background: active ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.08)",
          padding: "1px 5px", borderRadius: 999,
          color: active ? "#000" : "rgba(255,255,255,0.3)",
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EventsList() {
  const [tab, setTab] = useState<"all" | "active" | "upcoming" | "past">("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery<{ items: any[]; total: number }>({
    queryKey: ["/api/events", page],
    queryFn: () => getEvents({ limit, offset: (page - 1) * limit }),
    staleTime: 1000 * 60 * 2,
  });

  const events = data?.items || [];
  const total = data?.total || 0;
  const hasMore = page * limit < total;

  const classified = events.reduce((acc: any, ev: any) => {
    acc[classifyEvent(ev.date)].push(ev);
    return acc;
  }, { active: [] as any[], upcoming: [] as any[], past: [] as any[] });

  const filtered = tab === "all" ? events : classified[tab];
  const featured = filtered[0];
  const rest = filtered.slice(1);

  const counts = { active: classified.active.length, upcoming: classified.upcoming.length, past: classified.past.length };

  return (
    <>
      <PageSEO
        title="CrossFire Events — Tournaments, Esports & Seasonal Updates | CrossFire Wiki"
        description="Stay up-to-date with CrossFire esports tournaments, seasonal events, competitive matches and community activities. Live event schedules and results."
        image="https://cdnr.escharts.com/uploads/public/68a/d91/360/68ad913604b0e066419134.jpg?width=1140&height=570&quality=90&extension=jpg"
        canonicalPath="/events"
      />

      <div style={{ minHeight: "100vh", background: "var(--background)" }}>

        {/* ── PAGE HEADER ── */}
        <div style={{
          position: "relative", overflow: "hidden",
          borderBottom: `1px solid ${BORDER}`,
          background: "linear-gradient(to bottom, rgba(245,166,35,0.04) 0%, transparent 100%)",
          padding: "36px 0 28px",
        }}>
          {/* Gold top bar */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(to right, ${GOLD}, rgba(245,166,35,0.2) 60%, transparent)` }} />

          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <Link href="/"><span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", cursor: "pointer", fontWeight: 600 }}>Home</span></Link>
              <ChevronRight size={12} color="rgba(255,255,255,0.2)" />
              <span style={{ fontSize: 11, color: GOLD, fontWeight: 700 }}>Events</span>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, color: GOLD, textTransform: "uppercase", letterSpacing: "0.2em", margin: "0 0 4px" }}>CrossFire</p>
                <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em", color: "var(--foreground)", margin: 0, lineHeight: 1 }}>
                  Events
                </h1>
                <p style={{ fontSize: 13, color: "#555", margin: "6px 0 0" }}>
                  Tournaments, seasonal updates, and community activations
                </p>
              </div>

              {/* Live counts */}
              <div style={{ display: "flex", gap: 10 }}>
                {counts.active > 0 && (
                  <div style={{ padding: "8px 14px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 4, textAlign: "center" }}>
                    <p style={{ fontSize: 18, fontWeight: 900, color: "#34d399", margin: 0 }}>{counts.active}</p>
                    <p style={{ fontSize: 9, color: "#34d399", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Active</p>
                  </div>
                )}
                {counts.upcoming > 0 && (
                  <div style={{ padding: "8px 14px", background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 4, textAlign: "center" }}>
                    <p style={{ fontSize: 18, fontWeight: 900, color: GOLD, margin: 0 }}>{counts.upcoming}</p>
                    <p style={{ fontSize: 9, color: GOLD, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Upcoming</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tab bar */}
            <div style={{ display: "flex", gap: 6, marginTop: 20, flexWrap: "wrap" }}>
              <Tab label="All Events" icon={BookOpen}       count={events.length}     active={tab === "all"}      onClick={() => setTab("all")} />
              <Tab label="Active"     icon={Flame}          count={counts.active}     active={tab === "active"}   onClick={() => setTab("active")} />
              <Tab label="Upcoming"   icon={Clock}          count={counts.upcoming}   active={tab === "upcoming"} onClick={() => setTab("upcoming")} />
              <Tab label="Ended"      icon={Archive}        count={counts.past}       active={tab === "past"}     onClick={() => setTab("past")} />
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 64px" }}>
          <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }} className="events-layout">

            {/* Main column */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {isLoading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
                  <Loader2 size={32} color={GOLD} className="animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div style={{
                  padding: "60px 24px", textAlign: "center",
                  border: `1px dashed rgba(245,166,35,0.1)`, borderRadius: 6,
                }}>
                  <Clock size={36} color="rgba(255,255,255,0.1)" style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#444" }}>
                    No {tab !== "all" ? tab : ""} events right now
                  </p>
                  <p style={{ fontSize: 12, color: "#333", marginTop: 4 }}>Check back soon for updates</p>
                </div>
              ) : (
                <>
                  {featured && (
                    <div style={{ marginBottom: 28 }}>
                      <FeaturedCard ev={featured} />
                    </div>
                  )}

                  {rest.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }} className="ev-grid">
                      {rest.map((ev: any) => (
                        <EventCard key={ev.id} ev={ev} />
                      ))}
                    </div>
                  )}

                  {hasMore && (
                    <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
                      <button
                        onClick={() => setPage((p) => p + 1)}
                        style={{
                          padding: "10px 28px", fontSize: 11, fontWeight: 800,
                          textTransform: "uppercase", letterSpacing: "0.12em",
                          background: "rgba(245,166,35,0.08)", border: `1px solid rgba(245,166,35,0.25)`,
                          color: GOLD, borderRadius: 3, cursor: "pointer", transition: "all 0.2s",
                        }}
                        className="load-more-btn"
                      >
                        Load More Events
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sidebar */}
            <aside style={{ width: 300, flexShrink: 0 }} className="events-sidebar">
              <div style={{ position: "sticky", top: 76 }}>

                {/* Discord */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 0 8px", marginBottom: 12,
                    borderBottom: `1px solid rgba(88,101,242,0.2)`,
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: "#5865f2", margin: 0 }}>Live Community</p>
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 900, textTransform: "uppercase", color: "var(--foreground)", margin: "0 0 12px", letterSpacing: "-0.02em" }}>Discord</p>
                  <DiscordWidget />
                </div>

                {/* Quick links */}
                <div style={{
                  background: "var(--card)", border: `1px solid ${BORDER}`,
                  borderRadius: 5, overflow: "hidden", marginBottom: 16,
                }}>
                  <div style={{
                    padding: "9px 14px", borderBottom: `1px solid ${BORDER}`,
                    background: "rgba(255,255,255,0.02)",
                  }}>
                    <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: GOLD, margin: 0 }}>Quick Links</p>
                  </div>
                  <div style={{ padding: "6px" }}>
                    {[
                      { label: "Download CrossFire", href: "/download" },
                      { label: "Weapons Database",   href: "/weapons" },
                      { label: "Mercenaries",        href: "/mercenaries" },
                      { label: "Rank System",        href: "/ranks" },
                      { label: "Game Modes",         href: "/modes" },
                      { label: "Latest News",        href: "/news" },
                    ].map(({ label, href }) => (
                      <Link key={href} href={href}>
                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "8px 10px", borderRadius: 3,
                          cursor: "pointer", transition: "background 0.15s",
                        }} className="quick-link-item">
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>{label}</span>
                          <ChevronRight size={12} color="rgba(255,255,255,0.2)" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Event types legend */}
                <div style={{ background: "var(--card)", border: `1px solid ${BORDER}`, borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ padding: "9px 14px", borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.02)" }}>
                    <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: GOLD, margin: 0 }}>Status Guide</p>
                  </div>
                  <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { color: "#34d399", label: "Active", desc: "Currently running" },
                      { color: GOLD, label: "Upcoming", desc: "Starting within 30 days" },
                      { color: "rgba(255,255,255,0.25)", label: "Ended", desc: "Event has concluded" },
                    ].map(({ color, label, desc }) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{label}</span>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginLeft: 6 }}>{desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </aside>
          </div>

          <style>{`
            @media(max-width:1024px){.events-sidebar{display:none!important;}}
            @media(max-width:700px){.ev-grid{grid-template-columns:1fr!important;}}
            @media(max-width:900px){.ev-grid{grid-template-columns:repeat(2,1fr)!important;}}
            .load-more-btn:hover{background:rgba(245,166,35,0.15)!important;}
            .quick-link-item:hover{background:rgba(255,255,255,0.04)!important;}
          `}</style>
        </div>
      </div>
    </>
  );
}
