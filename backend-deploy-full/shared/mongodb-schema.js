import mongoose, { Schema } from 'mongoose';
import { z } from 'zod';
const UserSchema = new Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    displayName: { type: String },
    avatarUrl: { type: String },
    verifiedEmail: { type: Boolean, default: false },
    verifiedPhone: { type: Boolean, default: false },
    emailVerificationCode: { type: String, default: '' },
    phoneVerificationCode: { type: String, default: '' },
    resetCode: { type: String, default: '' },
    resetCodeIssuedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
});
const PostSchema = new Schema({
    title: { type: String, required: true },
    post_slug: { type: String, default: "", index: true },
    content: { type: String, required: true },
    summary: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    images: { type: [String], default: [] },
    imagePublicIds: { type: [String], default: [] },
    category: { type: String, required: true },
    tags: { type: [String], required: true },
    author: { type: String, required: true },
    views: { type: Number, default: 0 },
    readingTime: { type: Number, required: true },
    featured: { type: Boolean, default: false },
    previewOnHome: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    language: { type: String, default: "en" },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    seoKeywords: { type: [String], default: [] },
    canonicalUrl: { type: String, default: "" },
    ogImage: { type: String, default: "" },
    twitterImage: { type: String, default: "" },
    schemaType: { type: String, default: "Article" },
    breadcrumbs: { type: [{ name: String, url: String }], default: [] },
    sourceUrl: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    externalLinks: { type: [{ name: String, url: String }], default: [] },
    version: { type: Number, default: 1 },
    updatedAt: { type: Date, default: Date.now },
});
const EventSchema = new Schema({
    title: { type: String, required: true },
    event_name_slug: { type: String, default: "", index: true },
    titleAr: { type: String, default: '' },
    description: { type: String, default: '' },
    descriptionAr: { type: String, default: '' },
    rawHtmlContent: { type: String, default: '' },
    date: { type: String, required: true },
    location: { type: String, default: '' },
    type: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    imagePublicId: { type: String, default: '' },
    images: { type: [String], default: [] },
    imagePublicIds: { type: [String], default: [] },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    seoKeywords: { type: [String], default: [] },
    canonicalUrl: { type: String, default: '' },
    ogImage: { type: String, default: '' },
    twitterImage: { type: String, default: '' },
    schemaType: { type: String, default: 'Event' },
    order: { type: Number, default: 9999 },
    breadcrumbs: { type: [{ name: String, url: String }], default: [] },
    sourceUrl: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    externalLinks: { type: [{ name: String, url: String }], default: [] },
    version: { type: Number, default: 1 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
const NewsSchema = new Schema({
    title: { type: String, required: true },
    news_slug: { type: String, default: "", index: true },
    titleAr: { type: String, default: '' },
    dateRange: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    images: { type: [String], default: [] },
    imagePublicIds: { type: [String], default: [] },
    category: { type: String, required: true },
    content: { type: String, default: "" },
    contentAr: { type: String, default: '' },
    htmlContent: { type: String, default: '' },
    rawHtmlContent: { type: String, default: '' },
    author: { type: String, required: true },
    featured: { type: Boolean, default: false },
    previewOnHome: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    seoKeywords: { type: [String], default: [] },
    canonicalUrl: { type: String, default: '' },
    ogImage: { type: String, default: '' },
    twitterImage: { type: String, default: '' },
    schemaType: { type: String, default: 'NewsArticle' },
    breadcrumbs: { type: [{ name: String, url: String }], default: [] },
    sourceUrl: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    externalLinks: { type: [{ name: String, url: String }], default: [] },
    version: { type: Number, default: 1 },
    updatedAt: { type: Date, default: Date.now },
});

const WikiVersionSchema = new Schema({
    pageId: { type: Schema.Types.ObjectId, required: true, index: true },
    pageType: { type: String, required: true }, // 'post', 'event', 'news'
    version: { type: Number, required: true },
    content: { type: Object, required: true }, // Complete snapshot of the page data
    author: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const WikiTemplateSchema = new Schema({
    name: { type: String, required: true, unique: true },
    type: { type: String, required: true }, // 'post', 'event', 'news'
    content: { type: Object, required: true }, // Default values for the form
    author: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const TicketSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    status: { type: String, default: 'open' },
    priority: { type: String, default: 'normal' },
    category: { type: String, required: true },
    mediaUrl: { type: String, default: '' },
    mediaPublicId: { type: String, default: '' },
    mediaType: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
const TicketReplySchema = new Schema({
    ticketId: { type: String, required: true },
    authorName: { type: String, required: true },
    content: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    mediaUrl: { type: String, default: '' },
    mediaPublicId: { type: String, default: '' },
    mediaType: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
});
const AdminSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    roles: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
});
const NewsletterSubscriberSchema = new Schema({
    email: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
});
const SellerSchema = new Schema({
    name: { type: String, required: true },
    seller_name_slug: { type: String, default: '' },
    description: { type: String, default: '' },
    images: { type: [String], default: [] },
    imageUrls: { type: [String], default: [] },
    prices: { type: [{ item: String, price: Number }], default: [] },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    discord: { type: String, default: '' },
    website: { type: String, default: '' },
    facebook: { type: String, default: '' },
    twitter: { type: String, default: '' },
    instagram: { type: String, default: '' },
    youtube: { type: String, default: '' },
    tiktok: { type: String, default: '' },
    telegram: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    promotionText: { type: String, default: '' },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    rank: { type: Number, default: 9999 },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    seoKeywords: { type: [String], default: [] },
    canonicalUrl: { type: String, default: '' },
    ogImage: { type: String, default: '' },
    twitterImage: { type: String, default: '' },
    schemaType: { type: String, default: 'Organization' },
    createdAt: { type: Date, default: Date.now },
});
const SellerReviewSchema = new Schema({
    sellerId: { type: String, required: true },
    userName: { type: String, required: true },
    userPhone: { type: String, default: '' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
});
const TutorialSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, default: "" },
    youtubeUrl: { type: String, required: true },
    youtubeId: { type: String, required: true },
    category: { type: String, default: "tutorial" },
    likes: { type: Number, default: 0 },
    order: { type: Number, default: 9999 },
    tutorial_slug: { type: String, default: "", unique: true },
    createdAt: { type: Date, default: Date.now },
});
const SiteSettingsSchema = new Schema({
    reviewVerificationEnabled: { type: Boolean, default: false },
    reviewVerificationVideoUrl: { type: String, default: "" },
    reviewVerificationPassphrase: { type: String, default: "" },
    reviewVerificationPrompt: { type: String, default: "" },
    reviewVerificationTimecode: { type: String, default: "" },
    reviewVerificationYouTubeChannelUrl: { type: String, default: "" },
    announcementsEnabled: { type: Boolean, default: true },
    publicBaseUrl: { type: String, default: "" },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    seoKeywords: { type: [String], default: [] },
    seoOgImageUrl: { type: String, default: "" },
    robots: { type: String, default: "index, follow" },
}, {
    timestamps: true,
});
const WeaponSchema = new Schema({
    name: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    backgroundUrl: { type: String, default: "" },
    category: { type: String, default: "" },
    description: { type: String, default: "" },
    stats: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
const ModeSchema = new Schema({
    name: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    imageHistory: [{ url: String, timestamp: { type: Date, default: Date.now } }], // Archive for images
    description: { type: String, default: "" },
    type: { type: String, default: "" },
    category: { type: String, default: "Standard" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
const MapSchema = new Schema({
    name: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    imageHistory: [{ url: String, timestamp: { type: Date, default: Date.now } }], // Archive for images
    description: { type: String, default: "" },
    mode: { type: String, default: "" },
    category: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
const RankSchema = new Schema({
    name: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    tier: { type: Number, default: 0 },
    expRequired: { type: Number, default: 0 },
    description: { type: String, default: "" },
    requirements: { type: String, default: "" },
    bonus: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
const MercenarySchema = new Schema({
    mercenaryId: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    role: { type: String, required: true },
    description: { type: String, default: "" },
    voiceLines: { type: [String], default: [] },
    order: { type: Number, default: 9999 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
const AdminPermissionSchema = new Schema({
    adminId: { type: String, required: true, unique: true },
    permissions: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
const EventCommentSchema = new Schema({
    eventId: { type: String, required: true },
    parentCommentId: { type: String },
    name: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    userId: { type: String },
    userAvatar: { type: String },
    email: { type: String, default: "" },
    likes: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] }
});

const CustomPageSchema = new Schema({
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    sourceUrl: { type: String },
    htmlContent: { type: String },
    seoTitle: { type: String },
    seoDescription: { type: String },
    seoKeywords: { type: [String] },
    ogImage: { type: String },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const PostModel = mongoose.models.Post || mongoose.model('Post', PostSchema);
export const EventModel = mongoose.models.Event || mongoose.model('Event', EventSchema);
export const NewsModel = mongoose.models.News || mongoose.model('News', NewsSchema);
export const TicketModel = mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);
export const TicketReplyModel = mongoose.models.TicketReply || mongoose.model('TicketReply', TicketReplySchema);
export const AdminModel = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
export const NewsletterSubscriberModel = mongoose.models.NewsletterSubscriber || mongoose.model('NewsletterSubscriber', NewsletterSubscriberSchema);
export const SellerModel = mongoose.models.Seller || mongoose.model('Seller', SellerSchema);
export const SellerReviewModel = mongoose.models.SellerReview || mongoose.model('SellerReview', SellerReviewSchema);
export const TutorialModel = mongoose.models.Tutorial || mongoose.model('Tutorial', TutorialSchema);
export const SiteSettingsModel = mongoose.models.SiteSettings || mongoose.model('SiteSettings', SiteSettingsSchema);
export const WeaponModel = mongoose.models.Weapon || mongoose.model('Weapon', WeaponSchema);
export const ModeModel = mongoose.models.Mode || mongoose.model('Mode', ModeSchema);
export const MapModel = mongoose.models.Map || mongoose.model('Map', MapSchema);
export const RankModel = mongoose.models.Rank || mongoose.model('Rank', RankSchema);
export const MercenaryModel = mongoose.models.Mercenary || mongoose.model('Mercenary', MercenarySchema);
export const AdminPermissionModel = mongoose.models.AdminPermission || mongoose.model('AdminPermission', AdminPermissionSchema);
export const WikiVersionModel = mongoose.models.WikiVersion || mongoose.model('WikiVersion', WikiVersionSchema);
export const WikiTemplateModel = mongoose.models.WikiTemplate || mongoose.model('WikiTemplate', WikiTemplateSchema);
export const EventCommentModel = mongoose.models.EventComment || mongoose.model('EventComment', EventCommentSchema);
export const CustomPageModel = mongoose.models.CustomPage || mongoose.model('CustomPage', CustomPageSchema);

// Analytics Schemas
const AnalyticsTutorialSchema = new mongoose.Schema({
    tutorialId: { type: String, required: true },
    visitorHash: { type: String, required: true },
    event: { type: String, enum: ['view', 'click', 'complete'], default: 'view' },
    durationMs: { type: Number, default: 0 },
    country: { type: String, default: 'Unknown' },
    device: { type: String, default: 'Desktop' },
    browser: { type: String, default: 'Unknown' },
    createdAt: { type: Date, default: Date.now }
});
const AnalyticsSellerSchema = new mongoose.Schema({
    sellerSlug: { type: String, required: true },
    visitorHash: { type: String, required: true },
    event: { type: String, enum: ['view', 'click'], default: 'view' },
    timeSpentMs: { type: Number, default: 0 },
    country: { type: String, default: 'Unknown' },
    device: { type: String, default: 'Desktop' },
    browser: { type: String, default: 'Unknown' },
    createdAt: { type: Date, default: Date.now }
});
const AnalyticsAnnouncementSchema = new mongoose.Schema({
    announcementId: { type: String, required: true },
    visitorHash: { type: String, required: true },
    event: { type: String, enum: ['view', 'click', 'conversion'], default: 'view' },
    country: { type: String, default: 'Unknown' },
    device: { type: String, default: 'Desktop' },
    browser: { type: String, default: 'Unknown' },
    createdAt: { type: Date, default: Date.now }
});

export const AnalyticsTutorialModel = mongoose.models.AnalyticsTutorial || mongoose.model('AnalyticsTutorial', AnalyticsTutorialSchema);
export const AnalyticsSellerModel = mongoose.models.AnalyticsSeller || mongoose.model('AnalyticsSeller', AnalyticsSellerSchema);
export const AnalyticsAnnouncementModel = mongoose.models.AnalyticsAnnouncement || mongoose.model('AnalyticsAnnouncement', AnalyticsAnnouncementSchema);

export const UploadedFileSchema = new mongoose.Schema({
    filename: String,
    mimetype: String,
    size: Number,
    width: Number,
    height: Number,
    localPath: String,
    cloudinaryPublicId: String,
    cloudinaryUrl: String,
    domainUrl: String,
    thumbnailUrl: String,
    resourceType: String,
    bucket: { type: String, default: "uploads" },
    createdAt: { type: Date, default: Date.now },
});
export const UploadedFileModel = mongoose.models.UploadedFile || mongoose.model('UploadedFile', UploadedFileSchema);
export const insertUserSchema = z.object({
    username: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(6),
    password: z.string().min(8).regex(/[^A-Za-z0-9]/),
    avatarUrl: z.string().optional(),
});
export const insertPostSchema = z.object({
    title: z.string(),
    post_slug: z.string().optional(),
    content: z.string(),
    summary: z.string(),
    imageUrl: z.string().optional(),
    images: z.array(z.string()).optional(),
    category: z.string(),
    tags: z.array(z.string()),
    author: z.string(),
    readingTime: z.number(),
    featured: z.boolean().optional(),
    previewOnHome: z.boolean().optional(),
    language: z.enum(["en", "ar"]).optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoKeywords: z.array(z.string()).optional(),
    canonicalUrl: z.string().optional(),
    ogImage: z.string().optional(),
    twitterImage: z.string().optional(),
    schemaType: z.string().optional(),
    breadcrumbs: z.array(z.object({ name: z.string(), url: z.string() })).optional(),
    updatedAt: z.date().optional(),
});
export const insertEventSchema = z.object({
    title: z.string(),
    event_name_slug: z.string().optional(),
    titleAr: z.string().optional(),
    description: z.string().optional(),
    descriptionAr: z.string().optional(),
    rawHtmlContent: z.string().optional(),
    date: z.string(),
    type: z.string(),
    imageUrl: z.string().optional(),
    images: z.array(z.string()).optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoKeywords: z.array(z.string()).optional(),
    canonicalUrl: z.string().optional(),
    ogImage: z.string().optional(),
    twitterImage: z.string().optional(),
    schemaType: z.string().optional(),
    order: z.number().optional(),
    breadcrumbs: z.array(z.object({ name: z.string(), url: z.string() })).optional(),
});
export const insertNewsSchema = z.object({
    title: z.string(),
    news_slug: z.string().optional(),
    titleAr: z.string().optional(),
    dateRange: z.string(),
    imageUrl: z.string().optional(),
    images: z.array(z.string()).optional(),
    category: z.string(),
    content: z.string().optional(),
    contentAr: z.string().optional(),
    htmlContent: z.string().optional(),
    rawHtmlContent: z.string().optional(),
    author: z.string(),
    featured: z.boolean().optional(),
    previewOnHome: z.boolean().optional(),
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
    mediaUrl: z.string().optional(),
    mediaType: z.string().optional(),
});
export const insertTicketReplySchema = z.object({
    ticketId: z.string(),
    authorName: z.string(),
    content: z.string(),
    isAdmin: z.boolean().optional(),
    mediaUrl: z.string().optional(),
    mediaPublicId: z.string().optional(),
    mediaType: z.string().optional(),
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
    seller_name_slug: z.string().optional(),
    description: z.string().optional(),
    images: z.array(z.string()).optional(),
    imageUrls: z.array(z.string()).optional(),
    prices: z.array(z.object({ item: z.string(), price: z.number() })).optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    discord: z.string().optional(),
    website: z.string().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    instagram: z.string().optional(),
    youtube: z.string().optional(),
    tiktok: z.string().optional(),
    telegram: z.string().optional(),
    featured: z.boolean().optional(),
    promotionText: z.string().optional(),
    rank: z.number().optional(),
});
export const insertSellerReviewSchema = z.object({
    sellerId: z.string(),
    userName: z.string(),
    userPhone: z.string().optional(),
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
    verificationAnswer: z.string().optional(),
});
export const insertTutorialSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    youtubeUrl: z.string().url(),
    youtubeId: z.string().min(1),
    category: z.enum(["tutorial", "streamer", "highlights", "game-weapons"]).optional(),
    order: z.number().optional(),
});
export const updateTutorialSchema = insertTutorialSchema.partial();
export const insertWeaponSchema = z.object({
    name: z.string().min(1),
    imageUrl: z.string().optional(),
    backgroundUrl: z.string().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    stats: z.record(z.any()).optional(),
});
export const insertModeSchema = z.object({
    name: z.string().min(1),
    imageUrl: z.string().optional(),
    imageHistory: z.array(z.object({ url: z.string() })).optional(),
    description: z.string().optional(),
    type: z.string().optional(),
    category: z.string().optional(),
});
export const insertMapSchema = z.object({
    name: z.string().min(1),
    imageUrl: z.string().optional(),
    imageHistory: z.array(z.object({ url: z.string() })).optional(),
    description: z.string().optional(),
    mode: z.string().optional(),
    category: z.string().optional(),
});
export const insertRankSchema = z.object({
    name: z.string().min(1),
    imageUrl: z.string().optional(),
    tier: z.number().optional(),
    expRequired: z.number().optional(),
    description: z.string().optional(),
    requirements: z.string().optional(),
    bonus: z.string().optional(),
});
export const insertMercenarySchema = z.object({
    name: z.string().min(1),
    imageUrl: z.string().min(1),
    role: z.string().min(1),
    sounds: z.array(z.string()).optional(),
    order: z.number().optional(),
});
const urlOrEmptyString = z.string().trim().optional().transform((value) => value ?? "").refine((value) => {
    if (!value)
        return true;
    try {
        new URL(value);
        return true;
    }
    catch {
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
    announcementsEnabled: z.boolean().optional().default(true),
    publicBaseUrl: urlOrEmptyString,
    seoTitle: z.string().trim().max(120).optional().transform((value) => value ?? ""),
    seoDescription: z.string().trim().max(300).optional().transform((value) => value ?? ""),
    seoKeywords: z.array(z.string().trim().max(50)).optional().transform((value) => value ?? []),
    seoOgImageUrl: urlOrEmptyString,
    robots: z.string().trim().optional().transform((value) => value ?? "index, follow").refine((v) => {
        const allowed = new Set(["index, follow", "noindex, follow", "index, nofollow", "noindex, nofollow"]);
        return allowed.has(v.toLowerCase());
    }, { message: "Robots must be one of: index, follow | noindex, follow | index, nofollow | noindex, nofollow" }),
    featuredWeapons: z.array(z.string()).optional().transform((v) => v ?? []),
});
export const updateSiteSettingsSchema = siteSettingsSchema.partial();
const ConversationSchema = new Schema({
    participants: { type: [String], required: true },
    name: { type: String },
    type: { type: String, enum: ['direct', 'group', 'channel'], default: 'direct' },
    avatar: { type: String },
    admins: { type: [String] },
    createdAt: { type: Date, default: Date.now },
    lastMessageAt: { type: Date },
});
const MessageSchema = new Schema({
    conversationId: { type: String, required: true },
    senderId: { type: String, required: true },
    content: { type: String, required: true },
    mentions: { type: [String], default: [] },
    replyTo: { type: String },
    mediaUrl: { type: String },
    mediaType: { type: String, enum: ['image', 'video', 'file'] },
    readBy: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, default: 'sent' },
});
export const ConversationModel = mongoose.model('Conversation', ConversationSchema);
export const MessageModel = mongoose.model('Message', MessageSchema);
export const insertConversationSchema = z.object({
    participants: z.array(z.string()).min(1),
    name: z.string().optional(),
    type: z.enum(['direct', 'group', 'channel']).default('direct'),
    avatar: z.string().optional(),
    admins: z.array(z.string()).optional(),
});
export const insertMessageSchema = z.object({
    conversationId: z.string(),
    senderId: z.string(),
    content: z.string().min(1).max(4000),
    replyTo: z.string().optional(),
    mediaUrl: z.string().optional(),
    mediaType: z.enum(['image', 'video', 'file']).optional(),
});