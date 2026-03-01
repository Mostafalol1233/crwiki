import { useQuery } from "@tanstack/react-query";
import { useRef, useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import createDOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Target, Globe, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useZoomableImages, ImageViewerOverlay } from "@/components/ImageViewer";
import { useToast } from "@/hooks/use-toast";

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

interface NewsItemWithSlug extends NewsItem {
  news_slug?: string;
}

export default function NewsDetail() {
  const params = useParams();
  const slug = (params as any)?.slug as string | undefined;
  const legacyId = (params as any)?.legacyId as string | undefined;
  const [, setLocation] = useLocation();
  const { t, language, toggleLanguage } = useLanguage();
  const [isRTL, setIsRTL] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [viewer, setViewer] = useState<{ open: boolean; src: string; alt?: string }>({ open: false, src: "" });
  useZoomableImages(contentRef, (src, alt) => setViewer({ open: true, src, alt }));
  const [imgLoaded, setImgLoaded] = useState(false);
  const { toast } = useToast();

  const { data: newsItem, isLoading, error } = useQuery<NewsItemWithSlug>({
    queryKey: ["news", slug || legacyId],
    enabled: !!(slug || legacyId),
    queryFn: async () => {
      if (slug) {
        const res = await fetch(`/api/news/slug/${slug}`);
        if (!res.ok) {
          const resp = await fetch("/api/news").then(r => r.json());
          const allNews = Array.isArray(resp) ? resp : (resp?.items || []);
          const found = allNews.find((n: any) => n.news_slug === slug || n.id === slug);
          if (found) return found;
          throw new Error("News not found");
        }
        return res.json();
      }
      if (!legacyId) throw new Error("No news ID or slug provided");
      const res = await fetch(`/api/news/${legacyId}`);
      if (!res.ok) {
        const resp = await fetch("/api/news").then(r => r.json());
        const allNews = Array.isArray(resp) ? resp : (resp?.items || []);
        const found = allNews.find((n: any) => n.id === legacyId);
        if (found) return found;
        throw new Error("News not found");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    setIsRTL(language === 'ar');
  }, [language]);

  const { data: fallbackPost } = useQuery<any>({
    queryKey: ["/api/posts/" + (slug || legacyId)],
    enabled: !newsItem && !!(slug || legacyId),
    queryFn: async () => {
      const identifier = slug || legacyId;
      const res = await fetch(`/api/posts/${identifier}`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  useEffect(() => {
    if (fallbackPost && (fallbackPost.id || fallbackPost.post_slug)) {
      const target = `/posts/${fallbackPost.post_slug || fallbackPost.id}`;
      setLocation(target);
    }
  }, [fallbackPost, setLocation]);

  useEffect(() => {
    if (legacyId && newsItem?.news_slug) {
      const slugUrl = `/news/${newsItem.news_slug}`;
      if (typeof window !== "undefined" && window.location.pathname !== slugUrl) {
        setLocation(slugUrl);
      }
    }
  }, [legacyId, newsItem?.news_slug, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-muted-foreground">{t("loading")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-destructive">Error loading</div>
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
  const newsSlug = newsItem.news_slug || slug || legacyId;
  const newsUrl = `${baseUrl}/news/${newsSlug}`;
  const breadcrumbs = [
    { name: "News", url: "/news" },
    { name: newsItem.title, url: newsUrl },
  ];

  const selectedTitle = language === 'ar' && newsItem.titleAr ? newsItem.titleAr : newsItem.title;
  const selectedContentRaw = (() => {
    if (language === 'ar' && newsItem.contentAr) return newsItem.contentAr;
    const html = newsItem.htmlContent && newsItem.htmlContent.trim().length > 0 ? newsItem.htmlContent : newsItem.content;
    return html;
  })();

  const firstImageMatch = /<img[^>]+src=["']([^"']+)["']/i.exec(selectedContentRaw || "");
  const descriptionImage = firstImageMatch ? firstImageMatch[1] : undefined;
  const seoImage = newsItem.ogImage || newsItem.image || descriptionImage;

  const monthYearText = (() => {
    const d = newsItem.createdAt ? new Date(newsItem.createdAt as any) : new Date();
    try {
      return new Intl.DateTimeFormat(language === 'ar' ? 'ar' : 'en-US', { month: 'long', year: 'numeric' }).format(d);
    } catch {
      return d.toLocaleString(language === 'ar' ? 'ar' : undefined, { month: 'long', year: 'numeric' });
    }
  })();

  return (
    <>
      <SEOHead
        title={newsItem.seoTitle || `${selectedTitle} | Crossfire Wiki`}
        description={newsItem.seoDescription || selectedContentRaw?.replace(/<[^>]*>/g, '').substring(0, 155) || ""}
        keywords={newsItem.seoKeywords || [newsItem.category]}
        canonicalUrl={newsItem.canonicalUrl || newsUrl}
        ogImage={seoImage}
        twitterImage={newsItem.twitterImage || seoImage}
        ogTitle={newsItem.seoTitle || selectedTitle}
        ogDescription={newsItem.seoDescription || selectedContentRaw?.replace(/<[^>]*>/g, '').substring(0, 155) || ""}
        ogType="article"
        ogUrl={newsUrl}
        ogImageWidth={1200}
        ogImageHeight={630}
        noindex={false}
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
      {newsItem.image && (
        <SEOHead
          onlySchema
          schemaType="ImageObject"
          schemaData={{
            contentUrl: newsItem.image,
            name: selectedTitle,
            description: (selectedContentRaw || '').replace(/<[^>]*>/g, '').substring(0, 200) || selectedTitle,
            width: 1200,
            height: 800,
          }}
        />
      )}
      <div className="min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 md:py-12">
          {!(newsItem as any).fullLayout && <Breadcrumbs items={breadcrumbs} />}
          <div className="mb-8 mt-4 flex items-center gap-3 no-print">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/news")}
              className="rounded-none font-bold uppercase tracking-tight"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("back")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              className="rounded-none font-bold uppercase tracking-tight"
            >
              <Globe className="mr-2 h-4 w-4" />
              {language === 'ar' ? 'English' : 'العربية'}
            </Button>
          </div>

          <div className={`${(newsItem as any).fullLayout ? "" : "wiki-content-card rounded-3xl overflow-hidden p-6 md:p-12 lg:p-16"}`}>
            <article dir={isRTL ? "rtl" : undefined} className={isRTL ? "text-right" : undefined}>
              {!(newsItem as any).fullLayout && (
                <header className="mb-12">
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <Badge className="bg-primary hover:bg-primary/80 rounded-none uppercase font-black italic px-4 py-1">
                      {newsItem.category}
                    </Badge>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <Target className="h-4 w-4" />
                      <span>{monthYearText}</span>
                    </div>
                  </div>

                  <h1
                    className={`text-4xl md:text-6xl lg:text-7xl font-black uppercase italic tracking-tighter leading-none mb-8 ${isRTL ? "text-right" : ""}`}
                  >
                    {selectedTitle}
                  </h1>

                  <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-12">
                    <span>BY {newsItem.author || 'Bimora Team'}</span>
                  </div>

                  {newsItem.image && (
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl mb-12">
                      <img
                        src={newsItem.image}
                        alt={newsItem.title}
                        className="w-full h-full object-cover cursor-zoom-in"
                        onLoad={() => setImgLoaded(true)}
                        onClick={() => setViewer({ open: true, src: newsItem.image, alt: newsItem.title })}
                      />
                    </div>
                  )}
                </header>
              )}

              <div
                className={`prose prose-xl dark:prose-invert max-w-none mb-16 ${isRTL ? "text-right" : ""}`}
                dir={isRTL ? "rtl" : undefined}
                ref={contentRef}
                dangerouslySetInnerHTML={{
                  __html: (() => {
                    const transformEmbeds = (input: string) => {
                      let out = String(input || "");
                      out = out.replace(/https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/g, (_m, id) => `<div class="aspect-video mb-8"><iframe src="https://www.youtube.com/embed/${id}" width="560" height="315" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`);
                      return out;
                    };
                    const purifier = (createDOMPurify as any)(window as any);
                    const html = transformEmbeds(selectedContentRaw || "");
                    return purifier.sanitize(html, {
                      ADD_TAGS: ['style', 'script', 'iframe'],
                      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'target'],
                      FORCE_BODY: true,
                      ALLOW_UNKNOWN_PROTOCOLS: true,
                    });
                  })()
                }}
              />

              <div className="mt-12">
                <Link href="/news">
                  <Button size="lg" className="rounded-none font-black uppercase italic tracking-widest px-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                    {t("readMore")}
                  </Button>
                </Link>
              </div>
            </article>
          </div>
        </div>
      </div>
      <ImageViewerOverlay src={viewer.src} alt={viewer.alt} open={viewer.open} onClose={() => setViewer((v) => ({ ...v, open: false }))} />
    </>
  );
}
