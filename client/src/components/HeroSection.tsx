import { Link } from "wouter";
import { Clock, Eye } from "lucide-react";
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
}

export function HeroSection({ post }: HeroSectionProps) {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[70vh] md:min-h-[80vh] w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-black/20"
        style={{ backgroundImage: `url(${bgImage}), url(${fallbackImage})` }}
        onError={(e: any) => {
          e.target.style.backgroundImage = `url(${fallbackImage})`;
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
      
      <div className="relative max-w-7xl mx-auto px-4 md:px-8 h-full min-h-[70vh] md:min-h-[80vh] flex items-end pb-12 md:pb-20">
        <div className="max-w-3xl">
          <Badge
            variant="default"
            className="mb-4"
            data-testid={`badge-category-${post.category.toLowerCase()}`}
          >
            {post.category}
          </Badge>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight">
            {post.title}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-6 leading-relaxed">
            {post.summary}
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-muted-foreground">
            <span className="font-medium">{post.author}</span>
            <span>•</span>
            <span>{post.date}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {post.readingTime} {t("readingTime")}
              </span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{post.views.toLocaleString()} {t("views")}</span>
            </div>
          </div>

          <Button
            asChild
            size="lg"
            variant="default"
            className="backdrop-blur-md bg-primary hover:bg-primary/90 border-2 border-primary-foreground/20 text-primary-foreground font-bold shadow-lg"
            data-testid="button-read-featured"
          >
            <Link href={`/article/${post.id}`}>{t("readMore")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
