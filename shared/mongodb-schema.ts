import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

export interface IUser extends Document {
  username: string;
  password: string;
}

export interface IPost extends Document {
  title: string;
  content: string;
  summary: string;
  image: string;
  category: string;
  tags: string[];
  author: string;
  views: number;
  readingTime: number;
  featured: boolean;
  createdAt: Date;
  // SEO fields
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  twitterImage?: string;
  schemaType?: string;
  breadcrumbs?: Array<{ name: string; url: string }>;
  updatedAt?: Date;
}

export interface IComment extends Document {
  postId: string;
  parentCommentId?: string;
  name: string;
  content: string;
  createdAt: Date;
}

export interface IEvent extends Document {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  date: string;
  type: string;
  image: string;
  // SEO fields
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  twitterImage?: string;
  schemaType?: string;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

export interface INews extends Document {
  title: string;
  titleAr: string;
  dateRange: string;
  image: string;
  category: string;
  content: string;
  contentAr: string;
  htmlContent: string;
  author: string;
  featured: boolean;
  createdAt: Date;
  // SEO fields
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  twitterImage?: string;
  schemaType?: string;
  breadcrumbs?: Array<{ name: string; url: string }>;
  updatedAt?: Date;
}

export interface ITicket extends Document {
  title: string;
  description: string;
  userName: string;
  userEmail: string;
  status: string;
  priority: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITicketReply extends Document {
  ticketId: string;
  authorName: string;
  content: string;
  isAdmin: boolean;
  createdAt: Date;
}

export interface IAdmin extends Document {
  username: string;
  password: string;
  roles: string[];
  createdAt: Date;
}

export interface INewsletterSubscriber extends Document {
  email: string;
  createdAt: Date;
}

export interface ISeller extends Document {
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
  createdAt: Date;
}

export interface ISellerReview extends Document {
  sellerId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface ITutorial extends Document {
  title: string;
  description?: string;
  youtubeUrl: string;
  youtubeId: string;
  likes?: number;
  createdAt?: Date;
}

export interface ITutorialComment extends Document {
  tutorialId: string;
  author: string;
  content: string;
  createdAt?: Date;
}

export interface ISiteSettings extends Document {
  reviewVerificationEnabled: boolean;
  reviewVerificationVideoUrl: string;
  reviewVerificationPassphrase: string;
  reviewVerificationPrompt: string;
  reviewVerificationTimecode: string;
  reviewVerificationYouTubeChannelUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IWeapon extends Document {
  name: string;
  image?: string;
  category?: string;
  description?: string;
  stats?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IMode extends Document {
  name: string;
  image: string;
  description?: string;
  type?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRank extends Document {
  name: string;
  image: string;
  description?: string;
  requirements?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const PostSchema = new Schema<IPost>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  summary: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  tags: { type: [String], required: true },
  author: { type: String, required: true },
  views: { type: Number, default: 0 },
  readingTime: { type: Number, required: true },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  // SEO fields
  seoTitle: { type: String, default: "" },
  seoDescription: { type: String, default: "" },
  seoKeywords: { type: [String], default: [] },
  canonicalUrl: { type: String, default: "" },
  ogImage: { type: String, default: "" },
  twitterImage: { type: String, default: "" },
  schemaType: { type: String, default: "Article" },
  breadcrumbs: { type: [{ name: String, url: String }], default: [] },
  updatedAt: { type: Date, default: Date.now },
});

const CommentSchema = new Schema<IComment>({
  postId: { type: String, required: true },
  parentCommentId: { type: String },
  name: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const EventSchema = new Schema<IEvent>({
  title: { type: String, required: true },
  titleAr: { type: String, default: '' },
  description: { type: String, default: '' },
  descriptionAr: { type: String, default: '' },
  date: { type: String, required: true },
  type: { type: String, required: true },
  image: { type: String, default: '' },
  // SEO fields
  seoTitle: { type: String, default: '' },
  seoDescription: { type: String, default: '' },
  seoKeywords: { type: [String], default: [] },
  canonicalUrl: { type: String, default: '' },
  ogImage: { type: String, default: '' },
  twitterImage: { type: String, default: '' },
  schemaType: { type: String, default: 'Event' },
  breadcrumbs: { type: [{ name: String, url: String }], default: [] },
});

const NewsSchema = new Schema<INews>({
  title: { type: String, required: true },
  titleAr: { type: String, default: '' },
  dateRange: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  content: { type: String, required: true },
  contentAr: { type: String, default: '' },
  htmlContent: { type: String, default: '' },
  author: { type: String, required: true },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  // SEO fields
  seoTitle: { type: String, default: '' },
  seoDescription: { type: String, default: '' },
  seoKeywords: { type: [String], default: [] },
  canonicalUrl: { type: String, default: '' },
  ogImage: { type: String, default: '' },
  twitterImage: { type: String, default: '' },
  schemaType: { type: String, default: 'NewsArticle' },
  breadcrumbs: { type: [{ name: String, url: String }], default: [] },
  updatedAt: { type: Date, default: Date.now },
});

const TicketSchema = new Schema<ITicket>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  status: { type: String, default: 'open' },
  priority: { type: String, default: 'normal' },
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const TicketReplySchema = new Schema<ITicketReply>({
  ticketId: { type: String, required: true },
  authorName: { type: String, required: true },
  content: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const AdminSchema = new Schema<IAdmin>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  roles: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

const NewsletterSubscriberSchema = new Schema<INewsletterSubscriber>({
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

const SellerSchema = new Schema<ISeller>({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  images: { type: [String], default: [] },
  prices: { type: [{ item: String, price: Number }], default: [] },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  whatsapp: { type: String, default: '' },
  discord: { type: String, default: '' },
  website: { type: String, default: '' },
  featured: { type: Boolean, default: false },
  promotionText: { type: String, default: '' },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const SellerReviewSchema = new Schema<ISellerReview>({
  sellerId: { type: String, required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

const TutorialSchema = new Schema<ITutorial>({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  youtubeUrl: { type: String, required: true },
  youtubeId: { type: String, required: true },
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const TutorialCommentSchema = new Schema<ITutorialComment>({
  tutorialId: { type: String, required: true },
  author: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    reviewVerificationEnabled: { type: Boolean, default: false },
    reviewVerificationVideoUrl: { type: String, default: "" },
    reviewVerificationPassphrase: { type: String, default: "" },
    reviewVerificationPrompt: { type: String, default: "" },
    reviewVerificationTimecode: { type: String, default: "" },
    reviewVerificationYouTubeChannelUrl: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

const WeaponSchema = new Schema<IWeapon>({
  name: { type: String, required: true },
  image: { type: String, default: "" },
  category: { type: String, default: "" },
  description: { type: String, default: "" },
  stats: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const ModeSchema = new Schema<IMode>({
  name: { type: String, required: true },
  image: { type: String, default: "" },
  description: { type: String, default: "" },
  type: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const RankSchema = new Schema<IRank>({
  name: { type: String, required: true },
  image: { type: String, default: "" },
  description: { type: String, default: "" },
  requirements: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const UserModel = mongoose.model<IUser>('User', UserSchema);
export const PostModel = mongoose.model<IPost>('Post', PostSchema);
export const CommentModel = mongoose.model<IComment>('Comment', CommentSchema);
export const EventModel = mongoose.model<IEvent>('Event', EventSchema);
export const NewsModel = mongoose.model<INews>('News', NewsSchema);
export const TicketModel = mongoose.model<ITicket>('Ticket', TicketSchema);
export const TicketReplyModel = mongoose.model<ITicketReply>('TicketReply', TicketReplySchema);
export const AdminModel = mongoose.model<IAdmin>('Admin', AdminSchema);
export const NewsletterSubscriberModel = mongoose.model<INewsletterSubscriber>('NewsletterSubscriber', NewsletterSubscriberSchema);
export const SellerModel = mongoose.model<ISeller>('Seller', SellerSchema);
export const SellerReviewModel = mongoose.model<ISellerReview>('SellerReview', SellerReviewSchema);
export const TutorialModel = mongoose.model<ITutorial>('Tutorial', TutorialSchema);
export const TutorialCommentModel = mongoose.model<ITutorialComment>('TutorialComment', TutorialCommentSchema);
export const SiteSettingsModel = mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);
export const WeaponModel = mongoose.model<IWeapon>('Weapon', WeaponSchema);
export const ModeModel = mongoose.model<IMode>('Mode', ModeSchema);
export const RankModel = mongoose.model<IRank>('Rank', RankSchema);

export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const insertPostSchema = z.object({
  title: z.string(),
  content: z.string(),
  summary: z.string(),
  image: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  author: z.string(),
  readingTime: z.number(),
  featured: z.boolean().optional(),
  // SEO fields
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).optional(),
  canonicalUrl: z.string().optional(),
  ogImage: z.string().optional(),
  twitterImage: z.string().optional(),
  schemaType: z.string().optional(),
  breadcrumbs: z.array(z.object({ name: z.string(), url: z.string() })).optional(),
});

export const insertCommentSchema = z.object({
  postId: z.string(),
  parentCommentId: z.string().optional(),
  name: z.string(),
  content: z.string(),
});

export const insertEventSchema = z.object({
  title: z.string(),
  titleAr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  date: z.string(),
  type: z.string(),
  image: z.string().optional(),
  // SEO fields
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).optional(),
  canonicalUrl: z.string().optional(),
  ogImage: z.string().optional(),
  twitterImage: z.string().optional(),
  schemaType: z.string().optional(),
  breadcrumbs: z.array(z.object({ name: z.string(), url: z.string() })).optional(),
});

export const insertNewsSchema = z.object({
  title: z.string(),
  titleAr: z.string().optional(),
  dateRange: z.string(),
  image: z.string(),
  category: z.string(),
  content: z.string(),
  contentAr: z.string().optional(),
  htmlContent: z.string().optional(),
  author: z.string(),
  featured: z.boolean().optional(),
  // SEO fields
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).optional(),
  canonicalUrl: z.string().optional(),
  ogImage: z.string().optional(),
  twitterImage: z.string().optional(),
  schemaType: z.string().optional(),
  breadcrumbs: z.array(z.object({ name: z.string(), url: z.string() })).optional(),
});

export const insertTicketSchema = z.object({
  title: z.string(),
  description: z.string(),
  userName: z.string(),
  userEmail: z.string(),
  status: z.string().optional(),
  priority: z.string().optional(),
  category: z.string(),
});

export const insertTicketReplySchema = z.object({
  ticketId: z.string(),
  authorName: z.string(),
  content: z.string(),
  isAdmin: z.boolean().optional(),
});

export const insertAdminSchema = z.object({
  username: z.string(),
  password: z.string(),
  roles: z.array(z.string()).default([]),
});

export const insertNewsletterSubscriberSchema = z.object({
  email: z.string().email(),
});

export const insertSellerSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  prices: z.array(z.object({ item: z.string(), price: z.number() })).optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  discord: z.string().optional(),
  website: z.string().optional(),
  featured: z.boolean().optional(),
  promotionText: z.string().optional(),
});

export const insertSellerReviewSchema = z.object({
  sellerId: z.string(),
  userName: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  verificationAnswer: z.string().optional(),
});

export const insertTutorialSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  youtubeUrl: z.string().url(),
  youtubeId: z.string().min(1),
});

export const updateTutorialSchema = insertTutorialSchema.partial();

export const insertTutorialCommentSchema = z.object({
  tutorialId: z.string().min(1),
  author: z.string().min(1),
  content: z.string().min(1),
});

export const insertWeaponSchema = z.object({
  name: z.string().min(1),
  image: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  stats: z.record(z.any()).optional(),
});

export const insertModeSchema = z.object({
  name: z.string().min(1),
  image: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
});

export const insertRankSchema = z.object({
  name: z.string().min(1),
  image: z.string().optional(),
  description: z.string().optional(),
  requirements: z.string().optional(),
});

const urlOrEmptyString = z.string().trim().optional().transform((value) => value ?? "").refine((value) => {
  if (!value) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}, { message: "Must be a valid URL or left blank" });

export const siteSettingsSchema = z.object({
  reviewVerificationEnabled: z.boolean(),
  reviewVerificationVideoUrl: urlOrEmptyString,
  reviewVerificationPassphrase: z.string().trim().max(200).optional().transform((value) => value ?? ""),
  reviewVerificationPrompt: z.string().trim().max(1000).optional().transform((value) => value ?? ""),
  reviewVerificationTimecode: z.string().trim().max(50).optional().transform((value) => value ?? ""),
  reviewVerificationYouTubeChannelUrl: urlOrEmptyString,
});

export const updateSiteSettingsSchema = siteSettingsSchema.partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = IUser;

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = IPost;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = IComment;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = IEvent;

export type InsertNews = z.infer<typeof insertNewsSchema>;
export type News = INews;

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = ITicket;

export type InsertTicketReply = z.infer<typeof insertTicketReplySchema>;
export type TicketReply = ITicketReply;

export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = IAdmin;

export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type NewsletterSubscriber = INewsletterSubscriber;

export type InsertSeller = z.infer<typeof insertSellerSchema>;
export type Seller = ISeller;

export type InsertSellerReview = z.infer<typeof insertSellerReviewSchema>;
export type SellerReview = ISellerReview;

export type InsertTutorial = z.infer<typeof insertTutorialSchema>;
export type Tutorial = ITutorial;

export type InsertTutorialComment = z.infer<typeof insertTutorialCommentSchema>;
export type TutorialComment = ITutorialComment;

export type InsertWeapon = z.infer<typeof insertWeaponSchema>;
export type Weapon = IWeapon;

export type InsertMode = z.infer<typeof insertModeSchema>;
export type Mode = IMode;

export type InsertRank = z.infer<typeof insertRankSchema>;
export type Rank = IRank;

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
export type SiteSettingsUpdate = z.infer<typeof updateSiteSettingsSchema>;
export type SiteSettings = {
  reviewVerificationEnabled: boolean;
  reviewVerificationVideoUrl: string;
  reviewVerificationPassphrase: string;
  reviewVerificationPrompt: string;
  reviewVerificationTimecode: string;
  reviewVerificationYouTubeChannelUrl: string;
};
export type SiteSettingsDocument = ISiteSettings;
