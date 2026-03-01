import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { HeroSection } from "@/components/HeroSection";
import PageSEO from "@/components/PageSEO";
import { ArticleCard, type Article } from "@/components/ArticleCard";
import { Sidebar } from "@/components/Sidebar";
import { EventsRibbon } from "@/components/EventsRibbon";
import RawHtmlPreview from "@/components/RawHtmlPreview";
import { useLanguage } from "@/components/LanguageProvider";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ThumbsUp, Play, Flame, Calendar, ExternalLink, Globe, User } from "lucide-react";
import tutorialImage from "@assets/generated_images/Tutorial_article_cover_image_2152de25.png";
import type { Tutorial } from "@shared/mongodb-schema";

export default function Home() {
  function RatioBox({ src, alt, mdHeightClass = "", children }: { src: string; alt: string; mdHeightClass?: string; children?: React.ReactNode }) {
    const [ratio, setRatio] = useState<number>(9 / 16);
    return (
      <div
        className={`relative w-full overflow-hidden rounded-md bg-transparent p-0 md:p-1 ${mdHeightClass}`}
        style={{ paddingTop: `${ratio * 100}%` }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-contain rounded-xl transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth > 0) setRatio(img.naturalHeight / img.naturalWidth);
            }}
          />
        </div>
        {children}
      </div>
    );
  }
  const { t } = useLanguage();

  const { data: postsData } = useQuery<{ items: Article[], total: number }>({
    queryKey: ["/api/posts", { limit: 50 }],
    queryFn: () => apiRequest("/api/posts?limit=50", "GET"),
  });
  const allPosts = postsData?.items || [];

  const { data: eventsData } = useQuery<{ items: any[], total: number }>({
    queryKey: ["/api/events", { limit: 10 }],
    queryFn: () => apiRequest("/api/events?limit=10", "GET"),
  });
  const allEvents = eventsData?.items || [];
  const displayEvents = useMemo(() => {
    return allEvents
      .filter((e: any) => !e.rawHtmlContent)
      .filter((e: any) => (String(e.title || "").trim().length > 0) && (String(e.description || e.content || "").trim().length > 0))
      .slice(0, 5);
  }, [allEvents]);

  const { data: newsData } = useQuery<{ items: any[], total: number }>({
    queryKey: ["/api/news", { limit: 20 }],
    queryFn: () => apiRequest("/api/news?limit=20", "GET"),
  });
  const allNews = newsData?.items || [];

  const { data: tutorialsData } = useQuery<{ items: Tutorial[], total: number }>({
    queryKey: ["/api/tutorials"],
  });
  const allTutorials = tutorialsData?.items || [];

  const [zoom, setZoom] = useState(1);

  const heroPost = allPosts.filter((p: any) => p.previewOnHome !== false).find((p) => p.featured) || {
    id: "1",
    title: "Bimora Gaming — Quick, Simple & Massive",
    summary:
      "Play CrossFire with the ultimate Bimora hub for news, events, guides and community highlights. Jump in and start exploring now.",
    category: "Tutorials",
    image: tutorialImage,
    author: "Bimora Team",
    date: "Today",
    readingTime: 1,
    views: 0,
    tags: ["Welcome", "Getting Started"],
  };

  const hasFeaturedPost = allPosts.some((p) => p.featured);

  const [heroBgUrl, setHeroBgUrl] = useState<string>("");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiRequest("/api/public/settings/site", "GET");
        const url = String(data?.backgroundImageUrl || "").trim();
        if (!cancelled) setHeroBgUrl(url);
      } catch { }
    })();
    return () => { cancelled = true; };
  }, []);

  const showPortalSections = false;

  const latestArticles = useMemo(() => {
    return allPosts.filter((p: any) => p.previewOnHome !== false).slice(0, 4);
  }, [allPosts]);

  const recentPosts = useMemo(() => {
    return allPosts.slice(0, 3).map((post) => ({
      id: post.id,
      post_slug: post.post_slug,
      title: post.title,
      image: post.image,
      date: post.date,
    }));
  }, [allPosts]);

  const mostViewed = useMemo(() => {
    return [...allPosts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
  }, [allPosts]);

  const popularTags = useMemo(() => {
    const tagsMap: Record<string, number> = {};
    allPosts.forEach((post) => {
      post.tags?.forEach((tag) => {
        tagsMap[tag] = (tagsMap[tag] || 0) + 1;
      });
    });
    return Object.entries(tagsMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [allPosts]);

  const bimoraPicks = useMemo(() => {
    return allPosts
      .filter((post: any) => post.featured && post.previewOnHome !== false)
      .slice(0, 2)
      .map((post: any) => ({
        id: post.id,
        post_slug: post.post_slug,
        title: post.title,
        image: post.image,
        date: post.date,
      }));
  }, [allPosts]);

  const featuredNews = useMemo(() => {
    return allNews.filter((n: any) => n.featured);
  }, [allNews]);
  const featuredNewsHome = useMemo(() => {
    return allNews.filter((n: any) => n.featured && (n.previewOnHome !== false));
  }, [allNews]);

  return (
    <>
      <PageSEO
        title={"CrossFire Wiki — Guides, Weapons, Modes & Community"}
        description={"CrossFire Wiki: weapons, modes, tutorials, ranks, events, and community resources. Master Crossfire with up-to-date guides, maps and competitive intel."}
      />

      <div className="min-h-screen">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8">
          <HeroSection post={heroPost} bgImageUrl={heroBgUrl} />
          
          <div className="py-12 space-y-16">
            {/* 1. Event-preview priority: Every scraped event is rendered in a dedicated preview card at the top. */}
            {allEvents.filter(e => e.rawHtmlContent).map((event: any) => (
              <Card key={event.id} className="overflow-hidden border-2 border-primary/20 shadow-2xl">
                <div className="bg-primary/5 px-6 py-4 border-b border-primary/10 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                    <span className="font-bold uppercase tracking-widest text-sm text-primary">Forum Announcement</span>
                  </div>
                  <Badge variant="outline" className="bg-background">{event.date}</Badge>
                </div>
                <CardContent className="p-0">
                  <div className="p-6 md:p-10">
                    <h2 className="text-3xl md:text-4xl font-black mb-6 uppercase tracking-tight italic text-primary">
                      {event.title}
                    </h2>
                    <RawHtmlPreview 
                      html={event.rawHtmlContent} 
                      className="min-h-[200px]"
                    />
                  </div>
                  {event.image && (
                    <div className="w-full h-64 md:h-96 relative">
                      <img 
                        src={event.image} 
                        alt={event.title} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Existing Ribbon for other events */}
            <div className="wiki-content-card rounded-2xl overflow-hidden">
              <EventsRibbon events={displayEvents} />
            </div>

            <div className="max-w-6xl mx-auto space-y-24">
              {/* 2. Behind it (background) show a “Recent Posts” section. */}
              <section className="space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ThumbsUp className="h-6 w-6 text-primary" />
                    <h2 className="text-3xl font-black uppercase tracking-tight italic">
                      {t("recentPosts") || "Recent Posts"}
                    </h2>
                  </div>
                  <Link href="/posts">
                    <Button variant="ghost" className="hover:text-primary transition-colors uppercase font-bold tracking-widest text-xs">
                      View All Posts →
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {allPosts.slice(0, 6).map((post) => (
                    <ArticleCard key={post.id} article={post} />
                  ))}
                </div>
              </section>

              {/* 3. Below that show “Recent News”. */}
              <section className="space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                    <h2 className="text-3xl font-black uppercase tracking-tight italic">
                      {t("latestNews") || "Latest News"}
                    </h2>
                  </div>
                  <Link href="/news">
                    <Button variant="ghost" className="hover:text-primary transition-colors uppercase font-bold tracking-widest text-xs">
                      View All News →
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {allNews.slice(0, 4).map((item: any) => (
                    <ArticleCard key={item.id} article={item} />
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
