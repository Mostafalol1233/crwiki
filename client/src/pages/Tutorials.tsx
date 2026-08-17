import { useQuery } from "@tanstack/react-query";
import { getTutorials } from "@/lib/supabaseApi";
import { useState } from "react";
import { Play, Loader2, Youtube } from "lucide-react";
import PageSEO from "@/components/PageSEO";
import { Link } from "wouter";

const CATEGORIES = [
  { id: "all",        label: "All" },
  { id: "highlights", label: "Highlights" },
  { id: "tutorial",   label: "Tutorials" },
  { id: "gameplay",   label: "Gameplay" },
];

export default function TutorialsPage() {
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: rawTutorials = [], isLoading } = useQuery({
    queryKey: ["tutorials", activeCategory],
    queryFn: () => getTutorials(activeCategory === "all" ? undefined : activeCategory),
    staleTime: 5 * 60 * 1000,
  });

  const tutorials = Array.isArray(rawTutorials) ? rawTutorials : [];

  const GOLD = "#f5a623";
  const BG   = "var(--background)";
  const CARD = "var(--card)";
  const BORDER = "rgba(255,255,255,0.06)";

  return (
    <>
      <PageSEO
        title="CrossFire Tutorials & Highlights — CrossFire Wiki"
        description="Watch CrossFire tutorials, gameplay highlights, esports coverage and community clips. Improve your skills and stay up to date."
        canonicalPath="/tutorials"
      />

      <div style={{ minHeight: "100vh", background: BG, paddingTop: 48, paddingBottom: 80 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>

          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
            <Link href="/"><span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", cursor: "pointer", fontWeight: 600 }}>Home</span></Link>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>›</span>
            <span style={{ fontSize: 11, color: GOLD, fontWeight: 700 }}>Tutorials & Highlights</span>
          </div>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: 3, marginBottom: 12 }}>
              <Youtube size={11} color={GOLD} />
              <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.3em", color: GOLD }}>Videos & Guides</span>
            </div>
            <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 900, letterSpacing: "-0.03em", color: "var(--foreground)", margin: "0 0 8px" }}>
              Tutorials &amp; <span style={{ color: GOLD }}>Highlights</span>
            </h1>
            <p style={{ fontSize: 13, color: "#666", margin: "0 0 24px" }}>
              CrossFire gameplay guides, esports highlights, and community content.
            </p>

            {/* Category tabs */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    padding: "6px 14px", fontSize: 10, fontWeight: 800,
                    textTransform: "uppercase", letterSpacing: "0.1em",
                    background: activeCategory === cat.id ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.04)",
                    border: activeCategory === cat.id ? "1px solid rgba(245,166,35,0.35)" : `1px solid ${BORDER}`,
                    color: activeCategory === cat.id ? GOLD : "rgba(255,255,255,0.4)",
                    borderRadius: 3, cursor: "pointer",
                  }}
                >
                  {cat.label}
                </button>
              ))}

              {/* Link to full videos page */}
              <Link href="/videos">
                <button style={{
                  padding: "6px 14px", fontSize: 10, fontWeight: 700,
                  background: "transparent", border: `1px solid ${BORDER}`,
                  color: "rgba(255,255,255,0.3)", borderRadius: 3, cursor: "pointer",
                  marginLeft: "auto", display: "flex", alignItems: "center", gap: 5,
                }}>
                  <Youtube size={10} /> All Videos →
                </button>
              </Link>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
              <Loader2 size={24} color={GOLD} style={{ animation: "spin 0.8s linear infinite" }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : tutorials.length === 0 ? (
            <div style={{ padding: "80px 20px", textAlign: "center", background: CARD, border: `1px solid ${BORDER}`, borderRadius: 4 }}>
              <Youtube size={40} color="rgba(255,255,255,0.06)" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.25)", fontWeight: 700 }}>No videos in this category</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.15)", marginTop: 4 }}>Check back soon or browse all videos</p>
              <Link href="/videos">
                <button style={{ marginTop: 16, padding: "8px 20px", background: GOLD, border: "none", borderRadius: 3, color: "#000", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                  Browse All Videos
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {tutorials.map((video: any) => (
                <a
                  key={video.id}
                  href={video.youtubeUrl || (video.youtubeId ? `https://www.youtube.com/watch?v=${video.youtubeId}` : "#")}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  <div style={{
                    background: CARD, border: `1px solid ${BORDER}`, borderRadius: 4,
                    overflow: "hidden", cursor: "pointer", transition: "border-color 0.15s",
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(245,166,35,0.3)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = BORDER)}
                  >
                    {/* Thumbnail */}
                    <div style={{ position: "relative", paddingBottom: "56.25%", background: "linear-gradient(135deg, #0d0d0d 0%, #111 100%)" }}>
                      {video.youtubeId ? (
                        <img
                          src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                          alt={video.title}
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => {
                            const img = e.currentTarget;
                            if (img.src.includes("hqdefault")) {
                              img.src = `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`;
                            } else {
                              img.style.display = "none";
                            }
                          }}
                        />
                      ) : (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                          <Youtube size={32} color="rgba(245,166,35,0.4)" />
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>Video</span>
                        </div>
                      )}
                      {/* Play overlay */}
                      <div style={{
                        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                        background: "rgba(0,0,0,0.3)", opacity: 0, transition: "opacity 0.2s",
                      }}
                        className="play-overlay"
                      >
                        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(245,166,35,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Play size={20} color="#000" fill="#000" style={{ marginLeft: 3 }} />
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ padding: "12px 14px" }}>
                      {video.category && (
                        <span style={{ fontSize: 8, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: GOLD, display: "block", marginBottom: 4 }}>
                          {video.category}
                        </span>
                      )}
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", margin: "0 0 6px", lineHeight: 1.4 }}>
                        {video.title}
                      </p>
                      {video.description && (
                        <p style={{ fontSize: 11, color: "#555", margin: 0, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {video.description}
                        </p>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

          <style>{`.play-overlay:hover { opacity: 1 !important; }`}</style>
        </div>
      </div>
    </>
  );
}
