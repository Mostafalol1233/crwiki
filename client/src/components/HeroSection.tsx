import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Flame } from "lucide-react";
import fallbackImage from "@assets/feature-crossfire.jpg";

const bgImage = "https://files.catbox.moe/16kyiz.jpg";

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
  const heroBg = bgImageUrl || bgImage;

  return (
    <section className="relative w-full overflow-hidden" style={{ minHeight: "78vh" }}>
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: `url(${heroBg}), url(${fallbackImage})` }}
      />

      {/* Layered gradients for drama */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

      {/* Accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-primary/60 to-transparent" />

      {/* Content — left-aligned, bottom-anchored */}
      <div className="relative h-full flex items-end" style={{ minHeight: "78vh" }}>
        <div className="w-full max-w-[1400px] mx-auto px-6 md:px-10 pb-12 md:pb-16">
          <div className="max-w-2xl">
            {/* Category pill */}
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-sm">
                <Flame className="h-3 w-3" />
                {post.category}
              </span>
              <span className="text-white/40 text-xs font-bold uppercase tracking-widest">{post.date}</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-5 text-white drop-shadow-2xl">
              {post.title}
            </h1>

            {/* Summary */}
            <p className="text-white/65 text-base md:text-lg leading-relaxed mb-8 max-w-xl font-medium">
              {post.summary}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              {isPlaceholder ? (
                <Button
                  asChild
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest px-7 rounded-sm h-12 shadow-xl shadow-primary/30"
                >
                  <Link href="/download">
                    Download Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                post.id && (
                  <Button
                    asChild
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest px-7 rounded-sm h-12 shadow-xl shadow-primary/30"
                  >
                    <Link href={`/posts/${(post as any).post_slug || post.id}`}>
                      Read More <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )
              )}
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/10 font-bold uppercase tracking-widest px-6 rounded-sm h-12 border border-white/15"
              >
                <Link href="/category/events">Latest Events</Link>
              </Button>
            </div>

            {/* Author strip */}
            <div className="flex items-center gap-2 mt-6">
              <div className="w-6 h-6 rounded-full bg-primary/30 border border-primary/50 flex items-center justify-center text-[9px] font-black text-primary uppercase">
                {post.author?.[0] || "B"}
              </div>
              <span className="text-white/40 text-xs font-bold">{post.author}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade into page */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
