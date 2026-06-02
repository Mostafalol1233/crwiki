import { useMemo } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ThumbsUp, Calendar, Play } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="flex items-center gap-2 text-sm" style={{ color: "#555" }}>
          <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "#f5a623", borderTopColor: "transparent" }} />
          Loading videos...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <p className="text-sm" style={{ color: "#555" }}>Failed to load videos</p>
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
      <div className="min-h-screen" style={{ background: "var(--background)" }}>

        {/* Hero */}
        <div className="relative overflow-hidden py-12 md:py-16 text-center" style={{ background: "linear-gradient(to bottom, #0d0d0d 0%, var(--background) 100%)", borderBottom: "1px solid rgba(245,166,35,0.1)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(245,166,35,0.04) 0%, transparent 70%)" }} />
          <div className="relative max-w-3xl mx-auto px-6">
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5" style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: "2px" }}>
              <Play className="h-3 w-3" style={{ color: "#f5a623" }} />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: "#f5a623" }}>Videos</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-2" style={{ color: "var(--foreground)" }} data-testid="text-page-title">
              {title} <span style={{ color: "#f5a623" }}>Videos</span>
            </h1>
            <p className="text-sm" style={{ color: "#555" }}>{filtered.length} videos available</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          {/* Back navigation */}
          <div className="flex gap-3 mb-8">
            <Link href="/videos">
              <a className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider hover:opacity-80" style={{ color: "#555" }} data-testid="button-back-videos">
                <ArrowLeft className="h-3 w-3" /> Videos
              </a>
            </Link>
            <span style={{ color: "#333" }}>/</span>
            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#f5a623" }}>{title}</span>
          </div>

          {filtered.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((tutorial: any) => (
                <Link
                  key={tutorial.id}
                  href={tutorial.tutorial_slug ? `/tutorials/${tutorial.tutorial_slug}` : `/tutorials/id/${tutorial.id}`}
                >
                  <a className="block group transition-all hover:brightness-105" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={`https://img.youtube.com/vi/${tutorial.youtubeId}/maxresdefault.jpg`}
                        alt={tutorial.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${tutorial.youtubeId}/default.jpg`; }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.3)" }}>
                        <div className="w-10 h-10 flex items-center justify-center" style={{ background: "rgba(245,166,35,0.9)", borderRadius: "50%" }}>
                          <Play className="h-4 w-4" style={{ fill: "#000", color: "#000" }} />
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-sm line-clamp-2 mb-2" style={{ color: "var(--foreground)" }}>{tutorial.title}</h3>
                      {tutorial.description && (
                        <p className="text-xs line-clamp-2 mb-3" style={{ color: "#666" }}>{tutorial.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-[10px]" style={{ color: "#555" }}>
                          <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{tutorial.likes || 0}</span>
                          {tutorial.createdAt && (
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(tutorial.createdAt), "MMM d, yyyy")}</span>
                          )}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5" style={{ background: "rgba(245,166,35,0.1)", color: "#f5a623", borderRadius: "2px" }}>{title}</span>
                      </div>
                    </div>
                  </a>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "4px" }}>
              <Play className="h-10 w-10 mx-auto mb-3 opacity-10" style={{ color: "#f5a623" }} />
              <p className="text-sm font-black uppercase tracking-wider" style={{ color: "#444" }} data-testid="text-no-videos">No videos in this category yet</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
