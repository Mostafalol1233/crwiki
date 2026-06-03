const GOLD_BORDER = "rgba(154,124,63,0.25)";

interface GM {
  name: string;
  avatar: string;
  role: string;
  lastSeen: string;
  color: string;
}

const GMS: GM[] = [
  { name: "[GM]Celestine", avatar: "https://files.catbox.moe/ctwnqz.jpeg", role: "Community Manager", lastSeen: "Jun 3", color: "#e53e3e" },
  { name: "[GM]Juicebox", avatar: "https://files.catbox.moe/4il6hi.jpeg", role: "Game Master", lastSeen: "May 21", color: "#d4a017" },
  { name: "[GM]Vinsi", avatar: "https://files.catbox.moe/hh7h5u.jpeg", role: "Support GM", lastSeen: "Apr 27", color: "#38a169" },
  { name: "[GM]Ronin", avatar: "https://files.catbox.moe/eck3jc.jpeg", role: "Events GM", lastSeen: "May 10", color: "#3b82f6" },
];

export function GMSection() {
  return (
    <section style={{ padding: "48px 0" }}>
      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        marginBottom: "24px", paddingBottom: "12px", borderBottom: `1px solid ${GOLD_BORDER}`,
      }}>
        <h2 style={{
          fontFamily: "'Cinzel', serif", fontWeight: 300,
          fontSize: "clamp(1.3rem, 3vw, 1.9rem)", letterSpacing: "0.15em",
          color: "hsl(var(--foreground))", margin: 0,
        }}>
          GAME MASTERS
        </h2>
        <span style={{ fontFamily: "'EB Garamond', serif", fontStyle: "italic", fontSize: "0.85rem", color: "#9a7c3f" }}>
          Official CF Staff
        </span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "12px",
      }}>
        {GMS.map((gm) => (
          <div key={gm.name} style={{
            background: "hsl(var(--card))",
            border: `1px solid ${GOLD_BORDER}`,
            padding: "16px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            transition: "border-color 0.2s, transform 0.15s",
            cursor: "default",
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(154,124,63,0.6)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = GOLD_BORDER;
              (e.currentTarget as HTMLElement).style.transform = "none";
            }}
          >
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img
                src={gm.avatar}
                alt={gm.name}
                style={{
                  width: 52, height: 52,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `2px solid ${gm.color}`,
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(gm.name)}&background=1a1a1a&color=${gm.color.replace('#', '')}&size=52`;
                }}
              />
              <div style={{
                position: "absolute", bottom: 0, right: 0,
                width: 12, height: 12, borderRadius: "50%",
                background: "#22c55e",
                border: "2px solid hsl(var(--card))",
              }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontFamily: "'Cinzel', serif", fontWeight: 600,
                fontSize: "0.78rem", letterSpacing: "0.06em",
                color: gm.color, margin: "0 0 2px",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {gm.name}
              </p>
              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: "0.82rem", color: "hsl(var(--muted-foreground))", margin: "0 0 2px", opacity: 0.75 }}>
                {gm.role}
              </p>
              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", margin: 0, opacity: 0.5 }}>
                Last seen: {gm.lastSeen}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
