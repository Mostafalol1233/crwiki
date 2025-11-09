import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/LanguageProvider";
import { Link } from "wouter";
import { useMemo } from "react";

interface NewsItem {
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
  type?: 'news' | 'post';
}

export default function News() {
  const { t } = useLanguage();

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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-12">
          {t("news")} {t("newsAndUpdates")}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {allNews.map((item, index) => (
            <div
              key={item.id}
              className={`${
                index === 0 ? "md:col-span-2 md:row-span-2" : ""
              }`}
            >
              <Link href={item.type === 'post' ? `/article/${item.id}` : `/news/${item.id}`}>
                <Card
                  className={`relative overflow-hidden group hover-elevate active-elevate-2 transition-all duration-300 cursor-pointer ${
                    index === 0 ? "h-full min-h-[400px]" : "h-[300px]"
                  }`}
                  data-testid={`card-news-${item.id}`}
                >
                  <div className="relative w-full h-full">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                    
                    <div className="absolute top-4 left-4">
                      <Badge 
                        variant="secondary" 
                        className="backdrop-blur-sm bg-background/80"
                        data-testid={`badge-category-${item.category.toLowerCase()}`}
                      >
                        {item.category}
                      </Badge>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3
                        className={`font-bold mb-2 ${
                          index === 0
                            ? "text-3xl md:text-4xl"
                            : "text-xl md:text-2xl"
                        }`}
                      >
                        {item.title}
                      </h3>
                      <p className="text-sm text-white/80">{item.dateRange}</p>
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
  );
}
