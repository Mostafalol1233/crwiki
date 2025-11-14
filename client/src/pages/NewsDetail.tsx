import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
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
  author: string;
  featured?: boolean;
  titleAr?: string;
  contentAr?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
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
  const { t } = useLanguage();

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

  return (
    <>
      <SEOHead
        title={newsItem.seoTitle || `${newsItem.title} | Crossfire Wiki`}
        description={newsItem.seoDescription || newsItem.content?.substring(0, 155) || ""}
        keywords={newsItem.seoKeywords || [newsItem.category]}
        canonicalUrl={newsItem.canonicalUrl || newsUrl}
        ogImage={newsItem.ogImage || newsItem.image}
        twitterImage={newsItem.twitterImage || newsItem.ogImage || newsItem.image}
        ogTitle={newsItem.seoTitle || newsItem.title}
        ogDescription={newsItem.seoDescription || newsItem.content?.substring(0, 155) || ""}
        ogType="article"
        ogUrl={newsUrl}
        schemaType={newsItem.schemaType || "NewsArticle"}
        schemaData={{
          headline: newsItem.title,
          description: newsItem.content?.substring(0, 200) || "",
          image: newsItem.image,
          author: {
            "@type": "Person",
            name: newsItem.author,
          },
          datePublished: newsItem.createdAt ? new Date(newsItem.createdAt).toISOString() : new Date().toISOString(),
          dateModified: newsItem.updatedAt ? new Date(newsItem.updatedAt).toISOString() : new Date().toISOString(),
        }}
      />
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-20">
          <Breadcrumbs items={breadcrumbs} />
          <Link href="/news">
            <Button
              variant="ghost"
              className="mb-6"
              data-testid="button-back-to-news"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("backToNews")}
            </Button>
          </Link>

        <div className="mb-8">
          <Badge className="mb-4" data-testid={`badge-category-${newsItem.category.toLowerCase()}`}>
            {newsItem.category}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-news-title">
            {newsItem.title}
          </h1>
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <span data-testid="text-news-author">By {newsItem.author}</span>
            <span>•</span>
            <span data-testid="text-news-date">{newsItem.dateRange}</span>
          </div>
        </div>

        <div className="relative w-full h-[600px] md:h-[750px] lg:h-[900px] rounded-xl overflow-hidden mb-8">
          <img
            src={newsItem.image}
            alt={newsItem.title}
            className="absolute inset-0 w-full h-full object-cover"
            data-testid="img-news-hero"
          />
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-8">
          <p className="text-sm text-muted-foreground">
            <strong>{t("translationNote")}</strong> {t("translationNoteText")}
          </p>
        </div>

        <div
          className="prose prose-lg dark:prose-invert max-w-none"
          data-testid="text-news-content"
        >
          {(() => {
            const lines = newsItem.content.split("\n");
            const elements: JSX.Element[] = [];
            let listItems: string[] = [];
            let listStartIndex = 0;

            const flushList = (currentIndex: number) => {
              if (listItems.length > 0) {
                elements.push(
                  <ul key={`list-${listStartIndex}`} className="mb-4 ml-6 list-disc space-y-2">
                    {listItems.map((item, idx) => (
                      <li key={`${listStartIndex}-${idx}`}>{item}</li>
                    ))}
                  </ul>
                );
                listItems = [];
              }
            };

            lines.forEach((paragraph, index) => {
              if (paragraph.trim() === "") {
                flushList(index);
                return;
              }

              if (paragraph.startsWith("### ")) {
                flushList(index);
                elements.push(
                  <h3 key={index} className="text-2xl font-bold mt-8 mb-4">
                    {paragraph.replace("### ", "")}
                  </h3>
                );
                return;
              }

              if (paragraph.startsWith("## ")) {
                flushList(index);
                elements.push(
                  <h2 key={index} className="text-3xl font-bold mt-10 mb-6">
                    {paragraph.replace("## ", "")}
                  </h2>
                );
                return;
              }

              if (paragraph.startsWith("# ")) {
                flushList(index);
                elements.push(
                  <h1 key={index} className="text-4xl font-bold mt-12 mb-6">
                    {paragraph.replace("# ", "")}
                  </h1>
                );
                return;
              }

              if (paragraph.startsWith("- ")) {
                if (listItems.length === 0) {
                  listStartIndex = index;
                }
                listItems.push(paragraph.replace("- ", ""));
                return;
              }

              flushList(index);
              elements.push(
                <p key={index} className="mb-4 leading-relaxed">
                  {paragraph}
                </p>
              );
            });

            flushList(lines.length);
            return elements;
          })()}
        </div>

        <div className="mt-12 pt-8 border-t">
          <Link href="/news">
            <Button size="lg" data-testid="button-more-news">
              {t("readMoreNews")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
