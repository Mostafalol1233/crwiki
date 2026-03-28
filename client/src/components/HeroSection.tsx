import { Link } from "wouter";
import { ArrowRight, Download } from "lucide-react";

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
}

interface HeroSectionProps {
  post: HeroPost;
  isPlaceholder?: boolean;
  bgImageUrl?: string;
}

export function HeroSection({ post, isPlaceholder, bgImageUrl }: HeroSectionProps) {
  return (
    <section className="cf-hero relative w-full overflow-hidden" style={{ minHeight: "520px" }}>
      {/* Background — split scene like official CF site */}
      <div className="absolute inset-0">
        {/* Dark base */}
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        {/* Left scene – blue/cold tones */}
        <div
          className="absolute inset-y-0 left-0 w-1/2"
          style={{
            background: "linear-gradient(135deg, #0d1f3c 0%, #1a3a5c 40%, #0a0a0a 100%)",
          }}
        />
        {/* Right scene – warm/orange tones */}
        <div
          className="absolute inset-y-0 right-0 w-1/2"
          style={{
            background: "linear-gradient(225deg, #3d1a00 0%, #6b2d00 40%, #0a0a0a 100%)",
          }}
        />
        {/* Center dark gradient to frame the characters */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a]" />
        {/* The mercenaries hero image */}
        <img
          src="/cf-heroes-bg.png"
          alt="CrossFire Mercenaries"
          className="absolute inset-0 w-full h-full object-cover object-top"
          style={{ mixBlendMode: "normal", opacity: 0.92 }}
          draggable={false}
        />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
      </div>

      {/* Top edge accent */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#f5a623] to-transparent" />

      {/* Diagonal corner decorations like official site */}
      <div
        className="absolute top-0 left-0 w-32 h-full opacity-30"
        style={{
          background: "linear-gradient(to right, #0a0a0a 0%, transparent 100%)",
          clipPath: "polygon(0 0, 60% 0, 100% 100%, 0 100%)",
        }}
      />
      <div
        className="absolute top-0 right-0 w-32 h-full opacity-30"
        style={{
          background: "linear-gradient(to left, #0a0a0a 0%, transparent 100%)",
          clipPath: "polygon(40% 0, 100% 0, 100% 100%, 0 100%)",
        }}
      />

      {/* Content */}
      <div className="relative flex flex-col items-center justify-end h-full" style={{ minHeight: "520px", paddingBottom: "48px" }}>

        {/* Latest news title — only when not placeholder */}
        {!isPlaceholder && post.title && (
          <div className="text-center mb-4 px-4">
            <span className="inline-block bg-[#f5a623] text-black text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 mb-2">
              {post.category}
            </span>
            <h2 className="text-white text-xl md:text-2xl font-black uppercase tracking-tight max-w-lg mx-auto leading-tight drop-shadow-lg">
              {post.title}
            </h2>
          </div>
        )}

        {/* Download Button — golden, centered, official CF style */}
        <div className="flex flex-col items-center gap-3">
          <Link href="/download">
            <button className="cf-download-btn group relative flex items-center gap-3 px-10 py-4 font-black uppercase tracking-[0.2em] text-base text-black transition-all duration-200 hover:scale-105 active:scale-95" style={{ minWidth: "220px" }}>
              <Download className="h-5 w-5" />
              DOWNLOAD
            </button>
          </Link>

          {!isPlaceholder && post.id && (
            <Link
              href={`/posts/${(post as any).post_slug || post.id}`}
              className="text-white/60 hover:text-white text-xs uppercase tracking-widest font-bold transition-colors flex items-center gap-1"
            >
              Read More <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
