import { useState } from "react";
import { useLocation } from "wouter";
import { Search } from "lucide-react";

interface HomepageHeroProps {
  heroImage?: string;
  isDark: boolean;
}

export function HomepageHero({ heroImage, isDark }: HomepageHeroProps) {
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setLocation(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div
      className="relative w-full flex items-center justify-center"
      style={{ minHeight: "100vh" }}
    >
      {/* Background image */}
      {heroImage && (
        <img
          src={heroImage}
          alt="CrossFire"
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
      )}

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "linear-gradient(to bottom, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.75) 60%, rgba(10,10,10,0.97) 100%)"
            : "linear-gradient(to bottom, rgba(240,235,224,0.45) 0%, rgba(240,235,224,0.7) 60%, rgba(240,235,224,0.97) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <p
          className="mb-4"
          style={{
            fontFamily: "'EB Garamond', serif",
            fontStyle: "italic",
            fontSize: "0.95rem",
            letterSpacing: "0.18em",
            color: "#9a7c3f",
          }}
        >
          The definitive CrossFire resource
        </p>

        <h1
          style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 300,
            letterSpacing: "0.15em",
            fontSize: "clamp(2.2rem, 6vw, 4.5rem)",
            lineHeight: 1.1,
            color: isDark ? "#e8e0d0" : "#1a1a1a",
            marginBottom: "1.25rem",
          }}
        >
          CROSSFIRE WIKI
        </h1>

        <p
          style={{
            fontFamily: "'EB Garamond', serif",
            fontStyle: "italic",
            fontSize: "clamp(1rem, 2.5vw, 1.3rem)",
            color: isDark ? "rgba(232,224,208,0.65)" : "rgba(26,26,26,0.6)",
            marginBottom: "2.5rem",
            letterSpacing: "0.04em",
          }}
        >
          Weapons, mercenaries, ranks, maps and everything in between.
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="relative max-w-lg mx-auto">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search weapons, maps, mercenaries..."
            style={{
              width: "100%",
              padding: "14px 52px 14px 20px",
              background: isDark ? "rgba(10,10,10,0.7)" : "rgba(240,235,224,0.75)",
              border: "1px solid rgba(154,124,63,0.35)",
              color: isDark ? "#e8e0d0" : "#1a1a1a",
              fontFamily: "'EB Garamond', serif",
              fontSize: "1rem",
              letterSpacing: "0.03em",
              outline: "none",
              backdropFilter: "blur(8px)",
            }}
          />
          <button
            type="submit"
            style={{
              position: "absolute",
              right: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9a7c3f",
              padding: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Search size={18} />
          </button>
        </form>
      </div>

      {/* Bottom fade into page */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: "80px",
          background: `linear-gradient(to bottom, transparent, ${isDark ? "#0a0a0a" : "#F0EBE0"})`,
        }}
      />
    </div>
  );
}
