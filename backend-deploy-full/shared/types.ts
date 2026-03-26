export interface ScrapedEvent {
  url: string;
  title: string;
  date: string;
  image: string;
  content: string;
  rawHtmlContent?: string;
  category: string;
  colors: string[];
  logo?: string;
  preview: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  ogUrl?: string;
}

export interface Event {
  id: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  date: string;
  type: "upcoming" | "trending";
  image: string;
  rawHtmlContent?: string;
}

export interface NewsItem {
  id: string;
  slug?: string;
  title: string;
  titleAr?: string;
  dateRange: string;
  image: string;
  featured?: boolean;
  category: string;
  content: string;
  contentAr?: string;
  htmlContent?: string;
  rawHtmlContent?: string;
  author: string;
  previewOnHome?: boolean;
  createdAt?: Date;
}

export interface Weapon {
  name: string;
  image: string;
  category: string;
  description: string;
  stats: {
    damage: number;
    accuracy: number;
    recoil: string;
    fireRate: string;
    magazine?: number;
    range?: string;
  };
  background?: string;
  highlightedName?: string;
}

export interface Admin {
  id: string;
  username: string;
  password: string;
  roles: string[];
  createdAt: Date;
}

