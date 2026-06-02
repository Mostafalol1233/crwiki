import { Link } from "wouter";
import { Shield, Map, Users } from "lucide-react";

const GOLD = "#9a7c3f";
const GOLD_BORDER = "rgba(154,124,63,0.25)";

const CATEGORIES = [
  { icon: Shield, name: "WEAPONS", label: "Full arsenal & stats", link: "/weapons" },
  { icon: Map, name: "MAPS", label: "Battle arenas", link: "/maps" },
  { icon: Users, name: "MERCENARIES", label: "Elite operators", link: "/mercenaries" },
];

export function CategoriesGrid() {
  return (
    <section style={{ padding: "48px 0" }}>
      <div style={{ marginBottom: "28px", paddingBottom: "12px", borderBottom: `1px solid ${GOLD_BORDER}` }}>
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
          EXPLORE
        </h2>
      </div>

      <div className="categories-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
        {CATEGORIES.map(({ icon: Icon, name, label, link }) => (
          <Link key={name} href={link}>
            <div
              style={{
                background: "hsl(var(--card))",
                border: `1px solid ${GOLD_BORDER}`,
                padding: "32px 24px",
                cursor: "pointer",
                transition: "background 0.2s, border-color 0.2s",
                textAlign: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(154,124,63,0.05)";
                e.currentTarget.style.borderColor = "rgba(154,124,63,0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "hsl(var(--card))";
                e.currentTarget.style.borderColor = GOLD_BORDER;
              }}
            >
              <Icon size={28} style={{ color: GOLD, marginBottom: "14px", display: "inline-block" }} strokeWidth={1} />
              <h3
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 300,
                  fontSize: "1rem",
                  letterSpacing: "0.2em",
                  color: "hsl(var(--foreground))",
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
                  color: "hsl(var(--muted-foreground))",
                  margin: 0,
                  letterSpacing: "0.04em",
                  opacity: 0.6,
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
          .categories-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
