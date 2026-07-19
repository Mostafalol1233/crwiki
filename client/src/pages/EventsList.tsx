import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";
import { getEvents } from "@/lib/supabaseApi";
import PageSEO from "@/components/PageSEO";
import { DiscordWidget } from "@/components/DiscordWidget";
import { Calendar, Clock, MapPin, ChevronRight, Loader2, Zap } from "lucide-react";

interface Event {
  id: string;
  title: string;
  event_name_slug: string;
  description: string;
  date: string;
  location: string;
  type: string;
  image: string;
  imageUrl: string;
  featured: boolean;
}

const FALLBACK = "/cf-heroes-bg.png";

function formatDate(d: string) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return d;
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
}

function EventCard({ ev, featured }: { ev: Event; featured?: boolean }) {
  const slug = ev.event_name_slug || ev.id;
  const img = ev.image_url || ev.image || ev.imageUrl || FALLBACK;

  if (featured) {
    return (
      <Link href={`/events/${slug}`} className="group block col-span-full md:col-span-2">
        <div
          className="relative overflow-hidden transition-all duration-300 group-hover:-translate-y-0.5"
          style={{
            background: "var(--card)",
            border: "1px solid rgba(245,166,35,0.3)",
            borderRadius: "6px",
            boxShadow: "0 4px 30px rgba(245,166,35,0.08)",
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(to right, #f5a623, transparent)" }} />
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-[55%] relative overflow-hidden" style={{ minHeight: "280px", background: "#0d1117" }}>
              <img
                src={img}
                alt={ev.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                style={{ minHeight: "280px" }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK; }}
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to right, transparent 60%, var(--card))" }} />
              <div
                className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest"
                style={{ background: "#f5a623", color: "#000", borderRadius: "2px" }}
              >
                <Zap className="h-2.5 w-2.5" /> Featured Event
              </div>
            </div>
            <div className="flex-1 p-6 lg:p-8 flex flex-col justify-center">
              {ev.type && (
                <span
                  className="inline-block mb-3 text-[8px] font-black uppercase tracking-widest px-2 py-1"
                  style={{ background: "rgba(245,166,35,0.12)", color: "#f5a623", borderRadius: "2px", width: "fit-content" }}
                >
                  {ev.type}
                </span>
              )}
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight mb-3" style={{ color: "var(--foreground)" }}>
                {ev.title}
              </h2>
              {ev.description && (
                <p className="text-sm leading-relaxed line-clamp-2 mb-4" style={{ color: "#666" }}>{stripHtml(ev.description)}</p>
              )}
              <div className="flex flex-wrap gap-4 mb-4">
                {ev.date && (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#555" }}>
                    <Calendar className="h-3 w-3" style={{ color: "#f5a623" }} />
                    {formatDate(ev.date)}
                  </span>
                )}
                {ev.location && (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#555" }}>
                    <MapPin className="h-3 w-3" style={{ color: "#f5a623" }} />
                    {ev.location}
                  </span>
                )}
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-all group-hover:gap-2.5" style={{ color: "#f5a623" }}>
                View Event <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/events/${slug}`} className="group block">
      <div
        className="h-full overflow-hidden transition-all duration-300 hover:-translate-y-1"
        style={{
          background: "var(--card)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "4px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
        }}
      >
        <div className="relative overflow-hidden aspect-[16/9]" style={{ background: "#0d1117" }}>
          <img
            src={img}
            alt={ev.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK; }}
          />
          <div
            className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "linear-gradient(to right, #f5a623, transparent)" }}
          />
          {ev.type && (
            <div
              className="absolute top-3 left-3 text-[8px] font-black uppercase tracking-widest px-2 py-1"
              style={{ background: "rgba(0,0,0,0.75)", color: "#f5a623", borderRadius: "2px", backdropFilter: "blur(4px)" }}
            >
              {ev.type}
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-black text-sm uppercase tracking-tight leading-snug mb-2 line-clamp-2 group-hover:text-[#f5a623] transition-colors" style={{ color: "var(--foreground)" }}>
            {ev.title}
          </h3>
          {ev.description && (
            <p className="text-[11px] leading-relaxed line-clamp-2 mb-3" style={{ color: "#555" }}>{stripHtml(ev.description)}</p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              {ev.date && (
                <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wide" style={{ color: "#555" }}>
                  <Calendar className="h-2.5 w-2.5" style={{ color: "#f5a623" }} />
                  {formatDate(ev.date)}
                </span>
              )}
              {ev.location && (
                <span className="flex items-center gap-1.5 text-[9px] font-bold" style={{ color: "#444" }}>
                  <MapPin className="h-2.5 w-2.5" /> {ev.location}
                </span>
              )}
            </div>
            <ChevronRight
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              style={{ color: "rgba(245,166,35,0.4)" }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function EventsList() {
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading } = useQuery<{ items: Event[]; total: number }>({
    queryKey: ["/api/events", page],
    queryFn: () => getEvents({ limit, offset: (page - 1) * limit }),
    staleTime: 1000 * 60 * 2,
  });

  const events = data?.items || [];
  const total = data?.total || 0;
  const hasMore = page * limit < total;

  const featured = events[0];
  const rest = events.slice(1);

  return (
    <>
      <PageSEO
        title="CrossFire Events — Tournaments, Updates & Community"
        description="Stay up-to-date with CrossFire events, tournaments, and seasonal updates."
        canonicalPath="/events"
      />

      <div className="min-h-screen py-10 md:py-14" style={{ background: "var(--background)" }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8">

          {/* ── Header ── */}
          <div className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-1" style={{ color: "#f5a623" }}>Crossfire</p>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none mb-1" style={{ color: "var(--foreground)" }}>
              Events
            </h1>
            <p className="text-sm" style={{ color: "#555" }}>
              Tournaments, seasonal updates, and community activations
            </p>
          </div>

          {/* ── Discord + Events layout ── */}
          <div className="flex flex-col xl:flex-row gap-8 mb-10">

            {/* Main events column */}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-32">
                  <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#f5a623" }} />
                </div>
              ) : events.length === 0 ? (
                <div
                  className="py-24 text-center"
                  style={{ border: "1px dashed rgba(245,166,35,0.15)", borderRadius: "4px" }}
                >
                  <Clock className="h-10 w-10 mx-auto mb-3 opacity-20" style={{ color: "#f5a623" }} />
                  <p className="text-sm font-black uppercase tracking-widest" style={{ color: "#444" }}>
                    No events at the moment
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#333" }}>Check back soon for upcoming events</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Featured */}
                  {featured && <EventCard ev={featured} featured />}

                  {/* Grid */}
                  {rest.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {rest.map((ev) => (
                        <EventCard key={ev.id} ev={ev} />
                      ))}
                    </div>
                  )}

                  {/* Load more */}
                  {hasMore && (
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={() => setPage((p) => p + 1)}
                        className="px-8 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all hover:brightness-110"
                        style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", color: "#f5a623", borderRadius: "2px" }}
                      >
                        Load More Events
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar: Discord widget */}
            <aside className="xl:w-[340px] flex-shrink-0">
              <div className="sticky top-20">
                {/* Discord section header */}
                <div
                  className="mb-3 pb-2"
                  style={{ borderBottom: "1px solid rgba(88,101,242,0.2)" }}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: "#5865f2" }}>
                    Live Community
                  </p>
                  <p className="text-xl font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>
                    Discord
                  </p>
                </div>
                <DiscordWidget />

                {/* Quick links */}
                <div className="mt-6 space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] mb-3" style={{ color: "#444" }}>Quick Links</p>
                  {[
                    { label: "Download CrossFire", href: "/download" },
                    { label: "Weapons Database", href: "/weapons" },
                    { label: "Mercenaries", href: "/mercenaries" },
                    { label: "Rank System", href: "/ranks" },
                  ].map(({ label, href }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center justify-between px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide transition-all hover:border-[rgba(245,166,35,0.3)]"
                      style={{
                        background: "var(--card)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: "3px",
                        color: "var(--foreground)",
                        textDecoration: "none",
                      }}
                    >
                      {label}
                      <ChevronRight className="h-3 w-3 opacity-40" />
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>

        </div>
      </div>
    </>
  );
}
