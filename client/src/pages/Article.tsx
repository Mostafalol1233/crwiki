import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Clock, Eye, ArrowLeft, Languages, List, Flag, Maximize2, User, Calendar, ListOrdered, CheckCircle, ExternalLink, Link2 as LinkIcon, Info, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArticleCard, type Article } from "@/components/ArticleCard";
import { useLanguage } from "@/components/LanguageProvider";
import { queryClient } from "@/lib/queryClient";
import { getPostBySlug, getPostById, getPosts } from "@/lib/supabaseApi";
import { SEOHead } from "@/components/SEOHead";
import ContentImage from "@/components/ContentImage";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useRef, useState, useEffect, useMemo } from "react";
import { ImageViewerOverlay, useZoomableImages } from "@/components/ImageViewer";
import { sanitizeRichHtml } from "@/lib/sanitizeRichHtml";
import WikiPageTemplate from "@/components/WikiPageTemplate";

interface WikiTab {
  title: string;
  content: string;
  image?: string;
}

export default function Article() {
  const params = useParams();
  const slug = (params as any)?.slug as string | undefined;
  const legacyId = (params as any)?.legacyId as string | undefined;
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  const [isRTL, setIsRTL] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const { data: article, isLoading } = useQuery<any>({
    queryKey: [slug ? `/api/posts/slug/${slug}` : `/api/posts/${legacyId}`],
    enabled: !!(legacyId || slug),
    queryFn: async () => {
      if (slug) return getPostBySlug(slug);
      return getPostById(legacyId!);
    },
  });

  useEffect(() => {
    if (article && (article as any).post_slug && slug === (article as any).id) {
      setLocation(`/posts/${(article as any).post_slug}`, { replace: true });
    }
  }, [article, slug, setLocation]);

  const [viewer, setViewer] = useState<{ open: boolean; src: string; alt?: string }>({ open: false, src: "" });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
  const [activeTab, setActiveTab] = useState<number>(0);

  const { data: postsData } = useQuery<{ items: any[]; total: number }>({
    queryKey: ["/api/posts"],
    queryFn: () => getPosts({ limit: 50 }) as any,
  });
  const allPosts: Article[] = (postsData?.items || []) as any[];

  const finalArticle = useMemo(() => {
    if (article) return article;
    return allPosts.find((p: any) => 
      (p?.post_slug && p.post_slug === slug) || 
      (p?.id && (p.id === legacyId || p.id === slug))
    ) || null;
  }, [article, allPosts, slug, legacyId]);

  useEffect(() => {
    if (finalArticle?.content) {
      const doc = new DOMParser().parseFromString(finalArticle.content, "text/html");
      const hTags = doc.querySelectorAll("h2, h3, h4");
      const hData = Array.from(hTags).map((h, i) => {
        const id = `heading-${i}`;
        h.id = id;
        return { id, text: h.textContent || "", level: parseInt(h.tagName.substring(1)) };
      });
      setHeadings(hData);
    }
  }, [finalArticle?.content]);

  useEffect(() => {
    if (legacyId && finalArticle?.post_slug) {
      const target = `/posts/${finalArticle.post_slug}`;
      if (typeof window !== "undefined" && window.location.pathname !== target) {
        setLocation(target);
      }
    }
  }, [legacyId, finalArticle?.post_slug, setLocation]);

  useEffect(() => {
    setIsRTL(finalArticle?.language === 'ar');
  }, [finalArticle?.language]);

  useZoomableImages(contentRef, (src, alt) => setViewer({ open: true, src, alt }));

  const isAdmin = useMemo(() => typeof window !== "undefined" && !!localStorage.getItem("adminToken"), []);

  const breadcrumbs = useMemo(() => [
    { name: t("home"), url: "/" },
    { name: finalArticle?.category || "News", url: `/category/${finalArticle?.category?.toLowerCase() || "news"}` },
    { name: finalArticle?.title || "Article", url: "" }
  ], [t, finalArticle]);

  const relatedArticles = useMemo(() => {
    if (!finalArticle || !allPosts) return [];
    return allPosts
      .filter((p: any) => p.id !== finalArticle.id && p.category === finalArticle.category)
      .slice(0, 3);
  }, [finalArticle, allPosts]);

  const useWikiTemplate = useMemo(() => {
    const tags = Array.isArray(finalArticle?.tags)
      ? finalArticle.tags.map((tag: unknown) => String(tag).toLowerCase())
      : [];
    return Boolean(
      finalArticle?.fullLayout ||
      finalArticle?.template === "wiki" ||
      String(finalArticle?.category || "").toLowerCase() === "wiki" ||
      tags.includes("wiki") ||
      tags.includes("wiki-reference")
    );
  }, [finalArticle]);

  const rawContent = useMemo(() => {
    if (!finalArticle?.content) return "";
    const doc = new DOMParser().parseFromString(finalArticle.content, "text/html");
    const hTags = doc.querySelectorAll("h2, h3, h4");
    hTags.forEach((h, i) => {
      h.id = `heading-${i}`;
    });
    return doc.body.innerHTML;
  }, [finalArticle?.content]);

  const firstImageMatch = useMemo(() => /<img[^>]+src=["']([^"']+)["']/i.exec(rawContent || ""), [rawContent]);
  const descriptionImage = firstImageMatch ? firstImageMatch[1] : undefined;
  const publishedLabel = useMemo(() => {
    const value = finalArticle?.createdAt || finalArticle?.updatedAt;
    if (!value) return language === "ar" ? "غير متاح" : "N/A";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return language === "ar" ? "غير متاح" : "N/A";
    return parsed.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { year: "numeric", month: "short", day: "numeric" });
  }, [finalArticle?.createdAt, finalArticle?.updatedAt, language]);

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
          <p className="text-muted-foreground mb-4">{language === "ar" ? "المقال غير موجود" : "Article not found"}</p>
          <Button asChild>
            <Link href={language === "ar" ? "/ar" : "/"}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === "ar" ? "العودة إلى الرئيسية" : "Back to Home"}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (useWikiTemplate) {
    const title = isRTL && finalArticle.titleAr ? finalArticle.titleAr : finalArticle.title;
    const content = isRTL && finalArticle.contentAr ? finalArticle.contentAr : finalArticle.content;
    return (
      <>
        <SEOHead
          title={finalArticle.seo_title || title}
          description={finalArticle.seo_description || finalArticle.summary || title}
          keywords={finalArticle.tags || []}
          ogImage={finalArticle.og_image || finalArticle.image}
          canonicalUrl={finalArticle.canonical_url || (slug ? `https://crossfire.wiki/posts/${slug}` : undefined)}
          articlePublishedTime={finalArticle.created_at || finalArticle.createdAt}
          articleModifiedTime={finalArticle.updated_at || finalArticle.updatedAt || finalArticle.created_at || finalArticle.createdAt}
          articleAuthor={finalArticle.author || "CrossFire Wiki"}
          articleSection={finalArticle.category || "Wiki"}
          schemaType="Article"
        />
        <WikiPageTemplate
          title={title || "CrossFire Wiki"}
          content={content || ""}
          slug={finalArticle.post_slug || slug || String(finalArticle.id)}
          isAr={isRTL}
          seoDescription={finalArticle.seo_description || finalArticle.summary}
          publishedAt={finalArticle.created_at || finalArticle.createdAt}
          updatedAt={finalArticle.updated_at || finalArticle.updatedAt || finalArticle.created_at || finalArticle.createdAt}
          sourceUrl={finalArticle.source_url || finalArticle.sourceUrl}
        />
      </>
    );
  }

  return (
    <>
      <SEOHead
        title={finalArticle?.seo_title || finalArticle?.title}
        description={finalArticle?.seo_description || finalArticle?.summary || (finalArticle?.title ? `Complete CrossFire guide: ${finalArticle.title}` : undefined)}
        keywords={finalArticle?.tags || []}
        ogImage={finalArticle?.og_image || finalArticle?.image || descriptionImage}
        ogImageAlt={`${finalArticle?.title || "CrossFire article"} — CrossFire Wiki`}
        ogImageWidth={1200}
        ogImageHeight={630}
        twitterImage={finalArticle?.twitter_image || finalArticle?.og_image || finalArticle?.image || descriptionImage}
        ogTitle={finalArticle?.seo_title || finalArticle?.title}
        ogDescription={finalArticle?.seo_description || finalArticle?.summary}
        ogType="article"
        canonicalUrl={finalArticle?.canonical_url || (slug ? `https://crossfire.wiki/posts/${slug}` : undefined)}
        articlePublishedTime={finalArticle?.created_at || finalArticle?.createdAt}
        articleModifiedTime={finalArticle?.updated_at || finalArticle?.updatedAt || finalArticle?.created_at || finalArticle?.createdAt}
        articleAuthor={finalArticle?.author || "CrossFire Wiki"}
        articleSection={finalArticle?.category || "Guides"}
        articleTags={finalArticle?.tags || []}
        breadcrumbs={breadcrumbs}
        schemaType={finalArticle?.schema_type || finalArticle?.schemaType || "Article"}
        schemaData={{
          "@id": `${finalArticle?.canonical_url || (slug ? `https://crossfire.wiki/posts/${slug}` : "https://crossfire.wiki/posts")}#article`,
          headline: finalArticle?.title,
          description: (finalArticle?.seo_description || finalArticle?.summary || finalArticle?.title || "").substring(0, 500),
          image: finalArticle?.og_image || finalArticle?.image || descriptionImage,
          url: finalArticle?.canonical_url || (slug ? `https://crossfire.wiki/posts/${slug}` : "https://crossfire.wiki/posts"),
          author: { "@type": "Person", name: finalArticle?.author || "CrossFire Wiki Team" },
          datePublished: finalArticle?.created_at || finalArticle?.createdAt,
          dateModified: finalArticle?.updated_at || finalArticle?.updatedAt || finalArticle?.created_at || finalArticle?.createdAt,
          articleSection: finalArticle?.category || "Guides",
          keywords: finalArticle?.tags || [],
          inLanguage: finalArticle?.language === "ar" ? "ar" : "en",
          isPartOf: { "@type": "WebSite", name: "CrossFire Wiki", url: "https://crossfire.wiki" },
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
      <div className="min-h-screen" style={{ background: "var(--background)" }}>
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 md:py-12">
          {!finalArticle.fullLayout && <Breadcrumbs items={breadcrumbs} />}
          
          <div className="flex items-center gap-2 mb-6 mt-2 no-print flex-wrap">
            <Link href={language === "ar" ? "/ar" : "/"}>
              <a className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all hover:opacity-80" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.08)", color: "#888", borderRadius: "2px" }}>
                <ArrowLeft className="h-3 w-3" />
                {t("backToHome")}
              </a>
            </Link>
            <button
              onClick={() => setIsRTL(!isRTL)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all hover:opacity-80"
              style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.08)", color: "#888", borderRadius: "2px" }}
            >
              <Languages className="h-3 w-3" />
              {isRTL ? "LTR" : "Translate"}
            </button>
          </div>

          <div className={`${finalArticle.fullLayout ? "grid grid-cols-1 lg:grid-cols-12 gap-12" : "wiki-content-card rounded-3xl overflow-hidden p-6 md:p-12 lg:p-16"}`}>
            <div className={`${finalArticle.fullLayout ? "lg:col-span-9" : ""}`}>
              <article dir={isRTL ? "rtl" : undefined} className={isRTL ? "text-right" : undefined}>
                {!finalArticle.fullLayout && (
                  <>
                    <header className="mb-12">
                      <div className="flex flex-wrap items-center gap-2 mb-6 no-print">
                        <Link href={`/category/${finalArticle?.category?.toLowerCase() || "news"}`}>
                          <Badge variant="default" className="bg-primary hover:bg-primary/80 rounded-none uppercase font-black italic px-4 py-1">
                            {finalArticle?.category || "NEWS"}
                          </Badge>
                        </Link>
                        {finalArticle?.tags && Array.isArray(finalArticle.tags) && finalArticle.tags.map((tag: string) => (
                          <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`}>
                            <Badge variant="secondary" className="rounded-none uppercase font-bold text-[10px] px-3 py-1">
                              #{tag}
                            </Badge>
                          </Link>
                        ))}
                      </div>

                      <h1 className={`text-4xl md:text-6xl lg:text-7xl font-black uppercase italic tracking-tighter leading-none mb-8 ${isRTL ? "text-right" : ""}`}>
                        {finalArticle?.title}
                      </h1>

                      <div className="flex flex-wrap items-center gap-6 text-xs font-bold uppercase tracking-widest text-muted-foreground border-y py-6 mb-12 border-border/50 no-print">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-primary/20">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {finalArticle?.author?.[0]?.toUpperCase() || "B"}
                            </AvatarFallback>
                          </Avatar>
                          <span>BY {finalArticle?.author}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{finalArticle?.readingTime} MIN READ</span>
                        </div>
                        {isAdmin && typeof finalArticle?.views !== 'undefined' && (
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            <span>{finalArticle.views} VIEWS</span>
                          </div>
                        )}
                        <span>{language === "ar" ? "نُشر: " : "PUBLISHED: "}{publishedLabel}</span>
                      </div>

                      {finalArticle?.image && (
                        <div className="relative w-full aspect-video rounded-none border border-border/50 mb-12 shadow-2xl bg-muted/10 group">
                          <ContentImage
                            src={finalArticle.image}
                            alt={finalArticle.title}
                            className="object-contain w-full h-full transform transition-all duration-700 cursor-zoom-in group-hover:scale-[1.01]"
                            onLoad={() => setImgLoaded(true)}
                            onClick={() => setViewer({ open: true, src: finalArticle.image, alt: finalArticle.title })}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </header>

                    <div className="flex flex-wrap items-center gap-4 mb-8 no-print mt-8">
                      {finalArticle?.isVerified && (
                        <Badge variant="outline" className="rounded-none border-green-500 text-green-500 font-black uppercase italic px-3 py-1 bg-green-500/5">
                          <CheckCircle className="h-3 w-3 mr-2" />
                          Verified Content
                        </Badge>
                      )}
                      {finalArticle?.sourceUrl && (
                        <Button variant="ghost" size="sm" asChild className="p-0 h-auto text-[10px] font-black uppercase tracking-tight italic hover:text-primary transition-colors">
                          <a href={finalArticle.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center">
                            <ExternalLink className="h-3 w-3 mr-2" />
                            Original Source
                          </a>
                        </Button>
                      )}
                    </div>

                    {headings.length > 0 && (
                      <div className="mb-12 p-8 border border-border/50 bg-muted/5 rounded-none no-print wiki-toc">
                        <div className="flex items-center gap-2 mb-6">
                          <List className="h-5 w-5 text-primary" />
                          <h2 className="text-xl font-black uppercase italic tracking-tight">Table of Contents</h2>
                        </div>
                        <nav className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
                          {headings.map((h) => (
                            <a
                              key={h.id}
                              href={`#${h.id}`}
                              onClick={(e) => {
                                e.preventDefault();
                                document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className={`text-sm font-bold uppercase tracking-tight hover:text-primary transition-colors flex items-center gap-2 ${h.level > 2 ? 'pl-6 opacity-80' : ''}`}
                            >
                              <span className="text-[10px] text-primary/50">0{h.level - 1}.</span>
                              {h.text}
                            </a>
                          ))}
                        </nav>
                      </div>
                    )}
                  </>
                )}

                {!finalArticle.fullLayout && finalArticle?.summary && (
                  <div className="mb-12 p-8 border-l-4 border-primary bg-primary/5 italic text-lg leading-relaxed rounded-none">
                    {finalArticle.summary}
                  </div>
                )}

                {(finalArticle.wikiTabs as WikiTab[] | undefined)?.length ? (
                  <div className="wiki-article-body mt-12">
                    <div className="flex flex-wrap gap-0 border-b border-border/60 mb-8 overflow-x-auto">
                      <button
                        onClick={() => setActiveTab(-1)}
                        className={`px-5 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === -1 ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`}
                      >
                        Overview
                      </button>
                      {(finalArticle.wikiTabs as WikiTab[]).map((tab, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveTab(i)}
                          className={`px-5 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === i ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`}
                        >
                          {tab.title}
                        </button>
                      ))}
                    </div>
                    {activeTab === -1 ? (
                      <div
                        ref={contentRef}
                        className={`prose prose-slate dark:prose-invert max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-headings:tracking-tighter prose-p:text-lg prose-p:leading-relaxed prose-p:font-medium prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-none prose-img:shadow-xl prose-img:border prose-img:border-border/50 ${isRTL ? "rtl" : ""}`}
                        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(rawContent) }}
                      />
                    ) : (
                      <div>
                        {(finalArticle.wikiTabs as WikiTab[])[activeTab]?.image && (
                          <div className="mb-8 flex justify-center">
                            <ContentImage
                              src={(finalArticle.wikiTabs as WikiTab[])[activeTab].image}
                              alt={(finalArticle.wikiTabs as WikiTab[])[activeTab].title}
                              className="max-h-80 object-contain rounded border border-border/50 shadow-lg cursor-zoom-in"
                              onClick={() => setViewer({ open: true, src: (finalArticle.wikiTabs as WikiTab[])[activeTab].image || "", alt: (finalArticle.wikiTabs as WikiTab[])[activeTab].title })}
                            />
                          </div>
                        )}
                        <div
                          ref={contentRef}
                          className={`prose prose-slate dark:prose-invert max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-headings:tracking-tighter prose-p:text-lg prose-p:leading-relaxed prose-p:font-medium prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-none prose-img:shadow-xl prose-img:border prose-img:border-border/50 ${isRTL ? "rtl" : ""}`}
                          dangerouslySetInnerHTML={{ __html: sanitizeRichHtml((finalArticle.wikiTabs as WikiTab[])[activeTab]?.content || "") }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                <div className="wiki-article-body mt-12">
                  <div
                    ref={contentRef}
                    className={`prose prose-slate dark:prose-invert max-w-none 
                      prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-headings:tracking-tighter
                      prose-p:text-lg prose-p:leading-relaxed prose-p:font-medium
                      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                      prose-img:rounded-none prose-img:shadow-xl prose-img:border prose-img:border-border/50
                      ${isRTL ? "rtl" : ""}`}
                    dangerouslySetInnerHTML={{
                      __html: sanitizeRichHtml(rawContent)
                    }}
                  />
                </div>
                )}

                {finalArticle.externalLinks && finalArticle.externalLinks.length > 0 && (
                  <div className="mt-16 p-8 border border-border/50 bg-muted/5 rounded-none no-print">
                    <h2 className="text-xl font-black uppercase italic tracking-tight mb-6 flex items-center gap-2">
                      <LinkIcon className="h-5 w-5 text-primary" />
                      External Links
                    </h2>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {finalArticle.externalLinks.map((link: any, i: number) => (
                        <li key={i}>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-bold uppercase tracking-tight hover:text-primary transition-colors flex items-center gap-2 group"
                          >
                            <span className="w-1.5 h-1.5 bg-primary rounded-full group-hover:scale-150 transition-transform" />
                            {link.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end mt-4 mb-8 no-print">
                  <Button variant="outline" size="sm" asChild className="rounded-none font-bold uppercase tracking-tight">
                    <Link href={`/support?category=content&title=Issue with article: ${encodeURIComponent(finalArticle?.title || "")}`}>
                      <Flag className="mr-2 h-4 w-4" />
                      Report Issue
                    </Link>
                  </Button>
                </div>

                {relatedArticles.length > 0 && (
                  <div className="border-t pt-12 mt-12 no-print">
                    <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter mb-8">
                      {t("relatedArticles")}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {relatedArticles.map((relatedArticle: Article) => (
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

            {finalArticle.fullLayout && (
              <aside className="lg:col-span-3 space-y-8 no-print">
                <div className="wiki-sidebar-card p-8 border border-border/50 bg-muted/5 rounded-none sticky top-24 shadow-sm">
                  <h3 className="text-xl font-black uppercase italic tracking-tighter mb-8 flex items-center gap-3 border-b border-primary/20 pb-4">
                    <Info className="h-5 w-5 text-primary" />
                    Article Metadata
                  </h3>

                  <div className="space-y-8">
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Namespace</span>
                      <span className="text-sm font-black uppercase italic tracking-tight text-primary">Main Article</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Category</span>
                      <Link href={`/category/${finalArticle?.category?.toLowerCase() || "news"}`} className="text-sm font-black uppercase tracking-tight hover:text-primary transition-colors">
                        {finalArticle?.category || "NEWS"}
                      </Link>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Author</span>
                      <span className="text-sm font-black uppercase tracking-tight">{finalArticle?.author}</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Last Updated</span>
                      <span className="text-sm font-black uppercase tracking-tight">
                        {finalArticle?.updatedAt ? new Date(finalArticle.updatedAt).toLocaleDateString() : (finalArticle?.createdAt ? new Date(finalArticle.createdAt).toLocaleDateString() : "N/A")}
                      </span>
                    </div>

                    {finalArticle?.tags && finalArticle.tags.length > 0 && (
                      <div className="flex flex-col gap-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Tags</span>
                        <div className="flex flex-wrap gap-2">
                          {finalArticle.tags.map((tag: string) => (
                            <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`} className="text-[9px] font-black uppercase tracking-tighter border border-border/50 px-2 py-1 hover:bg-primary hover:text-primary-foreground transition-all">
                              {tag}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-12 pt-8 border-t border-border/50 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-4">Wiki Tools</h4>
                    <Button variant="outline" size="sm" className="w-full rounded-none font-black uppercase tracking-tighter text-[10px] justify-start h-10 border-primary/20 hover:bg-primary/5 group" onClick={() => window.print()}>
                      <Flag className="h-3 w-3 mr-3 text-primary group-hover:scale-110 transition-transform" />
                      Print Version
                    </Button>
                    <Button variant="outline" size="sm" className="w-full rounded-none font-black uppercase tracking-tighter text-[10px] justify-start h-10 border-primary/20 hover:bg-primary/5 group" asChild>
                      <Link href={`/support?category=content&title=Citation needed: ${encodeURIComponent(finalArticle?.title || "")}`}>
                        <Share2 className="h-3 w-3 mr-3 text-primary group-hover:scale-110 transition-transform" />
                        Cite Article
                      </Link>
                    </Button>
                  </div>
                </div>

                {headings.length > 0 && (
                  <div className="wiki-sidebar-card p-8 border border-border/50 bg-muted/5 rounded-none sticky top-[500px] shadow-sm hidden lg:block">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter mb-8 flex items-center gap-3 border-b border-primary/20 pb-4">
                      <ListOrdered className="h-5 w-5 text-primary" />
                      Sections
                    </h3>
                    <nav className="space-y-4">
                      {headings.slice(0, 10).map((h) => (
                        <a
                          key={h.id}
                          href={`#${h.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`text-[11px] font-black uppercase tracking-tight hover:text-primary transition-colors flex items-center gap-3 group ${h.level > 2 ? 'pl-4 opacity-70' : ''}`}
                        >
                          <span className="w-1 h-1 bg-primary/30 group-hover:bg-primary transition-colors" />
                          {h.text}
                        </a>
                      ))}
                      {headings.length > 10 && (
                        <span className="text-[10px] font-black uppercase italic text-muted-foreground pl-4">...and {headings.length - 10} more</span>
                      )}
                    </nav>
                  </div>
                )}
              </aside>
            )}
          </div>
        </div>
      </div>
      <ImageViewerOverlay src={viewer.src} alt={viewer.alt} open={viewer.open} onClose={() => setViewer((v) => ({ ...v, open: false }))} />
    </>
  );
}
