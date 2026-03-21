import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowLeft, Languages, List, ChevronUp, Clock3, Sparkles } from "lucide-react";
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

interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

const parseEventDate = (value?: string) => {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : new Date(parsed);
};

const formatTimeRemaining = (targetDate: Date, now: number, language: "en" | "ar") => {
  const diff = targetDate.getTime() - now;
  if (diff <= 0) {
    return language === "ar" ? "انتهى الحدث أو بدأ بالفعل" : "Event is live or already ended";
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (language === "ar") {
    return `${days} يوم • ${hours} ساعة • ${minutes} دقيقة`;
  }

  return `${days}d • ${hours}h • ${minutes}m`;
};

export default function EventDetail() {
  const params = useParams();
  const slug = params?.slug as string | undefined;
  const legacyId = params?.legacyId as string | undefined;
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [isRTL, setIsRTL] = useState(false);
  const [contentLanguage, setContentLanguage] = useState<"en" | "ar" | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [viewer, setViewer] = useState<{ open: boolean; src: string; alt?: string }>({ open: false, src: "" });
  const [now, setNow] = useState(() => Date.now());
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

  const preferredArabic = language === "ar";
  const hasArabicVersion = Boolean((event?.titleAr && event.titleAr.trim()) || (event?.descriptionAr && event.descriptionAr.trim()));
  const canToggleLanguage = hasArabicVersion;
  const resolvedContentLanguage = contentLanguage || (preferredArabic && hasArabicVersion ? "ar" : "en");
  const useArabicContent = resolvedContentLanguage === "ar" && hasArabicVersion;

  const title = useArabicContent ? event?.titleAr || event?.title || "" : event?.title || event?.titleAr || "";
  const description = useArabicContent ? event?.descriptionAr || event?.description || "" : event?.description || event?.descriptionAr || "";
  const eventDate = useMemo(() => parseEventDate(event?.date), [event?.date]);
  const rawDescription = useMemo(() => {
    if (!description) return "";
    const doc = new DOMParser().parseFromString(description, "text/html");
    doc.querySelectorAll("h2, h3, h4").forEach((h, i) => {
      h.id = `event-heading-${i}`;
    });
    return doc.body.innerHTML;
  }, [description]);
  const countdownLabel = useMemo(() => {
    if (!eventDate) {
      return t("eventDatePending");
    }
    return formatTimeRemaining(eventDate, now, useArabicContent ? "ar" : "en");
  }, [eventDate, now, t, useArabicContent]);
  const metaCards = useMemo(() => ([
    {
      label: t("currentLanguage"),
      value: useArabicContent ? "العربية" : "English",
    },
    {
      label: t("published"),
      value: event?.date || "—",
    },
    {
      label: t("eventStatus"),
      value: countdownLabel,
    },
  ]), [countdownLabel, event?.date, t, useArabicContent]);
  const tocTitle = t("tableOfContents");
  const quickTipsTitle = t("quickTips");
  const backToTopLabel = t("backToTop");
  const emptyTocLabel = t("headingsPlaceholder");
  const quickTips = useMemo(() => useArabicContent
    ? [
      "تحقق من موعد انتهاء الحدث قبل فوات المكافآت.",
      "احتفظ بالروابط والصور الرسمية قبل مشاركتها.",
      "استخدم قسم التعليقات لمتابعة تحديثات المجتمع.",
    ]
    : [
      "Check the event deadline before rewards expire.",
      "Save official links and images before sharing the event.",
      "Use the comments section to track community updates.",
    ], [useArabicContent]);

  useEffect(() => {
    if (!description) {
      setHeadings([]);
      return;
    }
    const doc = new DOMParser().parseFromString(description, "text/html");
    const hData = Array.from(doc.querySelectorAll("h2, h3, h4"))
      .map((h, i) => ({
        id: `event-heading-${i}`,
        text: (h.textContent || "").trim(),
        level: parseInt(h.tagName.substring(1), 10),
      }))
      .filter((heading) => heading.text.length > 0);
    setHeadings(hData);
  }, [description]);

  useEffect(() => {
    if (!eventDate) return;
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, [eventDate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-muted-foreground">{t("loading")}</div>
      </div>
    );
  }

  if (isError || !event) {
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
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <div className="w-full px-4 py-8 md:px-8 md:py-12">
          {!(event as any).fullLayout && <Breadcrumbs items={breadcrumbs} />}
          <div className="mb-8 mt-4 flex flex-wrap items-center gap-3 no-print">
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
              <div className="flex items-center gap-2">
                <Button
                  variant={resolvedContentLanguage === "ar" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setContentLanguage("ar")}
                  className="rounded-xl font-bold tracking-tight"
                >
                  <Languages className="mr-2 h-4 w-4" /> العربية
                </Button>
                <Button
                  variant={resolvedContentLanguage === "en" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setContentLanguage("en")}
                  className="rounded-xl font-bold tracking-tight"
                >
                  English
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setContentLanguage(null)}
                  className="rounded-xl font-semibold text-xs"
                >
                  Auto
                </Button>
              </div>
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

          <div className={`${(event as any).fullLayout ? "" : "wiki-content-card overflow-hidden rounded-3xl border border-primary/10 bg-card/90 p-4 shadow-2xl shadow-primary/5 backdrop-blur-sm md:p-8 lg:p-10 w-full"}`}>
            <div className={`${(event as any).fullLayout ? "" : "grid grid-cols-1 gap-8 lg:grid-cols-12 xl:gap-12"}`}>
              <article dir={isRTL || useArabicContent ? "rtl" : undefined} className={`lg:col-span-8 ${isRTL || useArabicContent ? "text-right" : undefined}`}>
                {!(event as any).fullLayout && (
                  <header className="mb-12">
                    <div className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-5 py-6 text-slate-50 shadow-2xl md:px-8 md:py-8">
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.24),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(239,68,68,0.16),_transparent_30%)]" />
                      <div className="relative z-10">
                        <div className="mb-6 flex flex-wrap items-center gap-4">
                          <Badge
                            variant={event.type === "upcoming" ? "default" : "secondary"}
                            className="rounded-none bg-primary px-4 py-1 text-xs font-black uppercase italic hover:bg-primary/80 sm:text-sm"
                          >
                            {event.type === "upcoming" ? t("upcoming") : t("trending")}
                          </Badge>

                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
                            <Calendar className="h-4 w-4" />
                            <span className="date-text">{event.date}</span>
                          </div>
                        </div>

                        <h1 className={`mb-6 text-3xl font-black leading-tight tracking-tighter text-white sm:text-4xl md:mb-8 md:text-6xl lg:text-7xl ${useArabicContent ? "not-italic" : "uppercase italic"} ${isRTL || useArabicContent ? "text-right" : ""}`}>
                          {title}
                        </h1>

                        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px] md:items-end">
                          <p className="max-w-3xl text-sm leading-7 text-slate-200 md:text-base">
                            {event.seoDescription || description.replace(/<[^>]*>/g, '').substring(0, 220) || title}
                          </p>
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
                              <Clock3 className="h-4 w-4" />
                              {t("countdown")}
                            </div>
                            <div className="text-lg font-black text-white">{countdownLabel}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {event.image && (
                      <div className="group relative mt-8 w-full overflow-hidden rounded-3xl border border-primary/10 aspect-video shadow-2xl shadow-primary/10">
                        <img
                          src={event.image}
                          alt={title}
                          className="h-full w-full cursor-zoom-in object-cover transition duration-500 group-hover:scale-[1.02]"
                          onClick={() => setViewer({ open: true, src: event.image!, alt: title })}
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-80" />
                      </div>
                    )}
                  </header>
                )}

                {hasArabicVersion && (
                  <p className="mb-6 text-sm font-medium text-muted-foreground md:text-base">
                    {useArabicContent ? "النسخة العربية مفعّلة الآن." : "English version is currently active."}
                  </p>
                )}

                <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {metaCards.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 to-amber-500/5 px-4 py-4 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                      <div className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{item.label}</div>
                      <div className="text-sm font-semibold leading-6">{item.value}</div>
                    </div>
                  ))}
                </div>

                {headings.length > 0 && (
                  <div className="mb-8 rounded-2xl border border-border/60 bg-muted/30 p-4 lg:hidden">
                    <div className="mb-3 flex items-center gap-2 font-bold">
                      <List className="h-4 w-4 text-primary" />
                      <span>{tocTitle}</span>
                    </div>
                    <div className="space-y-2">
                      {headings.map((heading) => (
                        <button
                          key={heading.id}
                          type="button"
                          onClick={() => document.getElementById(heading.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                          className={`block text-sm text-muted-foreground transition hover:text-primary ${isRTL || useArabicContent ? "text-right" : "text-left"} ${heading.level > 2 ? (isRTL || useArabicContent ? "pr-4" : "pl-4") : ""}`}
                        >
                          {heading.text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`mb-16 rounded-3xl border border-border/60 bg-background/70 p-4 shadow-sm md:p-6 ${isRTL || useArabicContent ? "text-right" : ""}`} dir={isRTL || useArabicContent ? "rtl" : undefined} ref={contentRef}>
                  <RawHtmlPreview html={rawDescription || ""} isFullPage={(event as any).fullLayout} isRTL={isRTL || useArabicContent} />
                </div>

                <div className="mt-12 border-t pt-12">
                  <CommentSection
                    comments={Array.isArray(comments) ? comments : []}
                    onCommentSubmit={handleCommentSubmit}
                    isAdmin={Boolean(localStorage.getItem("adminToken"))}
                    onDeleteComment={(id) => deleteCommentMutation.mutate(id)}
                    onLike={(id) => likeCommentMutation.mutate(id)}
                  />
                </div>
              </article>
              {!(event as any).fullLayout && (
                <aside className="hidden lg:col-span-4 lg:block">
                  <div className="sticky top-24 space-y-6">
                    <div className="rounded-3xl border border-border/60 bg-card/90 p-6 shadow-xl shadow-primary/5 backdrop-blur-sm">
                      <div className="mb-4 flex items-center gap-2 font-black uppercase tracking-tight">
                        <List className="h-4 w-4 text-primary" />
                        {tocTitle}
                      </div>
                      {headings.length > 0 ? (
                        <nav className="space-y-2">
                          {headings.map((heading) => (
                            <button
                              key={heading.id}
                              type="button"
                              onClick={() => document.getElementById(heading.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                              className={`block w-full text-sm text-muted-foreground transition hover:text-primary ${isRTL || useArabicContent ? "text-right" : "text-left"} ${heading.level > 2 ? (isRTL || useArabicContent ? "pr-4" : "pl-4") : ""}`}
                            >
                              {heading.text}
                            </button>
                          ))}
                        </nav>
                      ) : (
                        <p className="text-sm text-muted-foreground">{emptyTocLabel}</p>
                      )}
                    </div>

                    <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-amber-500/10 p-6 shadow-xl shadow-primary/10">
                      <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-primary">
                        <Sparkles className="h-4 w-4" />
                        {quickTipsTitle}
                      </div>
                      <ul className="space-y-3 text-sm text-muted-foreground">
                        {quickTips.map((tip) => (
                          <li key={tip} className="flex items-start gap-2">
                            <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 w-full"
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                      >
                        <ChevronUp className="mr-2 h-4 w-4" />
                        {backToTopLabel}
                      </Button>
                    </div>
                  </div>
                </aside>
              )}
            </div>
          </div>
        </div>
      </div>
      <ImageViewerOverlay src={viewer.src} alt={viewer.alt} open={viewer.open} onClose={() => setViewer((v) => ({ ...v, open: false }))} />
    </>
  );
}
