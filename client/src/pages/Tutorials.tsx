import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, Calendar, ArrowLeft } from "lucide-react";
import type { Tutorial } from "@shared/mongodb-schema";
import { format } from "date-fns";

export default function TutorialsPage() {
  const { data: tutorials, isLoading } = useQuery<Tutorial[]>({
    queryKey: ["tutorials"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg text-muted-foreground">Loading tutorials...</div>
      </div>
    );
  }

  return (
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

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4" data-testid="text-page-title">
            Video Tutorials
          </h1>
          <p className="text-muted-foreground">
            Learn how to play CrossFire with our video tutorial collection
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tutorials && tutorials.length > 0 ? (
            tutorials.map((tutorial) => (
              <Link key={tutorial.id} href={`/tutorials/${tutorial.id}`}>
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
                    <CardTitle className="line-clamp-2" data-testid={`text-tutorial-title-${tutorial.id}`}>
                      {tutorial.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tutorial.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {tutorial.description}
                      </p>
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
                            <span>{format(new Date(tutorial.createdAt), "MMM d, yyyy")}</span>
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary">Tutorial</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground" data-testid="text-no-tutorials">
                No tutorials available yet
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

