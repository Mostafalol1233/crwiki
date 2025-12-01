import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowLeft, Languages } from "lucide-react";
import { useState, useEffect } from "react";
import DOMPurify from "isomorphic-dompurify";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/Breadcrumbs";

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
  const [error, setError] = useState<Error | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isRTL, setIsRTL] = useState(false);

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
        ogImage={event.ogImage || event.image}
        twitterImage={event.twitterImage || event.ogImage || event.image}
        ogTitle={event.seoTitle || title}
        ogDescription={event.seoDescription || description?.replace(/<[^>]*>/g, '').substring(0, 155) || ""}
        ogType="event"
        ogUrl={eventUrl}
        schemaType={event.schemaType || "Event"}
        schemaData={{
          name: title,
          description: description?.replace(/<[^>]*>/g, '').substring(0, 200) || "",
          image: event.image,
          startDate: event.date,
          eventStatus: "EventScheduled",
          eventAttendanceMode: "OnlineEventAttendanceMode",
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
            <div className="w-full bg-black overflow-hidden flex justify-center">
              <img
                src={event.image}
                alt={title}
                className="w-full h-auto max-h-[550px] object-contain"
                onError={(e: any) => { e.currentTarget.src = "/attached_assets/feature-crossfire.jpg"; }}
                data-testid="img-event"
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
                <span data-testid="text-date">{event.date}</span>
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
                <div 
                  className={`prose prose-lg dark:prose-invert max-w-none ${isRTL ? "text-right" : ""}`}
                  dir={isRTL ? "rtl" : undefined}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description, {
                    ALLOWED_TAGS: [
                      'p','br','strong','b','em','i','u','strike','s','del','h1','h2','h3','h4','h5','h6',
                      'ul','ol','li','a','img','blockquote','pre','code','table','thead','tbody','tr','th','td','div','span','hr','small'
                    ],
                    ALLOWED_ATTR: ['href','src','alt','title','style','class','width','height','target','rel'],
                    ALLOW_DATA_ATTR: false,
                    KEEP_CONTENT: true,
                  }) }}
                  data-testid="text-description"
                />
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
      </div>
    </div>
    </>
  );
}
