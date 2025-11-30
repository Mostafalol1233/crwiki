import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Clock, Eye, ArrowLeft, Languages } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArticleCard, type Article } from "@/components/ArticleCard";
import { CommentSection, type Comment } from "@/components/CommentSection";
import { useLanguage } from "@/components/LanguageProvider";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import tutorialImage from "@assets/generated_images/Tutorial_article_cover_image_2152de25.png";
import { useState, useEffect } from "react";

export default function Article() {
  const params = useParams();
  const id = (params as any)?.id as string | undefined;
  const slug = (params as any)?.slug as string | undefined;
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [isRTL, setIsRTL] = useState(false);

  const { data: article, isLoading } = useQuery<any>({
    queryKey: [slug ? `/api/posts/slug/${slug}` : `/api/posts/${id}`],
    enabled: !!(id || slug),
    queryFn: async () => {
      if (slug) {
        const res = await fetch(`/api/posts/slug/${slug}`);
        if (!res.ok) throw new Error('Failed to fetch article');
        return res.json();
      }
      if (!id) return null;
      const res = await fetch(`/api/posts/${id}`);
      if (!res.ok) throw new Error('Failed to fetch article');
      return res.json();
    },
  });

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: [`/api/posts/${(article as any)?.id || id}/comments`],
    enabled: !!((article as any)?.id || id),
    queryFn: async () => {
      const postId = (article as any)?.id || id;
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: allPosts = [] } = useQuery<Article[]>({
    queryKey: ["/api/posts"],
  });

  const addCommentMutation = useMutation({
    mutationFn: (data: { author: string; content: string }) =>
      apiRequest(`/api/posts/${id}/comments`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [slug ? `/api/posts/slug/${slug}/comments` : `/api/posts/${id}/comments`],
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => apiRequest(`/api/posts/${(article as any)?.id || id}/comments/${commentId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/posts/${(article as any)?.id || id}/comments`],
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading article...</p>
      </div>
    );
  }

  if (!article) {
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
        post.id !== article.id &&
        (post.category === article.category ||
          (post.tags && Array.isArray(post.tags) && article.tags && Array.isArray(article.tags) && post.tags.some((tag: string) => article.tags.includes(tag))))
    )
    .slice(0, 3);

  const handleCommentSubmit = (author: string, content: string) => {
    addCommentMutation.mutate({ author, content });
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const articleUrl = `${baseUrl}/article/${slug || article?.post_slug || id}`;

  useEffect(() => {
    if (!slug && id && (article as any)?.post_slug) {
      const target = `/article/${(article as any).post_slug}`;
      if (typeof window !== "undefined" && window.location.pathname !== target) {
        setLocation(target);
      }
    }
  }, [slug, id, (article as any)?.post_slug]);
  const breadcrumbs = [
    { name: article.category, url: `/category/${article.category.toLowerCase()}` },
    { name: article.title, url: articleUrl },
  ];

  return (
    <>
      <SEOHead
        title={article.seoTitle || `${article.title} | Crossfire Wiki`}
        description={article.seoDescription || article.summary || ""}
        keywords={article.seoKeywords || article.tags || []}
        canonicalUrl={article.canonicalUrl || articleUrl}
        ogImage={article.ogImage || article.image}
        twitterImage={article.twitterImage || article.ogImage || article.image}
        ogTitle={article.seoTitle || article.title}
        ogDescription={article.seoDescription || article.summary || ""}
        ogType="article"
        ogUrl={articleUrl}
        schemaType={article.schemaType || "Article"}
        schemaData={{
          headline: article.title,
          description: article.summary || "",
          image: article.image,
          author: {
            "@type": "Person",
            name: article.author,
          },
          datePublished: article.createdAt ? new Date(article.createdAt).toISOString() : new Date().toISOString(),
          dateModified: article.updatedAt ? new Date(article.updatedAt).toISOString() : new Date().toISOString(),
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": articleUrl,
          },
        }}
      />
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
              <Badge variant="default" data-testid="badge-category">
                {article.category}
              </Badge>
              {article.tags && Array.isArray(article.tags) && article.tags.map((tag: string) => (
                <Badge key={tag} variant="outline" data-testid={`badge-tag-${tag}`}>
                  {tag}
                </Badge>
              ))}
            </div>

            <h1
              className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-6 ${isRTL ? "text-right" : ""}`}
              data-testid="text-article-title"
            >
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-muted-foreground mb-8">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {article.author
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span data-testid="text-author">{article.author}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span data-testid="text-reading-time">{article.readingTime} min read</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span data-testid="text-views">{article.views} views</span>
              </div>
              <span data-testid="text-date">{article.date}</span>
            </div>

            {article.image && (
              <div className="w-full bg-black rounded-md mb-8 overflow-hidden flex justify-center">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-auto max-h-[650px] object-contain"
                  width="800"
                  height="544"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  data-testid="img-article-cover"
                />
              </div>
            )}
          </div>

          {article.summary && (
            <div className="bg-card border border-border rounded-md p-6 mb-8" dir={isRTL ? "rtl" : undefined}>
              <p className={`text-lg text-foreground font-medium ${isRTL ? "text-right" : ""}`} data-testid="text-summary">
                {article.summary}
              </p>
            </div>
          )}

          <div
            className={`prose prose-lg dark:prose-invert max-w-none mb-12 ${isRTL ? "text-right" : ""}`}
            dir={isRTL ? "rtl" : undefined}
            dangerouslySetInnerHTML={{
              __html: article.content ? article.content.replace(/\n/g, "<br />") : '',
            }}
            data-testid="content-article-body"
          />

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

          <div className="border-t pt-12 mt-12">
            <CommentSection
              comments={comments}
              onCommentSubmit={handleCommentSubmit}
              isAdmin={Boolean(localStorage.getItem("adminToken"))}
              onDeleteComment={(cid) => deleteCommentMutation.mutate(cid)}
            />
          </div>
        </article>
      </div>
    </div>
    </>
  );
}
