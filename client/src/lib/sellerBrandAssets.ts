export interface SellerBrandAsset {
  logoUrl?: string;
  gallery: string[];
  sourceUrl?: string;
  sourceLabel?: string;
  accent: string;
  contacts?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
}

const BRAND_ASSETS: Record<string, SellerBrandAsset> = {
  "diaa sadek store": {
    logoUrl: "/assets/sellers/diaa-store-logo.png",
    gallery: [],
    sourceUrl: "https://diaasadek.com",
    sourceLabel: "Official store website",
    accent: "from-cyan-500/20 via-background to-blue-500/10",
  },
  "xbavly store": {
    logoUrl: "/assets/sellers/xbavly-logo.webp",
    gallery: ["/assets/sellers/xbavly-crossfire.png"],
    sourceUrl: "https://xbavly.com",
    sourceLabel: "Official store website",
    accent: "from-violet-500/20 via-background to-fuchsia-500/10",
  },
  "cody eg": {
    logoUrl: "/assets/sellers/cody-logo.png",
    gallery: [
      "/assets/sellers/cody-crossfire-100k.webp",
      "/assets/sellers/cody-crossfire-20k.webp",
    ],
    sourceUrl: "https://codyeg.com",
    sourceLabel: "Official store website",
    accent: "from-orange-500/20 via-background to-red-500/10",
  },
  "games2egypt": {
    logoUrl: "https://www.games2egypt.com/Images/Regions/1/1?fileFormat=3&width=191&v=2",
    gallery: [],
    sourceUrl: "https://www.games2egypt.com",
    sourceLabel: "Official store website",
    accent: "from-blue-500/20 via-background to-indigo-500/10",
  },
  "gamzio": {
    logoUrl: "/assets/sellers/gamzio-logo.svg",
    gallery: ["/assets/sellers/gamzio-crossfire.png"],
    sourceUrl: "https://gamzio.com/en/crossfire/",
    sourceLabel: "Official CrossFire page",
    accent: "from-emerald-500/20 via-background to-teal-500/10",
    contacts: {
      facebook: "https://www.facebook.com/GamzioCom",
      twitter: "https://x.com/GamzioCom",
      instagram: "https://www.instagram.com/GamzioCom",
      youtube: "https://www.youtube.com/GamzioCom",
    },
  },
  "eren store": {
    gallery: [],
    accent: "from-slate-500/20 via-background to-slate-900/10",
  },
};

function normalizeBrandKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getSellerBrandAsset(name: string): SellerBrandAsset {
  return BRAND_ASSETS[normalizeBrandKey(name)] || {
    gallery: [],
    accent: "from-slate-500/20 via-background to-slate-900/10",
  };
}

export function mergeSellerBrandAssets<T extends { name: string; logo_url?: string; images?: string[] }>(seller: T): T & { brand: SellerBrandAsset; displayLogo?: string; displayImages: string[] } {
  const brand = getSellerBrandAsset(seller.name);
  const officialContacts = brand.contacts || {};
  const enrichedSeller = { ...seller } as T & Partial<typeof officialContacts>;
  (Object.keys(officialContacts) as Array<keyof typeof officialContacts>).forEach((key) => {
    if (!enrichedSeller[key] && officialContacts[key]) enrichedSeller[key] = officialContacts[key];
  });
  const displayLogo = seller.logo_url || brand.logoUrl;
  const databaseImages = Array.isArray(seller.images) ? seller.images : [];
  const displayImages = Array.from(new Set([...databaseImages, ...brand.gallery].filter(Boolean)));
  return { ...enrichedSeller, brand, displayLogo, displayImages };
}
