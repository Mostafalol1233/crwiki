import * as React from "react";
import { getSellers } from "@/lib/supabaseApi";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Star, Mail, Phone, MessageCircle, Globe, ExternalLink, Search, Filter, CheckCircle, ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { SiDiscord, SiWhatsapp, SiFacebook, SiX, SiInstagram, SiYoutube, SiTiktok } from "react-icons/si";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useRoute } from "wouter";
import PageSEO from "@/components/PageSEO";
import DOMPurify from "isomorphic-dompurify";
import { useQuery as useRQ } from "@tanstack/react-query";

interface Seller {
  id: string;
  name: string;
  seller_name_slug?: string;
  description: string;
  images: string[];
  prices: { item: string; price: number }[];
  email: string;
  phone: string;
  whatsapp: string;
  discord: string;
  website: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  featured: boolean;
  promotionText: string;
  averageRating: number;
  totalReviews: number;
  rank?: number;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
  schemaType?: string;
}


function normalizeSellerList(value: unknown): Seller[] {
  if (!Array.isArray(value)) return [];
  return value.map((seller: any) => ({
    ...seller,
    id: String(seller?.id || ''),
    name: String(seller?.name || ''),
    description: String(seller?.description || ''),
    images: Array.isArray(seller?.images) ? seller.images : [],
    prices: Array.isArray(seller?.prices) ? seller.prices : [],
    featured: Boolean(seller?.featured),
    averageRating: typeof seller?.averageRating === 'number' ? seller.averageRating : Number(seller?.averageRating) || 0,
    totalReviews: typeof seller?.totalReviews === 'number' ? seller.totalReviews : Number(seller?.totalReviews) || 0,
  }));
}

class LocalErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any) {
    try { console.error('[Sellers ErrorBoundary]', error); } catch { }
  }
  render() {
    if (this.state?.hasError) {
      return (
        <div className="min-h-screen bg-background py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <Card>
              <CardContent className="py-12 text-center space-y-3">
                <p className="text-destructive">Failed to render sellers page.</p>
                <Button variant="outline" onClick={() => { try { window.location.href = '/sellers'; } catch { } }}>Back to Sellers</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }
    return this.props.children as any;
  }
}

/* ─── Lightbox Gallery ─── */
function GalleryLightbox({ images, initialIndex, onClose }: { images: string[]; initialIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(initialIndex);
  const prev = useCallback(() => setIdx((i) => (i <= 0 ? images.length - 1 : i - 1)), [images.length]);
  const next = useCallback(() => setIdx((i) => (i >= images.length - 1 ? 0 : i + 1)), [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
        <X className="h-6 w-6" />
      </button>
      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 text-white/80 hover:text-white z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 text-white/80 hover:text-white z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
      <div className="max-w-[90vw] max-h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <img
          src={images[idx]}
          alt={`Gallery image ${idx + 1}`}
          className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
        />
        {images.length > 1 && (
          <div className="mt-4 flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === idx ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Sellers() {
  const [slugMatch, slugParams] = useRoute("/seller/:slug");
  const slug = slugMatch ? (slugParams?.slug as string) : "";
  const { data: sellersData = [], isLoading, isError: sellersIsError, error: sellersError, refetch: refetchSellers } = useQuery<Seller[]>({
    queryKey: ["/api/sellers"],
    queryFn: getSellers,
    enabled: !slugMatch,
  });

  const sellers = useMemo(() => normalizeSellerList(sellersData), [sellersData]);

  const { data: sellerBySlugData, isLoading: slugLoading, isError: slugIsError, error: slugError } = useQuery<Seller>({
    queryKey: ["/api/sellers/slug", slug],
    enabled: !!slugMatch && !!slug,
    queryFn: async () => {
      const all = normalizeSellerList(await getSellers());
      const found = all.find((s: any) => s.seller_name_slug === slug || s.id === slug);
      if (!found) throw new Error('Seller not found');
      return found;
    }
  });

  const sellerBySlug = useMemo(() => normalizeSellerList(sellerBySlugData ? [sellerBySlugData] : [])[0], [sellerBySlugData]);
  const pageSlug = useMemo(() => sellerBySlug?.seller_name_slug || slug, [sellerBySlug?.seller_name_slug, slug]);
  const { data: sellerPage } = useRQ<{ sellerSlug: string; images: string[]; descriptionHtml: string; blocks?: { image: string; contentHtml: string; description: string }[] }>({
    queryKey: ["/api/seller-pages", pageSlug],
    enabled: false,
  });

  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("rank");
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  useEffect(() => {
    if (!slugMatch || !sellerBySlug) return;
    const pageSlug = sellerBySlug.seller_name_slug || slug;
    if (!pageSlug) return;
  }, [slugMatch, sellerBySlug, slug]);

  const isFiniteNumber = (n: any): n is number => typeof n === 'number' && Number.isFinite(n);
  const formatRating = (n: any) => isFiniteNumber(n) ? n.toFixed(1) : '0.0';

  const filteredSellers = useMemo(() => {
    let result = normalizeSellerList(sellers);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.prices.some(p => String(p.item || "").toLowerCase().includes(q))
      );
    }
    result.sort((a, b) => {
      if (sortBy === "rank") {
        const ra = typeof a.rank === 'number' ? a.rank! : 9999;
        const rb = typeof b.rank === 'number' ? b.rank! : 9999;
        return ra - rb;
      } else if (sortBy === "rating") {
        return (b.averageRating || 0) - (a.averageRating || 0);
      } else if (sortBy === "reviews") {
        return (b.totalReviews || 0) - (a.totalReviews || 0);
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
    return result;
  }, [sellers, searchQuery, sortBy]);

  const featuredSellers = filteredSellers.filter(s => s.featured);
  const regularSellers = filteredSellers.filter(s => !s.featured);

  const normalizeUrl = (u?: string) => {
    const s = String(u || '').trim();
    if (!s) return '';
    return s.startsWith('http') ? s : `https://${s}`;
  };

  const openSellerDialog = (seller: Seller) => {
    setSelectedSeller(seller);
    setIsDialogOpen(true);
    try {
    } catch { }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : star - 0.5 <= rating
                ? "fill-yellow-400/50 text-yellow-400"
                : "text-muted-foreground/30"
              }`}
          />
        ))}
      </div>
    );
  };

  /* ─── Seller Card ─── */
  const SellerCard = ({ seller, isFeatured }: { seller: Seller; isFeatured?: boolean }) => (
    <Card
      className={`group cursor-pointer flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 shadow-md overflow-hidden ${isFeatured
        ? 'bg-gradient-to-br from-yellow-50/80 via-background to-amber-50/50 dark:from-yellow-950/20 dark:via-background dark:to-amber-950/10 ring-1 ring-yellow-200/50 dark:ring-yellow-800/30'
        : 'bg-card'
        }`}
      data-testid={`card-seller-${seller.id}`}
      onClick={() => openSellerDialog(seller)}
    >
      {/* Image Header */}
      {Array.isArray(seller.images) && seller.images.length > 0 && (
        <div className="relative w-full overflow-hidden bg-muted">
          <img
            src={seller.images[0]}
            alt={seller.name}
            className="w-full h-48 object-contain bg-transparent transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {seller.images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              +{seller.images.length - 1} more
            </div>
          )}
          {isFeatured && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 shadow-lg text-xs font-semibold px-3 py-1">
                ⭐ Featured
              </Badge>
            </div>
          )}
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg leading-tight">
              <span className="truncate">{seller.name}</span>
              {seller.rank && seller.rank <= 5 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 flex items-center gap-1 shrink-0 text-[10px] px-1.5 py-0">
                  <CheckCircle className="h-3 w-3" /> Trusted
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1.5 line-clamp-2 text-xs">{seller.description}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 flex-grow pt-0">
        {seller.promotionText && (
          <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-2.5">
            <p className="text-xs font-medium text-primary leading-snug">{seller.promotionText}</p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="font-bold text-base tabular-nums">{formatRating(seller.averageRating)}</span>
          {renderStars(Math.round(isFiniteNumber(seller.averageRating) ? seller.averageRating : 0))}
          <span className="text-[10px] text-muted-foreground">({seller.totalReviews || 0})</span>
        </div>

        {Array.isArray(seller.prices) && seller.prices.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Top Deals</p>
            {seller.prices.slice(0, 3).map((price, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm py-0.5">
                <span className="text-muted-foreground truncate max-w-[65%] text-xs">{price.item}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">{price.price}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t pt-3 pb-3 flex justify-between items-center bg-muted/30">
        <div className="flex gap-2 text-muted-foreground">
          {seller.whatsapp && <SiWhatsapp className="h-3.5 w-3.5 hover:text-green-500 transition-colors" />}
          {seller.discord && <SiDiscord className="h-3.5 w-3.5 hover:text-indigo-500 transition-colors" />}
          {seller.facebook && <SiFacebook className="h-3.5 w-3.5 hover:text-blue-600 transition-colors" />}
        </div>
        <div className="flex items-center text-xs text-primary font-medium group-hover:gap-2 transition-all">
          View Details <ExternalLink className="ml-1 h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </CardFooter>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-12 md:py-20 flex justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading trusted sellers...</p>
        </div>
      </div>
    );
  }

  if (!slugMatch && sellersIsError) {
    return (
      <div className="min-h-screen bg-background py-12 md:py-20 text-center">
        <p className="text-destructive mb-4">Failed to load sellers</p>
        <Button onClick={() => refetchSellers()}>Retry</Button>
      </div>
    );
  }

  // ─── Slug View (Single Seller Page) ───
  if (slugMatch && sellerBySlug) {
    const s = sellerBySlug;
    return (
      <>
        <PageSEO
          title={s.seoTitle || `${s.name} — Seller | CrossFire Wiki`}
          description={s.seoDescription || s.description || `Seller ${s.name} page.`}
          canonicalPath={s.canonicalUrl || `/seller/${s.seller_name_slug || slug}`}
          image={s.ogImage || s.images?.[0]}
          schemaType={s.schemaType || 'Organization'}
        />
        <div className="min-h-screen bg-background">
          {/* Hero Header */}
          <div className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 border-b">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-16">
              <Button variant="ghost" onClick={() => window.location.href = '/sellers'} className="mb-6 pl-0 hover:pl-2 transition-all text-sm">
                ← Back to All Sellers
              </Button>

              <div className="flex flex-col md:flex-row items-start gap-6">
                {/* Seller Logo / First Image */}
                {s.images?.length > 0 && (
                  <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg bg-muted shrink-0">
                    <img src={s.images[0]} alt={s.name} className="w-full h-full object-contain bg-transparent" />
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-3xl md:text-5xl font-bold mb-3 flex flex-wrap items-center gap-3">
                    {s.name}
                    {s.featured && (
                      <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 text-xs">⭐ Featured</Badge>
                    )}
                    {s.rank && s.rank <= 5 && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 flex items-center gap-1 text-xs">
                        <CheckCircle className="h-3 w-3" /> Trusted
                      </Badge>
                    )}
                  </h1>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl font-bold tabular-nums">{formatRating(s.averageRating)}</span>
                    {renderStars(Math.round(isFiniteNumber(s.averageRating) ? s.averageRating : 0))}
                    <span className="text-muted-foreground text-sm">({s.totalReviews || 0} reviews)</span>
                  </div>
                  <p className="text-muted-foreground max-w-2xl leading-relaxed">{s.description}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Gallery + Price List */}
              <div className="lg:col-span-2 space-y-8">
                {s.images?.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <ZoomIn className="h-5 w-5 text-muted-foreground" />
                      Gallery
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {s.images.map((image, idx) => (
                        <div
                          key={idx}
                          className="group/img relative rounded-xl overflow-hidden border bg-muted cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => setLightbox({ images: s.images, index: idx })}
                        >
                          <img
                            src={image}
                            alt={`${s.name} ${idx + 1}`}
                            className="w-full h-auto min-h-[160px] max-h-[360px] object-contain bg-transparent"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center">
                            <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover/img:opacity-100 transition-opacity drop-shadow-lg" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(s.prices) && s.prices.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">💰 Price List</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {s.prices.map((price, idx) => (
                        <div key={idx} className="flex justify-between items-center p-4 rounded-xl border bg-card hover:shadow-md transition-all hover:border-primary/30 group">
                          <span className="font-medium text-sm">{price.item}</span>
                          <Badge variant="secondary" className="text-base font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                            {price.price}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {s.promotionText && (
                  <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 p-5">
                    <p className="text-sm font-medium text-primary">🔥 {s.promotionText}</p>
                  </div>
                )}
              </div>

              {/* Right Column: Contact & Actions */}
              <div className="space-y-5">
                <Card className="shadow-md border-0 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-3">
                    <CardTitle className="text-lg">📞 Contact Seller</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-3">
                    {s.website && <Button variant="outline" className="w-full justify-start gap-2 h-10" onClick={() => window.open(normalizeUrl(s.website), '_blank')}><Globe className="h-4 w-4" /> Website</Button>}
                    {s.email && <Button variant="outline" className="w-full justify-start gap-2 h-10" onClick={() => window.open(`mailto:${s.email}`, '_blank')}><Mail className="h-4 w-4" /> Email</Button>}
                    {s.whatsapp && <Button variant="outline" className="w-full justify-start gap-2 h-10 text-green-600 hover:text-green-700 hover:border-green-300" onClick={() => window.open(normalizeUrl(s.whatsapp), '_blank')}><SiWhatsapp className="h-4 w-4" /> WhatsApp</Button>}
                    {s.discord && <Button variant="outline" className="w-full justify-start gap-2 h-10 text-indigo-600 hover:text-indigo-700 hover:border-indigo-300" onClick={() => window.open(normalizeUrl(s.discord), '_blank')}><SiDiscord className="h-4 w-4" /> Discord</Button>}
                  </CardContent>
                </Card>

                {(s.facebook || s.twitter || s.instagram || s.youtube || s.tiktok) && (
                  <Card className="shadow-md border-0">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">🌐 Social Media</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2 pt-0">
                      {s.facebook && <Button variant="ghost" size="sm" onClick={() => window.open(normalizeUrl(s.facebook!), '_blank')}><SiFacebook className="mr-2 h-4 w-4" /> Facebook</Button>}
                      {s.twitter && <Button variant="ghost" size="sm" onClick={() => window.open(normalizeUrl(s.twitter!), '_blank')}><SiX className="mr-2 h-4 w-4" /> Twitter</Button>}
                      {s.instagram && <Button variant="ghost" size="sm" onClick={() => window.open(normalizeUrl(s.instagram!), '_blank')}><SiInstagram className="mr-2 h-4 w-4" /> Instagram</Button>}
                      {s.youtube && <Button variant="ghost" size="sm" onClick={() => window.open(normalizeUrl(s.youtube!), '_blank')}><SiYoutube className="mr-2 h-4 w-4" /> YouTube</Button>}
                      {s.tiktok && <Button variant="ghost" size="sm" onClick={() => window.open(normalizeUrl(s.tiktok!), '_blank')}><SiTiktok className="mr-2 h-4 w-4" /> TikTok</Button>}
                    </CardContent>
                  </Card>
                )}

                <Button size="lg" className="w-full shadow-md" onClick={() => window.location.href = `/reviews/seller/slug/${s.seller_name_slug || slug}`}>
                  Read All Reviews
                </Button>
              </div>
            </div>
          </div>
        </div>
        {lightbox && (
          <GalleryLightbox
            images={lightbox.images}
            initialIndex={lightbox.index}
            onClose={() => setLightbox(null)}
          />
        )}
      </>
    );
  }

  // ─── Full Seller Profile View (when /seller/:slug) ───
  if (slugMatch) {
    if (slugLoading) {
      return (
        <LocalErrorBoundary>
          <div className="min-h-screen bg-background py-12 md:py-20">
            <div className="max-w-5xl mx-auto px-4 md:px-8">
              <div className="animate-pulse space-y-4">
                <div className="h-8 w-1/3 bg-muted rounded" />
                <div className="h-64 w-full bg-muted rounded" />
                <div className="h-32 w-full bg-muted rounded" />
              </div>
            </div>
          </div>
        </LocalErrorBoundary>
      );
    }
    if (slugIsError || !sellerBySlug) {
      return (
        <LocalErrorBoundary>
          <div className="min-h-screen bg-background py-12 md:py-20">
            <div className="max-w-5xl mx-auto px-4 md:px-8">
              <Card>
                <CardContent className="py-12 text-center space-y-3">
                  <p className="text-destructive">Seller not found</p>
                  <Button variant="outline" onClick={() => { try { window.location.href = '/sellers'; } catch { } }}>Back to Sellers</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </LocalErrorBoundary>
      );
    }

    const images = (sellerPage?.images && sellerPage.images.length > 0) ? sellerPage.images : (sellerBySlug.images || []);
    const mainImage = images?.[0] || "";
    const descriptionHtml = sellerPage?.descriptionHtml || "";

    return (
      <LocalErrorBoundary>
        <>
          <PageSEO
            title={sellerBySlug.seoTitle || `${sellerBySlug.name} — Game Card Seller`}
            description={sellerBySlug.seoDescription || sellerBySlug.promotionText || sellerBySlug.description}
            canonicalPath={`/seller/${pageSlug}`}
            image={sellerBySlug.ogImage || mainImage || ""}
          />
          <div className="min-h-screen bg-background py-12 md:py-20">
            <div className="max-w-5xl mx-auto px-4 md:px-8">
              <div className="flex items-start justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold">{sellerBySlug.name}</h1>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    {renderStars(Math.round(isFiniteNumber(sellerBySlug.averageRating) ? sellerBySlug.averageRating : 0))}
                    <span className="font-medium text-foreground">{formatRating(sellerBySlug.averageRating)}</span>
                    <span>({sellerBySlug.totalReviews || 0} reviews)</span>
                    {sellerBySlug.featured && (
                      <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 text-xs">⭐ Featured</Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {sellerBySlug.website && <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => window.open(normalizeUrl(sellerBySlug.website), '_blank')}><Globe className="h-4 w-4" /> Website</Button>}
                  {sellerBySlug.whatsapp && <Button variant="outline" size="sm" className="justify-start gap-2 text-green-600" onClick={() => window.open(normalizeUrl(sellerBySlug.whatsapp), '_blank')}><SiWhatsapp className="h-4 w-4" /> WhatsApp</Button>}
                  {sellerBySlug.discord && <Button variant="outline" size="sm" className="justify-start gap-2 text-indigo-600" onClick={() => window.open(normalizeUrl(sellerBySlug.discord), '_blank')}><SiDiscord className="h-4 w-4" /> Discord</Button>}
                </div>
              </div>

              {mainImage && (
                <div className="relative w-full overflow-hidden mb-8">
                  <img
                    src={mainImage}
                    alt={`${sellerBySlug.name} main`}
                    className="w-full h-auto md:max-h-[560px] object-contain cursor-zoom-in bg-transparent"
                    loading="lazy"
                    onClick={() => setLightbox({ images, index: 0 })}
                  />
                </div>
              )}

              <article
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: (() => {
                    const raw = descriptionHtml || "";
                    return DOMPurify.sanitize(raw, {
                      ALLOWED_TAGS: [
                        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'strike', 's', 'del', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                        'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'pre', 'code', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span', 'hr',
                        'audio', 'video', 'source', 'iframe'
                      ],
                      ALLOWED_ATTR: [
                        'href', 'src', 'alt', 'title', 'style', 'class', 'width', 'height', 'target', 'rel',
                        'controls', 'frameborder', 'allow', 'allowfullscreen', 'loading', 'decoding', 'fetchpriority', 'preload', 'muted', 'autoplay'
                      ],
                      ALLOW_DATA_ATTR: false,
                      KEEP_CONTENT: true,
                    });
                  })()
                }}
              />

              {images.length > 1 && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-3">Gallery</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {images.slice(1).map((img, idx) => (
                      <div
                        key={idx}
                        className="group relative rounded-lg border bg-muted overflow-hidden cursor-pointer"
                        onClick={() => setLightbox({ images, index: idx + 1 })}
                      >
                        <img src={img} className="w-full h-40 object-contain bg-transparent" alt={`${sellerBySlug.name} ${idx + 2}`} />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(sellerBySlug.prices) && sellerBySlug.prices.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-3">Price List</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sellerBySlug.prices.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-lg border bg-muted/50 hover:border-primary/30 transition-colors">
                        <span className="text-sm truncate mr-2">{p.item}</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{p.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {lightbox && (
            <GalleryLightbox
              images={lightbox.images}
              initialIndex={lightbox.index}
              onClose={() => setLightbox(null)}
            />
          )}
        </>
      </LocalErrorBoundary>
    );
  }

  // ─── Main List View ───
  return (
    <LocalErrorBoundary>
      <>
        <PageSEO
          title={"Game Card Sellers — CrossFire Wiki"}
          description={"Find trusted CrossFire card sellers with ratings and contact info."}
          canonicalPath="/sellers"
        />
        <div className="min-h-screen bg-background">
          {/* Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 border-b border-border/40">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(var(--primary)) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(var(--primary)) 0%, transparent 40%)' }} />
            <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
              <div className="max-w-3xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Verified & Trusted
                </div>
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60">
                  Sellers Market
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
                  Find the best CrossFire accounts, game cards, and items. All sellers are verified by our community with real reviews and ratings.
                </p>
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                  {[
                    { label: "Verified Sellers", value: String(filteredSellers.length || sellers.length) },
                    { label: "Featured Partners", value: String(sellers.filter(s => s.featured).length) },
                    { label: "Community Reviews", value: String(sellers.reduce((acc, s) => acc + (s.totalReviews || 0), 0)) },
                  ].map(stat => (
                    <div key={stat.label} className="text-center p-3 rounded-xl bg-card/60 border border-border/50 backdrop-blur-sm">
                      <div className="text-2xl font-black text-primary">{stat.value}</div>
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-3 mb-10 bg-card/80 backdrop-blur-sm p-4 rounded-xl border shadow-sm sticky top-20 z-10">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sellers, items, or descriptions..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <div className="flex items-center gap-2 min-w-[140px]">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rank">Recommended</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="reviews">Most Reviewed</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Featured */}
            {featuredSellers.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <Star className="fill-yellow-400 text-yellow-400 h-6 w-6" />
                  Featured Partners
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredSellers.map((seller) => (
                    <SellerCard key={seller.id} seller={seller} isFeatured />
                  ))}
                </div>
              </div>
            )}

            {/* All Sellers */}
            <div>
              <h2 className="text-2xl font-semibold mb-6">
                {featuredSellers.length > 0 ? "All Verified Sellers" : "Verified Sellers"}
              </h2>
              {regularSellers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularSellers.map((seller) => (
                    <SellerCard key={seller.id} seller={seller} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  {searchQuery ? "No sellers found matching your search." : "No sellers available."}
                </div>
              )}
            </div>
          </div>

          {/* Quick-view Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-seller-details">
              {selectedSeller && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Main Content */}
                  <div className="lg:col-span-2 space-y-5">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-2xl">
                        {selectedSeller.name}
                        {selectedSeller.featured && <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 text-xs">⭐ Featured</Badge>}
                      </DialogTitle>
                      <DialogDescription>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(Math.round(isFiniteNumber(selectedSeller.averageRating) ? selectedSeller.averageRating : 0))}
                          <span className="font-medium text-foreground">{formatRating(selectedSeller.averageRating)}</span>
                          <span>({selectedSeller.totalReviews} reviews)</span>
                        </div>
                      </DialogDescription>
                    </DialogHeader>

                    <div className="prose dark:prose-invert text-sm">
                      <p>{selectedSeller.description}</p>
                    </div>

                    {Array.isArray(selectedSeller.images) && selectedSeller.images.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold">Gallery</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedSeller.images.slice(0, 4).map((img, idx) => (
                            <div
                              key={idx}
                              className="group/gimg relative rounded-lg border bg-muted overflow-hidden cursor-pointer"
                              onClick={() => setLightbox({ images: selectedSeller.images, index: idx })}
                            >
                              <img src={img} className="w-full h-36 object-contain bg-transparent" alt={`${selectedSeller.name} ${idx + 1}`} />
                              <div className="absolute inset-0 bg-black/0 group-hover/gimg:bg-black/20 transition-colors flex items-center justify-center">
                                <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover/gimg:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          ))}
                        </div>
                        {selectedSeller.images.length > 4 && (
                          <p className="text-xs text-muted-foreground">+{selectedSeller.images.length - 4} more images on full profile</p>
                        )}
                      </div>
                    )}

                    {Array.isArray(selectedSeller.prices) && selectedSeller.prices.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold">Price List</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedSeller.prices.map((p, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 rounded-lg border bg-muted/50 hover:border-primary/30 transition-colors">
                              <span className="text-sm truncate mr-2">{p.item}</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">{p.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Contact & Sidebar */}
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-card p-4 space-y-3">
                      <h3 className="font-semibold">Contact Seller</h3>
                      <div className="grid gap-2">
                        {selectedSeller.website && <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => window.open(normalizeUrl(selectedSeller.website), '_blank')}><Globe className="h-4 w-4" /> Website</Button>}
                        {selectedSeller.whatsapp && <Button variant="outline" size="sm" className="justify-start gap-2 text-green-600" onClick={() => window.open(normalizeUrl(selectedSeller.whatsapp), '_blank')}><SiWhatsapp className="h-4 w-4" /> WhatsApp</Button>}
                        {selectedSeller.discord && <Button variant="outline" size="sm" className="justify-start gap-2 text-indigo-600" onClick={() => window.open(normalizeUrl(selectedSeller.discord), '_blank')}><SiDiscord className="h-4 w-4" /> Discord</Button>}
                      </div>
                    </div>

                    <Button className="w-full" onClick={() => {
                      const sellerSlug = selectedSeller.seller_name_slug || selectedSeller.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                      window.location.href = `/seller/${sellerSlug}`;
                    }}>
                      View Full Profile
                    </Button>

                    <Button variant="outline" className="w-full" onClick={() => window.location.href = `/reviews/seller/slug/${selectedSeller.seller_name_slug || slug}`}>
                      View All Reviews
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {lightbox && (
            <GalleryLightbox
              images={lightbox.images}
              initialIndex={lightbox.index}
              onClose={() => setLightbox(null)}
            />
          )}
        </div>
      </>
    </LocalErrorBoundary>
  );
}
