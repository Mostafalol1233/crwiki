import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Video, Play, Star, BookOpen, Radio, Zap, Crosshair } from "lucide-react";
import PageSEO from "@/components/PageSEO";
import { useQuery } from "@tanstack/react-query";
import { ITutorial } from "@shared/mongodb-schema";
import { useEffect, useMemo, useState } from "react";

const CATEGORIES: Array<{ key: string; title: string; description: string; icon: any }> = [
  { key: "tutorial", title: "Tutorial", description: "Guides and how-to videos", icon: BookOpen },
  { key: "streamer", title: "Streamer", description: "Creator spotlights and streams", icon: Radio },
  { key: "highlights", title: "Highlights", description: "Best moments and clips", icon: Zap },
  { key: "game-weapons", title: "Game & Weapons", description: "Loadouts, weapons, and gameplay", icon: Crosshair },
];

export default function VideosPage() {
  const { data: tutorialsData } = useQuery<{ items: ITutorial[], total: number }>({
    queryKey: ["/api/tutorials"],
  });
  const tutorials = tutorialsData?.items || [];

  const featuredVideos = tutorials.slice(0, 3);
  const [activeVideoId, setActiveVideoId] = useState<string>("");

  useEffect(() => {
    if (!activeVideoId && featuredVideos[0]?.id) {
      setActiveVideoId(featuredVideos[0].id);
    }
  }, [activeVideoId, featuredVideos]);

  const activeVideo = useMemo(
    () => featuredVideos.find((video) => video.id === activeVideoId) || featuredVideos[0],
    [activeVideoId, featuredVideos]
  );

  return (
    <>
      <PageSEO
        title={"Videos — CrossFire Wiki"}
        description={"Browse CrossFire videos by category: tutorials, streamer, highlights, and game & weapons."}
        canonicalPath="/videos"
      />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <div className="mb-6">
            <Link href="/">
              <Button variant="ghost" data-testid="button-back">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>

          <div className="mb-10">
            <h1 className="text-4xl font-bold mb-3" data-testid="text-page-title">Videos</h1>
            <p className="text-muted-foreground">Choose a category to explore CrossFire videos</p>
          </div>

          {/* Featured Videos Section */}
          {featuredVideos.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center gap-2 mb-6">
                <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                <h2 className="text-2xl font-bold">Featured Videos</h2>
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                {activeVideo && (
                  <Card className="overflow-hidden border-border/60">
                    <div className="aspect-video bg-black">
                      <iframe
                        title={activeVideo.title}
                        src={`https://www.youtube.com/embed/${activeVideo.youtubeId}`}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                    <CardContent className="space-y-4 p-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <Video className="h-4 w-4 text-primary" />
                        <span className="text-sm uppercase tracking-widest text-muted-foreground">
                          Featured player
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold">{activeVideo.title}</h3>
                      {activeVideo.description && (
                        <p className="text-muted-foreground">{activeVideo.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Button asChild>
                          <Link href={`/tutorials/${activeVideo.tutorial_slug || activeVideo.id}`}>
                            Open full video page
                          </Link>
                        </Button>
                        <Button asChild variant="outline">
                          <a
                            href={`https://www.youtube.com/watch?v=${activeVideo.youtubeId}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Watch on YouTube
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex flex-col gap-4">
                  {featuredVideos.map((video) => (
                    <button
                      key={video.id}
                      type="button"
                      onClick={() => setActiveVideoId(video.id)}
                      className={`group overflow-hidden rounded-xl border text-left shadow-md transition-all hover:shadow-lg ${
                        activeVideo?.id === video.id
                          ? "border-primary ring-1 ring-primary/50"
                          : "border-border/60"
                      }`}
                    >
                      <div className="relative aspect-video bg-muted">
                        <img
                          src={`https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`}
                          alt={video.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.src.includes('maxresdefault')) {
                              target.src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
                            } else if (target.src.includes('hqdefault')) {
                              target.src = `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`;
                            }
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                          <div className="rounded-full bg-background/85 p-3 backdrop-blur-sm">
                            <Play className="h-5 w-5 fill-primary text-primary" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 p-4">
                        <h3 className="line-clamp-2 font-semibold">{video.title}</h3>
                        {video.category && (
                          <p className="text-xs uppercase tracking-widest text-muted-foreground">
                            {video.category}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Categories</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                return (
                  <Link key={c.key} href={`/videos/${c.key}`}>
                    <Card className="hover-elevate cursor-pointer h-full border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/50" data-testid={`card-video-category-${c.key}`}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" />
                          </div>
                          {c.title}
                        </CardTitle>
                        <CardDescription>{c.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button variant="ghost" className="w-full justify-between group">
                          Browse
                          <ArrowLeft className="h-4 w-4 rotate-180 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
