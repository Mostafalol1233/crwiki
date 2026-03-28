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
            {post.summary && (
              <p className="mt-3 text-sm md:text-base text-white/75 leading-relaxed max-w-xl mx-auto drop-shadow-md">
                {post.summary}
              </p>
            )}
          </div>
        )}

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
