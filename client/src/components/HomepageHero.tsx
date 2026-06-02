import { useState } from "react";
import { useLocation } from "wouter";
import { Search } from "lucide-react";

interface HomepageHeroProps {
  heroImage?: string;
}

export function HomepageHero({ heroImage }: HomepageHeroProps) {
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setLocation(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="relative w-full flex items-center justify-center" style={{ minHeight: "100vh" }}>
      {heroImage && (
        <img
          src={heroImage}
          alt="CrossFire"
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
      )}

      {/* Overlay uses a CSS variable trick so it works in both themes */}
      <div
        className="absolute inset-0 hero-overlay"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.72) 60%, rgba(0,0,0,0.97) 100%)" }}
      />

      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <p
          style={{
            fontFamily: "'EB Garamond', serif",
            fontStyle: "italic",
            fontSize: "0.95rem",
            letterSpacing: "0.18em",
            color: "#9a7c3f",
            marginBottom: "16px",
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
            color: "#e8e0d0",
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
            color: "rgba(232,224,208,0.65)",
            marginBottom: "2.5rem",
            letterSpacing: "0.04em",
          }}
        >
          Weapons, mercenaries, ranks, maps and everything in between.
        </p>

        <form onSubmit={handleSearch} className="relative max-w-lg mx-auto">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search weapons, maps, mercenaries..."
            style={{
              width: "100%",
              padding: "14px 52px 14px 20px",
              background: "rgba(10,10,10,0.7)",
              border: "1px solid rgba(154,124,63,0.4)",
              color: "#e8e0d0",
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
            <Search size={20} strokeWidth={1.5} />
          </button>
        </form>
      </div>

      {/* Fade into page background */}
      <div
        className="absolute bottom-0 left-0 right-0 hero-bottom-fade"
        style={{ height: "80px", background: "linear-gradient(to bottom, transparent, hsl(var(--background)))" }}
      />
    </div>
  );
}
