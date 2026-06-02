import { Link } from "wouter";
import { ChevronRight, Clock, Eye, User } from "lucide-react";
import { useEffect, useState } from "react";

interface HeroPost {
  id: string;
  title: string;
  summary: string;
  category: string;
  image: string;
  author: string;
  date: string;
  readingTime: number;
  views: number;
  post_slug?: string;
}

interface HeroSectionProps {
  post: HeroPost;
  isPlaceholder?: boolean;
  bgImageUrl?: string;
}

const STATS = [
  { label: "Active Players", value: "2.4M+", suffix: "" },
  { label: "Game Modes", value: "50+", suffix: "" },
  { label: "Weapons", value: "300+", suffix: "" },
  { label: "Maps", value: "100+", suffix: "" },
];

export function HeroSection({ post, isPlaceholder, bgImageUrl }: HeroSectionProps) {
  const bgImg = bgImageUrl || "/cf-heroes-bg.png";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const slug = (post as any).post_slug || post.id;

  return (
    <section
      className="cf-hero relative w-full overflow-hidden"
      style={{ minHeight: "620px", height: "clamp(560px, 65vh, 820px)" }}
    >
      {/* ── Background layers ── */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[#060606]" />
        <div className="absolute inset-y-0 left-0" style={{ width: "55%", background: "linear-gradient(135deg, #071428 0%, #0e2040 40%, #080808 100%)" }} />
        <div className="absolute inset-y-0 right-0" style={{ width: "55%", background: "linear-gradient(225deg, #2e0f00 0%, #4a1a00 40%, #080808 100%)" }} />

        {/* Hero image */}
        <img
          src={bgImg}
          alt="CrossFire Mercenaries"
          className="absolute inset-0 w-full h-full object-cover object-top"
          style={{ opacity: 0.92 }}
          draggable={false}
        />

        {/* Vignette overlays */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.85) 0%, transparent 65%)" }} />
        <div className="absolute bottom-0 left-0 right-0" style={{ height: "55%", background: "linear-gradient(to top, #060606 0%, rgba(6,6,6,0.75) 45%, transparent 100%)" }} />
        <div className="absolute top-0 left-0 right-0" style={{ height: "25%", background: "linear-gradient(to bottom, rgba(6,6,6,0.6) 0%, transparent 100%)" }} />

        {/* Side vignettes */}
        <div className="absolute inset-y-0 left-0 w-24 pointer-events-none" style={{ background: "linear-gradient(to right, rgba(6,6,6,0.7) 0%, transparent 100%)" }} />
        <div className="absolute inset-y-0 right-0 w-24 pointer-events-none" style={{ background: "linear-gradient(to left, rgba(6,6,6,0.7) 0%, transparent 100%)" }} />

        {/* Top golden accent line */}
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(to right, transparent 0%, #f5a623 20%, #f9d46a 50%, #f5a623 80%, transparent 100%)" }} />

        {/* Animated shimmer on the accent line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] overflow-hidden">
          <div
            className="h-full w-1/3"
            style={{
              background: "linear-gradient(to right, transparent, rgba(255,255,255,0.6), transparent)",
              animation: "heroShimmer 3s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="relative flex flex-col items-center justify-end h-full pb-0 px-4" style={{ minHeight: "620px" }}>

        {/* Post info */}
        {!isPlaceholder && post.title && (
          <div
            className="text-center mb-6 max-w-2xl transition-all duration-700"
            style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)" }}
          >
            {/* Category badge */}
            <span
              className="inline-block text-black text-[10px] font-black uppercase tracking-[0.28em] px-3 py-1 mb-4"
              style={{
                background: "linear-gradient(180deg, #f9c84a 0%, #e08a00 100%)",
                clipPath: "polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)",
              }}
            >
              {post.category}
            </span>

            {/* Title */}
            <h2 className="text-white text-2xl md:text-4xl font-black uppercase tracking-tight leading-tight drop-shadow-2xl mb-3">
              {post.title}
            </h2>

            {/* Summary */}
            {post.summary && (
              <p className="text-sm md:text-base leading-relaxed max-w-xl mx-auto drop-shadow-md" style={{ color: "rgba(255,255,255,0.65)" }} dir="auto">
                {post.summary}
              </p>
            )}

            {/* Meta row */}
            <div className="flex items-center justify-center gap-4 mt-4">
              {post.author && (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <User className="h-3 w-3" />
                  {post.author}
                </span>
              )}
              {post.readingTime > 0 && (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <Clock className="h-3 w-3" />
                  {post.readingTime} min read
                </span>
              )}
              {post.views > 0 && (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <Eye className="h-3 w-3" />
                  {post.views.toLocaleString()} views
                </span>
              )}
            </div>

            {/* Read More */}
            {post.id && (
              <Link
                href={`/posts/${slug}`}
                className="inline-flex items-center gap-1.5 mt-5 text-[11px] uppercase tracking-[0.2em] font-black transition-all duration-200 hover:gap-3 group"
                style={{ color: "#f5a623" }}
              >
                Read More
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        )}

        {/* ── Stats bar ── */}
        <div
          className="w-full max-w-4xl mx-auto transition-all duration-700 delay-100"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(12px)" }}
        >
          <div
            className="grid grid-cols-4 divide-x"
            style={{
              background: "rgba(0,0,0,0.75)",
              borderTop: "1px solid rgba(245,166,35,0.25)",
              backdropFilter: "blur(12px)",
              divideColor: "rgba(255,255,255,0.06)",
            }}
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center justify-center py-4 px-2" style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-xl md:text-2xl font-black leading-none" style={{ color: "#f5a623" }}>
                  {stat.value}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] mt-1 text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes heroShimmer {
          0% { transform: translateX(-100%); }
          60%, 100% { transform: translateX(400%); }
        }
      `}</style>
    </section>
  );
}
