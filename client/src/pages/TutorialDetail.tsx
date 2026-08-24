import { useState, useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useLanguage } from "@/components/LanguageProvider";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ThumbsUp, ArrowLeft, Frown, Smile } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Tutorial } from "@shared/mongodb-schema";
import { format } from "date-fns";
import { localizedPath } from "@/lib/routePaths";

export default function TutorialDetailPage() {
  const params = useParams();
  const slug = (params as any)?.slug as string | undefined;
  const legacyId = (params as any)?.legacyId as string | undefined;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const localPath = (path: string) => localizedPath(path, language);

  const [showLikeDialog, setShowLikeDialog] = useState(false);

  const { data: tutorial, isLoading: tutorialLoading, isError: tutorialError } = useQuery<any>({
    queryKey: ["tutorial", slug || legacyId || ""],
    enabled: !!(slug || legacyId),
    queryFn: async () => {
      const { getTutorials } = await import("@/lib/supabaseApi");
      const tutorials = await getTutorials();
      if (slug) {
        const found = tutorials.find((t: any) => t.tutorial_slug === slug || t.id === slug);
        if (!found) throw new Error("Tutorial not found");
        return found;
      }
      if (!legacyId) throw new Error("No tutorial identifier provided");
      const found = tutorials.find((t: any) => t.id === legacyId);
      if (!found) throw new Error("Tutorial not found");
      return found;
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const id = (tutorial as any)?.id || legacyId;
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.from('tutorials').update({ likes: supabase.rpc('increment', { row_id: id, amount: 1 }) } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      const id = (tutorial as any)?.id || legacyId || "";
      queryClient.invalidateQueries({ queryKey: ["/api/tutorials", id] });
      toast({
        title: "Liked!",
        description: "Thank you for your support!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to like tutorial",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (legacyId && (tutorial as any)?.tutorial_slug) {
      const target = localPath(`/tutorials/${(tutorial as any).tutorial_slug}`);
      if (typeof window !== "undefined" && window.location.pathname !== target) {
        setLocation(target);
      }
    }
  }, [legacyId, tutorial, setLocation]);

  const handleLikeClick = () => {
    setShowLikeDialog(true);
  };

  const handleLikeHere = () => {
    likeMutation.mutate();
    setShowLikeDialog(false);
  };

  const handleLikeYoutube = () => {
    if (tutorial) {
      const externalUrl = tutorial.youtube_url || tutorial.youtubeUrl || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined);
      if (externalUrl) window.open(externalUrl, "_blank");
    }
    setShowLikeDialog(false);
  };

  if (tutorialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg text-muted-foreground">{isAr ? "جارٍ تحميل الدليل..." : "Loading tutorial..."}</div>
      </div>
    );
  }

  if (tutorialError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">{isAr ? "تعذر تحميل الدليل" : "Failed to load tutorial"}</h2>
          <Button onClick={() => setLocation(localPath("/videos"))} data-testid="button-back-tutorials-error">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {isAr ? "العودة إلى الأدلة" : "Back to Tutorials"}
          </Button>
        </div>
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">{isAr ? "الدليل غير موجود" : "Tutorial Not Found"}</h2>
          <p className="text-muted-foreground">{isAr ? "الدليل الذي تبحث عنه غير موجود." : "The tutorial you're looking for doesn't exist."}</p>
          <Button onClick={() => setLocation(localPath("/videos"))} data-testid="button-back-tutorials">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {isAr ? "العودة إلى الأدلة" : "Back to Tutorials"}
          </Button>
        </div>
      </div>
    );
  }

  const tutorialSlug = tutorial?.tutorial_slug || tutorial?.slug || slug || legacyId || tutorial?.id;
  const canonicalOrigin = "https://crossfire.wiki";
  const canonicalUrl = `${canonicalOrigin}${localPath(`/tutorials/${tutorialSlug}`)}`;
  const videoId = tutorial?.youtube_id || tutorial?.youtubeId || (() => {
    const raw = tutorial?.youtube_url || tutorial?.youtubeUrl || "";
    const match = raw.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^?&/]+)/i);
    return match?.[1];
  })();
  const image = tutorial?.image_url || tutorial?.image || tutorial?.thumbnailUrl || tutorial?.thumbnail_url || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : `${canonicalOrigin}/logo-new.png`);
  const publishedIso = tutorial?.created_at || tutorial?.createdAt ? new Date(tutorial.created_at || tutorial.createdAt).toISOString() : undefined;
  const modifiedIso = tutorial?.updated_at || tutorial?.updatedAt ? new Date(tutorial.updated_at || tutorial.updatedAt).toISOString() : publishedIso;
  const displayTitle = isAr ? (tutorial?.title_ar || tutorial?.title) : tutorial?.title;
  const description = (isAr ? (tutorial?.description_ar || tutorial?.seo_description_ar) : tutorial?.seo_description) || tutorial?.description || `${isAr ? "دليل CrossFire كامل لـ" : "Complete CrossFire tutorial for "}${displayTitle || "players"}${isAr ? "، مع خطوات عملية ونصائح للعب." : ", including practical steps, strategy and gameplay advice."}`;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <SEOHead
        title={tutorial?.seo_title || (displayTitle ? `${displayTitle} — CrossFire Wiki` : (isAr ? "دليل — CrossFire Wiki" : "Tutorial — CrossFire Wiki"))}
        description={description}
        keywords={["CrossFire tutorial", tutorial?.category || "CrossFire guide", "CrossFire video", "Z8Games"]}
        canonicalUrl={canonicalUrl}
        ogImage={image}
        ogImageAlt={`${displayTitle || (isAr ? "دليل CrossFire" : "CrossFire tutorial")} — CrossFire Wiki`}
        ogImageWidth={1200}
        ogImageHeight={675}
        twitterImage={image}
        ogType="video.other"
        ogUrl={canonicalUrl}
        articlePublishedTime={publishedIso}
        articleModifiedTime={modifiedIso}
        articleAuthor="CrossFire Wiki"
        articleSection="Tutorials & Videos"
        breadcrumbs={[
          { name: isAr ? "الرئيسية" : "Home", url: `${canonicalOrigin}${localPath("/")}` },
          { name: isAr ? "الأدلة" : "Videos", url: `${canonicalOrigin}${localPath("/videos")}` },
          { name: displayTitle || (isAr ? "دليل" : "Tutorial"), url: canonicalUrl },
        ]}
        schemaType="VideoObject"
        schemaData={{
          "@id": `${canonicalUrl}#video`,
          name: displayTitle || (isAr ? "دليل CrossFire" : "CrossFire Tutorial"),
          description: description.substring(0, 500),
          thumbnailUrl: [image],
          uploadDate: publishedIso,
          dateModified: modifiedIso,
          duration: tutorial?.duration || undefined,
          embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : undefined,
          contentUrl: tutorial?.video_url || tutorial?.videoUrl || tutorial?.youtube_url || tutorial?.youtubeUrl || undefined,
          publisher: { "@type": "Organization", name: "CrossFire Wiki", url: canonicalOrigin, logo: { "@type": "ImageObject", url: `${canonicalOrigin}/logo-new.png` } },
          isFamilyFriendly: true,
          inLanguage: isAr ? "ar" : "en",
        }}
        extraSchemas={[{
          "@type": "HowTo",
          name: displayTitle || (isAr ? "دليل CrossFire" : "CrossFire Tutorial"),
          description: description.substring(0, 500),
          image,
          step: [],
        }]}
      />
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <button
          onClick={() => setLocation(localPath("/videos"))}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider mb-6 hover:opacity-80 transition-opacity"
          style={{ color: "#555" }}
          data-testid="button-back"
        >
          <ArrowLeft className="h-3 w-3" /> {isAr ? "العودة إلى الأدلة" : "Back to Videos"}
        </button>

        <div className="overflow-hidden" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
          <div className="aspect-video w-full bg-black">
            <iframe
              width="100%"
              height="100%"
              src={videoId ? `https://www.youtube.com/embed/${videoId}` : undefined}
              title={tutorial.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              data-testid="iframe-youtube"
            />
          </div>

          <div className="p-6 md:p-8 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }} data-testid="text-title">
                {tutorial.title}
              </h1>
              <button
                onClick={handleLikeClick}
                className="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all hover:brightness-110"
                style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", color: "#f5a623", borderRadius: "2px" }}
                data-testid="button-like"
              >
                <ThumbsUp className="h-3 w-3" />
                {tutorial.likes || 0} Likes
              </button>
            </div>

            {tutorial.createdAt && (
              <p className="text-xs" style={{ color: "#555" }}>{format(new Date(tutorial.createdAt), "MMMM d, yyyy")}</p>
            )}

            {tutorial.description && (
              <p className="text-sm leading-relaxed" style={{ color: "#888" }} data-testid="text-description">
                {tutorial.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showLikeDialog} onOpenChange={setShowLikeDialog}>
        <DialogContent data-testid="dialog-like-choice">
          <DialogHeader>
            <DialogTitle>Where would you like to like this video?</DialogTitle>
            <DialogDescription>
              Choose where you'd like to show your support
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={handleLikeHere}
              className="flex flex-col gap-2 h-auto py-6"
              data-testid="button-like-here"
            >
              <Frown className="h-8 w-8 text-muted-foreground" />
              <span>Like Here</span>
              <span className="text-xs text-muted-foreground">Internal counter only</span>
            </Button>
            <Button
              variant="default"
              onClick={handleLikeYoutube}
              className="flex flex-col gap-2 h-auto py-6"
              data-testid="button-like-youtube"
            >
              <Smile className="h-8 w-8" />
              <span>Like on YouTube</span>
              <span className="text-xs">Real support for creators!</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

