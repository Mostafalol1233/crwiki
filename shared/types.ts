export interface ScrapedEvent {
  url: string;
  title: string;
  date: string;
  image: string;
  content: string;
  category: string;
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
}

export interface NewsItem {
  id: string;
  title: string;
  titleAr?: string;
  dateRange: string;
  image: string;
  featured?: boolean;
  category: string;
  content: string;
  contentAr?: string;
  author: string;
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
}

export interface Admin {
  id: string;
  username: string;
  password: string;
  roles: string[];
  createdAt: Date;
}

