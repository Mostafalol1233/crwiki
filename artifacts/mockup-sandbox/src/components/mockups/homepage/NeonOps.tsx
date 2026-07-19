import React, { useState } from "react";

// ── CrossFire Wiki Homepage — "Crimson Ops" ─────────────────────────────────
// Palette: near-black, CF crimson red, silver/white text, muted gold accents.
// No synthetic neons. No emojis. Inline SVGs for all icons.

const C = {
  bg: "#080A0D",
  bg2: "#0F1215",
  bg3: "#161B20",
  border: "rgba(255,255,255,0.07)",
  borderHover: "rgba(196,30,30,0.55)",
  red: "#C41E1E",
  redDim: "rgba(196,30,30,0.12)",
  redGlow: "rgba(196,30,30,0.25)",
  silver: "#E8ECEF",
  silverDim: "rgba(232,236,239,0.55)",
  muted: "rgba(232,236,239,0.35)",
  faint: "rgba(232,236,239,0.12)",
  gold: "#C8922A",
  goldDim: "rgba(200,146,42,0.12)",
};

// ── Mock data ────────────────────────────────────────────────────────────────
const EVENTS = [
  { id: 1, title: "Football Frenzy", dates: "Jun 11 – Jul 19", type: "ACTIVE" },
  { id: 2, title: "Blazing Bonus", dates: "Jul 1 – 31", type: "ACTIVE" },
  { id: 3, title: "Infinity VIP M4A1-S Prometheus", dates: "Jul 8 – Aug 5", type: "ACTIVE" },
  { id: 4, title: "CF Event Pass Season 7", dates: "Jun 10 – Aug 5", type: "FEATURED" },
  { id: 5, title: "Football Fan Nations", dates: "Jun 11 – Jul 19", type: "ACTIVE" },
  { id: 6, title: "Football Fortitude", dates: "Jun 11 – Jul 19", type: "ACTIVE" },
];

const NEWS = [
  { id: 1, category: "UPDATE", title: "Season 7 Battle Pass — Full Rewards Breakdown", date: "Jul 15, 2026" },
  { id: 2, category: "GUIDE", title: "Top 10 Competitive Weapons for Ranked Play", date: "Jul 12, 2026" },
  { id: 3, category: "EVENT", title: "Football Frenzy: How to Earn All Rewards", date: "Jul 8, 2026" },
  { id: 4, category: "NEWS", title: "New Mercenary Skills Balance Patch Notes", date: "Jul 5, 2026" },
];

// ── SVG Icons (inline) ───────────────────────────────────────────────────────
function IconWeapons({ size = 24, color = C.silver }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 13h12v2H2zM14 11h2v6h-2zM16 12h4l2 2-2 1h-4zM6 11V9h3l1 2H6z" fill={color} />
      <rect x="4" y="15" width="2" height="3" rx="0.5" fill={color} opacity="0.6" />
    </svg>
  );
}

function IconModes({ size = 24, color = C.silver }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" fill={color} />
      <line x1="12" y1="3" x2="12" y2="6" stroke={color} strokeWidth="1.5" />
      <line x1="12" y1="18" x2="12" y2="21" stroke={color} strokeWidth="1.5" />
      <line x1="3" y1="12" x2="6" y2="12" stroke={color} strokeWidth="1.5" />
      <line x1="18" y1="12" x2="21" y2="12" stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1" fill={C.bg} />
    </svg>
  );
}

function IconMaps({ size = 24, color = C.silver }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="9" y1="3" x2="9" y2="18" stroke={color} strokeWidth="1" opacity="0.6" />
      <line x1="15" y1="6" x2="15" y2="21" stroke={color} strokeWidth="1" opacity="0.6" />
    </svg>
  );
}

function IconMercs({ size = 24, color = C.silver }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L8 6v3c0 3.5 2 6 4 7 2-1 4-3.5 4-7V6L12 3z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2" fill={color} opacity="0.7" />
      <path d="M9 20c0-2 1.3-3 3-3s3 1 3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconRanks({ size = 24, color = C.silver }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" fill={color} opacity="0.85" />
    </svg>
  );
}

function IconTutorials({ size = 24, color = C.silver }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4h16v14H4z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M4 4l8 6 8-6" stroke={color} strokeWidth="1.5" />
      <line x1="8" y1="13" x2="16" y2="13" stroke={color} strokeWidth="1.2" opacity="0.6" />
      <line x1="8" y1="16" x2="13" y2="16" stroke={color} strokeWidth="1.2" opacity="0.6" />
    </svg>
  );
}

// ── Reusable atoms ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <div style={{ width: 20, height: 2, background: C.red }} />
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.16em",
        color: C.red, textTransform: "uppercase", fontFamily: "Inter, system-ui, sans-serif",
      }}>
        {children}
      </span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: "'Inter', system-ui, sans-serif",
      fontWeight: 800, fontSize: "clamp(1.4rem, 2.8vw, 2rem)",
      color: C.silver, margin: 0, letterSpacing: "-0.03em", lineHeight: 1.15,
    }}>
      {children}
    </h2>
  );
}

function Divider() {
  return (
    <div style={{
      height: 1,
      background: `linear-gradient(to right, transparent, ${C.border} 15%, ${C.border} 85%, transparent)`,
      margin: "72px 0",
    }} />
  );
}

// ── Event strip chip ──────────────────────────────────────────────────────────
function EventChip({ event }: { event: typeof EVENTS[0] }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 10, flexShrink: 0,
        padding: "7px 14px",
        background: hov ? C.redDim : "transparent",
        border: `1px solid ${hov ? C.borderHover : C.border}`,
        borderRadius: 4,
        cursor: "pointer", transition: "all 0.18s",
      }}
    >
      <div style={{
        width: 5, height: 5, borderRadius: "50%",
        background: event.type === "FEATURED" ? C.gold : C.red,
        boxShadow: `0 0 6px ${event.type === "FEATURED" ? C.gold : C.red}`,
        flexShrink: 0,
      }} />
      <span style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 12, fontWeight: 600, color: C.silver, whiteSpace: "nowrap",
      }}>
        {event.title}
      </span>
      <span style={{
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        fontSize: 10, color: C.muted, whiteSpace: "nowrap",
      }}>
        {event.dates}
      </span>
    </div>
  );
}

// ── Event card ────────────────────────────────────────────────────────────────
function EventCard({ event, featured = false }: { event: typeof EVENTS[0]; featured?: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? C.bg3 : C.bg2,
        border: `1px solid ${hov ? C.borderHover : C.border}`,
        borderLeft: `3px solid ${event.type === "FEATURED" ? C.gold : C.red}`,
        borderRadius: 4,
        padding: featured ? "28px 28px" : "18px 20px",
        height: "100%", boxSizing: "border-box",
        transition: "all 0.18s",
        cursor: "pointer",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Subtle corner notch decoration */}
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: 0, height: 0,
        borderTop: `24px solid ${hov ? C.redDim : C.faint}`,
        borderLeft: "24px solid transparent",
      }} />

      {/* Type badge */}
      <div style={{
        display: "inline-block",
        padding: "2px 8px",
        background: event.type === "FEATURED" ? C.goldDim : C.redDim,
        border: `1px solid ${event.type === "FEATURED" ? "rgba(200,146,42,0.3)" : "rgba(196,30,30,0.3)"}`,
        borderRadius: 2,
        fontSize: 9, fontWeight: 700, letterSpacing: "0.14em",
        color: event.type === "FEATURED" ? C.gold : C.red,
        fontFamily: "'Inter', system-ui, sans-serif",
        textTransform: "uppercase",
        marginBottom: featured ? 16 : 10,
      }}>
        {event.type}
      </div>

      <h3 style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontWeight: 700,
        fontSize: featured ? "1.15rem" : "0.88rem",
        color: C.silver, margin: "0 0 10px",
        lineHeight: 1.3, letterSpacing: "-0.01em",
      }}>
        {event.title}
      </h3>

      <div style={{
        display: "flex", alignItems: "center", gap: 6,
      }}>
        {/* Calendar icon inline */}
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="2" width="14" height="13" rx="1.5" stroke={C.muted} strokeWidth="1.5" />
          <line x1="1" y1="6" x2="15" y2="6" stroke={C.muted} strokeWidth="1.5" />
          <line x1="5" y1="1" x2="5" y2="4" stroke={C.muted} strokeWidth="1.5" />
          <line x1="11" y1="1" x2="11" y2="4" stroke={C.muted} strokeWidth="1.5" />
        </svg>
        <span style={{
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: 10, color: C.muted,
        }}>
          {event.dates}
        </span>
      </div>

      {featured && (
        <div style={{
          marginTop: 20,
          display: "inline-flex", alignItems: "center", gap: 5,
          fontSize: 11, fontWeight: 600, color: C.red,
          fontFamily: "'Inter', system-ui, sans-serif",
          letterSpacing: "0.05em",
        }}>
          VIEW EVENT
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke={C.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ── Wiki section card ─────────────────────────────────────────────────────────
const WIKI_SECTIONS = [
  { icon: IconWeapons, label: "Weapons", desc: "Full database — stats, skins, variants", href: "/weapons", count: "300+" },
  { icon: IconModes, label: "Game Modes", desc: "Every mode with rules and strategies", href: "/modes", count: "50+" },
  { icon: IconMercs, label: "Mercenaries", desc: "Character profiles, skills, voice lines", href: "/mercenaries", count: "80+" },
  { icon: IconRanks, label: "Ranks", desc: "Full ranking system from Private to Grand Marshall", href: "/ranks", count: "101" },
];

function WikiCard({ section }: { section: typeof WIKI_SECTIONS[0] }) {
  const [hov, setHov] = useState(false);
  const { icon: Icon, label, desc, count } = section;
  return (
    <a href={section.href} style={{ textDecoration: "none" }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}>
      <div style={{
        background: hov ? C.bg3 : C.bg2,
        border: `1px solid ${hov ? C.borderHover : C.border}`,
        borderRadius: 6,
        padding: "24px 24px 20px",
        transition: "all 0.2s",
        boxShadow: hov ? `0 0 0 1px ${C.redGlow}, 0 8px 32px rgba(0,0,0,0.5)` : "none",
        height: "100%", boxSizing: "border-box",
        position: "relative", overflow: "hidden",
      }}>
        {/* Count badge top-right */}
        <div style={{
          position: "absolute", top: 16, right: 16,
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: 11, fontWeight: 700,
          color: hov ? C.red : C.muted,
          transition: "color 0.2s",
        }}>
          {count}
        </div>

        {/* Icon box */}
        <div style={{
          width: 44, height: 44, borderRadius: 6,
          background: hov ? C.redDim : C.faint,
          border: `1px solid ${hov ? "rgba(196,30,30,0.3)" : C.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 16, transition: "all 0.2s", flexShrink: 0,
        }}>
          <Icon size={22} color={hov ? C.red : C.silverDim} />
        </div>

        <p style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontWeight: 700, fontSize: "0.95rem",
          color: hov ? C.silver : "rgba(232,236,239,0.85)",
          margin: "0 0 6px", letterSpacing: "-0.01em",
          transition: "color 0.2s",
        }}>
          {label}
        </p>
        <p style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.55,
        }}>
          {desc}
        </p>

        {/* Bottom accent line on hover */}
        <div style={{
          position: "absolute", bottom: 0, left: 0,
          height: 2, width: hov ? "100%" : "0%",
          background: C.red,
          transition: "width 0.25s ease",
        }} />
      </div>
    </a>
  );
}

// ── News row ──────────────────────────────────────────────────────────────────
function NewsRow({ item }: { item: typeof NEWS[0] }) {
  const [hov, setHov] = useState(false);
  const catColor = item.category === "UPDATE" ? C.red : item.category === "GUIDE" ? C.gold : C.silverDim;
  return (
    <a href="#" style={{ textDecoration: "none" }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}>
      <div style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: "14px 18px",
        background: hov ? C.bg3 : "transparent",
        border: `1px solid ${hov ? C.borderHover : C.border}`,
        borderRadius: 4,
        transition: "all 0.18s",
      }}>
        {/* Category */}
        <span style={{
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: 9, fontWeight: 700, letterSpacing: "0.14em",
          color: catColor,
          width: 56, flexShrink: 0, textTransform: "uppercase",
        }}>
          {item.category}
        </span>
        {/* Title */}
        <span style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 13, fontWeight: 600,
          color: hov ? C.silver : "rgba(232,236,239,0.8)",
          flex: 1, letterSpacing: "-0.01em",
          transition: "color 0.15s",
        }}>
          {item.title}
        </span>
        {/* Date */}
        <span style={{
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: 10, color: C.muted, flexShrink: 0,
        }}>
          {item.date}
        </span>
        {/* Arrow */}
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: hov ? 1 : 0.3, transition: "opacity 0.15s" }}>
          <path d="M3 8h10M9 4l4 4-4 4" stroke={C.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </a>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function NeonOps() {
  const [searchVal, setSearchVal] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      color: C.silver,
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* ── Scan-line texture overlay ── */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ══ HERO ═══════════════════════════════════════════════════════════ */}
        <section style={{
          position: "relative", overflow: "hidden",
          borderBottom: `1px solid ${C.border}`,
          padding: "90px 24px 70px",
        }}>
          {/* Background pattern */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: `
              linear-gradient(to right, rgba(196,30,30,0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(196,30,30,0.04) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }} />
          {/* Red radial glow top-center */}
          <div style={{
            position: "absolute", top: -120, left: "50%", transform: "translateX(-50%)",
            width: 700, height: 300,
            background: "radial-gradient(ellipse at center, rgba(196,30,30,0.14) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          {/* Bottom fade */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
            background: `linear-gradient(to bottom, transparent, ${C.bg})`,
            pointerEvents: "none",
          }} />
          {/* Top red accent line */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(to right, transparent, ${C.red} 30%, ${C.red} 70%, transparent)`,
          }} />

          <div style={{ position: "relative", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
            {/* Status badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "5px 14px",
              background: C.redDim,
              border: `1px solid rgba(196,30,30,0.3)`,
              borderRadius: 2, marginBottom: 32,
            }}>
              <div style={{
                width: 5, height: 5, borderRadius: "50%",
                background: C.red, boxShadow: `0 0 8px ${C.red}`,
              }} />
              <span style={{
                fontSize: 10, fontWeight: 700, color: C.red,
                letterSpacing: "0.16em", textTransform: "uppercase",
                fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              }}>
                The Definitive CrossFire Resource
              </span>
            </div>

            {/* Hero title — generated image */}
            <div style={{ marginBottom: 24 }}>
              <img
                src="/__mockup/images/cf-wiki-hero-title.png"
                alt="CrossFire Wiki"
                style={{
                  maxWidth: "min(680px, 100%)",
                  height: "auto",
                  display: "block",
                  margin: "0 auto",
                }}
                onError={(e) => {
                  // Fallback if image isn't ready yet
                  const el = e.currentTarget;
                  el.style.display = "none";
                  const fallback = el.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = "block";
                }}
              />
              {/* Text fallback */}
              <div style={{ display: "none" }}>
                <h1 style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: 900, fontSize: "clamp(3rem, 8vw, 5.5rem)",
                  color: C.silver, margin: 0,
                  letterSpacing: "-0.05em", lineHeight: 1,
                  textTransform: "uppercase",
                }}>
                  CROSSFIRE<br />
                  <span style={{ color: C.red }}>WIKI</span>
                </h1>
              </div>
            </div>

            <p style={{
              fontSize: "clamp(0.9rem, 2vw, 1.1rem)",
              color: C.muted, marginBottom: 40,
              maxWidth: 520, marginLeft: "auto", marginRight: "auto",
              lineHeight: 1.6, letterSpacing: "0.01em",
            }}>
              Weapons · Mercenaries · Ranks · Events — everything to dominate.
            </p>

            {/* Search bar */}
            <div style={{ maxWidth: 520, margin: "0 auto" }}>
              <div style={{
                display: "flex", alignItems: "center",
                background: C.bg2,
                border: `1px solid ${searchFocused ? C.red : C.border}`,
                borderRadius: 4, overflow: "hidden",
                boxShadow: searchFocused ? `0 0 0 3px rgba(196,30,30,0.12)` : "none",
                transition: "all 0.2s",
              }}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ marginLeft: 16, flexShrink: 0 }}>
                  <circle cx="8.5" cy="8.5" r="5.5" stroke={searchFocused ? C.red : C.muted} strokeWidth="1.8" />
                  <line x1="12.5" y1="12.5" x2="17" y2="17" stroke={searchFocused ? C.red : C.muted} strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <input
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search weapons, maps, mercenaries..."
                  style={{
                    flex: 1, padding: "13px 12px",
                    background: "transparent", border: "none", outline: "none",
                    color: C.silver, fontSize: 14,
                    fontFamily: "'Inter', system-ui, sans-serif",
                  }}
                />
                <button style={{
                  padding: "10px 20px", margin: 4,
                  background: C.red, border: "none", borderRadius: 2,
                  color: "#fff", fontWeight: 700, fontSize: 12,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}>
                  Search
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ══ EVENTS STRIP ════════════════════════════════════════════════════ */}
        <div style={{
          borderBottom: `1px solid ${C.border}`,
          background: C.bg2,
          padding: "0 24px",
          overflowX: "auto",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 0,
            maxWidth: 1100, margin: "0 auto",
          }}>
            {/* Label */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "12px 20px 12px 0",
              borderRight: `1px solid ${C.border}`,
              marginRight: 16, flexShrink: 0,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.red, boxShadow: `0 0 6px ${C.red}` }} />
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.18em",
                color: C.red, textTransform: "uppercase",
                fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              }}>
                Live Events
              </span>
            </div>
            {/* Chips */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "8px 0" }}>
              {EVENTS.map(ev => <EventChip key={ev.id} event={ev} />)}
            </div>
          </div>
        </div>

        {/* ══ MAIN CONTENT ════════════════════════════════════════════════════ */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px" }}>

          {/* ── EVENTS ── */}
          <section>
            <div style={{
              display: "flex", alignItems: "flex-end",
              justifyContent: "space-between", marginBottom: 24,
            }}>
              <div>
                <SectionLabel>Active Now</SectionLabel>
                <SectionTitle>Events & Announcements</SectionTitle>
              </div>
              <a href="/events" style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 12, fontWeight: 600, color: C.muted,
                textDecoration: "none", letterSpacing: "0.04em",
              }}>
                All events
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>

            {/* Featured + 2 side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div style={{ gridRow: "1 / 3" }}>
                <EventCard event={EVENTS[3]} featured />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <EventCard event={EVENTS[0]} />
                <EventCard event={EVENTS[2]} />
              </div>
            </div>
            {/* Bottom 3 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {EVENTS.slice(1, 4).filter((_, i) => i !== 1).concat([EVENTS[4], EVENTS[5]]).slice(0, 3).map(ev => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
          </section>

          <Divider />

          {/* ── WIKI SECTIONS ── 4 cards, premium layout */}
          <section>
            <div style={{ marginBottom: 28 }}>
              <SectionLabel>Knowledge Base</SectionLabel>
              <SectionTitle>Wiki Sections</SectionTitle>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
            }}>
              {WIKI_SECTIONS.map(s => <WikiCard key={s.label} section={s} />)}
            </div>
            {/* Maps + Tutorials as a secondary strip */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12,
            }}>
              <a href="/maps" style={{ textDecoration: "none" }}>
                <div style={{
                  background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 6,
                  padding: "16px 20px",
                  display: "flex", alignItems: "center", gap: 14,
                  transition: "all 0.18s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = C.borderHover)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
                  <IconMaps size={20} color={C.silverDim} />
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.silver }}>Maps</p>
                    <p style={{ margin: 0, fontSize: 11, color: C.muted }}>Layouts, callouts, and tactical spots</p>
                  </div>
                  <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: 10, color: C.muted }}>100+</span>
                </div>
              </a>
              <a href="/tutorials" style={{ textDecoration: "none" }}>
                <div style={{
                  background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 6,
                  padding: "16px 20px",
                  display: "flex", alignItems: "center", gap: 14,
                  transition: "all 0.18s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = C.borderHover)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
                  <IconTutorials size={20} color={C.silverDim} />
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.silver }}>Tutorials</p>
                    <p style={{ margin: 0, fontSize: 11, color: C.muted }}>Tips, guides, and ranked strategies</p>
                  </div>
                </div>
              </a>
            </div>
          </section>

          <Divider />

          {/* ── LATEST NEWS ── */}
          <section>
            <div style={{
              display: "flex", alignItems: "flex-end",
              justifyContent: "space-between", marginBottom: 20,
            }}>
              <div>
                <SectionLabel>Stay Informed</SectionLabel>
                <SectionTitle>Latest News</SectionTitle>
              </div>
              <a href="/news" style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 12, fontWeight: 600, color: C.muted,
                textDecoration: "none", letterSpacing: "0.04em",
              }}>
                All news
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {NEWS.map(item => <NewsRow key={item.id} item={item} />)}
            </div>
          </section>

          <Divider />

          {/* ── DISCORD CTA ── */}
          <section>
            <div style={{
              position: "relative", overflow: "hidden",
              background: C.bg2,
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: "44px 40px",
              textAlign: "center",
            }}>
              {/* Background grid */}
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                backgroundImage: `
                  linear-gradient(to right, rgba(196,30,30,0.04) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(196,30,30,0.04) 1px, transparent 1px)
                `,
                backgroundSize: "40px 40px",
              }} />
              {/* Top accent */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(to right, transparent, ${C.red} 30%, ${C.red} 70%, transparent)`,
              }} />

              <div style={{ position: "relative" }}>
                <div style={{
                  display: "inline-block",
                  padding: "3px 10px",
                  background: "rgba(88,101,242,0.12)",
                  border: "1px solid rgba(88,101,242,0.25)",
                  borderRadius: 2,
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
                  color: "#7289da", textTransform: "uppercase",
                  marginBottom: 16,
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}>
                  Community
                </div>
                <h2 style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: 800, fontSize: "clamp(1.2rem, 2.5vw, 1.7rem)",
                  color: C.silver, margin: "0 0 10px",
                  letterSpacing: "-0.03em",
                }}>
                  Join the CrossFire Wiki Discord
                </h2>
                <p style={{
                  fontSize: 14, color: C.muted,
                  maxWidth: 420, margin: "0 auto 28px",
                  lineHeight: 1.6,
                }}>
                  Hundreds of players sharing strategies, loadouts, and event alerts in real time.
                </p>
                <a
                  href="https://discord.gg/7AbuDrNNJM"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 10,
                    padding: "12px 28px",
                    background: "#5865f2",
                    borderRadius: 4, textDecoration: "none",
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontWeight: 700, fontSize: 13, color: "#fff",
                    letterSpacing: "0.04em",
                  }}
                >
                  {/* Discord icon */}
                  <svg width="18" height="18" viewBox="0 0 71 55" fill="white">
                    <path d="M60.1 4.9A58.5 58.5 0 0 0 45.7.9a41 41 0 0 0-1.8 3.7 54 54 0 0 0-16.2 0A39 39 0 0 0 25.8.9 58.4 58.4 0 0 0 11.3 5C1.6 19.5-1 33.6.3 47.5a59 59 0 0 0 18 9.1 44.5 44.5 0 0 0 3.9-6.3 38.3 38.3 0 0 1-6.1-2.9l1.5-1.1a42.1 42.1 0 0 0 35.8 0l1.5 1.1a38.4 38.4 0 0 1-6.1 3 43.8 43.8 0 0 0 3.8 6.3 58.7 58.7 0 0 0 18-9.1C72 31.4 68 17.4 60.1 4.9ZM23.7 39.2c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.5 0 6.4 3.2 6.3 7.2 0 4-2.8 7.2-6.3 7.2Zm23.6 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.5 0 6.4 3.2 6.3 7.2 0 4-2.8 7.2-6.3 7.2Z" />
                  </svg>
                  Join Discord Server
                </a>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
