import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Star, Mail, Phone, MessageCircle, Globe, ExternalLink } from "lucide-react";
import { SiDiscord } from "react-icons/si";
import { useState } from "react";
import PageSEO from "@/components/PageSEO";

interface Seller {
  id: string;
  name: string;
  description: string;
  images: string[];
  prices: { item: string; price: number }[];
  email: string;
  phone: string;
  whatsapp: string;
  discord: string;
  website: string;
  featured: boolean;
  promotionText: string;
  averageRating: number;
  totalReviews: number;
}

export default function Sellers() {
  const { data: sellers = [], isLoading } = useQuery<Seller[]>({
    queryKey: ["/api/sellers"],
  });

  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const featuredSellers = sellers.filter(s => s.featured);
  const regularSellers = sellers.filter(s => !s.featured);

  const openSellerDialog = (seller: Seller) => {
    setSelectedSeller(seller);
    setIsDialogOpen(true);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  const SellerCard = ({ seller }: { seller: Seller }) => (
    <Card 
      className="hover-elevate cursor-pointer" 
      data-testid={`card-seller-${seller.id}`}
      onClick={() => openSellerDialog(seller)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {seller.name}
              {seller.featured && (
                <Badge variant="default" className="text-xs" data-testid={`badge-featured-${seller.id}`}>
                  Featured
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-2 line-clamp-2">{seller.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {seller.images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {seller.images.slice(0, 2).map((image, idx) => (
              <div key={idx} className="flex items-center justify-center">
                <img
                  src={image}
                  alt={`${seller.name} ${idx + 1}`}
                  // center and make the image itself bigger while keeping aspect ratio
                  className="max-h-72 max-w-[360px] w-full object-cover rounded-md bg-muted/30"
                  data-testid={`img-seller-${seller.id}-${idx}`}
                />
              </div>
            ))}
          </div>
        )}

        {seller.promotionText && (
          <div className="rounded-md border border-border bg-muted/60 p-3">
            <p className="text-sm font-medium text-foreground">{seller.promotionText}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          {renderStars(Math.round(seller.averageRating))}
          <span className="text-sm font-medium">
            {seller.averageRating.toFixed(1)} ({seller.totalReviews} reviews)
          </span>
        </div>

        {seller.prices.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-semibold">Sample Prices:</p>
            <div className="grid grid-cols-1 gap-1">
              {seller.prices.slice(0, 5).map((price, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-sm bg-muted/50 rounded px-2 py-1"
                >
                  <span className="text-muted-foreground">{price.item}</span>
                  <span className="font-semibold">${price.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
          <span>Click to view details</span>
          <ExternalLink className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center">
            <p className="text-muted-foreground">Loading sellers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageSEO
        title={"Game Card Sellers — CrossFire Wiki"}
        description={"Find trusted CrossFire card sellers with ratings and contact info."}
        canonicalPath="/sellers"
      />
      <div className="min-h-screen bg-background py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Game Card Sellers</h1>
          <p className="text-lg text-muted-foreground">
            Find trusted sellers for CrossFire game cards and items
          </p>
        </div>

        {featuredSellers.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Featured Sellers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredSellers.map((seller) => (
                <SellerCard key={seller.id} seller={seller} />
              ))}
            </div>
          </div>
        )}

        {regularSellers.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">
              {featuredSellers.length > 0 ? "All Sellers" : ""}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularSellers.map((seller) => (
                <SellerCard key={seller.id} seller={seller} />
              ))}
            </div>
          </div>
        )}

        {sellers.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No sellers available yet.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-seller-details">
          {selectedSeller && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  {selectedSeller.name}
                  {selectedSeller.featured && (
                    <Badge variant="default" data-testid={`dialog-badge-featured-${selectedSeller.id}`}>
                      Featured
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-base">
                  {selectedSeller.description}
                </DialogDescription>
              </DialogHeader>

              {selectedSeller.images.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Images</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedSeller.images.map((image, idx) => (
                      <div key={idx} className="flex items-center justify-center">
                        <img
                          src={image}
                          alt={`${selectedSeller.name} ${idx + 1}`}
                          className="max-h-[520px] max-w-full object-contain rounded-md bg-muted/30"
                          data-testid={`dialog-img-seller-${selectedSeller.id}-${idx}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedSeller.promotionText && (
                <div className="rounded-md border border-border bg-muted/60 p-4">
                  <h3 className="font-semibold mb-2">Promotion</h3>
                  <p className="text-sm text-foreground">{selectedSeller.promotionText}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                {renderStars(Math.round(selectedSeller.averageRating))}
                <span className="text-sm font-medium">
                  {selectedSeller.averageRating.toFixed(1)} ({selectedSeller.totalReviews} reviews)
                </span>
              </div>

              {selectedSeller.prices.length > 0 && (
                <div className="space-y-3 pt-2 border-t">
                  <h3 className="font-semibold">Sample Prices</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedSeller.prices.map((price, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-sm bg-muted/50 rounded px-3 py-2"
                      >
                        <span className="text-muted-foreground">{price.item}</span>
                        <span className="font-semibold">${price.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2 border-t">
                <h3 className="font-semibold">Contact Information</h3>
                <div className="grid grid-cols-1 gap-2">
                  {selectedSeller.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`mailto:${selectedSeller.email}`, '_blank');
                      }}
                      data-testid={`dialog-button-email-${selectedSeller.id}`}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {selectedSeller.email}
                    </Button>
                  )}
                  {selectedSeller.phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`tel:${selectedSeller.phone}`, '_blank');
                      }}
                      data-testid={`dialog-button-phone-${selectedSeller.id}`}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      {selectedSeller.phone}
                    </Button>
                  )}
                  {selectedSeller.whatsapp && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://wa.me/${selectedSeller.whatsapp.replace(/[^0-9]/g, '')}`, '_blank');
                      }}
                      data-testid={`dialog-button-whatsapp-${selectedSeller.id}`}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>
                  )}
                  {selectedSeller.discord && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      data-testid={`dialog-button-discord-${selectedSeller.id}`}
                    >
                      <SiDiscord className="h-4 w-4 mr-2" />
                      {selectedSeller.discord}
                    </Button>
                  )}
                  {selectedSeller.website && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(selectedSeller.website.startsWith('http') ? selectedSeller.website : `https://${selectedSeller.website}`, '_blank');
                      }}
                      data-testid={`dialog-button-website-${selectedSeller.id}`}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Visit Website
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </Button>
                  )}
                  {!selectedSeller.email && !selectedSeller.phone && !selectedSeller.whatsapp && !selectedSeller.discord && !selectedSeller.website && (
                    <p className="text-sm text-muted-foreground">No contact information available</p>
                  )}
                </div>

                <div className="mt-4">
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      window.location.href = `/reviews?seller=${selectedSeller.id}`;
                    }}
                  >
                    View All Reviews
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
