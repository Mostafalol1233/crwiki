import { useQuery } from "@tanstack/react-query";
import { useRef, useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Target, Globe, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { SEOHead } from "@/components/SEOHead";
import ContentImage from "@/components/ContentImage";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useZoomableImages, ImageViewerOverlay } from "@/components/ImageViewer";
import { useToast } from "@/hooks/use-toast";
import { sanitizeRichHtml } from "@/lib/sanitizeRichHtml";

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
      const { getNewsBySlug, getNews } = await import("@/lib/supabaseApi");
      if (slug) {
        try { return await getNewsBySlug(slug); }
        catch {
          const { items } = await getNews({ limit: 200 });
          const found = items.find((n: any) => n.news_slug === slug || n.id === slug);
          if (found) return found;
          throw new Error("News not found");
        }
      }
      if (!legacyId) throw new Error("No news ID or slug provided");
      const { items } = await getNews({ limit: 200 });
      const found = items.find((n: any) => n.id === legacyId);
      if (found) return found;
      throw new Error("News not found");
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
      const { getPostBySlug, getPostById } = await import("@/lib/supabaseApi");
      try {
        if (slug) return await getPostBySlug(slug);
        return await getPostById(legacyId!);
      } catch { return null; }
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

  const canonicalOrigin = "https://crossfire.wiki";
  const newsSlug = newsItem.news_slug || slug || legacyId;
  const newsUrl = `${canonicalOrigin}/news/${newsSlug}`;
  const newsBreadcrumbs = [
    { name: "Home", url: canonicalOrigin + "/" },
    { name: "News", url: canonicalOrigin + "/news" },
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
  const plainText = (selectedContentRaw || '').replace(/<[^>]*>/g, '');
  const seoDesc = newsItem.seoDescription || plainText.substring(0, 155) || "";
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;

  const publishedIso = newsItem.createdAt ? new Date(newsItem.createdAt as any).toISOString() : new Date().toISOString();
  const modifiedIso = newsItem.updatedAt ? new Date(newsItem.updatedAt as any).toISOString() : publishedIso;

  const newsKeywords = [
    ...(newsItem.seoKeywords || [newsItem.category]),
    "CrossFire news",
    "CrossFire Wiki",
    "كروس فاير اخبار",
  ].filter(Boolean);

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
        title={newsItem.seoTitle || `${selectedTitle} | CrossFire Wiki`}
        description={seoDesc}
        keywords={newsKeywords}
        canonicalUrl={newsItem.canonicalUrl || newsUrl}
        ogImage={seoImage}
        ogImageAlt={`${selectedTitle} — CrossFire News`}
        ogImageWidth={1200}
        ogImageHeight={630}
        twitterImage={newsItem.twitterImage || seoImage}
        ogTitle={newsItem.seoTitle || selectedTitle}
        ogDescription={seoDesc}
        ogType="article"
        ogUrl={newsUrl}
        noindex={false}
        articlePublishedTime={publishedIso}
        articleModifiedTime={modifiedIso}
        articleAuthor={newsItem.author || "CrossFire Wiki"}
        articleSection={newsItem.category || "News"}
        articleTags={newsKeywords}
        hreflangAlternates={[
          { lang: "en", url: newsUrl },
          { lang: "ar", url: newsUrl.replace("https://crossfire.wiki", "https://crossfire.wiki/ar") },
        ]}
        breadcrumbs={newsBreadcrumbs}
        publisher={{ name: "CrossFire Wiki", logoUrl: `${canonicalOrigin}/logo-new.png` }}
        schemaType={newsItem.schemaType || "NewsArticle"}
        schemaData={{
          "@id": newsUrl,
          headline: selectedTitle,
          description: plainText.substring(0, 500) || "",
          image: seoImage
            ? {
                "@type": "ImageObject",
                url: seoImage,
                width: 1200,
                height: 630,
                caption: selectedTitle,
              }
            : undefined,
          url: newsUrl,
          author: {
            "@type": "Person",
            name: newsItem.author || "CrossFire Wiki Team",
          },
          datePublished: publishedIso,
          dateModified: modifiedIso,
          wordCount,
          inLanguage: language === 'ar' ? "ar" : "en",
          isPartOf: {
            "@type": "WebSite",
            name: "CrossFire Wiki",
            url: canonicalOrigin,
          },
          about: {
            "@type": "Thing",
            name: "CrossFire",
          },
        }}
        extraSchemas={seoImage ? [
          {
            "@type": "ImageObject",
            contentUrl: seoImage,
            url: seoImage,
            name: selectedTitle,
            description: seoDesc,
            width: 1200,
            height: 630,
            caption: `${selectedTitle} — CrossFire Wiki`,
          }
        ] : undefined}
      />
      <div className="min-h-screen">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 md:py-12">
          {!(newsItem as any).fullLayout && <Breadcrumbs items={newsBreadcrumbs} />}
          <div className="flex items-center gap-2 mb-6 mt-2 no-print flex-wrap">
            <Link href="/news">
              <a className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all hover:opacity-80" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.08)", color: "#888", borderRadius: "2px" }}>
                <ArrowLeft className="h-3 w-3" />
                {t("backToNews")}
              </a>
            </Link>
            <button
              onClick={() => setIsRTL(!isRTL)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all hover:opacity-80"
              style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.08)", color: "#888", borderRadius: "2px" }}
            >
              <Globe className="h-3 w-3" />
              {isRTL ? "LTR" : "Translate"}
            </button>
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
                      <ContentImage
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
                    const html = transformEmbeds(selectedContentRaw || "");
                    return sanitizeRichHtml(html);
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
