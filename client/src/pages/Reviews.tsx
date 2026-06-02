import { useMemo, useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Star, User } from "lucide-react";
import { format } from "date-fns";
import DOMPurify from "isomorphic-dompurify";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { getSellers, getSellerReviews, addSellerReview, getSiteSettings } from "@/lib/supabaseApi";
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
import PageSEO from "@/components/PageSEO";

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
  userPhone: "",
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
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageDescription, setPreviewImageDescription] = useState<string>("");
  const [previewContentHtml, setPreviewContentHtml] = useState<string>("");

  const [match, params] = useRoute("/reviews/seller/:sellerName");
  const sellerNameParam = match ? params?.sellerName as string : "";
  const sellerSlug = useMemo(() => {
    const s = String(sellerNameParam || "").toLowerCase().trim();
    if (!s) return "";
    return s.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
  }, [sellerNameParam]);
  const [sort, setSort] = useState<"newest" | "highest" | "helpful">("newest");
  const [page, setPage] = useState(1);

  const { data: sellers = [] } = useQuery<Seller[]>({
    queryKey: ["/api/sellers"],
    queryFn: getSellers,
    enabled: !match,
  });

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: [`/api/sellers/${selectedSeller?.id}/reviews`],
    queryFn: () => getSellerReviews(selectedSeller!.id),
    enabled: !!selectedSeller && !match,
  });

  const { data: sellerByName } = useQuery<{ seller: Seller & { verified: boolean }, reviews: Review[], pageInfo: { page: number; pageSize: number; total: number; totalPages: number } }>({
    queryKey: ["/api/reviews/seller/by-name", sellerNameParam, sort, page],
    enabled: !!match && !!sellerNameParam,
    queryFn: async () => {
      const allSellers = await getSellers();
      const slug = sellerNameParam.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      const seller = allSellers.find((s: any) => s.seller_name_slug === slug || s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slug);
      if (!seller) throw new Error("Seller not found");
      const sellerReviews = await getSellerReviews(seller.id);
      return { seller: { ...seller, verified: true }, reviews: sellerReviews, pageInfo: { page: 1, pageSize: 50, total: sellerReviews.length, totalPages: 1 } };
    }
  });

  const { data: sellerDetails } = useQuery<Seller>({
    queryKey: ["/api/sellers", sellerByName?.seller?.id],
    enabled: !!match && !!sellerByName?.seller?.id,
    queryFn: async () => {
      const all = await getSellers();
      return all.find((s: any) => s.id === sellerByName?.seller?.id) || null;
    }
  });

  const { data: sellerPage } = useQuery<any>({
    queryKey: ["/api/seller-pages", sellerSlug],
    enabled: false,
  });

  const { data: verificationSettings } = useQuery<ReviewVerificationSettings>({
    queryKey: ["/api/public/settings/review-verification"],
    queryFn: async () => {
      const settings = await getSiteSettings();
      return { reviewVerificationEnabled: false, reviewVerificationVideoUrl: '', reviewVerificationTimecode: '' };
    },
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
    mutationFn: async (data: { sellerId: string; userId?: string; userName: string; userPhone?: string; rating: number; comment: string; verificationAnswer?: string }) => {
      return addSellerReview({ sellerId: data.sellerId, userName: data.userName, rating: data.rating, comment: data.comment, userPhone: data.userPhone, verificationAnswer: data.verificationAnswer });
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
    const userToken = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
    if (!userToken) {
      toast({
        title: "Sign in required",
        description: "Please sign in or sign up to submit a review.",
        variant: "destructive",
      });
      return;
    }
    if (!reviewForm.userName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }
    // Phone optional during open submission; CSRF disabled server-side
    createReviewMutation.mutate({
      sellerId: selectedSeller.id,
      userId: typeof window !== 'undefined' ? (localStorage.getItem('userId') || '') : '',
      userName: reviewForm.userName.trim(),
      userPhone: reviewForm.userPhone.trim(),
      rating: reviewForm.rating,
      comment: reviewForm.comment.trim(),
      verificationAnswer: undefined,
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
  const isAdmin = jwtPayload && ['super_admin', 'admin', 'seller_admin', 'ticket_manager'].includes(jwtPayload.role);
  const [sellerImageEdit, setSellerImageEdit] = useState("");
  const [sellerDescEdit, setSellerDescEdit] = useState("");
  const [sellerHtmlEdit, setSellerHtmlEdit] = useState("");

  return (
    <>
      <PageSEO
        title={match ? `${sellerByName?.seller?.name || "Seller"} Reviews — CrossFire Wiki` : "Seller Reviews — CrossFire Wiki"}
        description={match ? `Reviews for ${sellerByName?.seller?.name || "Seller"}.` : "Read and submit reviews for CrossFire sellers. Verification supported."}
        canonicalPath={match ? `/reviews/seller/${sellerNameParam}` : "/reviews"}
      />
      <div className="min-h-screen bg-background py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {!match && (
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Seller Reviews</h1>
            <p className="text-lg text-muted-foreground">
              Browse game card sellers and read reviews from other players
            </p>
          </div>
        )}

        {match && sellerByName && (
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
              {sellerByName.seller.name}
              {sellerByName.seller.verified && (
                <Badge variant="default" className="text-xs">Verified</Badge>
              )}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              {renderStars(Math.round(sellerByName.seller.averageRating || 0))}
              <span className="text-sm">{(sellerByName.seller.averageRating || 0).toFixed(1)} ({sellerByName.seller.totalReviews || 0})</span>
            </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <div className="w-full max-w-md h-48 rounded-md overflow-hidden flex items-center justify-center">
                  {(sellerPage?.blocks?.length || 0) > 0 ? (
                    <div className="relative group w-full h-full">
                      <img
                        src={sellerPage!.blocks[0].image}
                        alt={`${sellerByName.seller.name} image`}
                        className="w-full h-full object-contain cursor-pointer"
                        loading="lazy"
                        onClick={() => { setPreviewImageUrl(sellerPage!.blocks[0].image); setPreviewImageDescription(sellerPage!.blocks[0].description || sellerPage?.descriptionHtml || ""); setPreviewContentHtml(sellerPage!.blocks[0].contentHtml || ""); setIsImagePreviewOpen(true); }}
                        data-testid={`img-seller-hero-${sellerByName.seller.id}`}
                      />
                      {(jwtPayload?.role === 'super_admin') && (
                        <button
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full h-8 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          title="Delete image"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!sellerSlug) return;
                            const ok = window.confirm('Delete this image from seller page?');
                            if (!ok) return;
                            try {
                              const nextBlocks = (sellerPage?.blocks || []).filter((_b, i) => i !== 0);
                              const nextImages = (sellerPage?.images || []).filter((url) => url !== sellerPage!.blocks[0].image);
                              toast({ title: "Image management requires admin backend" });
                            } catch (err: any) {
                              alert(err?.message || 'Failed to delete image');
                            }
                          }}
                        >×</button>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No image yet</div>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(String(sellerPage?.descriptionHtml || "No description yet")) }} />
              </div>
            </div>

            {(sellerPage?.blocks?.length || 0) > 1 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Gallery</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {sellerPage!.blocks.slice(1).map((blk: { image: string; contentHtml: string; description: string }, idx: number) => (
                    <div key={idx} className="relative flex items-center justify-center group">
                      <img
                        src={blk.image}
                        alt={`${sellerByName.seller.name} ${idx + 2}`}
                        className="w-full h-36 object-contain cursor-pointer"
                        loading="lazy"
                        onClick={() => { setPreviewImageUrl(blk.image); setPreviewImageDescription(blk.description || sellerPage?.descriptionHtml || ""); setPreviewContentHtml(blk.contentHtml || ""); setIsImagePreviewOpen(true); }}
                      />
                      {(jwtPayload?.role === 'super_admin') && (
                        <button
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full h-7 w-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          title="Delete image"
                          onClick={async (e) => {
                            e.stopPropagation();
                            toast({ title: "Image management requires admin backend" });
                          }}
                        >×</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isAdmin && sellerByName?.seller?.id && (
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold mb-2">Seller Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="seller-image">Image URL</Label>
                    <Input id="seller-image" value={sellerImageEdit} onChange={(e)=> setSellerImageEdit(e.target.value)} placeholder="https://..." />
                  </div>
                  <div>
                    <Label htmlFor="seller-desc">Description</Label>
                    <Textarea id="seller-desc" value={sellerDescEdit} onChange={(e)=> setSellerDescEdit(e.target.value)} rows={3} placeholder="Short description" />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="seller-html">Content (HTML)</Label>
                    <Textarea id="seller-html" value={sellerHtmlEdit} onChange={(e)=> setSellerHtmlEdit(e.target.value)} rows={4} placeholder="<p style='color:#f80;font-weight:bold'>Your rich content here</p>" />
                  </div>
                </div>
                <div className="mt-3">
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        const payload: any = {};
                        const nextBlocks = Array.isArray(sellerPage?.blocks) ? [...sellerPage!.blocks] : [];
                        if (sellerImageEdit.trim() || sellerHtmlEdit.trim() || sellerDescEdit.trim()) {
                          nextBlocks.push({ image: sellerImageEdit.trim(), contentHtml: sellerHtmlEdit.trim(), description: sellerDescEdit.trim() });
                          payload.blocks = nextBlocks;
                        }
                        if (!payload.blocks) {
                          toast({ title: "Nothing to update", variant: "destructive" });
                          return;
                        }
                        toast({ title: "Seller page management requires admin backend" });
                        setSellerImageEdit("");
                        setSellerDescEdit("");
                        setSellerHtmlEdit("");
                      } catch (err: any) {
                        toast({ title: "Update failed", description: err?.message, variant: "destructive" });
                      }
                    }}
                  >
                    Save Seller Details
                  </Button>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 mt-4">
              <Label>Sort:</Label>
              <Button variant={sort === "newest" ? "default" : "outline"} size="sm" onClick={()=> setSort("newest")}>Newest</Button>
              <Button variant={sort === "highest" ? "default" : "outline"} size="sm" onClick={()=> setSort("highest")}>Highest</Button>
              <Button variant={sort === "helpful" ? "default" : "outline"} size="sm" onClick={()=> setSort("helpful")}>Most Helpful</Button>
              <Dialog open={isReviewDialogOpen} onOpenChange={(open)=> { if (!open) closeReviewDialog(); }}>
                <DialogTrigger asChild>
                  <Button variant="default" size="sm" onClick={()=> { setSelectedSeller({ id: sellerByName.seller.id, name: sellerByName.seller.name, description: "", images: [], prices: [], averageRating: 0, totalReviews: 0 }); setIsReviewDialogOpen(true); }}>Write Review</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Review {sellerByName.seller.name}</DialogTitle>
                    <DialogDescription>Share your experience with the community. Helpful, honest feedback keeps everyone safe.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="reviewer-name">Your Name</Label>
                      <Input id="reviewer-name" value={reviewForm.userName} onChange={(e)=> setReviewForm({ ...reviewForm, userName: e.target.value })} placeholder="Enter your name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reviewer-phone">Your Phone Number</Label>
                      <Input id="reviewer-phone" value={reviewForm.userPhone} onChange={(e)=> setReviewForm({ ...reviewForm, userPhone: e.target.value })} placeholder="Enter your phone number" />
                    </div>
                    <div className="space-y-2">
                      <Label>Rating</Label>
                      {renderStars(reviewForm.rating, true)}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="review-comment">Comment (Optional)</Label>
                      <Textarea id="review-comment" value={reviewForm.comment} onChange={(e)=> setReviewForm({ ...reviewForm, comment: e.target.value })} rows={4} placeholder="Share your experience..." />
                    </div>
                    <Button onClick={handleSubmitReview} disabled={createReviewMutation.isPending}>{createReviewMutation.isPending ? "Submitting..." : "Submit Review"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4 mt-6">
              {sellerByName.reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {sellerByName.reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="pt-6 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{review.userName}</span>
                          </div>
                          <div className="flex items-center gap-2">{renderStars(review.rating)}</div>
                        </div>
                        {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                        <p className="text-xs text-muted-foreground">{format(new Date(review.createdAt), "MMM d, yyyy")}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {sellerByName.pageInfo.totalPages > 1 && (
              <div className="flex items-center gap-2 mt-6">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={()=> setPage((p)=> Math.max(1, p-1))}>Prev</Button>
                <span className="text-sm">Page {page} of {sellerByName.pageInfo.totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= sellerByName.pageInfo.totalPages} onClick={()=> setPage((p)=> Math.min(sellerByName.pageInfo.totalPages, p+1))}>Next</Button>
              </div>
            )}
          </div>
        )}

        {!match && (
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
                          className="max-h-36 max-w-36 w-full object-contain cursor-pointer"
                          loading="lazy"
                          onClick={() => { setPreviewImageUrl(image); setPreviewImageDescription(seller.description || ""); setIsImagePreviewOpen(true); }}
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
                        <img
                          src={image}
                          alt={`${seller.name} ${idx + 1}`}
                          className="max-h-36 max-w-36 w-full object-contain cursor-pointer"
                          onClick={() => { setPreviewImageUrl(image); setIsImagePreviewOpen(true); }}
                        />
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
                          <Label htmlFor="reviewer-phone" className="text-sm font-medium">Your Phone Number</Label>
                          <Input
                            id="reviewer-phone"
                            value={reviewForm.userPhone}
                            onChange={(e) => setReviewForm({ ...reviewForm, userPhone: e.target.value })}
                            placeholder="Enter your phone number"
                            data-testid="input-reviewer-phone"
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
                                    {format(new Date(review.createdAt), "MMM d, yyyy")}
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
        )}

        {!match && sellers.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No sellers available yet.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog
        open={isImagePreviewOpen}
        onOpenChange={(open) => {
          if (!open) { setIsImagePreviewOpen(false); setPreviewImageUrl(null); }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          {previewImageUrl && (
            <>
              <img src={previewImageUrl} alt="Preview" className="w-full h-auto object-contain rounded-md" />
              {previewContentHtml && (
                <div className="prose prose-invert max-w-none mt-3" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewContentHtml) }} />
              )}
              {previewImageDescription && (
                <p className="text-sm text-muted-foreground mt-3" data-testid="text-image-description">
                  {previewImageDescription}
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

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
    </>
  );
}
