import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Star, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/components/LanguageProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import type { ReviewVerificationSettings } from "@/types/site-settings";

interface Seller {
  id: string;
  name: string;
  description: string;
  images: string[];
  prices: { item: string; price: number }[];
  averageRating: number;
  totalReviews: number;
}

interface Review {
  id: string;
  sellerId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

const REVIEW_FORM_DEFAULT = {
  userName: "",
  rating: 5,
  comment: "",
};

export default function Reviews() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [reviewForm, setReviewForm] = useState({ ...REVIEW_FORM_DEFAULT });
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [pendingSeller, setPendingSeller] = useState<Seller | null>(null);
  const [verificationAnswer, setVerificationAnswer] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [verifiedCode, setVerifiedCode] = useState("");

  const { data: sellers = [] } = useQuery<Seller[]>({
    queryKey: ["/api/sellers"],
  });

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: [`/api/sellers/${selectedSeller?.id}/reviews`],
    enabled: !!selectedSeller,
  });

  const { data: verificationSettings } = useQuery<ReviewVerificationSettings>({
    queryKey: ["/api/public/settings/review-verification"],
  });

  const extractYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const parseTimecodeToSeconds = (timecode: string): number | null => {
    if (!timecode) return null;
    const parts = timecode.trim().split(":").map((part) => Number(part.trim()));
    if (parts.some((part) => Number.isNaN(part))) {
      return null;
    }
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return null;
  };

  const verificationEmbedUrl = useMemo(() => {
    if (!verificationSettings?.reviewVerificationVideoUrl) return null;
    const id = extractYouTubeId(verificationSettings.reviewVerificationVideoUrl);
    if (!id) return null;
    const seconds = parseTimecodeToSeconds(verificationSettings.reviewVerificationTimecode || "");
    const params = seconds ? `?start=${seconds}` : "";
    return `https://www.youtube.com/embed/${id}${params}`;
  }, [verificationSettings]);

  const resetVerificationState = () => {
    setVerificationDialogOpen(false);
    setPendingSeller(null);
    setVerificationAnswer("");
    setVerificationError("");
  };

  const closeReviewDialog = () => {
    setIsReviewDialogOpen(false);
    setSelectedSeller(null);
    setVerifiedCode("");
    setReviewForm({ ...REVIEW_FORM_DEFAULT });
    setPendingSeller(null);
  };

  const handleOpenReviewDialog = (seller: Seller) => {
    setReviewForm({ ...REVIEW_FORM_DEFAULT });
    if (verificationSettings?.reviewVerificationEnabled) {
      setPendingSeller(seller);
      setVerificationAnswer("");
      setVerificationError("");
      setVerificationDialogOpen(true);
    } else {
      setSelectedSeller(seller);
      setIsReviewDialogOpen(true);
    }
  };

  const handleVerificationConfirm = () => {
    if (!pendingSeller) {
      setVerificationError("Something went wrong. Please try again.");
      return;
    }
    if (!verificationAnswer.trim()) {
      setVerificationError("Please enter the verification word from the video.");
      return;
    }
    setVerifiedCode(verificationAnswer.trim());
    setSelectedSeller(pendingSeller);
    setIsReviewDialogOpen(true);
    resetVerificationState();
  };

  const createReviewMutation = useMutation({
    mutationFn: async (data: { sellerId: string; userName: string; rating: number; comment: string; verificationAnswer?: string }) => {
      return apiRequest(`/api/sellers/${data.sellerId}/reviews`, "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sellers"] });
      if (selectedSeller) {
        queryClient.invalidateQueries({ queryKey: [`/api/sellers/${selectedSeller.id}/reviews`] });
      }
      toast({
        title: "Review submitted",
        description: "Thank you for your review!",
      });
      closeReviewDialog();
      setVerifiedCode("");
      setPendingSeller(null);
    },
    onError: (error: any) => {
      const message = error.message || "Failed to submit review";
      if (message.includes("403") && selectedSeller) {
        setVerifiedCode("");
        setVerificationAnswer("");
        setVerificationError("Verification failed. Please try again.");
        setPendingSeller(selectedSeller);
        setIsReviewDialogOpen(false);
        setVerificationDialogOpen(true);
      }
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitReview = () => {
    if (!selectedSeller) return;
    if (!reviewForm.userName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }
    if (verificationSettings?.reviewVerificationEnabled && !verifiedCode.trim()) {
      toast({
        title: "Verification required",
        description: "Please complete the verification step before submitting your review.",
        variant: "destructive",
      });
      return;
    }
    createReviewMutation.mutate({
      sellerId: selectedSeller.id,
      userName: reviewForm.userName.trim(),
      rating: reviewForm.rating,
      comment: reviewForm.comment.trim(),
      verificationAnswer: verificationSettings?.reviewVerificationEnabled ? verifiedCode.trim() : undefined,
    });
  };

  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            } ${interactive ? "cursor-pointer hover:scale-110 transition" : ""}`}
            onClick={() => {
              if (interactive) {
                setReviewForm({ ...reviewForm, rating: star });
              }
            }}
            data-testid={`star-${star}`}
          />
        ))}
      </div>
    );
  };

  function parseJwt(token: string | null) {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch {
      return null;
    }
  }

  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const jwtPayload = parseJwt(adminToken);
  const isAdmin = jwtPayload && ['super_admin', 'admin', 'ticket_manager'].includes(jwtPayload.role);

  return (
    <div className="min-h-screen bg-background py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Seller Reviews</h1>
          <p className="text-lg text-muted-foreground">
            Browse game card sellers and read reviews from other players
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sellers.map((seller) => (
            <Card key={seller.id} className="hover-elevate" data-testid={`card-seller-${seller.id}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{seller.name}</span>
                  <Badge variant="secondary" data-testid={`badge-reviews-${seller.id}`}>
                    {seller.totalReviews} reviews
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {seller.images.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {seller.images.slice(0, 2).map((image, idx) => (
                      <div key={idx} className="flex items-center justify-center">
                        <img
                          src={image}
                          alt={`${seller.name} ${idx + 1}`}
                          className="max-h-72 max-w-[360px] w-full object-cover rounded-md bg-muted/30"
                          data-testid={`img-seller-${seller.id}-${idx}`}
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground">{seller.description}</p>
                
                <div className="flex items-center justify-between">
                  {renderStars(Math.round(seller.averageRating))}
                  <span className="text-sm font-medium">{seller.averageRating.toFixed(1)}</span>
                </div>

                {seller.images.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {seller.images.slice(0, 2).map((image, idx) => (
                      <div key={idx} className="flex items-center justify-center">
                        <div className="w-full max-w-[360px] h-48 overflow-hidden rounded-md bg-muted/30">
                          <img
                            src={image}
                            alt={`${seller.name} ${idx + 1}`}
                            className="w-full h-full object-cover object-center"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Dialog
                  open={isReviewDialogOpen && selectedSeller?.id === seller.id}
                  onOpenChange={(open) => {
                    if (!open) {
                      closeReviewDialog();
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      className="w-full"
                      onClick={() => handleOpenReviewDialog(seller)}
                      data-testid={`button-review-${seller.id}`}
                    >
                      Write Review
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Review {selectedSeller?.name ?? seller.name}</DialogTitle>
                      <DialogDescription>
                        Share your experience with the community. Helpful, honest feedback keeps everyone safe.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold">Review for {selectedSeller?.name ?? seller.name}</h3>
                        <div className="space-y-2">
                          <Label htmlFor="reviewer-name" className="text-sm font-medium">Your Name</Label>
                          <Input
                            id="reviewer-name"
                            value={reviewForm.userName}
                            onChange={(e) => setReviewForm({ ...reviewForm, userName: e.target.value })}
                            placeholder="Enter your name"
                            data-testid="input-reviewer-name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Rating</Label>
                          {renderStars(reviewForm.rating, true)}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="review-comment" className="text-sm font-medium">Comment (Optional)</Label>
                          <Textarea
                            id="review-comment"
                            value={reviewForm.comment}
                            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                            placeholder="Share your experience..."
                            rows={4}
                            data-testid="input-review-comment"
                          />
                        </div>

                        <Button
                          onClick={handleSubmitReview}
                          disabled={createReviewMutation.isPending}
                          data-testid="button-submit-review"
                        >
                          {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                        </Button>
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <h3 className="font-semibold">Reviews ({reviews.length})</h3>
                        {reviews.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review!</p>
                        ) : (
                          <div className="space-y-4">
                            {reviews.map((review) => (
                              <Card key={review.id} data-testid={`review-${review.id}`}>
                                <CardContent className="pt-6 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4" />
                                      <span className="font-medium">{review.userName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {renderStars(review.rating)}
                                    </div>
                                  </div>
                                  {review.comment && (
                                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                                  )}
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                  </p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>

        {sellers.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No sellers available yet.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog
        open={verificationDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetVerificationState();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Step 1: Verify You Watched the Video</DialogTitle>
            <DialogDescription>
              {verificationSettings?.reviewVerificationPrompt ||
                "Watch the video and enter the secret word mentioned at the highlighted moment."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {verificationSettings?.reviewVerificationYouTubeChannelUrl && (
              <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm font-medium mb-2">Subscribe to our YouTube Channel</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Please subscribe to our YouTube channel before watching the verification video.
                </p>
                <Button
                  variant="default"
                  onClick={() => {
                    window.open(verificationSettings.reviewVerificationYouTubeChannelUrl, "_blank");
                  }}
                  className="w-full sm:w-auto"
                >
                  Subscribe on YouTube
                </Button>
              </div>
            )}

            {verificationEmbedUrl ? (
              <div className="w-full overflow-hidden rounded-lg bg-muted">
                <div className="aspect-video">
                  <iframe
                    title="Verification Video"
                    src={verificationEmbedUrl}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-muted-foreground/30 bg-muted/40 p-4 text-sm text-muted-foreground">
                Video verification is currently unavailable. Please contact support if this persists.
              </p>
            )}

            {verificationSettings?.reviewVerificationTimecode && (
              <p className="text-sm text-muted-foreground">
                Hint: listen around <span className="font-medium">{verificationSettings.reviewVerificationTimecode}</span>.
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="verification-word" className="text-sm font-medium">
                Enter the verification word
              </Label>
              <Input
                id="verification-word"
                value={verificationAnswer}
                onChange={(e) => {
                  setVerificationAnswer(e.target.value);
                  setVerificationError("");
                }}
                placeholder="Enter the secret word"
              />
              {verificationError && (
                <p className="text-sm text-destructive">{verificationError}</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetVerificationState}>
                Cancel
              </Button>
              <Button onClick={handleVerificationConfirm}>
                Continue to Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
