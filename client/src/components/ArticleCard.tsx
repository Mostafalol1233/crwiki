import { Link } from "wouter";
import { Clock, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "./LanguageProvider";

export interface Article {
  id: string;
  post_slug?: string;
  title: string;
  summary: string;
  category: string;
  image: string;
  author: string;
  date: string;
  readingTime: number;
  views: number;
  tags: string[];
  featured?: boolean;
}

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const { t } = useLanguage();

  return (
    <Card
      className="bg-transparent border-0 shadow-none"
      data-testid={`card-article-${article.id}`}
    >
      <Link href={`/posts/${(article as any).post_slug || article.id}`}>
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover"
            width="640"
            height="360"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            draggable={false}
          />
          {article.featured && (
            <Badge
              variant="default"
              className="absolute top-4 left-4"
              data-testid="badge-featured"
            >
              {t("featured")}
            </Badge>
          )}
          <Badge
            variant="secondary"
            className="absolute top-4 right-4"
            data-testid={`badge-category-${article.category?.toLowerCase() || 'unknown'}`}
          >
            {article.category || 'Uncategorized'}
          </Badge>
        </div>

        <CardContent className="px-0 pt-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            {article.tags?.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs"
                data-testid={`badge-tag-${tag.toLowerCase()}`}
              >
                {tag}
              </Badge>
            ))}
          </div>

          <h3 className="text-xl font-semibold line-clamp-2 leading-snug">
            {article.title}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {article.summary}
          </p>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground break-words whitespace-normal">
            <span className="font-medium truncate">{article.author}</span>
            <span>•</span>
            <span className="truncate date-text">{article.date}</span>
            <span>•</span>
            <div className="flex items-center gap-1 truncate">
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {article.readingTime} {t("readingTime")}
              </span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1 truncate">
              <Eye className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{(article.views || 0).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
