import { useState } from "react";
import { ChevronLeft, ChevronRight, Camera } from "lucide-react";

interface Highlight {
  month: string;
  year: number;
  image: string;
  title: string;
}

const HIGHLIGHTS: Highlight[] = [
  {
    month: "Jun",
    year: 2026,
    image: "https://files.catbox.moe/ctwnqz.jpeg",
    title: "CrossFire Arch Honorary — June 2026",
  },
  {
    month: "Apr",
    year: 2026,
    image: "https://files.catbox.moe/r26ox6.jpeg",
    title: "Black Mamba Season — April 2026",
  },
  {
    month: "Mar",
    year: 2026,
    image: "https://files.catbox.moe/3o58nb.jpeg",
    title: "Sisterhood Event — March 2026",
  },
  {
    month: "Jan",
    year: 2026,
    image: "https://files.catbox.moe/4il6hi.jpeg",
    title: "Vipers Return — January 2026",
  },
  {
    month: "Dec",
    year: 2025,
    image: "https://files.catbox.moe/hh7h5u.jpeg",
    title: "Desperado Winter — December 2025",
  },
  {
    month: "Nov",
    year: 2025,
    image: "https://files.catbox.moe/eck3jc.jpeg",
    title: "Ronin Tournament — November 2025",
  },
];

const GOLD_BORDER = "rgba(154,124,63,0.25)";

export function HighlightsSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = HIGHLIGHTS[activeIdx];

  const prev = () => setActiveIdx((i) => (i - 1 + HIGHLIGHTS.length) % HIGHLIGHTS.length);
  const next = () => setActiveIdx((i) => (i + 1) % HIGHLIGHTS.length);

  return (
    <section style={{ padding: "48px 0" }}>
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: "20px",
          paddingBottom: "12px",
          borderBottom: `1px solid ${GOLD_BORDER}`,
        }}
      >
        <h2
          style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 300,
            fontSize: "clamp(1.3rem, 3vw, 1.9rem)",
            letterSpacing: "0.15em",
            color: "hsl(var(--foreground))",
            margin: 0,
          }}
        >
          HIGHLIGHTS
        </h2>
      </div>

      {/* Main container */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "#0d1117",
          border: `2px solid rgba(58,123,213,0.5)`,
          borderRadius: "6px",
        }}
      >
        {/* Main image */}
        <div className="relative" style={{ aspectRatio: "16/7", overflow: "hidden" }}>
          <img
            key={activeIdx}
            src={active.image}
            alt={active.title}
            className="w-full h-full object-cover"
            style={{ transition: "opacity 0.4s" }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)" }}
          />

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
            <h3
              className="font-black text-white text-xl uppercase tracking-tight"
              style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}
            >
              {active.title}
            </h3>
          </div>

          {/* Nav arrows */}
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center transition-all hover:scale-110"
            style={{ background: "rgba(0,0,0,0.6)", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center transition-all hover:scale-110"
            style={{ background: "rgba(0,0,0,0.6)", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Sidebar icons (right edge) */}
          <div
            className="absolute right-0 top-4 flex flex-col gap-1"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            {[{ Icon: Camera }].map(({ Icon }, i) => (
              <div key={i} className="w-9 h-9 flex items-center justify-center" style={{ color: "rgba(255,255,255,0.5)" }}>
                <Icon className="h-4 w-4" />
              </div>
            ))}
          </div>
        </div>

        {/* Thumbnail strip */}
        <div
          className="flex gap-0 overflow-x-auto"
          style={{ background: "#080d14", borderTop: "1px solid rgba(58,123,213,0.3)" }}
        >
          {HIGHLIGHTS.map((h, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className="relative flex-shrink-0 overflow-hidden transition-all"
              style={{
                width: "90px",
                height: "64px",
                outline: "none",
                border: "none",
                borderRight: "1px solid rgba(58,123,213,0.2)",
                cursor: "pointer",
              }}
            >
              <img
                src={h.image}
                alt={h.title}
                className="w-full h-full object-cover"
                style={{ opacity: activeIdx === idx ? 1 : 0.45, transition: "opacity 0.2s" }}
              />
              {activeIdx === idx && (
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ background: "#3a7bd5" }}
                />
              )}
              <div
                className="absolute bottom-0 left-0 right-0 px-1.5 py-1"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }}
              >
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
