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
      <div className="min-h-screen" style={{ background: "var(--background)" }}>

        {/* Hero */}
        <div className="relative overflow-hidden py-14 md:py-20 text-center" style={{ background: "linear-gradient(to bottom, #0d0d0d 0%, var(--background) 100%)", borderBottom: "1px solid rgba(245,166,35,0.1)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(245,166,35,0.05) 0%, transparent 70%)" }} />
          <div className="relative max-w-3xl mx-auto px-6">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5" style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: "2px" }}>
              <Video className="h-3 w-3" style={{ color: "#f5a623" }} />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: "#f5a623" }}>CrossFire Content</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-none mb-3" style={{ color: "var(--foreground)" }} data-testid="text-page-title">
              CF <span style={{ color: "#f5a623" }}>Videos</span>
            </h1>
            <p className="text-sm" style={{ color: "#666" }}>Choose a category to explore CrossFire videos</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">

          {/* Featured Videos */}
          {featuredVideos.length > 0 && (
            <div className="mb-14">
              <div className="flex items-center gap-2 mb-6">
                <Star className="h-4 w-4" style={{ color: "#f5a623", fill: "#f5a623" }} />
                <h2 className="text-lg font-black uppercase tracking-wider" style={{ color: "var(--foreground)" }}>Featured Videos</h2>
              </div>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                {activeVideo && (
                  <div className="overflow-hidden" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
                    <div className="aspect-video bg-black">
                      <iframe
                        title={activeVideo.title}
                        src={`https://www.youtube.com/embed/${activeVideo.youtubeId}`}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Video className="h-3 w-3" style={{ color: "#f5a623" }} />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: "#f5a623" }}>Featured</span>
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-tight mb-2" style={{ color: "var(--foreground)" }}>{activeVideo.title}</h3>
                      {activeVideo.description && <p className="text-sm mb-4" style={{ color: "#666" }}>{activeVideo.description}</p>}
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/tutorials/${activeVideo.tutorial_slug || activeVideo.id}`}>
                          <a className="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all hover:brightness-110" style={{ background: "#f5a623", color: "#000", borderRadius: "2px" }}>
                            Full Page
                          </a>
                        </Link>
                        <a
                          href={`https://www.youtube.com/watch?v=${activeVideo.youtubeId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all hover:brightness-110"
                          style={{ background: "rgba(255,255,255,0.06)", color: "var(--foreground)", borderRadius: "2px" }}
                        >
                          YouTube ↗
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {featuredVideos.map((video) => (
                    <button
                      key={video.id}
                      type="button"
                      onClick={() => setActiveVideoId(video.id)}
                      className="group overflow-hidden text-left transition-all"
                      style={{
                        background: "var(--card)",
                        border: activeVideo?.id === video.id ? "1px solid rgba(245,166,35,0.4)" : "1px solid rgba(255,255,255,0.05)",
                        borderRadius: "3px",
                      }}
                    >
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={`https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`}
                          alt={video.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.src.includes('maxresdefault')) target.src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
                            else if (target.src.includes('hqdefault')) target.src = `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`;
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.15)" }}>
                          <div className="w-9 h-9 flex items-center justify-center" style={{ background: "rgba(245,166,35,0.9)", borderRadius: "50%" }}>
                            <Play className="h-4 w-4" style={{ color: "#000", fill: "#000" }} />
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="line-clamp-2 font-bold text-sm" style={{ color: "var(--foreground)" }}>{video.title}</h3>
                        {video.category && <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: "#555" }}>{video.category}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Categories */}
          <div className="mb-12">
            <h2 className="text-lg font-black uppercase tracking-wider mb-5" style={{ color: "var(--foreground)" }}>Categories</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                return (
                  <Link key={c.key} href={`/videos/${c.key}`}>
                    <a
                      className="block p-5 transition-all hover:brightness-105 group"
                      style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}
                      data-testid={`card-video-category-${c.key}`}
                    >
                      <div className="w-9 h-9 flex items-center justify-center mb-3" style={{ background: "rgba(245,166,35,0.1)", borderRadius: "2px" }}>
                        <Icon className="h-4.5 w-4.5" style={{ color: "#f5a623" }} />
                      </div>
                      <h3 className="font-black text-sm uppercase tracking-wide mb-1" style={{ color: "var(--foreground)" }}>{c.title}</h3>
                      <p className="text-[11px]" style={{ color: "#555" }}>{c.description}</p>
                      <div className="flex items-center gap-1 mt-3 text-[10px] font-black uppercase tracking-wider" style={{ color: "#f5a623" }}>
                        Browse <ArrowLeft className="h-3 w-3 rotate-180 transition-transform group-hover:translate-x-1" />
                      </div>
                    </a>
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
