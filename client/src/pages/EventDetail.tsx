import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowLeft, Languages } from "lucide-react";
import { useRef, useState, useEffect, useMemo } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ImageViewerOverlay, useZoomableImages } from "@/components/ImageViewer";
import { CommentSection } from "@/components/CommentSection";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import RawHtmlPreview from "@/components/RawHtmlPreview";

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
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [isRTL, setIsRTL] = useState(false);
  const [contentLanguage, setContentLanguage] = useState<"auto" | "en" | "ar">("auto");
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [viewer, setViewer] = useState<{ open: boolean; src: string; alt?: string }>({ open: false, src: "" });
  useZoomableImages(contentRef, (src, alt) => setViewer({ open: true, src, alt }));

  const { data: event, isLoading, isError } = useQuery<Event>({
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

  if (isError) {
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

  const preferredArabic = language === "ar";
  const hasArabicVersion = Boolean((event.titleAr && event.titleAr.trim()) || (event.descriptionAr && event.descriptionAr.trim()));
  const canToggleLanguage = hasArabicVersion;
  const resolvedContentLanguage = contentLanguage === "auto" ? (preferredArabic && hasArabicVersion ? "ar" : "en") : contentLanguage;
  const useArabicContent = resolvedContentLanguage === "ar" && hasArabicVersion;

  const title = useArabicContent ? event.titleAr || event.title : event.title || event.titleAr || "";
  const description = useArabicContent ? event.descriptionAr || event.description : event.description || event.descriptionAr || "";

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
      <div className="min-h-screen">
        <div className="w-full px-4 md:px-8 py-8 md:py-12">
          {!(event as any).fullLayout && <Breadcrumbs items={breadcrumbs} />}
          <div className="mb-8 mt-4 flex items-center gap-3 no-print">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/")}
              className="rounded-xl font-bold tracking-tight"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("back")}
            </Button>
            {canToggleLanguage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setContentLanguage((prev) => (prev === "ar" ? "en" : prev === "en" ? "auto" : "ar"))}
                className="rounded-xl font-bold tracking-tight"
              >
                <Languages className="mr-2 h-4 w-4" />
                {contentLanguage === "auto" ? (preferredArabic ? "تلقائي: عربي" : "Auto: EN") : contentLanguage === "ar" ? "العربية" : "English"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRTL(!isRTL)}
              className="rounded-xl font-bold tracking-tight"
            >
              {isRTL ? "LTR" : "RTL Layout"}
            </Button>
          </div>

          <div className={`${(event as any).fullLayout ? "" : "wiki-content-card rounded-3xl overflow-hidden p-4 md:p-8 lg:p-10 w-full"}`}>
            <article dir={isRTL || useArabicContent ? "rtl" : undefined} className={isRTL || useArabicContent ? "text-right" : undefined}>
              {!(event as any).fullLayout && (
                <header className="mb-12">
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <Badge
                      variant={event.type === "upcoming" ? "default" : "secondary"}
                      className="bg-primary hover:bg-primary/80 rounded-none uppercase font-black italic px-4 py-1 text-xs sm:text-sm"
                    >
                      {event.type === "upcoming" ? t("upcoming") : t("trending")}
                    </Badge>

                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="date-text">{event.date}</span>
                    </div>
                  </div>

                  <h1
                    className={`text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black uppercase italic tracking-tighter leading-tight mb-6 md:mb-8 ${isRTL || useArabicContent ? "text-right" : ""}`}
                  >
                    {title}
                  </h1>

                  {event.image && (
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl mb-12">
                      <img
                        src={event.image}
                        alt={title}
                        className="w-full h-full object-cover cursor-zoom-in"
                        onClick={() => setViewer({ open: true, src: event.image!, alt: title })}
                      />
                    </div>
                  )}
                </header>
              )}

              {hasArabicVersion && (
                <p className="mb-6 text-sm md:text-base text-muted-foreground font-medium">
                  {useArabicContent ? "يتم عرض النسخة العربية الآن — يمكنك التبديل لأي وقت." : "English version is currently shown — switch anytime."}
                </p>
              )}

              <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-semibold">
                  <span className="text-muted-foreground">Language:</span>{" "}
                  {useArabicContent ? "Arabic" : "English"}
                </div>
                <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-semibold">
                  <span className="text-muted-foreground">Published:</span>{" "}
                  {event.date}
                </div>
              </div>

              <div
                className={`mb-16 ${isRTL || useArabicContent ? "text-right" : ""}`}
                dir={isRTL || useArabicContent ? "rtl" : undefined}
                ref={contentRef}
              >
                <RawHtmlPreview 
                  html={description || ""} 
                  isFullPage={(event as any).fullLayout} 
                />
              </div>

              <div className="border-t pt-12 mt-12">
                <CommentSection
                  comments={Array.isArray(comments) ? comments : []}
                  onCommentSubmit={handleCommentSubmit}
                  isAdmin={Boolean(localStorage.getItem("adminToken"))}
                  onDeleteComment={(id) => deleteCommentMutation.mutate(id)}
                  onLike={(id) => likeCommentMutation.mutate(id)}
                />
              </div>
            </article>
          </div>
        </div>
      </div>
      <ImageViewerOverlay src={viewer.src} alt={viewer.alt} open={viewer.open} onClose={() => setViewer((v) => ({ ...v, open: false }))} />
    </>
  );
}
