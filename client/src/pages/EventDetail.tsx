import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowLeft, Languages, Loader2 } from "lucide-react";
import { useRef, useState, useEffect, useMemo } from "react";
import DOMPurify from "isomorphic-dompurify";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ImageViewerOverlay, useZoomableImages } from "@/components/ImageViewer";
import { CommentSection } from "@/components/CommentSection";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Event {
  id: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  date: string;
  type?: "upcoming" | "trending";
  image?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  twitterImage?: string;
  schemaType?: string;
  event_name_slug?: string;
}

export default function EventDetail() {
  const params = useParams();
  const slug = params?.slug as string | undefined;
  const legacyId = params?.legacyId as string | undefined;
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [error, setError] = useState<Error | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isRTL, setIsRTL] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [viewer, setViewer] = useState<{ open: boolean; src: string; alt?: string }>({ open: false, src: "" });
  useZoomableImages(contentRef, (src, alt) => setViewer({ open: true, src, alt }));
  const [imgLoaded, setImgLoaded] = useState(false);

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: ["event", slug || legacyId],
    enabled: !!(slug || legacyId),
    retry: 1,
    queryFn: async () => {
      if (slug) {
        const res = await fetch(`/api/events/slug/${slug}`);
        if (!res.ok) {
          const errorText = await res.text().catch(() => "Unknown error");
          throw new Error(`Failed to load event: ${res.status} ${errorText}`);
        }
        return res.json();
      }
      if (!legacyId) throw new Error("No event ID or slug provided");
      const res = await fetch(`/api/events/${legacyId}`);
      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        throw new Error(`Failed to load event: ${res.status} ${errorText}`);
      }
      return res.json();
    },
  });

  const { data: rawComments } = useQuery({
    queryKey: ["/api/events", event?.id, "comments"],
    enabled: !!event?.id,
    queryFn: async () => {
      const res = await fetch(`/api/events/${event!.id}/comments`);
      if (!res.ok) return [];
      return res.json();
    }
  });

  const comments = useMemo(() => {
    const arr = Array.isArray(rawComments) ? rawComments : [];
    const normalized = arr
      .map((c: any) => {
        const id = String(c?.id || c?._id || "").trim();
        const parentCommentIdRaw = c?.parentCommentId;
        const parentCommentId = parentCommentIdRaw === null || parentCommentIdRaw === undefined
          ? undefined
          : String(parentCommentIdRaw).trim() || undefined;
        return {
          ...c,
          id,
          parentCommentId,
        };
      })
      .filter((c: any) => c.id && c.id !== "undefined" && c.id !== "null");

    const seen = new Set<string>();
    const deduped: any[] = [];
    for (const c of normalized) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      deduped.push(c);
    }
    return deduped;
  }, [rawComments]);

  const addCommentMutation = useMutation({
    mutationFn: async (data: { author: string; content: string; parentCommentId?: string; userId?: string; userAvatar?: string }) => {
      return await apiRequest(`/api/events/${event!.id}/comments`, "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", event?.id, "comments"] });
      toast({ title: "Comment added", description: "Your comment has been posted successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Failed to add comment", description: err.message, variant: "destructive" });
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!id || id === "undefined" || id === "null") {
        throw new Error("Invalid comment id");
      }
      await apiRequest(`/api/events/${event!.id}/comments/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", event?.id, "comments"] });
      toast({ title: "Comment deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to delete comment", description: err.message, variant: "destructive" });
    }
  });

  const likeCommentMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!id || id === "undefined" || id === "null") {
        throw new Error("Invalid comment id");
      }
      const userId = localStorage.getItem("userId");
      return await apiRequest(`/api/event-comments/${id}/like`, "POST", { userId: userId || undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", event?.id, "comments"] });
    },
    onError: (err: any) => {
      toast({ title: "Failed to like comment", description: err.message, variant: "destructive" });
    }
  });

  const handleCommentSubmit = (author: string, content: string, parentCommentId?: string, userId?: string, userAvatar?: string) => {
    addCommentMutation.mutate({ author, content, parentCommentId, userId, userAvatar });
  };

  useEffect(() => {
    if (legacyId && event?.event_name_slug) {
      const slugUrl = `/events/${event.event_name_slug}`;
      if (typeof window !== "undefined" && window.location.pathname !== slugUrl) {
        setLocation(slugUrl);
      }
    }
  }, [legacyId, event?.event_name_slug, setLocation]);

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
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">{t("eventNotFound")}</h2>
          <Button onClick={() => setLocation("/")} data-testid="button-back-home">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToHome")}
          </Button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">{t("eventNotFound")}</h2>
          <Button onClick={() => setLocation("/")} data-testid="button-back-home">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToHome")}
          </Button>
        </div>
      </div>
    );
  }

  const title = showTranslation && event.titleAr ? event.titleAr : event.title;
  const description = showTranslation && event.descriptionAr ? event.descriptionAr : event.description;
  const hasTranslation = event.titleAr || event.descriptionAr;

  const firstImageMatch = /<img[^>]+src=["']([^"']+)["']/i.exec(description || "");
  const descriptionImage = firstImageMatch ? firstImageMatch[1] : undefined;
  const seoImage = event.ogImage || event.image || descriptionImage;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const eventSlug = event.event_name_slug || slug || legacyId;
  const eventUrl = `${baseUrl}/events/${eventSlug}`;
  const breadcrumbs = [
    { name: "Events", url: "/category/events" },
    { name: title, url: eventUrl },
  ];

  // restored: render description as raw HTML like earlier behavior

  return (
    <>
      <SEOHead
        title={event.seoTitle || `${title} | Crossfire Wiki`}
        description={event.seoDescription || description?.replace(/<[^>]*>/g, '').substring(0, 155) || ""}
        keywords={event.seoKeywords || [event.type || "event", "crossfire event"]}
        canonicalUrl={event.canonicalUrl || eventUrl}
        ogImage={seoImage}
        twitterImage={event.twitterImage || seoImage}
        ogTitle={event.seoTitle || title}
        ogDescription={event.seoDescription || description?.replace(/<[^>]*>/g, '').substring(0, 155) || ""}
        ogType="article"
        ogUrl={eventUrl}
        ogImageWidth={1200}
        ogImageHeight={630}
        noindex={false}
        schemaType={event.schemaType || "Event"}
        schemaData={{
          name: title,
          description: description?.replace(/<[^>]*>/g, '').substring(0, 200) || "",
          image: seoImage || event.image,
          startDate: event.date,
          eventStatus: "EventScheduled",
          eventAttendanceMode: "OnlineEventAttendanceMode",
        }}
      />
      {event.image && (
        <SEOHead
          onlySchema
          schemaType="ImageObject"
          schemaData={{
            contentUrl: seoImage || event.image,
            name: title,
            description: (description || title || '').replace(/<[^>]*>/g, '').substring(0, 200),
            width: 1200,
            height: 800,
          }}
        />
      )}
      <SEOHead
        onlySchema
        schemaType="BreadcrumbList"
        schemaData={{
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: baseUrl || "https://crossfire.wiki/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Events",
              item: `${baseUrl}/category/events`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: title,
              item: eventUrl,
            },
          ],
        }}
      />
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <Breadcrumbs items={breadcrumbs} />
          <div className="mb-6 flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("back")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRTL(!isRTL)}
              data-testid="button-toggle-rtl-event"
            >
              <Languages className="mr-2 h-4 w-4" />
              {isRTL ? "LTR" : "Translate"}
            </Button>
          </div>

          <Card className="overflow-hidden">
            {event.image && (
              <div className="relative w-full bg-black overflow-hidden flex justify-center">
                {!imgLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
                <img
                  src={event.image}
                  alt={title}
                  className="w-full h-auto md:max-h-[550px] object-contain rounded-xl cursor-zoom-in"
                  onError={(e: any) => { e.currentTarget.src = "/attached_assets/feature-crossfire.jpg"; }}
                  onLoad={() => setImgLoaded(true)}
                  data-testid="img-event"
                  loading="lazy"
                  decoding="async"
                  onClick={() => setViewer({ open: true, src: event.image!, alt: title })}
                />
              </div>
            )}

            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant={event.type === "upcoming" ? "default" : "secondary"}
                  data-testid={`badge-type-${event.type}`}
                >
                  {event.type === "upcoming" ? t("upcoming") : t("trending")}
                </Badge>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="date-text" data-testid="text-date">{event.date}</span>
                </div>

                {hasTranslation && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const next = !showTranslation;
                      setShowTranslation(next);
                      setIsRTL(next);
                    }}
                    data-testid="button-toggle-translation"
                  >
                    <Languages className="mr-2 h-4 w-4" />
                    {showTranslation ? t("showOriginal") : t("showTranslation")}
                  </Button>
                )}
              </div>

              <div>
                <h1 className={`text-3xl md:text-4xl font-bold mb-4 ${isRTL ? "text-right" : ""}`} data-testid="text-title">
                  {title}
                </h1>

                {description && (
                  <div className="w-full overflow-x-auto">
                    <div
                      className={`prose prose-lg dark:prose-invert max-w-none ${isRTL ? "text-right" : ""}`}
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
                          const html = transformEmbeds(description || "");
                          return DOMPurify.sanitize(html, {
                            ALLOWED_TAGS: [
                              'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'strike', 's', 'del', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                              'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'pre', 'code', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span', 'hr', 'small',
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
                      data-testid="text-description"
                    />
                  </div>
                )}
              </div>

              {hasTranslation && (
                <div className="pt-6 border-t">
                  <p className="text-sm text-muted-foreground">
                    {showTranslation ? t("viewingTranslation") : t("translationAvailable")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {event && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Comments</h2>
              <CommentSection
                comments={Array.isArray(comments) ? comments : []}
                onCommentSubmit={handleCommentSubmit}
                isAdmin={Boolean(localStorage.getItem("adminToken"))}
                onDeleteComment={(id) => deleteCommentMutation.mutate(id)}
                onLike={(id) => likeCommentMutation.mutate(id)}
              />
            </div>
          )}
        </div>
      </div>
      <ImageViewerOverlay src={viewer.src} alt={viewer.alt} open={viewer.open} onClose={() => setViewer((v) => ({ ...v, open: false }))} />
    </>
  );
}
