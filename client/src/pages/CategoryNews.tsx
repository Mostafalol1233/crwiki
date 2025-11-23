import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Globe } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/components/LanguageProvider";
import PageSEO from "@/components/PageSEO";

interface NewsItem {
  id: string;
  title: string;
  titleAr?: string;
  dateRange: string;
  image: string;
  category: string;
  content: string;
  contentAr?: string;
  htmlContent?: string;
  author: string;
  featured?: boolean;
  createdAt?: Date;
}

export default function CategoryNews() {
  const { t, language, toggleLanguage } = useLanguage();

  const { data: news = [], isLoading } = useQuery<NewsItem[]>({
    queryKey: ["/api/news"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <p className="text-center text-muted-foreground">Loading news...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageSEO
        title={"News Category — CrossFire Wiki"}
        description={"Latest CrossFire news and announcements."}
        canonicalPath="/category/news"
      />
      <div className="min-h-screen bg-background py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              {t("newsCategory") || "News"}
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              title={language === "en" ? "العربية" : "English"}
              aria-label={language === "en" ? "Switch to Arabic" : "Switch to English"}
              className="rounded-none"
              data-testid="button-language-toggle-categorynews"
            >
              <Globe className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-lg text-muted-foreground">
            Latest news and announcements from the CrossFire community
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item) => (
            <Link
              key={item.id}
              href={`/news/${item.id}`}
              data-testid={`link-news-${item.id}`}
            >
              <Card className="h-full hover-elevate active-elevate-2 transition-all duration-300 hover:scale-[1.02]">
                <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg bg-muted/30">
                  <img
                    src={item.image}
                    alt={language === "ar" && item.titleAr ? item.titleAr : item.title}
                    className="w-full h-full object-contain"
                    width="400"
                    height="225"
                    loading="lazy"
                  />
                  {item.featured && (
                    <Badge
                      variant="default"
                      className="absolute top-4 left-4"
                      data-testid={`badge-featured-${item.id}`}
                    >
                      {t("featured")}
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className="absolute top-4 right-4"
                    data-testid={`badge-category-${item.category.toLowerCase()}`}
                  >
                    {item.category}
                  </Badge>
                </div>

                <CardContent className="p-6 space-y-4">
                  <h3 className="text-xl font-semibold line-clamp-2 leading-snug">
                    {language === "ar" && item.titleAr ? item.titleAr : item.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{item.dateRange}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{item.author}</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {language === "ar" && item.contentAr
                      ? item.contentAr.substring(0, 150) + "..."
                      : item.content.substring(0, 150) + "..."}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {news.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No news available yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </>
  );
}
