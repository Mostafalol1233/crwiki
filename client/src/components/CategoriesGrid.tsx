import { Link } from "wouter";
import { Shield, Map, Users } from "lucide-react";

interface CategoriesGridProps {
  isDark: boolean;
}

const GOLD = "#9a7c3f";
const GOLD_BORDER = "rgba(154,124,63,0.25)";

const CATEGORIES = [
  { icon: Shield, name: "WEAPONS", label: "Full arsenal & stats", link: "/weapons" },
  { icon: Map, name: "MAPS", label: "Battle arenas", link: "/maps" },
  { icon: Users, name: "MERCENARIES", label: "Elite operators", link: "/mercenaries" },
];

export function CategoriesGrid({ isDark }: CategoriesGridProps) {
  const textColor = isDark ? "#e8e0d0" : "#1a1a1a";
  const cardBg = isDark ? "#0d0d0d" : "#f5f0e8";

  return (
    <section style={{ padding: "48px 0" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px", paddingBottom: "12px", borderBottom: `1px solid ${GOLD_BORDER}` }}>
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
          EXPLORE
        </h2>
      </div>

      <div
        className="categories-grid"
        style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}
      >
        {CATEGORIES.map(({ icon: Icon, name, label, link }) => (
          <Link key={name} href={link}>
            <div
              style={{
                background: cardBg,
                border: `1px solid ${GOLD_BORDER}`,
                padding: "32px 24px",
                cursor: "pointer",
                transition: "background 0.2s, border-color 0.2s",
                textAlign: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark
                  ? "rgba(154,124,63,0.06)"
                  : "rgba(154,124,63,0.06)";
                e.currentTarget.style.borderColor = "rgba(154,124,63,0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = cardBg;
                e.currentTarget.style.borderColor = GOLD_BORDER;
              }}
            >
              <Icon
                size={28}
                style={{ color: GOLD, marginBottom: "14px", display: "inline-block" }}
                strokeWidth={1}
              />
              <h3
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 300,
                  fontSize: "1rem",
                  letterSpacing: "0.2em",
                  color: textColor,
                  margin: "0 0 8px",
                }}
              >
                {name}
              </h3>
              <p
                style={{
                  fontFamily: "'EB Garamond', serif",
                  fontStyle: "italic",
                  fontSize: "0.88rem",
                  color: isDark ? "rgba(232,224,208,0.5)" : "rgba(26,26,26,0.5)",
                  margin: 0,
                  letterSpacing: "0.04em",
                }}
              >
                {label}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .categories-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
