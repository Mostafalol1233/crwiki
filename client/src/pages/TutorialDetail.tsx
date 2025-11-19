import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ThumbsUp, ArrowLeft, MessageCircle, Frown, Smile } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Tutorial, TutorialComment } from "@shared/mongodb-schema";
import { format } from "date-fns";

export default function TutorialDetailPage() {
  const [, params] = useRoute("/tutorials/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const tutorialId = params?.id;

  const [showLikeDialog, setShowLikeDialog] = useState(false);
  const [commentAuthor, setCommentAuthor] = useState("");
  const [commentContent, setCommentContent] = useState("");

  const { data: tutorial, isLoading: tutorialLoading, isError: tutorialError } = useQuery<Tutorial>({
    queryKey: ["/api/tutorials", tutorialId || ""],
    enabled: !!tutorialId,
  });

  const { data: comments = [], isError: commentsError } = useQuery<TutorialComment[]>({
    queryKey: ["/api/tutorials", tutorialId || "", "comments"],
    enabled: !!tutorialId,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/tutorials/${tutorialId}/like`, "POST", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tutorials", tutorialId || ""] });
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

  const commentMutation = useMutation({
    mutationFn: async (data: { author: string; content: string }) => {
      return await apiRequest(`/api/tutorials/${tutorialId}/comments`, "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tutorials", tutorialId || "", "comments"] });
      setCommentAuthor("");
      setCommentContent("");
      toast({
        title: "Comment Posted",
        description: "Your comment has been added!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to post comment",
        variant: "destructive",
      });
    },
  });

  const handleLikeClick = () => {
    setShowLikeDialog(true);
  };

  const handleLikeHere = () => {
    likeMutation.mutate();
    setShowLikeDialog(false);
  };

  const handleLikeYoutube = () => {
    if (tutorial) {
      window.open(tutorial.youtubeUrl, "_blank");
    }
    setShowLikeDialog(false);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentAuthor.trim() || !commentContent.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    commentMutation.mutate({ author: commentAuthor, content: commentContent });
  };

  if (tutorialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg text-muted-foreground">Loading tutorial...</div>
      </div>
    );
  }

  if (tutorialError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Failed to load tutorial</h2>
          <Button onClick={() => setLocation("/tutorials")} data-testid="button-back-tutorials-error">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tutorials
          </Button>
        </div>
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Tutorial Not Found</h2>
          <p className="text-muted-foreground">The tutorial you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation("/tutorials")} data-testid="button-back-tutorials">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tutorials
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/tutorials")}
            data-testid="button-back"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tutorials
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="aspect-video w-full bg-black">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${tutorial.youtubeId}`}
              title={tutorial.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              data-testid="iframe-youtube"
            />
          </div>

          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-title">
                  {tutorial.title}
                </h1>
                <Button
                  onClick={handleLikeClick}
                  variant="outline"
                  className="gap-2"
                  data-testid="button-like"
                >
                  <ThumbsUp className="h-4 w-4" />
                  {tutorial.likes || 0} Likes
                </Button>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {tutorial.createdAt && format(new Date(tutorial.createdAt), "MMMM d, yyyy")}
              </div>

              {tutorial.description && (
                <div className="text-lg" data-testid="text-description">
                  {tutorial.description}
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Comments ({comments.length})
              </h2>

              <form onSubmit={handleCommentSubmit} className="space-y-4 mb-6">
                <div className="space-y-2">
                  <Input
                    placeholder="Your name"
                    value={commentAuthor}
                    onChange={(e) => setCommentAuthor(e.target.value)}
                    data-testid="input-comment-author"
                  />
                </div>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Write your comment..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    rows={3}
                    data-testid="textarea-comment-content"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={commentMutation.isPending}
                  data-testid="button-post-comment"
                >
                  {commentMutation.isPending ? "Posting..." : "Post Comment"}
                </Button>
              </form>

              <div className="space-y-4">
                {comments.map((comment) => (
                  <Card key={comment.id} data-testid={`card-comment-${comment.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold" data-testid="text-comment-author">
                          {comment.author}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {comment.createdAt && format(new Date(comment.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm" data-testid="text-comment-content">
                        {comment.content}
                      </p>
                    </CardContent>
                  </Card>
                ))}

                {comments.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No comments yet. Be the first to comment!
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
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

