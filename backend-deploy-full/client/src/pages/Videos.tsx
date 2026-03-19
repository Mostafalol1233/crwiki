import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Video, Play, Star, BookOpen, Radio, Zap, Crosshair } from "lucide-react";
import PageSEO from "@/components/PageSEO";
import { useQuery } from "@tanstack/react-query";
import { ITutorial } from "@shared/mongodb-schema";

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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Main Featured Video */}
                {featuredVideos[0] && (
                  <Link href={`/tutorials/${featuredVideos[0].tutorial_slug || featuredVideos[0].id}`}>
                    <div className="group cursor-pointer relative rounded-xl overflow-hidden aspect-video border bg-muted h-full shadow-lg hover:shadow-xl transition-all">
                      <img
                        src={`https://img.youtube.com/vi/${featuredVideos[0].youtubeId}/maxresdefault.jpg`}
                        alt={featuredVideos[0].title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src.includes('maxresdefault')) {
                            target.src = `https://img.youtube.com/vi/${featuredVideos[0].youtubeId}/hqdefault.jpg`;
                          } else if (target.src.includes('hqdefault')) {
                            target.src = `https://img.youtube.com/vi/${featuredVideos[0].youtubeId}/mqdefault.jpg`;
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="bg-background/80 backdrop-blur-sm rounded-full p-4 transform scale-75 group-hover:scale-100 transition-all">
                          <Play className="h-8 w-8 text-primary fill-primary" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                        <h3 className="text-white text-xl md:text-2xl font-bold mb-2 line-clamp-2">{featuredVideos[0].title}</h3>
                        {featuredVideos[0].description && (
                          <p className="text-white/80 line-clamp-2 hidden md:block">{featuredVideos[0].description}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                )}

                {/* Secondary Featured Videos */}
                <div className="flex flex-col gap-6">
                  {featuredVideos.slice(1, 3).map((video) => (
                    <Link key={video.id} href={`/tutorials/${video.tutorial_slug || video.id}`}>
                      <div className="group cursor-pointer relative rounded-xl overflow-hidden aspect-video border bg-muted shadow-md hover:shadow-lg transition-all">
                        <img
                          src={`https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`}
                          alt={video.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.src.includes('maxresdefault')) {
                              target.src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
                            } else if (target.src.includes('hqdefault')) {
                              target.src = `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`;
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="bg-background/80 backdrop-blur-sm rounded-full p-3 transform scale-75 group-hover:scale-100 transition-all">
                            <Play className="h-6 w-6 text-primary fill-primary" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                          <h3 className="text-white font-semibold line-clamp-2">{video.title}</h3>
                        </div>
                      </div>
                    </Link>
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
