import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

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
        <div className="absolute inset-0 bg-[#080808]" />
        <div className="absolute inset-y-0 left-0" style={{ width: "50%", background: "linear-gradient(135deg, #0b1c38 0%, #162e50 35%, #0a0a0a 100%)" }} />
        <div className="absolute inset-y-0 right-0" style={{ width: "50%", background: "linear-gradient(225deg, #3a1500 0%, #5c2500 35%, #0a0a0a 100%)" }} />
        <div className="absolute inset-y-0 left-0 w-28 pointer-events-none" style={{ background: "linear-gradient(to right, #080808 0%, transparent 100%)", clipPath: "polygon(0 0, 65% 0, 100% 100%, 0 100%)", opacity: 0.7 }} />
        <div className="absolute inset-y-0 right-0 w-28 pointer-events-none" style={{ background: "linear-gradient(to left, #080808 0%, transparent 100%)", clipPath: "polygon(35% 0, 100% 0, 100% 100%, 0 100%)", opacity: 0.7 }} />
        <img src={bgImg} alt="CrossFire Mercenaries" className="absolute inset-0 w-full h-full object-cover object-top" style={{ opacity: 0.95 }} draggable={false} />
        <div className="absolute bottom-0 left-0 right-0" style={{ height: "50%", background: "linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.8) 40%, transparent 100%)" }} />
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(to right, transparent 0%, #f5a623 30%, #f9c84a 50%, #f5a623 70%, transparent 100%)" }} />
      </div>

      {/* Content overlay — bottom aligned */}
      <div className="relative flex flex-col items-center justify-end h-full pb-10 px-4" style={{ minHeight: "600px" }}>
        {/* Latest news badge + title — only if there's a real post */}
        {!isPlaceholder && post.title && (
          <div className="text-center mb-5 max-w-2xl">
            <span
              className="inline-block text-black text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1 mb-3"
              style={{ background: "linear-gradient(180deg, #f9c84a 0%, #e08a00 100%)", clipPath: "polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px)" }}
            >
              {post.category}
            </span>
            <h2 className="text-white text-xl md:text-3xl font-black uppercase tracking-tight leading-tight drop-shadow-2xl">
              {post.title}
            </h2>
          </div>
        )}

        {/* ── Ornate CF Download Button ── */}
        <div className="cf-download-platform flex flex-col items-center" style={{ position: "relative" }}>
          <Link href="/download">
            <button
              className="group relative overflow-hidden font-black uppercase tracking-[0.3em] text-[17px] transition-all duration-200 hover:brightness-110 active:scale-95"
              style={{
                minWidth: "300px",
                padding: "14px 48px",
                background: "linear-gradient(180deg, #f9c84a 0%, #e89b10 40%, #c67800 100%)",
                color: "#1a0a00",
                border: "none",
                boxShadow: "0 0 30px rgba(245,166,35,0.35), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -2px 0 rgba(0,0,0,0.3)",
                position: "relative",
                zIndex: 2,
                letterSpacing: "0.25em",
              }}
            >
              <span style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>DOWNLOAD</span>
              {/* Shine sweep on hover */}
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)" }}
              />
            </button>
          </Link>

          {/* Platform/bracket below the button */}
          <div
            className="relative flex items-stretch"
            style={{ marginTop: "-1px", width: "380px", height: "36px", zIndex: 1 }}
          >
            {/* Left wing */}
            <div
              style={{
                flex: "0 0 80px",
                background: "linear-gradient(180deg, #3a3020 0%, #1e1812 100%)",
                clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)",
                borderLeft: "1px solid #5a4a20",
                borderBottom: "1px solid #5a4a20",
              }}
            />
            {/* Center shelf */}
            <div
              style={{
                flex: 1,
                background: "linear-gradient(180deg, #2a2218 0%, #1a1410 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderBottom: "2px solid #8a6a20",
                boxShadow: "inset 0 1px 0 rgba(245,180,35,0.15)",
              }}
            >
              {/* Decorative rivets/dots */}
              <div style={{ display: "flex", gap: "8px", opacity: 0.5 }}>
                {[0,1,2,3,4].map(i => (
                  <div key={i} style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#8a6a20" }} />
                ))}
              </div>
            </div>
            {/* Right wing */}
            <div
              style={{
                flex: "0 0 80px",
                background: "linear-gradient(180deg, #3a3020 0%, #1e1812 100%)",
                clipPath: "polygon(0 0, 100% 0, 100% 100%, 20% 100%)",
                borderRight: "1px solid #5a4a20",
                borderBottom: "1px solid #5a4a20",
              }}
            />
          </div>

          {/* Dark base strip */}
          <div
            style={{
              width: "240px",
              height: "8px",
              background: "linear-gradient(180deg, #151210 0%, #080605 100%)",
              borderLeft: "1px solid #3a2a10",
              borderRight: "1px solid #3a2a10",
              borderBottom: "1px solid #2a2010",
            }}
          />
        </div>

        {/* Optional "Read More" link */}
        {!isPlaceholder && post.id && (
          <Link
            href={`/posts/${(post as any).post_slug || post.id}`}
            className="mt-4 flex items-center gap-1.5 text-xs uppercase tracking-widest font-bold transition-all hover:gap-2.5"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Read More <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </section>
  );
}
