import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/LanguageProvider";
import { Globe } from "lucide-react";
import { Link } from "wouter";
import { useMemo } from "react";
import PageSEO from "@/components/PageSEO";

type NewsItemBase = {
  id: string;
  title: string;
  dateRange?: string;
  date?: string;
  image: string;
  category: string;
  content: string;
  summary?: string;
  author: string;
  featured?: boolean;
};

type NewsItemNews = NewsItemBase & {
  type: 'news';
  titleAr?: string;
  contentAr?: string;
};

type NewsItemPost = NewsItemBase & {
  type: 'post';
};

type NewsItem = NewsItemNews | NewsItemPost;

export default function News() {
  const { t, language, toggleLanguage } = useLanguage();

  const { data: newsItems = [], isLoading: newsLoading } = useQuery<NewsItem[]>({
    queryKey: ["/api/news"],
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery<any[]>({
    queryKey: ["/api/posts"],
  });

  const allNews = useMemo(() => {
    const newsWithType = newsItems.map(item => ({ ...item, type: 'news' as const }));
    const postsWithType = posts.map(post => ({
      id: post.id,
      title: post.title,
      dateRange: post.date || 'Recent',
      image: post.image,
      category: post.category,
      content: post.content,
      summary: post.summary,
      author: post.author,
      featured: post.featured,
      type: 'post' as const
    }));
    
    return [...newsWithType, ...postsWithType].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
  }, [newsItems, posts]);

  if (newsLoading || postsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-muted-foreground">{t("loading")}</div>
      </div>
    );
  }

  return (
    <>
      <PageSEO
        title={"News & Updates — CrossFire Wiki"}
        description={"Latest CrossFire news, posts, and updates from the community and official sources."}
        canonicalPath="/news"
      />
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl md:text-5xl font-bold">
            {t("newsAndUpdates")}
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLanguage}
            title={language === "en" ? "العربية" : "English"}
            aria-label={language === "en" ? "Switch to Arabic" : "Switch to English"}
            className="rounded-none"
            data-testid="button-language-toggle-news"
          >
            <Globe className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {allNews.map((item, index) => (
            <div key={item.id}>
              <Link href={item.type === 'post' ? `/article/${item.id}` : `/news/${item.id}`}>
                <Card
                  className="relative overflow-hidden cursor-pointer bg-transparent border-0 shadow-none"
                  data-testid={`card-news-${item.id}`}
                >
                  <div className={`relative ${index === 0 ? "aspect-[16/9]" : "aspect-[16/9]"} overflow-hidden rounded-lg bg-muted/30`}>
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      width="400"
                      height="300"
                      loading="lazy"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge
                        className="backdrop-blur-sm bg-primary/90 text-primary-foreground border-primary/30"
                        data-testid={`badge-category-${item.category.toLowerCase()}`}
                      >
                        {item.category}
                      </Badge>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-6 text-white bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                      <h3
                        className={`font-bold mb-2 ${
                          index === 0 ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl"
                        }`}
                      >
                        {language === "ar" && "titleAr" in item && item.titleAr ? item.titleAr : item.title}
                      </h3>
                      <p className="text-base md:text-lg text-white/85">{item.dateRange}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            variant="outline"
            className="backdrop-blur-sm"
            data-testid="button-read-more-news"
          >
            {t("readMoreNews").toUpperCase()}
          </Button>
        </div>
      </div>
    </div>
    </>
  );
}
