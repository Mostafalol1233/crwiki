import { Link } from "wouter";
import { /*Clock, Eye*/ } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "./LanguageProvider";
// Define background URL directly to avoid import issues
const bgImage = "https://files.catbox.moe/16kyiz.jpg";
const fallbackImage = "/attached_assets/feature-crossfire.jpg";

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
}

export function HeroSection({ post, isPlaceholder }: HeroSectionProps) {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[60vh] md:min-h-[70vh] w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage}), url(${fallbackImage})` }}
        onError={(e: any) => {
          e.target.style.backgroundImage = `url(${fallbackImage})`;
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/70" />
      {/* subtle noise & scanlines for game-like atmosphere */}
      <div className="absolute inset-0 opacity-[0.12] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,.08), transparent 60%)' }} />
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(180deg, rgba(255,255,255,.06) 0px, rgba(255,255,255,.06) 1px, transparent 2px, transparent 4px)' }} />

      <div className="relative max-w-7xl mx-auto px-4 md:px-8 h-full min-h-[60vh] md:min-h-[70vh] flex items-end pb-10 md:pb-16">
        <div className="max-w-3xl border-2 border-primary/30 bg-gradient-to-br from-card/30 to-card/10 backdrop-blur-md rounded-xl md:rounded-2xl p-5 md:p-7 shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
          <Badge
            variant="default"
            className="mb-4"
            data-testid={`badge-category-${post.category.toLowerCase()}`}
          >
            {post.category}
          </Badge>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-wide uppercase mb-4 leading-tight bg-gradient-to-r from-foreground via-white to-foreground bg-clip-text text-transparent drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]">
            {post.title}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-6 leading-relaxed">
            {post.summary}
          </p>

          <div className="flex items-center gap-3 mb-6 text-sm text-muted-foreground">
            <span className="font-medium">{post.author}</span>
            <span>•</span>
            <span>{post.date}</span>
          </div>

          {isPlaceholder ? (
            <Button
              asChild
              size="lg"
              variant="default"
              className="bg-destructive hover:bg-destructive/90 text-white font-extrabold tracking-wider uppercase px-8 py-6 shadow-xl border-2 border-destructive/50 rounded-lg md:rounded-xl"
              data-testid="button-play-free"
            >
              <Link href="/download">Download Now</Link>
            </Button>
          ) : (
            post.id && (
              <Button
                asChild
                size="lg"
                variant="default"
                className="backdrop-blur-md bg-primary hover:bg-primary/90 border-2 border-primary-foreground/30 text-primary-foreground font-extrabold tracking-wider uppercase rounded-lg md:rounded-xl shadow-lg"
                data-testid="button-read-featured"
              >
                <Link href={`/article/${post.id}`}>{t("readMore")}: {post.title}</Link>
              </Button>
            )
          )}
        </div>
      </div>
    </section>
  );
}
