import { Link } from "wouter";
import { Download, ChevronRight } from "lucide-react";

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
  const bgImg = bgImageUrl || "/cf-heroes-bg.png";

  return (
    <section
      className="cf-hero relative w-full overflow-hidden"
      style={{ minHeight: "600px", height: "clamp(520px, 62vh, 780px)" }}
    >
      {/* Background layers */}
      <div className="absolute inset-0">
        {/* Dark base */}
        <div className="absolute inset-0 bg-[#080808]" />

        {/* Left blue scene */}
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: "50%",
            background:
              "linear-gradient(135deg, #0b1c38 0%, #162e50 35%, #0a0a0a 100%)",
          }}
        />

        {/* Right warm/orange scene */}
        <div
          className="absolute inset-y-0 right-0"
          style={{
            width: "50%",
            background:
              "linear-gradient(225deg, #3a1500 0%, #5c2500 35%, #0a0a0a 100%)",
          }}
        />

        {/* Diagonal clip — left dark corner */}
        <div
          className="absolute inset-y-0 left-0 w-28 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, #080808 0%, transparent 100%)",
            clipPath: "polygon(0 0, 65% 0, 100% 100%, 0 100%)",
            opacity: 0.7,
          }}
        />

        {/* Diagonal clip — right dark corner */}
        <div
          className="absolute inset-y-0 right-0 w-28 pointer-events-none"
          style={{
            background:
              "linear-gradient(to left, #080808 0%, transparent 100%)",
            clipPath: "polygon(35% 0, 100% 0, 100% 100%, 0 100%)",
            opacity: 0.7,
          }}
        />

        {/* Hero image — the soldiers */}
        <img
          src={bgImg}
          alt="CrossFire Mercenaries"
          className="absolute inset-0 w-full h-full object-cover object-top"
          style={{ opacity: 0.95, mixBlendMode: "normal" }}
          draggable={false}
        />

        {/* Bottom fade to page background */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: "45%",
            background:
              "linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.7) 50%, transparent 100%)",
          }}
        />

        {/* Top golden line accent */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{
            background:
              "linear-gradient(to right, transparent 0%, #f5a623 30%, #f9c84a 50%, #f5a623 70%, transparent 100%)",
          }}
        />
      </div>

      {/* Content overlay — bottom aligned */}
      <div
        className="relative flex flex-col items-center justify-end h-full pb-12 md:pb-16 px-4"
        style={{ minHeight: "600px" }}
      >
        {/* Latest news badge + title — only if there's a real post */}
        {!isPlaceholder && post.title && (
          <div className="text-center mb-6 max-w-2xl">
            <span
              className="inline-block text-black text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1 mb-3"
              style={{
                background:
                  "linear-gradient(180deg, #f9c84a 0%, #e08a00 100%)",
                clipPath:
                  "polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px)",
              }}
            >
              {post.category}
            </span>
            <h2 className="text-white text-xl md:text-3xl font-black uppercase tracking-tight leading-tight drop-shadow-2xl">
              {post.title}
            </h2>
          </div>
        )}

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Golden Download button */}
          <Link href="/download">
            <button
              className="cf-download-btn group relative flex items-center gap-3 px-10 py-4 font-black uppercase tracking-[0.22em] text-[15px] text-black transition-all duration-200 hover:scale-105 active:scale-95"
              style={{ minWidth: "230px" }}
            >
              <Download className="h-5 w-5 flex-shrink-0" />
              DOWNLOAD NOW
            </button>
          </Link>

          {/* Optional "Read More" link */}
          {!isPlaceholder && post.id && (
            <Link
              href={`/posts/${(post as any).post_slug || post.id}`}
              className="flex items-center gap-1.5 text-xs uppercase tracking-widest font-bold transition-all hover:gap-2.5"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Read More <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
