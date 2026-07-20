import { useRef } from "react";
import { Calendar, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export interface Event {
  id: string;
  title: string;
  date: string;
  type: "upcoming" | "trending";
  event_name_slug?: string;
}

interface EventsRibbonProps {
  events: Event[];
}

export function EventsRibbon({ events }: EventsRibbonProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (!events.length) return null;

  // Duplicate so the marquee loop is seamless
  const doubled = [...events, ...events];
  // Speed: ~3.5s per event card
  const durationSec = Math.max(events.length * 3.5, 12);

  return (
    <div
      className="w-full border-y"
      style={{
        background: "var(--card)",
        borderColor: "rgba(255,255,255,0.06)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Edge fade — left */}
      <div
        className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none"
        style={{
          width: 48,
          background: "linear-gradient(to right, var(--card), transparent)",
        }}
      />
      {/* Edge fade — right */}
      <div
        className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none"
        style={{
          width: 48,
          background: "linear-gradient(to left, var(--card), transparent)",
        }}
      />

      {/* Scrolling track */}
      <div
        ref={trackRef}
        className="flex items-center gap-3 py-2 cf-marquee"
        style={{
          // Width is 2× content so we can translate -50% seamlessly
          width: "max-content",
          animationDuration: `${durationSec}s`,
          willChange: "transform",
          paddingLeft: 16,
          paddingRight: 16,
        }}
      >
        {doubled.map((event, idx) => {
          const href = event.event_name_slug
            ? `/events/${event.event_name_slug}`
            : `/events/${event.id}`;
          const isTrending = event.type === "trending";
          return (
            <Link
              key={`${event.id}-${idx}`}
              href={href}
              className="flex items-center gap-2.5 flex-shrink-0 px-4 py-2 rounded transition-all"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "var(--foreground)",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(212,160,23,0.08)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,160,23,0.25)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
              }}
            >
              {isTrending ? (
                <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#ef4444" }} />
              ) : (
                <Calendar className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#d4a017" }} />
              )}
              <span className="text-[12px] font-semibold">{event.title}</span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  color: "#666",
                }}
              >
                {event.date
                ? (() => {
                    try {
                      const d = new Date(event.date);
                      return isNaN(d.getTime()) ? event.date : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                    } catch { return event.date; }
                  })()
                : ""}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
