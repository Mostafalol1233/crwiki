import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Clock, Eye, ArrowLeft, Languages, List, ChevronDown, ChevronRight, Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArticleCard, type Article } from "@/components/ArticleCard";
import { useLanguage } from "@/components/LanguageProvider";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import tutorialImage from "@assets/generated_images/Tutorial_article_cover_image_2152de25.png";
import { useRef, useState, useEffect } from "react";
import { ImageViewerOverlay, useZoomableImages } from "@/components/ImageViewer";
import { Loader2 } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";

export default function Article() {
  const params = useParams();
  const slug = (params as any)?.slug as string | undefined;
  const legacyId = (params as any)?.legacyId as string | undefined;
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [isRTL, setIsRTL] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [viewer, setViewer] = useState<{ open: boolean; src: string; alt?: string }>({ open: false, src: "" });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [toc, setToc] = useState<{ id: string; text: string; level: number }[]>([]);
  const [isTocOpen, setIsTocOpen] = useState(true);

  const { data: article, isLoading } = useQuery<any>({
    queryKey: [slug ? `/api/posts/slug/${slug}` : `/api/posts/${legacyId}`],
    enabled: !!(legacyId || slug),
    queryFn: async () => {
      const url = slug ? `/api/posts/slug/${slug}` : `/api/posts/${legacyId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch article');
      return res.json();
    },
  });

  const { data: postsData } = useQuery<{ items: Article[]; total: number }>({
    queryKey: ["/api/posts"],
  });
  const allPosts = postsData?.items || [];

  const fallbackFromList = allPosts.find((p: any) => (p?.post_slug && p.post_slug === slug) || (p?.id && (p.id === legacyId || p.id === slug)));
  const finalArticle: any = article || fallbackFromList || null;

  useEffect(() => {
    if (legacyId && (finalArticle as any)?.post_slug) {
      const target = `/posts/${(finalArticle as any).post_slug}`;
      if (typeof window !== "undefined" && window.location.pathname !== target) {
        setLocation(target);
      }
    }
  }, [legacyId, (finalArticle as any)?.post_slug, setLocation]);

  useEffect(() => {
    setIsRTL((finalArticle as any)?.language === 'ar');
  }, [(finalArticle as any)?.language]);

  useZoomableImages(contentRef, (src, alt) => setViewer({ open: true, src, alt }));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading article...</p>
      </div>
    );
  }

  if (!finalArticle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Article not found</p>
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const relatedArticles = allPosts
    .filter(
      (post) =>
        post.id !== finalArticle.id &&
        (post.category === finalArticle.category ||
          (post.tags && Array.isArray(post.tags) && finalArticle.tags && Array.isArray(finalArticle.tags) && post.tags.some((tag: string) => finalArticle.tags.includes(tag))))
    )
    .slice(0, 3);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const articleUrl = `${baseUrl}/posts/${slug || finalArticle?.post_slug || finalArticle?.id || legacyId}`;
  const isAdmin = typeof window !== "undefined" && !!localStorage.getItem("adminToken");


  const breadcrumbs = [
    { name: finalArticle.category, url: `/category/${finalArticle.category.toLowerCase()}` },
    { name: finalArticle.title, url: articleUrl },
  ];

  return (
    <>
      <SEOHead
        title={finalArticle.seoTitle || `${finalArticle.title} | Crossfire Wiki`}
        description={finalArticle.seoDescription || finalArticle.summary || ""}
        keywords={finalArticle.seoKeywords || finalArticle.tags || []}
        canonicalUrl={finalArticle.canonicalUrl || articleUrl}
        ogImage={finalArticle.ogImage || finalArticle.image}
        twitterImage={finalArticle.twitterImage || finalArticle.ogImage || finalArticle.image}
        ogTitle={finalArticle.seoTitle || finalArticle.title}
        ogDescription={finalArticle.seoDescription || finalArticle.summary || ""}
        ogType="article"
        ogUrl={articleUrl}
        ogImageWidth={1200}
        ogImageHeight={630}
        noindex={false}
        schemaType={finalArticle.schemaType || "Article"}
        schemaData={{
          headline: finalArticle.title,
          description: finalArticle.summary || "",
          image: finalArticle.image,
          author: {
            "@type": "Person",
            name: finalArticle.author,
          },
          datePublished: finalArticle.createdAt ? new Date(finalArticle.createdAt).toISOString() : new Date().toISOString(),
          dateModified: finalArticle.updatedAt ? new Date(finalArticle.updatedAt).toISOString() : new Date().toISOString(),
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": articleUrl,
          },
        }}
      />
      {finalArticle.image && (
        <SEOHead
          onlySchema
          schemaType="ImageObject"
          schemaData={{
            contentUrl: finalArticle.image,
            name: finalArticle.title,
            description: (finalArticle.summary || finalArticle.title || '').substring(0, 200),
            width: 1200,
            height: 800,
          }}
        />
      )}
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <Breadcrumbs items={breadcrumbs} />
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              asChild
              data-testid="button-back-home"
            >
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("backToHome")}
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRTL(!isRTL)}
              data-testid="button-toggle-rtl-article"
            >
              <Languages className="mr-2 h-4 w-4" />
              {isRTL ? "LTR" : "Translate"}
            </Button>
          </div>

          <article dir={isRTL ? "rtl" : undefined} className={isRTL ? "text-right" : undefined}>
            <div className="mb-8 md:mb-12">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Link href={`/category/${finalArticle.category.toLowerCase()}`}>
                  <Badge variant="default" data-testid="badge-category" className="cursor-pointer hover:bg-primary/80">
                    {finalArticle.category}
                  </Badge>
                </Link>
                {finalArticle.tags && Array.isArray(finalArticle.tags) && finalArticle.tags.map((tag: string) => (
                  <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`}>
                    <Badge variant="outline" data-testid={`badge-tag-${tag}`} className="cursor-pointer hover:bg-accent">
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>

              <h1
                className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-6 ${isRTL ? "text-right" : ""}`}
                data-testid="text-article-title"
              >
                {finalArticle.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-muted-foreground mb-8">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {finalArticle.author
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span data-testid="text-author">{finalArticle.author}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span data-testid="text-reading-time">{finalArticle.readingTime} min read</span>
                </div>
                {isAdmin && typeof (finalArticle as any)?.views !== 'undefined' && (
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span data-testid="text-views">{finalArticle.views} views</span>
                  </div>
                )}
                <span data-testid="text-date">{finalArticle.date}</span>
              </div>

              {finalArticle.image && (
                <div className="relative w-full bg-black rounded-md mb-8 overflow-hidden flex justify-center">
                  {!imgLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  <img
                    src={finalArticle.image}
                    alt={finalArticle.title}
                    className="w-full h-auto max-h-[60vh] md:max-h-[650px] object-contain cursor-zoom-in"
                    width="800"
                    height="544"
                    loading="lazy"
                    fetchPriority="high"
                    decoding="async"
                    data-testid="img-article-cover"
                    onLoad={() => setImgLoaded(true)}
                    onClick={() => setViewer({ open: true, src: finalArticle.image, alt: finalArticle.title })}
                  />
                </div>
              )}
            </div>

            {finalArticle.summary && (
              <div className="bg-card border border-border rounded-md p-6 mb-8" dir={isRTL ? "rtl" : undefined}>
                <p className={`text-lg text-foreground font-medium ${isRTL ? "text-right" : ""}`} data-testid="text-summary">
                  {finalArticle.summary}
                </p>
              </div>
            )}

            {toc.length > 0 && (
              <div className="bg-card border border-border rounded-md p-4 mb-8 w-full md:w-auto md:min-w-[300px] inline-block" dir={isRTL ? "rtl" : undefined}>
                <div
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => setIsTocOpen(!isTocOpen)}
                >
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <List className="h-5 w-5" />
                    {t("tableOfContents") || "Table of Contents"}
                  </h3>
                  {isTocOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </div>
                {isTocOpen && (
                  <nav className="mt-4 space-y-1">
                    {toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`block text-sm hover:underline hover:text-primary transition-colors py-1 ${item.level === 3 ? (isRTL ? "mr-4" : "ml-4 text-muted-foreground") : "font-medium"
                          }`}
                        onClick={(e) => {
                          e.preventDefault();
                          const el = document.getElementById(item.id);
                          if (el) {
                            const offset = 80; // Header height
                            const elementPosition = el.getBoundingClientRect().top;
                            const offsetPosition = elementPosition + window.pageYOffset - offset;
                            window.scrollTo({
                              top: offsetPosition,
                              behavior: "smooth"
                            });
                            window.history.pushState(null, "", `#${item.id}`);
                          }
                        }}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                )}
              </div>
            )}

            <div
              className={`prose prose-lg dark:prose-invert max-w-none mb-12 ${isRTL ? "text-right" : ""}`}
              dir={isRTL ? "rtl" : undefined}
              ref={contentRef}
              dangerouslySetInnerHTML={{
                __html: (() => {
                  const transformEmbeds = (input: string) => {
                    let out = String(input || "");
                    out = out.replace(/https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/g, (_m, id) => `<div class="aspect-video"><iframe src="https://www.youtube.com/embed/${id}" width="560" height="315" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`);
                    out = out.replace(/https?:\/\/(?:www\.)?youtu\.be\/([A-Za-z0-9_-]{11})/g, (_m, id) => `<div class="aspect-video"><iframe src="https://www.youtube.com/embed/${id}" width="560" height="315" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`);
                    out = out.replace(/https?:\/\/(?:www\.)?youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/g, (_m, id) => `<div class="aspect-video"><iframe src="https://www.youtube.com/embed/${id}" width="560" height="315" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`);
                    return out;
                  };
                  const raw = finalArticle.content ? finalArticle.content.replace(/\n/g, "<br />") : "";
                  const html = transformEmbeds(raw);
                  return DOMPurify.sanitize(html, {
                    ALLOWED_TAGS: [
                      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'strike', 's', 'del', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                      'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'pre', 'code', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span', 'hr',
                      'audio', 'video', 'source', 'iframe'
                    ],
                    ALLOWED_ATTR: [
                      'href', 'src', 'alt', 'title', 'style', 'class', 'width', 'height', 'target', 'rel',
                      'controls', 'frameborder', 'allow', 'allowfullscreen', 'loading', 'decoding', 'fetchpriority', 'preload', 'muted', 'autoplay'
                    ],
                    ALLOW_DATA_ATTR: false,
                    KEEP_CONTENT: true,
                  });
                })()
              }}
              data-testid="content-article-body"
            />

            <div className="flex justify-end mt-4 mb-8">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/support?category=content&title=Issue with article: ${encodeURIComponent(finalArticle.title)}`}>
                  <Flag className="mr-2 h-4 w-4" />
                  Report Issue
                </Link>
              </Button>
            </div>

            {relatedArticles.length > 0 && (
              <div className="border-t pt-12 mt-12">
                <h2 className="text-2xl md:text-3xl font-semibold mb-8">
                  {t("relatedArticles")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedArticles.map((relatedArticle) => (
                    <ArticleCard
                      key={relatedArticle.id}
                      article={relatedArticle}
                    />
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>
      </div>
      <ImageViewerOverlay src={viewer.src} alt={viewer.alt} open={viewer.open} onClose={() => setViewer((v) => ({ ...v, open: false }))} />
    </>
  );
}
