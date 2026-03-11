import { useMemo } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ThumbsUp, Calendar } from "lucide-react";
import type { Tutorial } from "@shared/mongodb-schema";
import { format } from "date-fns";
import PageSEO from "@/components/PageSEO";

const CATEGORY_LABEL: Record<string, string> = {
  "tutorial": "Tutorial",
  "streamer": "Streamer",
  "highlights": "Highlights",
  "game-weapons": "Game & Weapons",
};

export default function VideosCategoryPage() {
  const params = useParams();
  const category = String((params as any)?.category || "");

  const { data: tutorialsData, isLoading, isError } = useQuery<{ items: Tutorial[], total: number }>({
    queryKey: ["/api/tutorials"],
  });
  const tutorials = tutorialsData?.items || [];

  const filtered = useMemo(() => {
    const key = category || "tutorial";
    return (tutorials || []).filter((t: any) => String(t?.category || "tutorial") === key);
  }, [tutorials, category]);

  const title = CATEGORY_LABEL[category] || "Videos";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg text-muted-foreground">Loading videos...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg text-muted-foreground">Failed to load videos</div>
      </div>
    );
  }

  return (
    <>
      <PageSEO
        title={`${title} Videos — CrossFire Wiki`}
        description={`Browse ${title} videos on CrossFire Wiki.`}
        canonicalPath={`/videos/${category}`}
      />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <div className="mb-6 flex flex-wrap gap-2">
            <Link href="/videos">
              <Button variant="ghost" data-testid="button-back-videos">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Videos
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" data-testid="button-back-home">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-3" data-testid="text-page-title">{title} Videos</h1>
            <p className="text-muted-foreground">{filtered.length} videos</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.length > 0 ? (
              filtered.map((tutorial: any) => (
                <Link
                  key={tutorial.id}
                  href={tutorial.tutorial_slug ? `/tutorials/${tutorial.tutorial_slug}` : `/tutorials/id/${tutorial.id}`}
                >
                  <Card className="hover-elevate cursor-pointer h-full">
                    <div className="aspect-video w-full bg-black rounded-t-lg overflow-hidden">
                      <img
                        src={`https://img.youtube.com/vi/${tutorial.youtubeId}/maxresdefault.jpg`}
                        alt={tutorial.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${tutorial.youtubeId}/default.jpg`;
                        }}
                      />
                    </div>
                    <CardHeader>
                      <CardTitle className="line-clamp-2">{tutorial.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {tutorial.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{tutorial.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{tutorial.likes || 0}</span>
                          </div>
                          {tutorial.createdAt && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span className="date-text">{format(new Date(tutorial.createdAt), "MMM d, yyyy")}</span>
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary">{title}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground" data-testid="text-no-videos">No videos in this category yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
