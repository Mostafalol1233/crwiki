import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
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

const GOLD = "#f5a623";
const GOLD_DIM = "rgba(245,166,35,0.18)";
const BG_DARK = "#07090d";
const BG_CARD = "#0d1117";
const BORDER = "rgba(245,166,35,0.15)";

export function HighlightsSection({ hideHeader }: { hideHeader?: boolean } = {}) {
  const [highlights, setHighlights] = useState<Highlight[]>(STATIC_HIGHLIGHTS);
  const [activeIdx, setActiveIdx] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("site_highlights")
          .select("*")
          .order("sort_order", { ascending: true });
        if (data && data.length > 0) setHighlights(data as Highlight[]);
      } catch { /* use static fallback */ }
    })();
  }, []);

  const active = highlights[activeIdx] || highlights[0];
  if (!active) return null;

  const prev = () => { setImgLoaded(false); setActiveIdx((i) => (i - 1 + highlights.length) % highlights.length); };
  const next = () => { setImgLoaded(false); setActiveIdx((i) => (i + 1) % highlights.length); };

  // Rows of 3 for the thumbnail grid
  const rows: Highlight[][] = [];
  for (let i = 0; i < highlights.length; i += 3) rows.push(highlights.slice(i, i + 3));

  return (
    <section>
      {!hideHeader && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${BORDER}`,
        }}>
          <h2 style={{
            fontFamily: "'Cinzel', serif", fontWeight: 300,
            fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)", letterSpacing: "0.2em",
            color: "hsl(var(--foreground))", margin: 0, textTransform: "uppercase",
          }}>
            Highlights
          </h2>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {highlights.length} entries
          </span>
        </div>
      )}

      <div style={{
        background: BG_CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 8,
        overflow: "hidden",
        boxShadow: "0 4px 32px rgba(0,0,0,0.5)",
      }}>

        {/* ── Featured hero ──────────────────────────────────── */}
        <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden", background: BG_DARK }}>

          {active.media_type === "video" ? (
            <video
              key={active.id}
              src={active.url}
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              autoPlay muted loop playsInline controls
            />
          ) : (
            <>
              {/* Blur placeholder while loading */}
              {!imgLoaded && (
                <div style={{ position: "absolute", inset: 0, background: "#0d1117", zIndex: 1 }} />
              )}
              <img
                ref={imgRef}
                key={active.id}
                src={active.url}
                alt={active.title}
                onLoad={() => setImgLoaded(true)}
                style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  display: "block",
                  transition: "opacity 0.35s ease",
                  opacity: imgLoaded ? 1 : 0,
                }}
              />
            </>
          )}

          {/* Bottom gradient */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 45%, transparent 100%)",
            pointerEvents: "none",
          }} />

          {/* Top-left: date badge */}
          <div style={{
            position: "absolute", top: 14, left: 14,
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
            border: `1px solid ${BORDER}`, borderRadius: 4,
            padding: "4px 10px",
          }}>
            {active.media_type === "video" && <Play size={10} style={{ color: GOLD }} />}
            <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {active.month} {active.year}
            </span>
          </div>

          {/* Dot indicators */}
          <div style={{
            position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 5, alignItems: "center",
          }}>
            {highlights.map((_, i) => (
              <button key={i} onClick={() => { setImgLoaded(false); setActiveIdx(i); }}
                style={{
                  width: i === activeIdx ? 20 : 6, height: 6,
                  borderRadius: 3, border: "none", cursor: "pointer",
                  background: i === activeIdx ? GOLD : "rgba(255,255,255,0.25)",
                  transition: "all 0.25s", padding: 0,
                }} />
            ))}
          </div>

          {/* Title overlay */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 18px 14px" }}>
            <p style={{
              fontSize: "clamp(11px, 2.2vw, 15px)", fontWeight: 800,
              color: "#fff", margin: 0,
              textTransform: "uppercase", letterSpacing: "0.04em",
              textShadow: "0 1px 8px rgba(0,0,0,0.9)",
              lineHeight: 1.3,
            }}>
              {active.title}
            </p>
          </div>

          {/* Nav arrows */}
          {highlights.length > 1 && (
            <>
              <button onClick={prev}
                style={{
                  position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                  width: 34, height: 34, borderRadius: "50%",
                  background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
                  border: `1px solid rgba(255,255,255,0.15)`,
                  color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}
                className="hlights-arrow"
              >
                <ChevronLeft size={16} />
              </button>
              <button onClick={next}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  width: 34, height: 34, borderRadius: "50%",
                  background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
                  border: `1px solid rgba(255,255,255,0.15)`,
                  color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}
                className="hlights-arrow"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>

        {/* ── Thumbnail grid ─────────────────────────────────── */}
        <div style={{ borderTop: `1px solid ${BORDER}`, background: "#090c12" }}>
          {rows.map((row, rowIdx) => (
            <div
              key={rowIdx}
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${row.length}, 1fr)`,
                borderBottom: rowIdx < rows.length - 1 ? `1px solid ${BORDER}` : undefined,
              }}
            >
              {row.map((h) => {
                const globalIdx = highlights.indexOf(h);
                const isActive = globalIdx === activeIdx;
                return (
                  <button
                    key={h.id}
                    onClick={() => { setImgLoaded(false); setActiveIdx(globalIdx); }}
                    style={{
                      position: "relative",
                      height: 80,
                      border: "none",
                      borderRight: globalIdx % 3 < 2 ? `1px solid ${BORDER}` : undefined,
                      cursor: "pointer",
                      padding: 0,
                      overflow: "hidden",
                      outline: "none",
                      background: BG_DARK,
                    }}
                  >
                    {/* Thumbnail image */}
                    <img
                      src={h.url}
                      alt={h.title}
                      style={{
                        width: "100%", height: "100%", objectFit: "cover",
                        display: "block",
                        filter: isActive ? "none" : "brightness(0.45) saturate(0.6)",
                        transition: "filter 0.25s",
                      }}
                    />

                    {/* Gradient overlay */}
                    <div style={{
                      position: "absolute", inset: 0,
                      background: isActive
                        ? "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)"
                        : "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)",
                    }} />

                    {/* Active gold top bar */}
                    {isActive && (
                      <div style={{
                        position: "absolute", top: 0, left: 0, right: 0, height: 2,
                        background: `linear-gradient(to right, ${GOLD}, rgba(245,166,35,0.3))`,
                      }} />
                    )}

                    {/* Month label */}
                    <div style={{
                      position: "absolute", bottom: 6, left: 0, right: 0,
                      textAlign: "center",
                    }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800,
                        color: isActive ? GOLD : "rgba(255,255,255,0.55)",
                        textTransform: "uppercase", letterSpacing: "0.06em",
                        textShadow: "0 1px 4px rgba(0,0,0,0.9)",
                        transition: "color 0.2s",
                      }}>
                        {h.month}. {h.year}
                      </span>
                    </div>

                    {/* Active glow */}
                    {isActive && (
                      <div style={{
                        position: "absolute", inset: 0,
                        boxShadow: `inset 0 0 0 1px ${GOLD}40`,
                        pointerEvents: "none",
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .hlights-arrow:hover {
          background: rgba(245,166,35,0.2) !important;
          border-color: rgba(245,166,35,0.4) !important;
        }
      `}</style>
    </section>
  );
}
