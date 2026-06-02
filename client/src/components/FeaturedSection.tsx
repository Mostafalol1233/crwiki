import { Link } from "wouter";

interface FeaturedCard {
  id: string;
  title: string;
  description?: string;
  image?: string;
  imageUrl?: string;
  tag?: string;
  slug?: string;
  event_name_slug?: string;
  news_slug?: string;
  post_slug?: string;
  type?: string;
}

interface FeaturedSectionProps {
  featured: FeaturedCard | null;
  secondary: FeaturedCard[];
  isDark: boolean;
  sectionLabel?: string;
  sectionTitle?: string;
  allLink?: string;
}

function getHref(card: FeaturedCard) {
  if (card.event_name_slug) return `/events/${card.event_name_slug}`;
  if (card.news_slug) return `/news/${card.news_slug}`;
  if (card.post_slug) return `/article/${card.post_slug}`;
  if (card.slug) return `/events/${card.slug}`;
  return `/events/${card.id}`;
}

const GOLD = "#9a7c3f";
const GOLD_BORDER = "rgba(154,124,63,0.25)";
const FALLBACK_IMG = "https://files.catbox.moe/wof38b.jpeg";

export function FeaturedSection({
  featured,
  secondary,
  isDark,
  sectionLabel = "Latest",
  sectionTitle = "Events & News",
  allLink = "/category/events",
}: FeaturedSectionProps) {
  const cardBg = isDark ? "#0d0d0d" : "#f5f0e8";
  const textColor = isDark ? "#e8e0d0" : "#1a1a1a";
  const subColor = isDark ? "rgba(232,224,208,0.55)" : "rgba(26,26,26,0.55)";

  if (!featured) return null;

  return (
    <section style={{ padding: "48px 0" }}>
      {/* Section header */}
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
        <div>
          <span
            style={{
              display: "block",
              fontFamily: "'EB Garamond', serif",
              fontStyle: "italic",
              fontSize: "0.8rem",
              color: GOLD,
              letterSpacing: "0.12em",
              marginBottom: "4px",
            }}
          >
            {sectionLabel}
          </span>
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
            {sectionTitle}
          </h2>
        </div>
        <Link href={allLink}>
          <span
            style={{
              fontFamily: "'EB Garamond', serif",
              fontStyle: "italic",
              fontSize: "0.9rem",
              color: GOLD,
              letterSpacing: "0.06em",
              cursor: "pointer",
            }}
          >
            View all →
          </span>
        </Link>
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "12px",
        }}
        className="featured-grid"
      >
        {/* Large featured card */}
        <Link href={getHref(featured)}>
          <div
            className="group"
            style={{
              background: cardBg,
              border: `1px solid ${GOLD_BORDER}`,
              cursor: "pointer",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(154,124,63,0.55)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = GOLD_BORDER)}
          >
            <div
              style={{
                height: "160px",
                overflow: "hidden",
                background: "#050505",
              }}
            >
              <img
                src={featured.image || featured.imageUrl || FALLBACK_IMG}
                alt={featured.title}
                style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s" }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
              />
            </div>
            <div style={{ padding: "16px" }}>
              {featured.tag && (
                <span
                  style={{
                    display: "inline-block",
                    fontFamily: "'Cinzel', serif",
                    fontSize: "0.65rem",
                    fontWeight: 400,
                    letterSpacing: "0.18em",
                    color: GOLD,
                    border: `1px solid ${GOLD_BORDER}`,
                    padding: "3px 8px",
                    marginBottom: "8px",
                  }}
                >
                  {featured.tag}
                </span>
              )}
              <h3
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 300,
                  fontSize: "1.05rem",
                  letterSpacing: "0.08em",
                  color: textColor,
                  margin: "0 0 8px",
                  lineHeight: 1.3,
                }}
              >
                {featured.title}
              </h3>
              {featured.description && (
                <p
                  style={{
                    fontFamily: "'EB Garamond', serif",
                    fontSize: "0.9rem",
                    color: subColor,
                    margin: "0 0 12px",
                    lineHeight: 1.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as any,
                    overflow: "hidden",
                  }}
                >
                  {featured.description}
                </p>
              )}
              <span style={{ fontFamily: "'EB Garamond', serif", fontStyle: "italic", fontSize: "0.85rem", color: GOLD }}>
                View Event →
              </span>
            </div>
          </div>
        </Link>

        {/* Two stacked secondary cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {secondary.slice(0, 2).map((card) => (
            <Link key={card.id} href={getHref(card)}>
              <div
                style={{
                  background: cardBg,
                  border: `1px solid ${GOLD_BORDER}`,
                  flex: 1,
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(154,124,63,0.55)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = GOLD_BORDER)}
              >
                <div style={{ height: "90px", overflow: "hidden", background: "#050505" }}>
                  <img
                    src={card.image || card.imageUrl || FALLBACK_IMG}
                    alt={card.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
                  />
                </div>
                <div style={{ padding: "10px 12px" }}>
                  {card.tag && (
                    <span
                      style={{
                        display: "inline-block",
                        fontFamily: "'Cinzel', serif",
                        fontSize: "0.6rem",
                        letterSpacing: "0.16em",
                        color: GOLD,
                        marginBottom: "4px",
                      }}
                    >
                      {card.tag}
                    </span>
                  )}
                  <h4
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontWeight: 300,
                      fontSize: "0.8rem",
                      letterSpacing: "0.07em",
                      color: textColor,
                      margin: "0 0 6px",
                      lineHeight: 1.3,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical" as any,
                      overflow: "hidden",
                    }}
                  >
                    {card.title}
                  </h4>
                  <span style={{ fontFamily: "'EB Garamond', serif", fontStyle: "italic", fontSize: "0.78rem", color: GOLD }}>
                    View →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .featured-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
