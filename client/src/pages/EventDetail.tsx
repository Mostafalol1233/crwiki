import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowLeft, Languages } from "lucide-react";
import { useState } from "react";
import createDOMPurify from "dompurify";
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
  seoKeywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  twitterImage?: string;
  schemaType?: string;
}

export default function EventDetail() {
  // wouter's useParams can be untyped in some versions; read params then cast safely
  const params = useParams();
  const id = params?.id as string | undefined;
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [error, setError] = useState<Error | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: ["event", id],
    enabled: !!id,
    retry: 1,
    queryFn: async () => {
      if (!id) throw new Error("No event ID provided");
      const res = await fetch(`/api/events/${id}`);
      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        throw new Error(`Failed to load event: ${res.status} ${errorText}`);
      }
      return res.json();
    },
  });

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
          <h2 className="text-2xl font-semibold mb-4">Error Loading Event</h2>
          <p className="text-muted-foreground mb-4">Sorry, there was a problem loading this event.</p>
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
  const eventUrl = `${baseUrl}/events/${id}`;
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
        keywords={event.seoKeywords || [event.type, "crossfire event"]}
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
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("back")}
            </Button>
          </div>

        <Card className="overflow-hidden">
          {event.image && (
            <div className="w-full bg-black overflow-hidden flex justify-center">
              <img
                src={event.image}
                alt={title}
                className="w-full h-auto max-h-[550px] object-contain"
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
                  onClick={() => setShowTranslation(!showTranslation)}
                  data-testid="button-toggle-translation"
                >
                  <Languages className="mr-2 h-4 w-4" />
                  {showTranslation ? t("showOriginal") : t("showTranslation")}
                </Button>
              )}
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-title">
                {title}
              </h1>

              {description && (
                <div 
                  className="prose prose-lg dark:prose-invert max-w-none"
                  // createDOMPurify returns a DOMPurify instance bound to the window
                  dangerouslySetInnerHTML={{ __html: createDOMPurify(window as unknown as Window).sanitize(description) }}
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
