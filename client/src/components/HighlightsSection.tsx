import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon, Video } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Highlight {
  id: string;
  title: string;
  month: string;
  year: number;
  media_type: "image" | "video";
  url: string;
  sort_order: number;
}

const STATIC_HIGHLIGHTS: Highlight[] = [
  { id: "1", month: "Jun", year: 2026, media_type: "image", url: "https://z8games.akamaized.net/cfna/web/main/Forum/260528_cfwe_zppu_bonus_forums.jpg", title: "Summer Breeze Bonus — June 2026", sort_order: 1 },
  { id: "2", month: "Apr", year: 2026, media_type: "image", url: "https://z8games.akamaized.net/cfna/web/main/Forum/260330_cfwe_bp_apr_main_forum.jpg", title: "Mercenary Pass Season 59: Rising Tide — April 2026", sort_order: 2 },
  { id: "3", month: "Mar", year: 2026, media_type: "image", url: "https://z8games.akamaized.net/cfna/web/main/Forum/260223_cfwe_zppubonus_forums.jpg", title: "March Of Gold — March 2026", sort_order: 3 },
  { id: "4", month: "Jan", year: 2026, media_type: "image", url: "https://z8games.akamaized.net/cfna/web/main/Forum/251223_cfwe_bp_jan2026_main_forum.jpg", title: "Mercenary Pass Season 58: Timeless Treasures — January 2026", sort_order: 4 },
  { id: "5", month: "Dec", year: 2025, media_type: "image", url: "https://z8games.akamaized.net/cfna/web/main/Forum/251126_cfwe_npu_forum.jpg", title: "Sleighbell Bonus — December 2025", sort_order: 5 },
  { id: "6", month: "Nov", year: 2025, media_type: "image", url: "https://z8games.akamaized.net/cfna/web/main/Forum/251027_cfwe_zppubonus_forums.jpg", title: "Wavelite Bonus Surge — November 2025", sort_order: 6 },
];

const GOLD_BORDER = "rgba(154,124,63,0.25)";
const ACCENT = "#3a7bd5";

export function HighlightsSection({ hideHeader }: { hideHeader?: boolean } = {}) {
  const [highlights, setHighlights] = useState<Highlight[]>(STATIC_HIGHLIGHTS);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("site_highlights")
          .select("*")
          .order("sort_order", { ascending: true });
        if (data && data.length > 0) setHighlights(data as Highlight[]);
      } catch {
        // ignore errors — static fallback is already shown
      }
    })();
  }, []);

  const active = highlights[activeIdx] || highlights[0];
  if (!active) return null;

  const prev = () => setActiveIdx((i) => (i - 1 + highlights.length) % highlights.length);
  const next = () => setActiveIdx((i) => (i + 1) % highlights.length);

  return (
    <section>
      {!hideHeader && (
        <div style={{
          display: "flex", alignItems: "baseline", justifyContent: "space-between",
          marginBottom: "20px", paddingBottom: "12px", borderBottom: `1px solid ${GOLD_BORDER}`,
        }}>
          <h2 style={{
            fontFamily: "'Cinzel', serif", fontWeight: 300,
            fontSize: "clamp(1.3rem, 3vw, 1.9rem)", letterSpacing: "0.15em",
            color: "hsl(var(--foreground))", margin: 0,
          }}>
            HIGHLIGHTS
          </h2>
        </div>
      )}

      <div className="relative overflow-hidden" style={{
        background: "#0d1117", border: `2px solid rgba(58,123,213,0.5)`, borderRadius: "6px",
      }}>
        {/* Main media */}
        <div className="relative" style={{ aspectRatio: "16/7", overflow: "hidden", background: "#050810" }}>
          {active.media_type === "video" ? (
            <video
              key={active.id}
              src={active.url}
              className="w-full h-full"
              style={{ objectFit: "contain", display: "block" }}
              autoPlay
              muted
              loop
              playsInline
              controls
            />
          ) : (
            <img
              key={active.id}
              src={active.url}
              alt={active.title}
              className="w-full h-full"
              style={{ objectFit: "contain", transition: "opacity 0.4s" }}
            />
          )}

          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)", pointerEvents: "none" }} />

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 md:px-6 md:pb-5">
            <h3 className="font-black text-white text-[11px] sm:text-sm md:text-xl uppercase tracking-tight leading-snug" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}>
              {active.title}
            </h3>
          </div>

          {/* Nav arrows */}
          <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center transition-all hover:scale-110"
            style={{ background: "rgba(0,0,0,0.6)", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center transition-all hover:scale-110"
            style={{ background: "rgba(0,0,0,0.6)", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}>
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Media type badge */}
          <div className="absolute top-3 left-4 flex items-center gap-1.5 px-2 py-1"
            style={{ background: "rgba(0,0,0,0.55)", borderRadius: 4, backdropFilter: "blur(4px)" }}>
            {active.media_type === "video"
              ? <Video className="h-3 w-3" style={{ color: "#60a5fa" }} />
              : <ImageIcon className="h-3 w-3" style={{ color: "rgba(255,255,255,0.4)" }} />}
            <span style={{ fontSize: 10, color: active.media_type === "video" ? "#60a5fa" : "rgba(255,255,255,0.4)", fontWeight: 500, letterSpacing: "0.08em" }}>
              {active.month} {active.year}
            </span>
          </div>
        </div>

        {/* Thumbnail strip */}
        <div className="flex gap-0 overflow-x-auto" style={{ background: "#080d14", borderTop: `1px solid rgba(58,123,213,0.3)` }}>
          {highlights.map((h, idx) => (
            <button key={h.id} onClick={() => setActiveIdx(idx)}
              className="relative flex-shrink-0 overflow-hidden transition-all"
              style={{ width: "90px", height: "64px", outline: "none", border: "none", borderRight: "1px solid rgba(58,123,213,0.2)", cursor: "pointer" }}>
              {h.media_type === "video" ? (
                <div className="w-full h-full flex items-center justify-center" style={{ background: "#0d1117", opacity: activeIdx === idx ? 1 : 0.45 }}>
                  <Video className="h-5 w-5" style={{ color: "#60a5fa" }} />
                </div>
              ) : (
                <img src={h.url} alt={h.title} className="w-full h-full object-cover"
                  style={{ opacity: activeIdx === idx ? 1 : 0.45, transition: "opacity 0.2s" }} />
              )}
              {activeIdx === idx && (
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: ACCENT }} />
              )}
              <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }}>
                <p className="text-[9px] font-black leading-none" style={{ color: activeIdx === idx ? "#60a5fa" : "rgba(255,255,255,0.5)" }}>
                  {h.month}. {h.year}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
