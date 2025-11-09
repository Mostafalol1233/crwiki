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


