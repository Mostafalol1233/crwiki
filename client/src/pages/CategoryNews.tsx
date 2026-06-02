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

  const { data: newsData, isLoading } = useQuery<{ items: NewsItem[], total: number }>({
    queryKey: ["/api/news"],
  });
  const news = newsData?.items || [];

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
      <div className="min-h-screen" style={{ background: "var(--background)" }}>

        {/* Hero */}
        <div className="relative overflow-hidden py-12 md:py-16 text-center" style={{ background: "linear-gradient(to bottom, #0d0d0d 0%, var(--background) 100%)", borderBottom: "1px solid rgba(245,166,35,0.1)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(245,166,35,0.04) 0%, transparent 70%)" }} />
          <div className="relative max-w-3xl mx-auto px-6">
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5" style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: "2px" }}>
              <Globe className="h-3 w-3" style={{ color: "#f5a623" }} />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: "#f5a623" }}>CrossFire</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-2" style={{ color: "var(--foreground)" }}>
              {t("newsCategory") || "News"}
            </h1>
            <div className="flex items-center justify-center gap-3">
              <p className="text-sm" style={{ color: "#666" }}>Latest CrossFire news and announcements</p>
              <button
                onClick={toggleLanguage}
                className="inline-flex items-center gap-1.5 px-2 py-1 text-[9px] font-black uppercase tracking-wider transition-all hover:brightness-110"
                style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", color: "#f5a623", borderRadius: "2px" }}
                data-testid="button-language-toggle-categorynews"
              >
                <Globe className="h-3 w-3" />
                {language === "en" ? "العربية" : "English"}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {news.map((item) => (
            <Link
              key={item.id}
              href={`/news/${(item as any).news_slug || item.id}`}
              data-testid={`link-news-${item.id}`}
            >
              <a className="block group transition-all hover:brightness-105" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img
                    src={item.image}
                    alt={language === "ar" && item.titleAr ? item.titleAr : item.title}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                    width="400"
                    height="225"
                    loading="lazy"
                    style={{ background: "#111" }}
                  />
                  {item.featured && (
                    <span className="absolute top-3 left-3 text-[9px] font-black uppercase tracking-wider px-2 py-0.5" style={{ background: "#f5a623", color: "#000", borderRadius: "2px" }} data-testid={`badge-featured-${item.id}`}>
                      {t("featured")}
                    </span>
                  )}
                  <span className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider px-2 py-0.5" style={{ background: "rgba(0,0,0,0.7)", color: "#aaa", borderRadius: "2px" }} data-testid={`badge-category-${item.category.toLowerCase()}`}>
                    {item.category}
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-sm line-clamp-2 leading-snug mb-2" style={{ color: "var(--foreground)" }}>
                    {language === "ar" && item.titleAr ? item.titleAr : item.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-[10px] mb-2" style={{ color: "#555" }}>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{item.dateRange}</span>
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{item.author}</span>
                  </div>

                  <p className="text-xs line-clamp-3 leading-relaxed" style={{ color: "#666" }}>
                    {language === "ar" && item.contentAr
                      ? item.contentAr.substring(0, 150) + "..."
                      : item.content.substring(0, 150) + "..."}
                  </p>
                </div>
              </a>
            </Link>
          ))}
        </div>

        {news.length === 0 && (
          <div className="py-16 text-center" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "4px" }}>
            <p className="text-sm font-black uppercase tracking-wider" style={{ color: "#444" }}>No news available yet.</p>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
