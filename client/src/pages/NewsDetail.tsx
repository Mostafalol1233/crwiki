import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useParams, Link } from "wouter";
import createDOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Target, Globe, Languages } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/Breadcrumbs";

interface NewsItem {
  id: string;
  title: string;
  dateRange: string;
  image: string;
  category: string;
  content: string;
  htmlContent?: string;
  author: string;
  featured?: boolean;
  titleAr?: string;
  contentAr?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  twitterImage?: string;
  schemaType?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export default function NewsDetail() {
  const params = useParams();
  const newsId = params.id;
  const { t, language, toggleLanguage } = useLanguage();
  const [showTranslation, setShowTranslation] = useState(false);

  const { data: newsItems = [], isLoading } = useQuery<NewsItem[]>({
    queryKey: ["/api/news"],
  });

  const newsItem = newsItems.find((item) => item.id === newsId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-muted-foreground">{t("loading")}</div>
      </div>
    );
  }

  if (!newsItem) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">{t("newsNotFound")}</h1>
        <Link href="/news">
          <Button variant="outline" data-testid="button-back-to-news">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToNews")}
          </Button>
        </Link>
      </div>
    );
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const newsUrl = `${baseUrl}/news/${newsId}`;
  const breadcrumbs = [
    { name: "News", url: "/news" },
    { name: newsItem.title, url: newsUrl },
  ];

  const hasTranslation = !!(newsItem.titleAr || newsItem.contentAr);

  const selectedTitle = showTranslation && newsItem.titleAr ? newsItem.titleAr : newsItem.title;
  const selectedContentRaw = showTranslation && newsItem.contentAr ? newsItem.contentAr : (newsItem.htmlContent && newsItem.htmlContent.trim().length > 0 ? newsItem.htmlContent : newsItem.content);

  return (
    <>
      <SEOHead
        title={newsItem.seoTitle || `${selectedTitle} | Crossfire Wiki`}
        description={newsItem.seoDescription || selectedContentRaw?.replace(/<[^>]*>/g, '').substring(0, 155) || ""}
        keywords={newsItem.seoKeywords || [newsItem.category]}
        canonicalUrl={newsItem.canonicalUrl || newsUrl}
        ogImage={newsItem.ogImage || newsItem.image}
        twitterImage={newsItem.twitterImage || newsItem.ogImage || newsItem.image}
        ogTitle={newsItem.seoTitle || selectedTitle}
        ogDescription={newsItem.seoDescription || selectedContentRaw?.replace(/<[^>]*>/g, '').substring(0, 155) || ""}
        ogType="article"
        ogUrl={newsUrl}
        schemaType={newsItem.schemaType || "NewsArticle"}
        schemaData={{
          headline: selectedTitle,
          description: selectedContentRaw?.replace(/<[^>]*>/g, '').substring(0, 200) || "",
          image: newsItem.image,
          author: {
            "@type": "Person",
            name: newsItem.author,
          },
          datePublished: newsItem.createdAt ? new Date(newsItem.createdAt).toISOString() : new Date().toISOString(),
          dateModified: newsItem.updatedAt ? new Date(newsItem.updatedAt).toISOString() : new Date().toISOString(),
        }}
      />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
          <Breadcrumbs items={breadcrumbs} />
          <div className="flex items-center justify-between mb-6">
            <Link href="/news">
              <Button
                variant="ghost"
                data-testid="button-back-to-news"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("backToNews")}
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              title={language === "en" ? "العربية" : "English"}
              aria-label={language === "en" ? "Switch to Arabic" : "Switch to English"}
              className="rounded-none"
              data-testid="button-language-toggle-newsdetail"
            >
              <Globe className="h-5 w-5" />
            </Button>
            {hasTranslation && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTranslation(!showTranslation)}
                className="ml-2"
                data-testid="button-toggle-translation-news"
              >
                <Languages className="mr-2 h-4 w-4" />
                {showTranslation ? t("showOriginal") : t("showTranslation")}
              </Button>
            )}
          </div>

        <section className="mb-10">
          <div className="mb-3">
            <Badge className="bg-red-600 text-white rounded-full px-3 py-1" data-testid={`badge-category-${newsItem.category.toLowerCase()}`}>
              {newsItem.category}
            </Badge>
          </div>
          <h1 className="text-5xl md:text-6xl font-black leading-tight mb-4" data-testid="text-news-title">
            {selectedTitle}
          </h1>
          {newsItem.contentAr && (
            <p className="text-lg md:text-xl text-gray-700 mb-4 flex items-start gap-2">
              <Target className="h-5 w-5 text-red-600 mt-1" />
              <span dir="rtl">{newsItem.contentAr.replace(/<[^>]*>?/gm, "").slice(0, 180)}...</span>
            </p>
          )}
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span data-testid="text-news-author">{newsItem.author}</span>
            <span>•</span>
            <span data-testid="text-news-date">{newsItem.dateRange}</span>
          </div>
        </section>

        <div className="w-full overflow-hidden mb-10">
          <img
            src={newsItem.image}
            alt={newsItem.title}
            className="w-full h-auto object-cover"
            data-testid="img-news-hero"
          />
        </div>

        

        {(() => {
          const html = selectedContentRaw || "";
          const purified = (createDOMPurify as any)(window as any).sanitize(html);
          return (
            <article
              className="prose prose-lg dark:prose-invert max-w-none"
              dir={showTranslation ? "rtl" : undefined}
              dangerouslySetInnerHTML={{ __html: purified }}
              data-testid="text-news-content"
            />
          );
        })()}

        <div className="mt-12">
          <Link href="/news">
            <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white" data-testid="button-more-news">
              {showTranslation && newsItem.titleAr ? `إقرأ المزيد: ${newsItem.titleAr}` : `إقرأ المزيد: ${newsItem.title}`}
            </Button>
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
