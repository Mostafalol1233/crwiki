import { Link } from "wouter";

interface WeaponCard {
  id: string;
  name: string;
  image?: string;
  imageUrl?: string;
  category?: string;
  stats?: Record<string, any>;
}

interface LatestWeaponsProps {
  weapons: WeaponCard[];
  isDark: boolean;
}

const GOLD = "#9a7c3f";
const GOLD_BORDER = "rgba(154,124,63,0.25)";

function StatBar({ label, value, isDark }: { label: string; value: number; isDark: boolean }) {
  const pct = Math.min(Math.max(value || 0, 0), 100);
  return (
    <div style={{ marginBottom: "6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
        <span style={{ fontFamily: "'EB Garamond', serif", fontSize: "0.7rem", letterSpacing: "0.1em", color: isDark ? "rgba(232,224,208,0.45)" : "rgba(26,26,26,0.45)" }}>
          {label}
        </span>
      </div>
      <div style={{ height: "2px", background: isDark ? "rgba(232,224,208,0.08)" : "rgba(26,26,26,0.08)", width: "100%" }}>
        <div style={{ height: "2px", width: `${pct}%`, background: GOLD, transition: "width 0.8s" }} />
      </div>
    </div>
  );
}

export function LatestWeapons({ weapons, isDark }: LatestWeaponsProps) {
  const textColor = isDark ? "#e8e0d0" : "#1a1a1a";
  const cardBg = isDark ? "#0d0d0d" : "#f5f0e8";

  return (
    <section style={{ padding: "48px 0" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: "28px",
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
            color: textColor,
            margin: 0,
          }}
        >
          LATEST WEAPONS
        </h2>
        <Link href="/weapons">
          <span style={{ fontFamily: "'EB Garamond', serif", fontStyle: "italic", fontSize: "0.9rem", color: GOLD, cursor: "pointer" }}>
            Full Arsenal →
          </span>
        </Link>
      </div>

      {/* 4 weapon cards */}
      <div
        className="weapons-grid"
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}
      >
        {(weapons.length === 0 ? Array.from({ length: 4 }).map((_, i) => ({ id: String(i), name: "", image: "" } as WeaponCard)) : weapons.slice(0, 4)).map((w, i) => {
          const img = w.image || w.imageUrl || "";
          const damage = w.stats?.damage ?? w.stats?.Damage ?? 0;
          const recoil = w.stats?.recoil ?? w.stats?.Recoil ?? 0;
          return (
            <Link key={w.id || i} href="/weapons">
              <div
                style={{
                  background: cardBg,
                  border: `1px solid ${GOLD_BORDER}`,
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(154,124,63,0.55)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = GOLD_BORDER)}
              >
                {/* Image area */}
                <div style={{ background: isDark ? "#060606" : "#e8e3d8", padding: "20px 16px 12px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100px" }}>
                  {img ? (
                    <img src={img} alt={w.name} style={{ maxHeight: "80px", maxWidth: "100%", objectFit: "contain" }} loading="lazy" />
                  ) : (
                    <div style={{ width: "60px", height: "60px", background: isDark ? "#111" : "#ddd" }} />
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: "12px" }}>
                  <p
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontWeight: 400,
                      fontSize: "0.65rem",
                      letterSpacing: "0.12em",
                      color: textColor,
                      margin: "0 0 10px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {w.name || "—"}
                  </p>
                  <StatBar label="Damage" value={damage} isDark={isDark} />
                  <StatBar label="Recoil" value={recoil} isDark={isDark} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .weapons-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </section>
  );
}
