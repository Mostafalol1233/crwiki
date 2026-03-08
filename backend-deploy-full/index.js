// Ensure environment variables from .env are loaded when node runs index.js directly
import "dotenv/config";

// server/index-production.ts
import express from "express";
import path from "path";
import fs from "fs";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { MirrorService } from './services/mirror.js';

// Import weapons data for auto-seeding
import { weaponsData } from "./weapons-all-seed.js";

// server/routes.ts
import { createServer } from "http";
import multer from "multer";
import rateLimit from "express-rate-limit";

// shared/mongodb-schema.ts
import mongoose, { Schema } from "mongoose";
import { z } from "zod";
import FormData from "form-data";
var UserSchema = new Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, default: "", unique: true },
    phone: { type: String, default: "", unique: true },
    password: { type: String, required: true },
    verifiedEmail: { type: Boolean, default: false },
    verifiedPhone: { type: Boolean, default: false },
    emailVerificationCode: { type: String, default: "" },
    phoneVerificationCode: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
});

function isCrawlerUserAgent(ua) {
    const s = String(ua || "");
    return /(whatsapp|facebookexternalhit|twitterbot|slackbot|discordbot|linkedinbot|telegrambot|skypeuripreview)/i.test(s);
}

function toCloudinary1200x630(url) {
    try {
        const u = new URL(url);
        if (/res\.cloudinary\.com/i.test(u.hostname) && /\/image\/upload\//.test(u.pathname)) {
            const p = u.pathname.replace(/\/image\/upload\//, "/image/upload/c_fill,w_1200,h_630,f_auto,q_auto/");
            return `${u.protocol}//${u.host}${p}${u.search}${u.hash}`;
        }
        return url;
    }
    catch {
        return url;
    }
}

function resolveAbsoluteUrl(maybeUrl, baseUrl) {
    const src = String(maybeUrl || "").trim();
    if (!src)
        return "";
    try {
        return new URL(src, baseUrl).toString();
    }
    catch {
        return src.startsWith("/") ? `${baseUrl}${src}` : `${baseUrl}/${src}`;
    }
}

function escapeHtmlAttr(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function injectOgMeta(html, meta) {
    let out = String(html || "");
    const upsert = (propertyOrName, content, isName) => {
        if (!content)
            return;
        const attr = isName ? "name" : "property";
        const key = isName ? `name=\"${propertyOrName}\"` : `property=\"${propertyOrName}\"`;
        const escaped = escapeHtmlAttr(content);
        const re = new RegExp(`<meta\\s+${attr}=\\"${propertyOrName.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\"[^>]*?>`, "i");
        if (re.test(out)) {
            out = out.replace(re, `<meta ${attr}="${propertyOrName}" content="${escaped}" data-og-dynamic="true" />`);
        }
        else {
            out = out.replace(/<\/head>/i, `  <meta ${attr}="${propertyOrName}" content="${escaped}" data-og-dynamic="true" />\n</head>`);
        }
    };

    upsert("og:title", meta.title, false);
    upsert("og:description", meta.description, false);
    upsert("og:url", meta.url, false);
    upsert("og:type", meta.type || "article", false);
    upsert("og:image", meta.image, false);
    upsert("og:image:secure_url", meta.image, false);
    upsert("og:image:width", meta.imageWidth ? String(meta.imageWidth) : "1200", false);
    upsert("og:image:height", meta.imageHeight ? String(meta.imageHeight) : "630", false);
    upsert("twitter:card", "summary_large_image", true);
    upsert("twitter:title", meta.title, true);
    upsert("twitter:description", meta.description, true);
    upsert("twitter:image", meta.image, true);
    return out;
}
var PostSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, default: "" },
    summary: { type: String, default: "" },
    image: { type: String, default: "" },
    images: { type: [String], default: [] },
    category: { type: String, required: true },
    tags: { type: [String], required: true },
    author: { type: String, required: true },
    views: { type: Number, default: 0 },
    readingTime: { type: Number, required: true },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    post_slug: { type: String, default: "", unique: true },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    seoKeywords: { type: [String], default: [] },
    canonicalUrl: { type: String, default: "" },
    ogImage: { type: String, default: "" },
    twitterImage: { type: String, default: "" },
    schemaType: { type: String, default: "Article" },
    language: { type: String, default: "en" },
    createdByAdminId: { type: String, default: "" },
    createdByAdminName: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
});

var EventSchema = new Schema({
    title: { type: String, required: true },
    titleAr: { type: String, default: "" },
    description: { type: String, default: "" },
    descriptionAr: { type: String, default: "" },
    date: { type: String, required: true },
    type: { type: String, required: true },
    image: { type: String, default: "" },
    images: { type: [String], default: [] },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    seoKeywords: { type: [String], default: [] },
    canonicalUrl: { type: String, default: "" },
    ogImage: { type: String, default: "" },
    twitterImage: { type: String, default: "" },
    schemaType: { type: String, default: "Event" },
    order: { type: Number, default: 0 },
    event_name_slug: { type: String, default: "", unique: true },
    createdByAdminId: { type: String, default: "" },
    createdByAdminName: { type: String, default: "" },
});

var NewsSchema = new Schema({
    title: { type: String, required: true },
    titleAr: { type: String, default: "" },
    dateRange: { type: String, required: true },
    image: { type: String, default: "" },
    images: { type: [String], default: [] },
    category: { type: String, required: true },
    content: { type: String, default: "" },
    contentAr: { type: String, default: "" },
    htmlContent: { type: String, default: "" },
    author: { type: String, required: true },
    featured: { type: Boolean, default: false },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    seoKeywords: { type: [String], default: [] },
    canonicalUrl: { type: String, default: "" },
    ogImage: { type: String, default: "" },
    twitterImage: { type: String, default: "" },
    schemaType: { type: String, default: "NewsArticle" },
    order: { type: Number, default: 0 },
    news_slug: { type: String, default: "", unique: true },
    createdByAdminId: { type: String, default: "" },
    createdByAdminName: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
});
NewsSchema.index({ news_slug: 1 }, { unique: true });
var TutorialSchema = new Schema({
    title: { type: String, required: true },
    youtubeUrl: { type: String, required: true },
    youtubeId: { type: String, required: true },
    category: { type: String, default: "tutorial" },
    description: { type: String, default: "" },
    likes: { type: Number, default: 0 },
    order: { type: Number, default: 9999 },
    tutorial_slug: { type: String, default: "", unique: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

var TicketSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    status: { type: String, default: "open" },
    priority: { type: String, default: "normal" },
    category: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
var TicketReplySchema = new Schema({
    ticketId: { type: String, required: true },
    authorName: { type: String, required: true },
    content: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});
var EventCommentSchema = new Schema({
    eventId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    content: { type: String, required: true },
    parentCommentId: { type: String, default: null },
    likes: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] },
    userId: { type: String, default: "" },
    userAvatar: { type: String, default: "" },
    email: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
});
var AdminSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "admin" },
    permissions: { type: Schema.Types.Mixed, default: {} },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    contact: { type: String, default: "" },
    profileImageUrl: { type: String, default: "" },
    active: { type: Boolean, default: true },
    bio: { type: String, default: "" },
    create_limit: { type: Number, default: -1 },
    posts_created: { type: Number, default: 0 },
    events_created: { type: Number, default: 0 },
    news_created: { type: Number, default: 0 },
    tutorials_created: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});
var NewsletterSubscriberSchema = new Schema({
    email: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
});
var SellerSchema = new Schema({
    name: { type: String, required: true },
    seller_name_slug: { type: String, default: "" },
    description: { type: String, default: "" },
    images: { type: [String], default: [] },
    prices: { type: [{ item: String, price: Number }], default: [] },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    discord: { type: String, default: "" },
    website: { type: String, default: "" },
    facebook: { type: String, default: "" },
    twitter: { type: String, default: "" },
    instagram: { type: String, default: "" },
    youtube: { type: String, default: "" },
    tiktok: { type: String, default: "" },
    telegram: { type: String, default: "" },
    featured: { type: Boolean, default: false },
    promotionText: { type: String, default: "" },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    rank: { type: Number, default: 9999 },
    createdAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
    reviewPromptEnabled: { type: Boolean, default: false },
    reviewPromptText: { type: String, default: "" },
});
var SellerReviewSchema = new Schema({
    sellerId: { type: String, required: true },
    userId: { type: String, default: "" },
    userName: { type: String, required: true },
    userPhoneEncrypted: { type: String, default: "" },
    phoneCountryCode: { type: String, default: "" },
    phoneLast4: { type: String, default: "" },
    phoneVerified: { type: Boolean, default: false },
    helpfulVotes: { type: Number, default: 0 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
});
var UserModel = mongoose.models.User || mongoose.model("User", UserSchema);
var PostModel = mongoose.models.Post || mongoose.model("Post", PostSchema);
var EventModel = mongoose.models.Event || mongoose.model("Event", EventSchema);
var NewsModel = mongoose.models.News || mongoose.model("News", NewsSchema);
var TicketModel = mongoose.models.Ticket || mongoose.model("Ticket", TicketSchema);
var TutorialModel = mongoose.models.Tutorial || mongoose.model("Tutorial", TutorialSchema);
var TicketReplyModel = mongoose.models.TicketReply || mongoose.model("TicketReply", TicketReplySchema);
var AdminModel = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);
var EventCommentModel = mongoose.models.EventComment || mongoose.model("EventComment", EventCommentSchema);
var NewsletterSubscriberModel = mongoose.models.NewsletterSubscriber || mongoose.model(
    "NewsletterSubscriber",
    NewsletterSubscriberSchema,
);
var SellerModel = mongoose.models.Seller || mongoose.model("Seller", SellerSchema);
var SellerReviewModel = mongoose.models.SellerReview || mongoose.model("SellerReview", SellerReviewSchema);
var UploadedFileSchema = new Schema({
    filename: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    localPath: { type: String, default: "" },
    cloudinaryPublicId: { type: String, default: "" },
    cloudinaryUrl: { type: String, default: "" },
    domainUrl: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    resourceType: { type: String, default: "auto" },
    data: { type: Buffer }, // For storing file content directly in Mongo
    bucket: { type: String, default: "uploads" },
    createdAt: { type: Date, default: Date.now },
});
UploadedFileSchema.index({ bucket: 1, filename: 1 }, { unique: true });
var UploadedFileModel = mongoose.models.UploadedFile || mongoose.model("UploadedFile", UploadedFileSchema);
var UrlMatchFailureSchema = new Schema({
    type: { type: String, required: true },
    value: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});
var UrlMatchFailureModel = mongoose.models.UrlMatchFailure || mongoose.model("UrlMatchFailure", UrlMatchFailureSchema);
var UrlGenerationAuditSchema = new Schema({
    type: { type: String, required: true },
    source: { type: String, required: true },
    slug: { type: String, required: true },
    ok: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});
var UrlGenerationAuditModel = mongoose.models.UrlGenerationAudit || mongoose.model("UrlGenerationAudit", UrlGenerationAuditSchema);
SellerSchema.index({ name: 1 });
SellerSchema.index({ seller_name_slug: 1 }, { unique: true });
EventSchema.index({ event_name_slug: 1 }, { unique: true });
PostSchema.index({ post_slug: 1 }, { unique: true });
TutorialSchema.index({ tutorial_slug: 1 }, { unique: true });
SellerReviewSchema.index({ sellerId: 1, userId: 1 }, { unique: true, partialFilterExpression: { userId: { $type: "string" } } });
var AdminAuditLogSchema = new Schema({
    action: { type: String, required: true },
    reviewId: { type: String, required: true },
    adminId: { type: String, required: true },
    details: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
});
var AdminAuditLogModel = mongoose.models.AdminAuditLog || mongoose.model("AdminAuditLog", AdminAuditLogSchema);
// Weapons / Modes / Ranks / Mercenaries schemas (added to support seeding endpoints)
var MercenarySchema = new Schema({
    mercenaryId: { type: String, required: true },
    name: { type: String, required: true, unique: true },
    image: { type: String, required: true },
    role: { type: String, default: "" },
    description: { type: String, default: "" },
    voiceLines: { type: [String], default: [] },
    order: { type: Number, default: 9999 },
    createdAt: { type: Date, default: Date.now },
});
var WeaponSchema = new Schema({
    name: { type: String, required: true },
    image: { type: String, default: "" },
    description: { type: String, default: "" },
    category: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
});
WeaponSchema.index({ name: 1 });
WeaponSchema.index({ category: 1 });
var ModeSchema = new Schema({
    name: { type: String, required: true },
    image: { type: String, default: "" },
    description: { type: String, default: "" },
    video: { type: String, default: "" },
    type: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
});
var RankSchema = new Schema({
    name: { type: String, required: true },
    tier: { type: Number, default: 0 },
    image: { type: String, default: "" },
    emblem: { type: String, default: "" },
    description: { type: String, default: "" },
    expRequired: { type: Number, default: 0 },
    bonus: { type: String, default: "" },
    requirements: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
});
var MercenaryModel = mongoose.models.Mercenary || mongoose.model("Mercenary", MercenarySchema);
var WeaponModel = mongoose.models.Weapon || mongoose.model("Weapon", WeaponSchema);
var ModeModel = mongoose.models.Mode || mongoose.model("Mode", ModeSchema);
var RankModel = mongoose.models.Rank || mongoose.model("Rank", RankSchema);
var ConversationSchema = new Schema({
    participants: { type: [String], required: true },
    type: { type: String, enum: ['direct', 'group', 'channel'], default: 'direct' },
    lastMessage: { type: String },
    lastMessageAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
});
ConversationSchema.index({ participants: 1 });

var MessageSchema = new Schema({
    conversationId: { type: String, required: true, index: true },
    sender: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['text', 'image', 'system'], default: 'text' },
    readBy: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
});

var ConversationModel = mongoose.models.Conversation || mongoose.model("Conversation", ConversationSchema);
var MessageModel = mongoose.models.Message || mongoose.model("Message", MessageSchema);
var ChatUserSchema = new Schema({
    userName: { type: String, required: true },
    phone: { type: String, default: "" },
    verified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});
var ChatUserModel = mongoose.models.ChatUser || mongoose.model("ChatUser", ChatUserSchema);
var ChatSettingsSchema = new Schema({
    name: { type: String, default: "chat" },
    registrationEnabled: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now },
});
var ChatSettingsModel = mongoose.models.ChatSettings || mongoose.model("ChatSettings", ChatSettingsSchema);
var AnalyticsTutorialSchema = new Schema({
    tutorialId: { type: String, index: true },
    visitorHash: { type: String, index: true },
    event: { type: String },
    durationMs: { type: Number, default: 0 },
    country: { type: String, default: "unknown" },
    device: { type: String, default: "unknown" },
    browser: { type: String, default: "unknown" },
    createdAt: { type: Date, default: Date.now, index: true },
}, { collection: "analytics_tutorials" });
var AnalyticsSellerSchema = new Schema({
    sellerSlug: { type: String, index: true },
    visitorHash: { type: String, index: true },
    event: { type: String },
    timeSpentMs: { type: Number, default: 0 },
    country: { type: String, default: "unknown" },
    device: { type: String, default: "unknown" },
    browser: { type: String, default: "unknown" },
    createdAt: { type: Date, default: Date.now, index: true },
}, { collection: "analytics_sellers" });
var AnalyticsAnnouncementSchema = new Schema({
    announcementId: { type: String, index: true },
    visitorHash: { type: String, index: true },
    event: { type: String },
    country: { type: String, default: "unknown" },
    device: { type: String, default: "unknown" },
    browser: { type: String, default: "unknown" },
    createdAt: { type: Date, default: Date.now, index: true },
}, { collection: "analytics_announcements" });
var AnalyticsTutorialModel = mongoose.models.AnalyticsTutorialModel || mongoose.model("AnalyticsTutorialModel", AnalyticsTutorialSchema);
var AnalyticsSellerModel = mongoose.models.AnalyticsSellerModel || mongoose.model("AnalyticsSellerModel", AnalyticsSellerSchema);
var AnalyticsAnnouncementModel = mongoose.models.AnalyticsAnnouncementModel || mongoose.model("AnalyticsAnnouncementModel", AnalyticsAnnouncementSchema);
var SiteSettingsSchema = new Schema({
    publicBaseUrl: { type: String, default: "" },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    seoKeywords: { type: [String], default: [] },
    seoOgImage: { type: String, default: "" },
    backgroundImageUrl: { type: String, default: "" },
    robots: { type: String, default: "index, follow" },
    announcementsEnabled: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });
var SiteSettingsModel = mongoose.models.SiteSettings || mongoose.model("SiteSettings", SiteSettingsSchema);
var GlobalAnnouncementSchema = new Schema({
    contentHtml: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    linkUrl: { type: String, default: "" },
    active: { type: Boolean, default: true },
    dismissible: { type: Boolean, default: true },
    direction: { type: String, default: "auto" },
}, { timestamps: true });
var SellerAnnouncementSchema = new Schema({
    sellerSlug: { type: String, index: true, unique: true },
    contentHtml: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    linkUrl: { type: String, default: "" },
    active: { type: Boolean, default: true },
    direction: { type: String, default: "auto" },
}, { timestamps: true });
var GlobalAnnouncementModel = mongoose.models.GlobalAnnouncement || mongoose.model("GlobalAnnouncement", GlobalAnnouncementSchema);
var SellerAnnouncementModel = mongoose.models.SellerAnnouncement || mongoose.model("SellerAnnouncement", SellerAnnouncementSchema);
var SellerPageSchema = new Schema({
    sellerSlug: { type: String, index: true, unique: true },
    images: { type: [String], default: [] },
    descriptionHtml: { type: String, default: "" },
    blocks: {
        type: [
            {
                image: { type: String, default: "" },
                contentHtml: { type: String, default: "" },
                description: { type: String, default: "" },
            },
        ],
        default: [],
    },
}, { timestamps: true });
var SellerPageModel = mongoose.models.SellerPage || mongoose.model("SellerPage", SellerPageSchema);
var CustomPageSchema = new Schema({
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, default: "" },
    sourceUrl: { type: String, default: "" },
    htmlContent: { type: String, default: "" },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    seoKeywords: { type: [String], default: [] },
    ogImage: { type: String, default: "" },
    active: { type: Boolean, default: true },
}, { timestamps: true });
var CustomPageModel = mongoose.models.CustomPage || mongoose.model("CustomPage", CustomPageSchema);
var insertUserSchema = z.object({
    username: z.string(),
    password: z.string(),
});
var insertPostSchema = z.object({
    title: z.string(),
    content: z.string().optional(),
    summary: z.string().optional(),
    image: z.string().optional(),
    images: z.array(z.string()).optional(),
    category: z.string(),
    tags: z.array(z.string()),
    author: z.string(),
    readingTime: z.number(),
    featured: z.boolean().optional(),
    order: z.number().optional(),
    fullLayout: z.boolean().optional(),
});
var insertConversationSchema = z.object({
    participants: z.array(z.string()),
    type: z.enum(['direct', 'group', 'channel']).default('direct'),
    initialMessage: z.string().optional(),
});
var insertMessageSchema = z.object({
    conversationId: z.string(),
    content: z.string(),
    type: z.enum(['text', 'image', 'system']).default('text'),
});
var insertEventSchema = z.object({
    title: z.string(),
    titleAr: z.string().optional(),
    description: z.string().optional(),
    descriptionAr: z.string().optional(),
    date: z.string(),
    type: z.string(),
    image: z.string().optional(),
    images: z.array(z.string()).optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoKeywords: z.array(z.string()).optional(),
    canonicalUrl: z.string().optional(),
    ogImage: z.string().optional(),
    twitterImage: z.string().optional(),
    schemaType: z.string().optional(),
    order: z.number().optional(),
    fullLayout: z.boolean().optional(),
});
var insertNewsSchema = z.object({
    title: z.string(),
    titleAr: z.string().optional(),
    dateRange: z.string(),
    image: z.string().optional(),
    images: z.array(z.string()).optional(),
    category: z.string(),
    content: z.string().optional(),
    contentAr: z.string().optional(),
    htmlContent: z.string().optional(),
    author: z.string(),
    featured: z.boolean().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoKeywords: z.array(z.string()).optional(),
    canonicalUrl: z.string().optional(),
    ogImage: z.string().optional(),
    twitterImage: z.string().optional(),
    schemaType: z.string().optional(),
    order: z.number().optional(),
    fullLayout: z.boolean().optional(),
});
var insertTicketSchema = z.object({
    title: z.string(),
    description: z.string(),
    userName: z.string(),
    userEmail: z.string(),
    status: z.string().optional(),
    priority: z.string().optional(),
    category: z.string(),
});
var insertTicketReplySchema = z.object({
    ticketId: z.string(),
    authorName: z.string(),
    content: z.string(),
    isAdmin: z.boolean().optional(),
});
var insertAdminSchema = z.object({
    username: z.string(),
    password: z.string(),
    role: z.string().optional(),
    name: z.string().optional(),
    email: z.string().optional(),
    contact: z.string().optional(),
    profileImageUrl: z.string().optional(),
    active: z.boolean().optional(),
    bio: z.string().optional(),
    permissions: z.record(z.boolean()).optional(),
    allowedSellerIds: z.array(z.string()).optional(),
});
var insertNewsletterSubscriberSchema = z.object({
    email: z.string().email(),
});
var insertSellerSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    images: z.array(z.string()).optional(),
    prices: z
        .array(z.object({ item: z.string(), price: z.number() }))
        .optional(),
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
    reviewPromptEnabled: z.boolean().optional(),
    reviewPromptText: z.string().optional(),
});
var insertSellerReviewSchema = z.object({
    sellerId: z.string(),
    userId: z.string().optional(),
    userName: z.string(),
    userPhone: z.string().optional(),
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
});

// server/mongodb.ts
import mongoose2 from "mongoose";
var isConnected = false;
async function connectMongoDB(maxRetries = 5) {
    if (isConnected) {
        console.log("MongoDB is already connected");
        return;
    }
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (!mongoUri) {
        throw new Error("MONGODB_URI or DATABASE_URL environment variable is not defined");
    }
    let attempt = 0;
    while (!isConnected && attempt <= maxRetries) {
        try {
            attempt++;
            await mongoose2.connect(mongoUri);
            isConnected = true;
            console.log("MongoDB connected successfully");
            break;
        } catch (error) {
            const delayMs = Math.min(30000, 1000 * Math.pow(2, attempt));
            console.error(`MongoDB connection error (attempt ${attempt}):`, error);
            if (attempt > maxRetries) throw error;
            await new Promise((r) => setTimeout(r, delayMs));
        }
    }
}
mongoose2.connection.on("disconnected", () => {
    isConnected = false;
    console.log("MongoDB disconnected");
});
mongoose2.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
});

// server/mongodb-storage.ts
var MongoDBStorage = class {
    mercenaries;
    initialized = false;
    constructor() {
        this.mercenaries = /* @__PURE__ */ new Map();
        this.initializeMercenaries();
        this.connect().catch(err => {
            console.error("Critical: Failed to connect to MongoDB in MongoDBStorage constructor:", err.message);
        });
    }
    async connect() {
        if (!this.initialized) {
            await connectMongoDB();
            this.initialized = true;
        }
    }
    initializeMercenaries() {
        const mercenaries = [
            {
                mercenaryId: "1",
                name: "Wolf",
                image: "https://files.catbox.moe/6npa73.jpeg",
                role: "Assault",
                description: "Aggressive assault specialist",
            },
            {
                mercenaryId: "2",
                name: "Vipers",
                image: "https://files.catbox.moe/4il6hi.jpeg",
                role: "Sniper",
                description: "Precision sniper expert",
            },
            {
                mercenaryId: "3",
                name: "Sisterhood",
                image: "https://files.catbox.moe/3o58nb.jpeg",
                role: "Medic",
                description: "Support and healing specialist",
            },
            {
                mercenaryId: "4",
                name: "Black Mamba",
                image: "https://files.catbox.moe/r26ox6.jpeg",
                role: "Scout",
                description: "Fast reconnaissance scout",
            },
            {
                mercenaryId: "5",
                name: "Arch Honorary",
                image: "https://files.catbox.moe/ctwnqz.jpeg",
                role: "Guardian",
                description: "Protective guardian role",
            },
            {
                mercenaryId: "6",
                name: "Desperado",
                image: "https://files.catbox.moe/hh7h5u.jpeg",
                role: "Engineer",
                description: "Technical engineer specialist",
            },
            {
                mercenaryId: "7",
                name: "Ronin",
                image: "https://files.catbox.moe/eck3jc.jpeg",
                role: "Samurai",
                description: "Melee combat warrior",
            },
            {
                mercenaryId: "8",
                name: "Dean",
                image: "https://files.catbox.moe/t78mvu.jpeg",
                role: "Specialist",
                description: "Specialized tactics expert",
            },
            {
                mercenaryId: "9",
                name: "Thoth",
                image: "https://files.catbox.moe/g4zfzn.jpeg",
                role: "Guardian",
                description: "Protective guardian role",
            },
            {
                mercenaryId: "10",
                name: "SFG",
                image: "https://files.catbox.moe/3bba2g.jpeg",
                role: "Special Forces",
                description: "Special forces operative",
            },
        ];
        mercenaries.forEach((merc) => this.mercenaries.set(merc.mercenaryId, merc));
    }
    async getUser(id) {
        const user = await UserModel.findById(id);
        return user || void 0;
    }
    async getUserByUsername(username) {
        const user = await UserModel.findOne({ username });
        return user || void 0;
    }
    async getUserByEmail(email) {
        const user = await UserModel.findOne({ email });
        return user || void 0;
    }
    async getUserByPhone(phone) {
        const user = await UserModel.findOne({ phone });
        return user || void 0;
    }
    async createUser(user) {
        const newUser = await UserModel.create(user);
        return newUser;
    }
    async updateUser(id, updates) {
        const updated = await UserModel.findByIdAndUpdate(id, updates, {
            new: true,
        }).lean();
        if (!updated) return void 0;
        return { ...updated, id: String(updated._id) };
    }
    async getAllPosts(opts) {
        const hasOpts = !!(opts && typeof opts === "object" && Object.keys(opts).length);
        const baseQuery = {};
        if (hasOpts) {
            const category = (opts.category !== void 0 && opts.category !== null) ? String(opts.category).trim() : "";
            const search = (opts.search !== void 0 && opts.search !== null) ? String(opts.search).trim() : "";
            const featuredRaw = (opts.featured !== void 0 && opts.featured !== null) ? String(opts.featured).trim() : "";
            if (category)
                baseQuery.category = category;
            if (featuredRaw)
                baseQuery.featured = featuredRaw === "true" || featuredRaw === "1";
            if (search) {
                baseQuery.$or = [
                    { title: { $regex: search, $options: "i" } },
                    { summary: { $regex: search, $options: "i" } },
                    { content: { $regex: search, $options: "i" } },
                    { author: { $regex: search, $options: "i" } },
                ];
            }
        }
        const mapPost = (post) => ({
            ...post,
            id: String(post._id),
            slug: post.slug || "",
            tags: post.tags || [],
            views: post.views || 0,
            category: post.category || "",
            author: post.author || "Unknown",
            order: post.order || 0,
        });

        if (!hasOpts) {
            const posts = await PostModel.find().sort({ order: -1, createdAt: -1 }).lean();
            return posts.map(mapPost);
        }

        const limit = Math.max(1, Math.min(100, Number(opts.limit) || 20));
        const offset = Math.max(0, Number(opts.offset) || 0);

        const [items, total] = await Promise.all([
            PostModel.find(baseQuery).sort({ order: -1, createdAt: -1 }).skip(offset).limit(limit).lean(),
            PostModel.countDocuments(baseQuery),
        ]);

        return { items: items.map(mapPost), total };
    }
    async getPostById(id) {
        const post = await PostModel.findById(id).lean();
        if (!post) return void 0;
        return {
            ...post,
            id: String(post._id),
            slug: post.slug || "",
            tags: post.tags || [],
            views: post.views || 0,
            category: post.category || "",
            author: post.author || "Unknown",
        };
    }
    async createPost(post) {
        const baseUrl = (process.env.PUBLIC_BASE_URL || "https://crossfire.wiki").replace(/\/$/, "");
        const payload = { ...post };
        const src = payload.title || payload.seoTitle || "";
        payload.post_slug = slugifyEventName(src);
        await this.logUrlGeneration("post", src, payload.post_slug, !!payload.post_slug);
        if (!payload.seoTitle) payload.seoTitle = payload.title || "";
        const plainContent = String(payload.content || payload.summary || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        if (!payload.seoDescription || payload.seoDescription.length < 60 || payload.seoDescription.length > 160) {
            const d = generateSummary(plainContent, 160);
            payload.seoDescription = d.length < 60 ? plainContent.substring(0, Math.min(160, Math.max(60, plainContent.length))).trim() : d;
        }
        if (!payload.seoKeywords || (Array.isArray(payload.seoKeywords) ? payload.seoKeywords.length === 0 : true)) {
            payload.seoKeywords = suggestKeywords(plainContent, 8);
        }
        if (!payload.canonicalUrl) payload.canonicalUrl = `${baseUrl}/article/${payload.post_slug}`;
        if (!payload.ogImage && payload.image) payload.ogImage = payload.image;
        if (!payload.twitterImage && (payload.ogImage || payload.image)) payload.twitterImage = payload.ogImage || payload.image;
        if (!payload.schemaType) payload.schemaType = "Article";
        if (!payload.language) payload.language = "en";
        const newPost = await PostModel.create(payload);
        const lean = await PostModel.findById(newPost._id).lean();
        if (!lean) throw new Error("Failed to create post");
        return {
            ...lean,
            id: String(lean._id),
            slug: lean.slug || "",
            tags: lean.tags || [],
            views: lean.views || 0,
            category: lean.category || "",
            author: lean.author || "Unknown",
        };
    }
    async updatePost(id, post) {
        const updates = { ...post };
        if (updates.title) {
            const src = updates.title || updates.seoTitle || "";
            updates.post_slug = slugifyEventName(src);
            const baseUrl = (process.env.PUBLIC_BASE_URL || "https://crossfire.wiki").replace(/\/$/, "");
            updates.canonicalUrl = `${baseUrl}/article/${updates.post_slug}`;
            await this.logUrlGeneration("post", src, updates.post_slug, !!updates.post_slug);
        }
        if (updates.content) {
            const plainContent = String(updates.content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
            if (!updates.seoDescription || updates.seoDescription.length < 60 || updates.seoDescription.length > 160) {
                const d = generateSummary(plainContent, 160);
                updates.seoDescription = d.length < 60 ? plainContent.substring(0, Math.min(160, Math.max(60, plainContent.length))).trim() : d;
            }
            if (!updates.seoKeywords || (Array.isArray(updates.seoKeywords) ? updates.seoKeywords.length === 0 : true)) {
                updates.seoKeywords = suggestKeywords(plainContent, 8);
            }
        }
        if (!updates.schemaType) updates.schemaType = "Article";
        const updated = await PostModel.findByIdAndUpdate(id, updates, {
            new: true,
        }).lean();
        if (!updated) return void 0;
        return {
            ...updated,
            id: String(updated._id),
            slug: updated.slug || "",
            tags: updated.tags || [],
            views: updated.views || 0,
            category: updated.category || "",
            author: updated.author || "Unknown",
        };
    }
    async deletePost(id) {
        const result = await PostModel.findByIdAndDelete(id);
        return !!result;
    }
    async incrementPostViews(id) {
        await PostModel.findByIdAndUpdate(id, { $inc: { views: 1 } });
    }
    async getAllEvents() {
        const events = await EventModel.find().sort({ order: 1, createdAt: -1 }).lean();
        return events.map((event) => ({
            ...event,
            id: String(event._id),
            order: typeof event.order === 'number' ? event.order : 9999,
        }));
    }
    async createEvent(event) {
        const payload = { ...event };
        const src = payload.title || payload.seoTitle || "";
        payload.event_name_slug = slugifyEventName(src);
        await this.logUrlGeneration("event", src, payload.event_name_slug, !!payload.event_name_slug);
        const baseUrl = (process.env.PUBLIC_BASE_URL || "https://crossfire.wiki").replace(/\/$/, "");
        if (!payload.seoTitle) payload.seoTitle = payload.title || "";
        const plainDescEv = String(payload.description || "").replace(/<[^>]*>/g, "");
        if (!payload.seoDescription) payload.seoDescription = plainDescEv.substring(0, 155);
        if (!payload.seoKeywords) payload.seoKeywords = (payload.title || "").toLowerCase().split(/\s+/).filter(Boolean).slice(0, 8);
        if (!payload.canonicalUrl) payload.canonicalUrl = `${baseUrl}/events/${payload.event_name_slug}`;
        if (!payload.ogImage && payload.image) payload.ogImage = payload.image;
        if (!payload.twitterImage && (payload.ogImage || payload.image)) payload.twitterImage = payload.ogImage || payload.image;
        if (!payload.schemaType) payload.schemaType = "Event";
        const newEvent = await EventModel.create(payload);
        const lean = await EventModel.findById(newEvent._id).lean();
        if (!lean) throw new Error("Failed to create event");
        return {
            ...lean,
            id: String(lean._id),
        };
    }
    async deleteEvent(id) {
        const result = await EventModel.findByIdAndDelete(id);
        return !!result;
    }
    async getEventBySlug(slug) {
        const ev = await EventModel.findOne({ event_name_slug: slug }).lean();
        if (!ev) return void 0;
        return { ...ev, id: String(ev._id), fullLayout: !!ev.fullLayout };
    }
    async getPostBySlug(slug) {
        const post = await PostModel.findOne({ post_slug: slug }).lean();
        if (!post) return void 0;
        return {
            ...post,
            id: String(post._id),
            tags: post.tags || [],
            views: post.views || 0,
            category: post.category || "",
            author: post.author || "Unknown",
            fullLayout: !!post.fullLayout,
        };
    }
    async getAllNews() {
        const news = await NewsModel.find().sort({ order: -1, createdAt: -1 });
        return news.map((item) => ({
            id: String(item._id),
            news_slug: item.news_slug || "",
            title: item.title,
            titleAr: item.titleAr,
            dateRange: item.dateRange,
            image: item.image,
            category: item.category,
            content: item.content,
            contentAr: item.contentAr,
            htmlContent: item.htmlContent,
            author: item.author,
            featured: item.featured,
            order: item.order || 0,
            createdAt: item.createdAt,
        }));
    }
    async createNews(news) {
        const baseUrl = (process.env.PUBLIC_BASE_URL || "https://crossfire.wiki").replace(/\/$/, "");
        const payload = { ...news };
        const src = payload.title || payload.seoTitle || "";
        payload.news_slug = slugifyEventName(src);
        await this.logUrlGeneration("news", src, payload.news_slug, !!payload.news_slug);
        if (!payload.seoTitle) payload.seoTitle = payload.title || "";
        const plainDescNews = String(payload.content || "").replace(/<[^>]*>/g, "");
        if (!payload.seoDescription) payload.seoDescription = plainDescNews.substring(0, 155);
        if (!payload.seoKeywords) payload.seoKeywords = (payload.title || "").toLowerCase().split(/\s+/).filter(Boolean).slice(0, 8);
        if (!payload.canonicalUrl) payload.canonicalUrl = `${baseUrl}/news/${payload.news_slug}`;
        if (!payload.ogImage && payload.image) payload.ogImage = payload.image;
        if (!payload.twitterImage && (payload.ogImage || payload.image)) payload.twitterImage = payload.ogImage || payload.image;
        if (!payload.schemaType) payload.schemaType = "NewsArticle";
        const newNews = await NewsModel.create(payload);
        return {
            id: String(newNews._id),
            news_slug: newNews.news_slug || "",
            title: newNews.title,
            titleAr: newNews.titleAr,
            dateRange: newNews.dateRange,
            image: newNews.image,
            category: newNews.category,
            content: newNews.content,
            contentAr: newNews.contentAr,
            htmlContent: newNews.htmlContent,
            author: newNews.author,
            featured: newNews.featured,
            createdAt: newNews.createdAt,
        };
    }
    async updateNews(id, news) {
        const updates = { ...news };
        if (updates.title) {
            const src = updates.title || updates.seoTitle || "";
            updates.news_slug = slugifyEventName(src);
            const baseUrl = (process.env.PUBLIC_BASE_URL || "https://crossfire.wiki").replace(/\/$/, "");
            updates.canonicalUrl = `${baseUrl}/news/${updates.news_slug}`;
            await this.logUrlGeneration("news", src, updates.news_slug, !!updates.news_slug);
        }
        const updated = await NewsModel.findByIdAndUpdate(id, updates, {
            new: true,
        });
        if (!updated) return void 0;
        return {
            id: String(updated._id),
            news_slug: updated.news_slug || "",
            title: updated.title,
            titleAr: updated.titleAr,
            dateRange: updated.dateRange,
            image: updated.image,
            category: updated.category,
            content: updated.content,
            contentAr: updated.contentAr,
            htmlContent: updated.htmlContent,
            author: updated.author,
            featured: updated.featured,
            createdAt: updated.createdAt,
        };
    }
    async deleteNews(id) {
        const result = await NewsModel.findByIdAndDelete(id);
        return !!result;
    }
    async getAllTutorials() {
        const tutorials = await TutorialModel.find().sort({ order: -1, createdAt: -1 }).lean();
        return tutorials.map((item) => ({
            ...item,
            id: String(item._id),
        }));
    }
    async getNewsById(id) {
        const news = await NewsModel.findById(id).lean();
        if (!news) return void 0;
        return {
            id: String(news._id),
            news_slug: news.news_slug || "",
            title: news.title,
            titleAr: news.titleAr,
            dateRange: news.dateRange,
            image: news.image,
            category: news.category,
            content: news.content,
            contentAr: news.contentAr,
            htmlContent: news.htmlContent,
            author: news.author,
            featured: news.featured,
            seoTitle: news.seoTitle,
            seoDescription: news.seoDescription,
            seoKeywords: news.seoKeywords,
            canonicalUrl: news.canonicalUrl,
            ogImage: news.ogImage,
            twitterImage: news.twitterImage,
            schemaType: news.schemaType,
            createdAt: news.createdAt,
        };
    }
    async getNewsBySlug(slug) {
        const news = await NewsModel.findOne({ news_slug: slug }).lean();
        if (!news) return void 0;
        return {
            id: String(news._id),
            news_slug: news.news_slug || "",
            title: news.title,
            titleAr: news.titleAr,
            dateRange: news.dateRange,
            image: news.image,
            category: news.category,
            content: news.content,
            contentAr: news.contentAr,
            htmlContent: news.htmlContent,
            author: news.author,
            featured: news.featured,
            seoTitle: news.seoTitle,
            seoDescription: news.seoDescription,
            seoKeywords: news.seoKeywords,
            canonicalUrl: news.canonicalUrl,
            ogImage: news.ogImage,
            twitterImage: news.twitterImage,
            schemaType: news.schemaType,
            fullLayout: !!news.fullLayout,
            createdAt: news.createdAt,
        };
    }
    async getAllMercenaries() {
        const mercenaries = await MercenaryModel.find()
            .sort({ order: 1, createdAt: -1 })
            .lean();
        return mercenaries.map((m) => ({
            ...m,
            id: m.mercenaryId || String(m._id),
            voiceLines: Array.isArray(m.voiceLines) ? m.voiceLines : [],
        }));
    }
    async createMercenary(merc) {
        const newMerc = await MercenaryModel.create({
            ...merc,
            mercenaryId: merc.id || String(new mongoose.Types.ObjectId()),
        });
        const lean = await MercenaryModel.findById(newMerc._id).lean();
        if (!lean) throw new Error("Failed to create mercenary");
        return { ...lean, id: lean.mercenaryId || String(lean._id) };
    }
    async deleteMercenary(id) {
        const res = await MercenaryModel.findByIdAndDelete(id);
        return !!res;
    }
    async updateMercenary(id, data) {
        let updated = await MercenaryModel.findOneAndUpdate({ mercenaryId: String(id) }, data, { new: true }).lean();
        if (!updated) {
            if (/^[a-f\d]{24}$/i.test(String(id))) {
                updated = await MercenaryModel.findByIdAndUpdate(id, data, { new: true }).lean();
            }
        }
        if (!updated) return void 0;
        return { ...updated, id: updated.mercenaryId || String(updated._id) };
    }
    async removeDuplicateMercenaries() {
        const all = await MercenaryModel.find().lean().sort({ createdAt: 1 });
        const seen = new Map();
        const toDelete = [];
        for (const merc of all) {
            const key = (merc.name || "").toLowerCase();
            if (seen.has(key)) {
                toDelete.push(merc._id);
            } else {
                seen.set(key, merc._id);
            }
        }
        if (toDelete.length > 0) {
            await MercenaryModel.deleteMany({ _id: { $in: toDelete } });
        }
        return toDelete.length;
    }
    async getAllTickets() {
        const tickets = await TicketModel.find().sort({ createdAt: -1 }).lean();
        return tickets.map((ticket) => ({
            ...ticket,
            id: String(ticket._id),
        }));
    }
    async getTicketById(id) {
        const ticket = await TicketModel.findById(id).lean();
        if (!ticket) return void 0;
        return {
            ...ticket,
            id: String(ticket._id),
        };
    }
    async getTicketsByEmail(email) {
        const tickets = await TicketModel.find({ userEmail: email })
            .sort({ createdAt: -1 })
            .lean();
        return tickets.map((ticket) => ({
            ...ticket,
            id: String(ticket._id),
        }));
    }
    async createTicket(ticket) {
        const newTicket = await TicketModel.create(ticket);
        const ticketObj = await TicketModel.findById(newTicket._id).lean();
        return {
            ...ticketObj,
            id: String(ticketObj._id),
        };
    }
    async updateTicket(id, ticket) {
        const updated = await TicketModel.findByIdAndUpdate(
            id,
            { ...ticket, updatedAt: /* @__PURE__ */ new Date() },
            { new: true },
        ).lean();
        if (!updated) return void 0;
        return {
            ...updated,
            id: String(updated._id),
        };
    }
    async deleteTicket(id) {
        const result = await TicketModel.findByIdAndDelete(id);
        return !!result;
    }
    async getTicketReplies(ticketId) {
        const replies = await TicketReplyModel.find({ ticketId }).sort({
            createdAt: 1,
        });
        return replies;
    }
    async createTicketReply(reply) {
        const newReply = await TicketReplyModel.create(reply);
        return newReply;
    }
    async getAllAdmins() {
        const admins = await AdminModel.find().sort({ createdAt: -1 }).lean();
        return admins.map((admin) => ({
            ...admin,
            id: String(admin._id),
        }));
    }

    async getAllAdminPermissions() {
        const admins = await AdminModel.find().select({ permissions: 1 }).lean();
        const map = {};
        for (const a of admins) {
            map[String(a._id)] = a.permissions || {};
        }
        return map;
    }

    async updateAdminPermissions(adminId, permissions) {
        await AdminModel.findByIdAndUpdate(
            adminId,
            { permissions: permissions || {} },
            { new: true }
        );
    }
    async getAllAdmins() {
        const admins = await AdminModel.find().sort({ createdAt: -1 }).lean();
        return admins.map((a) => ({ ...a, id: String(a._id) }));
    }
    async getAdminById(id) {
        const admin = await AdminModel.findById(id).lean();
        if (!admin) return void 0;
        return {
            ...admin,
            id: String(admin._id),
        };
    }
    async getAdminByUsername(username) {
        const admin = await AdminModel.findOne({ username }).lean();
        if (!admin) return void 0;
        return {
            ...admin,
            id: String(admin._id),
        };
    }
    async createAdmin(admin) {
        const newAdmin = await AdminModel.create(admin);
        const adminObj = await AdminModel.findById(newAdmin._id).lean();
        return {
            ...adminObj,
            id: String(adminObj._id),
        };
    }
    async updateAdmin(id, admin) {
        const updated = await AdminModel.findByIdAndUpdate(id, admin, {
            new: true,
        }).lean();
        if (!updated) return void 0;
        return {
            ...updated,
            id: String(updated._id),
        };
    }
    async deleteAdmin(id) {
        const result = await AdminModel.findByIdAndDelete(id);
        return !!result;
    }
    async getEventById(id) {
        const event = await EventModel.findById(id).lean();
        if (!event) return void 0;
        return {
            ...event,
            id: String(event._id),
        };
    }
    async updateEvent(id, event) {
        const updates = { ...event };
        if (updates.title) {
            const src = updates.title || updates.seoTitle || "";
            updates.event_name_slug = slugifyEventName(src);
            const baseUrl = (process.env.PUBLIC_BASE_URL || "https://crossfire.wiki").replace(/\/$/, "");
            updates.canonicalUrl = `${baseUrl}/events/${updates.event_name_slug}`;
            await this.logUrlGeneration("event", src, updates.event_name_slug, !!updates.event_name_slug);
        }
        const updated = await EventModel.findByIdAndUpdate(id, updates, {
            new: true,
        }).lean();
        if (!updated) return void 0;
        return {
            ...updated,
            id: String(updated._id),
        };
    }
    async getAllNewsletterSubscribers() {
        const subscribers = await NewsletterSubscriberModel.find().sort({
            createdAt: -1,
        });
        return subscribers;
    }
    async getNewsletterSubscriberByEmail(email) {
        const subscriber = await NewsletterSubscriberModel.findOne({ email });
        return subscriber || void 0;
    }
    async createNewsletterSubscriber(subscriber) {
        const newSubscriber =
            await NewsletterSubscriberModel.create(subscriber);
        return newSubscriber;
    }
    async deleteNewsletterSubscriber(id) {
        const result = await NewsletterSubscriberModel.findByIdAndDelete(id);
        return !!result;
    }
    async getAllSellers() {
        const sellers = await SellerModel.find().sort({ rank: 1, createdAt: -1 }).lean();
        return sellers.map((seller) => ({
            ...seller,
            id: String(seller._id),
            images: seller.images || [],
            prices: seller.prices || [],
            averageRating: seller.averageRating || 0,
            totalReviews: seller.totalReviews || 0,
        }));
    }
    async getSellerByExactName(name) {
        const sel = await SellerModel.findOne({ name }).lean();
        if (!sel) return void 0;
        return {
            ...sel,
            id: String(sel._id),
            images: sel.images || [],
            prices: sel.prices || [],
            averageRating: sel.averageRating || 0,
            totalReviews: sel.totalReviews || 0,
        };
    }
    async getSellerById(id) {
        const seller = await SellerModel.findById(id).lean();
        if (!seller) return void 0;
        return {
            ...seller,
            id: String(seller._id),
            images: seller.images || [],
            prices: seller.prices || [],
            averageRating: seller.averageRating || 0,
            totalReviews: seller.totalReviews || 0,
        };
    }
    async getSellerBySlug(slug) {
        const s = await SellerModel.findOne({ seller_name_slug: slug }).lean();
        if (!s) return void 0;
        return {
            ...s,
            id: String(s._id),
            images: s.images || [],
            prices: s.prices || [],
            averageRating: s.averageRating || 0,
            totalReviews: s.totalReviews || 0,
        };
    }
    async createSeller(seller) {
        const payload = { ...seller };
        payload.seller_name_slug = slugifyEventName(String(seller.name || ""));
        const newSeller = await SellerModel.create(payload);
        const lean = await SellerModel.findById(newSeller._id).lean();
        if (!lean) throw new Error("Failed to create seller");
        return {
            ...lean,
            id: String(lean._id),
            images: lean.images || [],
            prices: lean.prices || [],
            averageRating: lean.averageRating || 0,
            totalReviews: lean.totalReviews || 0,
        };
    }
    async updateSeller(id, seller) {
        const payload = { ...seller };
        if (typeof payload.name === "string" && payload.name.trim().length > 0) {
            payload.seller_name_slug = slugifyEventName(payload.name);
        }
        const updated = await SellerModel.findByIdAndUpdate(id, payload, {
            new: true,
        }).lean();
        if (!updated) return void 0;
        return {
            ...updated,
            id: String(updated._id),
            images: updated.images || [],
            prices: updated.prices || [],
            averageRating: updated.averageRating || 0,
            totalReviews: updated.totalReviews || 0,
        };
    }
    async deleteSeller(id) {
        const result = await SellerModel.findByIdAndDelete(id);
        await SellerReviewModel.deleteMany({ sellerId: id });
        return !!result;
    }
    async getSellerReviews(sellerId) {
        const reviews = await SellerReviewModel.find({ sellerId })
            .sort({ createdAt: -1 })
            .lean();
        return reviews.map((review) => ({
            id: String(review._id),
            sellerId: review.sellerId,
            userName: review.userName,
            rating: review.rating,
            comment: review.comment || "",
            createdAt: review.createdAt,
            helpfulVotes: review.helpfulVotes || 0,
        }));
    }
    async createSellerReview(review) {
        const payload = { ...review };
        if (review.userPhone) {
            if (!validatePhoneNumber(review.userPhone)) {
                throw new Error("Invalid phone number format");
            }
            payload.userPhoneEncrypted = encryptPhoneNumber(review.userPhone);
            payload.phoneCountryCode = extractCountryCode(review.userPhone);
            payload.phoneLast4 = maskLast4(review.userPhone);
        }
        const newReview = await SellerReviewModel.create(payload);
        await this.updateSellerRating(review.sellerId);
        const lean = await SellerReviewModel.findById(newReview._id).lean();
        if (!lean) throw new Error("Failed to create review");
        return {
            id: String(lean._id),
            sellerId: lean.sellerId,
            userId: lean.userId || "",
            userName: lean.userName,
            rating: lean.rating,
            comment: lean.comment || "",
            createdAt: lean.createdAt,
            helpfulVotes: lean.helpfulVotes || 0,
        };
    }
    async deleteSellerReview(sellerId, reviewId) {
        const result = await SellerReviewModel.findByIdAndDelete(reviewId);
        if (!result) return false;
        await this.updateSellerRating(sellerId);
        return true;
    }
    async updateSellerRating(sellerId) {
        const reviews = await SellerReviewModel.find({ sellerId });
        const totalReviews = reviews.length;
        const averageRating =
            totalReviews > 0
                ? reviews.reduce((sum, review) => sum + review.rating, 0) /
                totalReviews
                : 0;
        await SellerModel.findByIdAndUpdate(sellerId, {
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews,
        });
    }
    async logUrlMatchFailure(type, value) {
        await UrlMatchFailureModel.create({ type, value });
    }
    async logUrlGeneration(type, source, slug, ok) {
        await UrlGenerationAuditModel.create({ type, source, slug, ok: !!ok });
    }
    async auditAdminAction(action, reviewId, adminId, details) {
        await AdminAuditLogModel.create({ action, reviewId, adminId, details: details || {} });
    }
    // Weapons
    async getAllWeapons() {
        const items = await WeaponModel.find().sort({ createdAt: -1 }).lean();
        return items.map((it) => ({ ...it, id: String(it._id) }));
    }
    async searchWeaponsPaged(params) {
        const page = Math.max(1, Number(params?.page || 1));
        const pageSize = Math.min(200, Math.max(1, Number(params?.pageSize || 50)));
        const q = String(params?.q || '').trim();
        const letter = String(params?.letter || '').trim();
        const category = String(params?.category || '').trim();
        const sort = String(params?.sort || 'alpha').toLowerCase();
        const order = String(params?.order || 'asc').toLowerCase();
        const filter = {};
        if (letter) {
            try {
                const esc = letter.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
                filter.name = { $regex: `^${esc}`, $options: 'i' };
            } catch { }
        }
        if (category) filter.category = category;
        const baseItems = await WeaponModel.find(filter).lean();
        const norm = (s) => String(s || '').toLowerCase();
        const tokenize = (s) => String(s || '').toLowerCase().split(/\s+/).filter(Boolean);
        const compute = (name, query) => {
            const n = norm(name);
            const qn = norm(query);
            if (!qn) return { score: 0, indices: [], exact: false };
            if (n === qn) return { score: 1000, indices: Array.from({ length: n.length }, (_, i) => i), exact: true };
            const nparts = tokenize(name);
            const qparts = tokenize(query);
            let score = 0;
            if (n.startsWith(qn)) score += 600;
            let subseq = [];
            if (qn.length > 0) {
                let qi = 0;
                for (let i = 0; i < n.length && qi < qn.length; i++) {
                    if (n[i] === qn[qi]) {
                        subseq.push(i);
                        qi++;
                    }
                }
            }
            if (subseq.length === qn.length) {
                let chains = 1;
                for (let i = 1; i < subseq.length; i++) if (subseq[i] === subseq[i - 1] + 1) chains++;
                score += 350 + chains * 15 - (subseq[subseq.length - 1] - subseq[0] - qn.length);
            }
            const used = new Set();
            const bag = [];
            for (let i = 0; i < qn.length; i++) {
                const ch = qn[i];
                for (let j = 0; j < n.length; j++) {
                    if (used.has(j)) continue;
                    if (n[j] === ch) {
                        used.add(j);
                        bag.push(j);
                        break;
                    }
                }
            }
            const coverage = bag.length / qn.length;
            score += Math.round(coverage * 200);
            for (const idx of bag) {
                if (idx === 0 || /\s/.test(name[idx - 1] || '')) score += 10;
            }
            const indices = subseq.length === qn.length ? subseq : bag;
            return { score, indices, exact: false };
        };
        let rows = baseItems.map((it) => {
            const r = q ? compute(it.name || '', q) : { score: 0, indices: [], exact: false };
            const name = String(it.name || '');
            let highlightedName = name;
            if (r.indices.length > 0) {
                const set = new Set(r.indices);
                let out = '';
                for (let i = 0; i < name.length; i++) {
                    const ch = name[i];
                    if (set.has(i)) out += `<mark>${ch}</mark>`; else out += ch;
                }
                highlightedName = out;
            }
            return { ...it, id: String(it._id), score: r.score, highlightedName };
        });
        if (q) rows = rows.filter(r => r.score > 0);
        if (sort === 'date') {
            rows.sort((a, b) => {
                const av = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bv = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return order === 'desc' ? (bv - av) : (av - bv);
            });
        } else {
            rows.sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                const cmp = String(a.name || '').localeCompare(String(b.name || ''));
                return order === 'desc' ? -cmp : cmp;
            });
        }
        const total = rows.length;
        const start = (page - 1) * pageSize;
        const items = rows.slice(start, start + pageSize);
        return { items, total, page, pageSize };
    }
    async getWeaponById(id) {
        const item = await WeaponModel.findById(id).lean();
        if (!item) return void 0;
        return { ...item, id: String(item._id) };
    }
    async createWeapon(weapon) {
        const nw = await WeaponModel.create(weapon);
        const lean = await WeaponModel.findById(nw._id).lean();
        if (!lean) throw new Error("Failed to create weapon");
        return { ...lean, id: String(lean._id) };
    }
    async updateWeapon(id, weapon) {
        const updated = await WeaponModel.findByIdAndUpdate(id, weapon, {
            new: true,
        }).lean();
        if (!updated) return void 0;
        return { ...updated, id: String(updated._id) };
    }
    async deleteWeapon(id) {
        const res = await WeaponModel.findByIdAndDelete(id);
        return !!res;
    }

    // Modes
    async getAllModes() {
        const items = await ModeModel.find().sort({ createdAt: -1 }).lean();
        return items.map((it) => ({ ...it, id: String(it._id) }));
    }
    async getModeById(id) {
        const item = await ModeModel.findById(id).lean();
        if (!item) return void 0;
        return { ...item, id: String(item._id) };
    }
    async createMode(mode) {
        const nw = await ModeModel.create(mode);
        const lean = await ModeModel.findById(nw._id).lean();
        if (!lean) throw new Error("Failed to create mode");
        return { ...lean, id: String(lean._id) };
    }
    async updateMode(id, mode) {
        const updated = await ModeModel.findByIdAndUpdate(id, mode, {
            new: true,
        }).lean();
        if (!updated) return void 0;
        return { ...updated, id: String(updated._id) };
    }
    async deleteMode(id) {
        const res = await ModeModel.findByIdAndDelete(id);
        return !!res;
    }

    // Ranks
    async getAllRanks() {
        const items = await RankModel.find().sort({ createdAt: -1 }).lean();
        return items.map((it) => ({ ...it, id: String(it._id) }));
    }
    async getRankById(id) {
        const item = await RankModel.findById(id).lean();
        if (!item) return void 0;
        return { ...item, id: String(item._id) };
    }
    async createRank(rank) {
        const nw = await RankModel.create(rank);
        const lean = await RankModel.findById(nw._id).lean();
        if (!lean) throw new Error("Failed to create rank");
        return { ...lean, id: String(lean._id) };
    }
    async updateRank(id, rank) {
        const updated = await RankModel.findByIdAndUpdate(id, rank, {
            new: true,
        }).lean();
        if (!updated) return void 0;
        return { ...updated, id: String(updated._id) };
    }
    async deleteRank(id) {
        const res = await RankModel.findByIdAndDelete(id);
        return !!res;
    }
};

// server/storage.ts
var storage = new MongoDBStorage();

// server/utils/auth.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
var JWT_SECRET =
    process.env.JWT_SECRET || "your-secret-key-change-in-production";
var ADMIN_PASSWORD =
    process.env.ADMIN_PASSWORD || "SuperAdmin#2024$SecurePass!9x";
async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}
async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}
function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}
async function verifyAdminPassword(password) {
    return password === ADMIN_PASSWORD;
}
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    console.log(
        "[AUTH] Authorization header:",
        authHeader ? "present" : "missing",
    );
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("[AUTH] No Bearer token found");
        return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.substring(7);
    console.log("[AUTH] Token extracted, length:", token.length);
    const payload = verifyToken(token);
    console.log(
        "[AUTH] Token verification result:",
        payload ? "valid" : "invalid",
    );
    if (!payload) {
        return res.status(401).json({ error: "Invalid token" });
    }
    req.user = payload;
    next();
}
function requireSuperAdmin(req, res, next) {
    const user = req.user;
    if (!user || user.role !== "super_admin") {
        return res
            .status(403)
            .json({ error: "Forbidden: Super Admin access required" });
    }
    next();
}
function requireSettingsManager(req, res, next) {
    const role = req.user?.role || "";
    if (role === "super_admin") return next();
    const perms = req.user?.permissions || {};
    if (perms["settings:manage"]) return next();
    return res.status(403).json({ error: "Forbidden: Settings manager access required" });
}

async function requireSellerEditPermission(req, res, next) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (user.role === "super_admin") return next();
    const sellerId = String(req.params.id || "");
    if (!sellerId) return res.status(400).json({ error: "Missing seller id" });
    try {
        const allowedFromToken = ((user.permissions && user.permissions.allowedSellerIds) || user.allowedSellerIds || []).map(String);
        if (user.role === "seller_admin" && allowedFromToken.includes(sellerId)) {
            return next();
        }
        return res.status(403).json({ error: "Forbidden: Not allowed to edit this seller" });
    } catch (err) {
        return res.status(500).json({ error: "Permission check failed" });
    }
}

function stripOrderingFields(updates, role) {
    try {
        if (role !== "super_admin") {
            if (updates && typeof updates === "object") {
                delete updates.order;
                delete updates.rank;
            }
        }
    } catch { }
}

function requireContentCreator(req, res, next) {
    const role = req.user?.role || "";
    const perms = req.user?.permissions || {};
    if (role === "super_admin") return next();
    if (role === "admin" && (perms["posts:create"] || perms["events:create"] || perms["news:create"] || perms["tutorials:create"])) return next();
    return res.status(403).json({ error: "Forbidden: Content creator role required" });
}

function requireAdminOnly(req, res, next) {
    const role = req.user?.role || "";
    if (role === "super_admin" || role === "admin") return next();
    return res.status(403).json({ error: "Forbidden: Admin role required" });
}

function requireOwnershipOrAdmin(contentType) {
    return async (req, res, next) => {
        const role = req.user?.role || "";
        if (role === "super_admin") return next();
        const id = req.params.id;
        if (!id) return res.status(400).json({ error: "Missing ID" });
        try {
            let content = null;
            if (contentType === "post") {
                content = await PostModel.findById(id).lean();
            } else if (contentType === "event") {
                content = await EventModel.findById(id).lean();
            } else if (contentType === "news") {
                content = await NewsModel.findById(id).lean();
            }
            if (!content) return res.status(404).json({ error: "Not found" });
            const adminId = req.user?.id || "";
            if (content.createdByAdminId !== adminId && role !== "super_admin") {
                return res.status(403).json({ error: "Forbidden: Can only edit/delete your own content" });
            }
            return next();
        } catch (err) {
            return res.status(500).json({ error: "Permission check failed" });
        }
    };
}

function slugifyEventName(input) {
    if (!input) return "";
    const base = input
        .toString()
        .normalize("NFKD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .replace(/[^a-z0-9 ]+/g, "")
        .trim()
        .replace(/\s+/g, "-");
    return base.substring(0, 60);
}

function summarizeSeoDescription(text) {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (!clean) return "";
    return clean.substring(0, 160);
}

function extractKeywordsFromText(text) {
    const tokens = String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(Boolean);
    const stopwords = new Set(["the", "and", "for", "with", "that", "this", "from", "have", "your", "you", "are", "was", "were", "they", "their", "has", "had", "not", "but", "all", "can", "will", "its", "into", "our", "out", "about", "more", "than", "when", "what", "where", "which", "who", "why", "how", "a", "an", "to", "of", "on", "in", "at", "by", "is", "it", "as"]);
    const freq = new Map();
    for (const token of tokens) {
        if (token.length < 3 || stopwords.has(token)) continue;
        freq.set(token, (freq.get(token) || 0) + 1);
    }
    return [...freq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word);
}

function deriveSeoFromHtml(html, fallbackTitle = "") {
    const $ = cheerio.load(String(html || ""));
    const titleTag = $("title").first().text().trim();
    const heading = $("h1").first().text().trim();
    const bodyText = $("body").text().replace(/\s+/g, " ").trim();
    const seoTitle = fallbackTitle || titleTag || heading || "Custom Page";
    const seoDescription = summarizeSeoDescription(bodyText);
    const seoKeywords = extractKeywordsFromText(`${seoTitle} ${bodyText}`);
    const ogImage = $("meta[property='og:image']").attr("content") || $("meta[name='og:image']").attr("content") || $("img").first().attr("src") || "";
    return { seoTitle, seoDescription, seoKeywords, ogImage };
}


function sanitizeSellerNameParam(name) {
    const n = String(name || "").trim();
    if (!/^[A-Za-z0-9 _-]{1,100}$/.test(n)) return null;
    return n;
}

function getPhoneKey() {
    const key = process.env.PHONE_ENC_KEY || "";
    if (!key || key.length < 32) return null;
    return Buffer.from(key.substring(0, 32));
}

function encryptPhoneNumber(plain) {
    const key = getPhoneKey();
    if (!key || !plain) return "";
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const enc = Buffer.concat([
        cipher.update(String(plain), "utf8"),
        cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, enc]).toString("base64");
}

function decryptPhoneNumber(enc) {
    const key = getPhoneKey();
    if (!key || !enc) return "";
    const buf = Buffer.from(enc, "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(data), decipher.final()]);
    return dec.toString("utf8");
}

function extractCountryCode(phone) {
    const s = String(phone || "").trim();
    if (!s.startsWith("+")) return "";
    const digits = s.substring(1);
    const m = digits.match(/^(\d{1,3})/);
    return m ? m[1] : "";
}

function validatePhoneNumber(phone) {
    const s = String(phone || "").trim();
    if (!/^\+\d{6,15}$/.test(s)) return false;
    const cc = extractCountryCode(s);
    if (!cc) return false;
    const len = s.replace(/\D/g, "").length;
    const ranges = {
        "1": [10, 11],
        "44": [10, 10],
        "49": [10, 11],
        "33": [9, 10],
        "966": [9, 10],
        "971": [9, 10],
    };
    const r = ranges[cc];
    if (!r) return len >= 8 && len <= 15;
    return len >= r[0] && len <= r[1];
}

function maskLast4(phone) {
    const s = String(phone || "").replace(/\D/g, "");
    if (s.length < 4) return "";
    return s.slice(-4);
}

function requireCsrf(_req, _res, next) { next(); }

// server/utils/helpers.ts
function slugify(text) {
    if (!text) return "";
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\u0600-\u06FF]/g, "") // Remove Arabic characters
        .replace(/[^\w\s-]/g, "") // Remove special characters
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-") // Replace multiple hyphens with single
        .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

function calculateReadingTime(content) {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes;
}
function sanitizePublicPost(post, includeViews) {
    const out = { ...post };
    if (!includeViews) {
        try { delete out.views; } catch { }
    }
    return out;
}
function generateSummary(content, maxLength = 200) {
    const plainText = content.replace(/[#*`]/g, "").trim();
    if (plainText.length <= maxLength) {
        return plainText;
    }
    return plainText.substring(0, maxLength).trim() + "...";
}
function suggestKeywords(text, limit = 8) {
    const stop = new Set([
        "the", "and", "a", "an", "to", "of", "in", "on", "for", "with", "by", "is", "are", "was", "were", "be", "as", "at", "from", "that", "this", "it", "or", "if", "but", "about", "into", "over", "after", "before", "under", "above", "between",
        "من", "على", "في", "عن", "و", "ما", "لا", "لم", "لن", "إلى", "الى", "كان", "كانت", "ذلك", "هذه", "هذا", "قد", "لقد", "كما"
    ]);
", "من", "على", "في", "عن", "و", "47", "45", "43", "46", "29", "ما", "لا", "لم", "لن", "إلى", "الى", "كان", "كانت", "ذلك", "هذه", "هذا", "إذ", "قد", "لقد", "كما"]);
    const words = String(text || "")
        .toLowerCase()
        .replace(/<[^>]*>/g, " ")
        .replace(/[^\p{L}\p{N}\s]+/gu, " ")
        .split(/\s+/)
        .filter((w) => w && w.length > 2 && !stop.has(w));
    const freq = new Map();
    for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
    const sorted = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).map(([w]) => w);
    return sorted.slice(0, limit);
}
function formatDate(date) {
    if (!date) return "long ago";
    const d = (date instanceof Date) ? date : new Date(date);
    if (isNaN(d.getTime())) return "long ago";
    
    const now = /* @__PURE__ */ new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 6e4);
    const diffHours = Math.floor(diffMs / 36e5);
    const diffDays = Math.floor(diffMs / 864e5);
    if (diffMins < 60) {
        return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    } else if (diffDays < 7) {
        return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
    } else {
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }
}

// server/routes.ts
var upload = multer({ storage: multer.memoryStorage() });
var uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1e3,
    // 1 hour
    max: 10,
    // Limit each IP to 10 uploads per hour
    message: "Too many upload requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});
var apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1e3,
    // 15 minutes
    max: 100,
    // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});
let registrationClosed = false;
async function registerRoutes(app2) {
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
    });

    // test-only helper was removed from exports to avoid runtime issues
    app2.use('/uploads/mirrored', express.static(path.resolve('backend-deploy-full/uploads/mirrored')));

    app2.post("/api/users/register", authLimiter, async (req, res) => {
        try {
            if (registrationClosed) {
                return res
                    .status(403)
                    .json({ error: "Registration is closed" });
            }
            const { username, email, phone, password } = req.body || {};
            if (!username || !email || !phone || !password) {
                return res
                    .status(400)
                    .json({ error: "All fields are required" });
            }
            if (
                typeof password !== "string" ||
                password.length < 8 ||
                !/[^A-Za-z0-9]/.test(password)
            ) {
                return res
                    .status(400)
                    .json({
                        error: "Password must be at least 8 characters and include a special character",
                    });
            }
            const existingEmail = await storage.getUserByEmail(email);
            if (existingEmail)
                return res
                    .status(400)
                    .json({ error: "Email already registered" });
            const existingPhone = await storage.getUserByPhone(phone);
            if (existingPhone)
                return res
                    .status(400)
                    .json({ error: "Phone already registered" });
            const existingUsername = await storage.getUserByUsername(username);
            if (existingUsername)
                return res
                    .status(400)
                    .json({ error: "Username already taken" });
            const hash = await hashPassword(password);
            const emailCode = Math.floor(
                100000 + Math.random() * 900000,
            ).toString();
            const phoneCode = Math.floor(
                100000 + Math.random() * 900000,
            ).toString();
            const user = await storage.createUser({
                username,
                email,
                phone,
                password: hash,
            });
            const id =
                (user && (user.id || user._id?.toString?.() || user._id)) ||
                undefined;
            await storage.updateUser(id, {
                emailVerificationCode: emailCode,
                phoneVerificationCode: phoneCode,
                verifiedEmail: false,
                verifiedPhone: false,
            });
            console.log("[REGISTER] user created", { id, username, email });
            res.status(201).json({
                message: "Registered. Verify email and phone.",
                emailCode,
                phoneCode,
            });
        } catch (error) {
            console.warn("[REGISTER] failed", { error: error?.message });
            res.status(500).json({ error: error.message });
        }
    });
    app2.post("/api/users/login", authLimiter, async (req, res) => {
        try {
            const { identifier, password } = req.body || {};
            if (!identifier || !password)
                return res
                    .status(400)
                    .json({ error: "Identifier and password required" });
            const byEmail = await storage.getUserByEmail(identifier);
            const byUsername = await storage.getUserByUsername(identifier);
            const byPhone = await storage.getUserByPhone(identifier);
            const user = byEmail || byUsername || byPhone;
            if (!user) {
                console.warn("[LOGIN] user not found", { identifier });
                return res.status(401).json({ error: "Invalid credentials" });
            }
            const ok = await comparePassword(password, user.password);
            if (!ok) {
                console.warn("[LOGIN] bad password", { id: user.id || user._id });
                return res.status(401).json({ error: "Invalid credentials" });
            }
            const id =
                (user && (user.id || user._id?.toString?.() || user._id)) ||
                undefined;
            const token = generateToken({ id, username: user.username });
            console.log("[LOGIN] success", { id, username: user.username });
            res.json({
                token,
                user: {
                    id,
                    username: user.username,
                    verifiedEmail: user.verifiedEmail,
                    verifiedPhone: user.verifiedPhone,
                },
            });
        } catch (error) {
            console.error("[LOGIN] error", { error: error?.message });
            res.status(500).json({ error: error.message });
        }
    });
    app2.post("/api/users/verify-email", authLimiter, async (req, res) => {
        try {
            const { email, code } = req.body || {};
            const user = await storage.getUserByEmail(email);
            if (!user) return res.status(404).json({ error: "User not found" });
            if (user.emailVerificationCode !== code)
                return res.status(400).json({ error: "Invalid code" });
            const id =
                (user && (user.id || user._id?.toString?.() || user._id)) ||
                undefined;
            const updated = await storage.updateUser(id, {
                verifiedEmail: true,
                emailVerificationCode: "",
            });
            res.json({
                success: true,
                user: { id: updated?.id, verifiedEmail: true },
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.post("/api/users/verify-phone", authLimiter, async (req, res) => {
        try {
            const { phone, code } = req.body || {};
            const user = await storage.getUserByPhone(phone);
            if (!user) return res.status(404).json({ error: "User not found" });
            if (user.phoneVerificationCode !== code)
                return res.status(400).json({ error: "Invalid code" });
            const id =
                (user && (user.id || user._id?.toString?.() || user._id)) ||
                undefined;
            const updated = await storage.updateUser(id, {
                verifiedPhone: true,
                phoneVerificationCode: "",
            });
            res.json({
                success: true,
                user: { id: updated?.id, verifiedPhone: true },
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.post("/api/auth/login", async (req, res) => {
        try {
            const { username, password } = req.body;
            if (username && password) {
                const admin = await storage.getAdminByUsername(username);
                if (!admin) {
                    return res
                        .status(401)
                        .json({ error: "Invalid credentials" });
                }
                const isValid = await comparePassword(password, admin.password);
                if (!isValid) {
                    return res
                        .status(401)
                        .json({ error: "Invalid credentials" });
                }
                const token = generateToken({
                    id: admin.id,
                    username: admin.username,
                    role: admin.role,
                });
                res.json({
                    token,
                    admin: {
                        id: admin.id,
                        username: admin.username,
                        role: admin.role,
                        permissions: admin.permissions || {},
                    },
                });
            } else if (password) {
                const isValid = await verifyAdminPassword(password);
                if (!isValid) {
                    return res.status(401).json({ error: "Invalid password" });
                }
                const token = generateToken({ role: "super_admin" });
                res.json({ token, admin: { role: "super_admin", permissions: {} } });
            } else {
                return res
                    .status(400)
                    .json({
                        error: "Username and password or password required",
                    });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.get("/api/posts", async (req, res) => {
        try {
            const { category, search, featured, limit, offset } = req.query;
            const { items, total } = await storage.getAllPosts({ category, search, featured, limit, offset });
            const formattedPosts = items.map((post) => sanitizePublicPost({
                ...post,
                date: formatDate(post.createdAt),
            }, false));
            res.json({ items: formattedPosts, total });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.get("/api/posts/:id", async (req, res) => {
        try {
            const idOrSlug = req.params.id;
            const post = await storage.getPostByIdOrSlug(idOrSlug);
            if (!post) {
                return res.status(404).json({ error: "Post not found" });
            }
            // Increment views using the actual ID
            await storage.incrementPostViews(post.id);
            const formattedPost = sanitizePublicPost({
                ...post,
                date: formatDate(post.createdAt),
            }, false);
            res.json(formattedPost);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.get("/api/posts/slug/:slug", async (req, res) => {
        try {
            const { slug } = req.params;
            const post = await storage.getPostBySlug(slug);
            if (!post) {
                await storage.logUrlMatchFailure("post", slug);
                return res.status(404).json({ error: "Post not found" });
            }
            const formattedPost = {
                ...post,
                date: formatDate(post.createdAt),
            };
            res.json(formattedPost);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.get("/api/posts/:id/redirect", async (req, res) => {
        try {
            const p = await storage.getPostById(req.params.id);
            if (!p) return res.status(404).json({ error: "Post not found" });
            const base = (process.env.PUBLIC_BASE_URL || "https://crossfire.wiki").replace(/\/$/, "");
            const target = `${base}/article/${p.post_slug || slugifyEventName(p.title || "")}`;
            res.status(302).set("Location", target).send("Found");
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.get("/api/admin/posts/analytics", requireAuth, requireAdminOnly, async (_req, res) => {
        try {
            const posts = await storage.getAllPosts();
            res.json(posts.map((p) => ({ id: p.id, title: p.title, views: p.views || 0 })));
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.get("/api/admin/posts/:id/analytics", requireAuth, requireAdminOnly, async (req, res) => {
        try {
            const post = await storage.getPostById(req.params.id);
            if (!post) return res.status(404).json({ error: "Post not found" });
            res.json({ id: post.id, title: post.title, views: post.views || 0 });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Minimal Open Graph share page that redirects to client route
    app2.get("/share/:type/:id", async (req, res) => {
        try {
            const { type, id } = req.params;
            let title = "Crossfire";
            let description = "";
            let image = "";
            let url = `${req.protocol}://${req.get("host")}`;
            const settings = await SiteSettingsModel.findOne().lean();
            const fallbackOg = settings?.seoOgImage || `${req.protocol}://${req.get("host")}/favicon.png`;
            if (type === "post") {
                const p = await storage.getPostById(id);
                if (p) { title = p.title; description = p.summary || p.seoDescription || ""; image = p.ogImage || p.image || fallbackOg; url = `${url}/article/${p.post_slug || p.id}`; }
            } else if (type === "event") {
                const e = await storage.getEventById(id);
                if (e) { title = e.title; description = e.seoDescription || e.description || ""; image = e.ogImage || e.image || fallbackOg; url = `${url}/events/${e.event_name_slug || id}`; }
            } else if (type === "news") {
                const n = await storage.getNewsById(id);
                if (n) { title = n.title; description = n.seoDescription || (n.content ? String(n.content).slice(0, 160) : ""); image = n.ogImage || n.image || fallbackOg; url = `${url}/news/${n.news_slug || id}`; }
            }
            try {
                const head = await fetch(image, { method: 'HEAD' });
                if (!head || !head.ok) image = fallbackOg;
            } catch {
                image = fallbackOg;
            }
            const absImage = toCloudinary1200x630(resolveAbsoluteUrl(image, url) || fallbackOg);
            const absUrl = resolveAbsoluteUrl(url, url);
            const html = `<!doctype html><html lang="en"><head>
    <meta charset="utf-8" />
    <meta property="og:title" content="${escapeHtmlAttr(title)}" />
    <meta property="og:description" content="${escapeHtmlAttr(description)}" />
    <meta property="og:image" content="${escapeHtmlAttr(absImage)}" />
    <meta property="og:image:secure_url" content="${escapeHtmlAttr(absImage)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${escapeHtmlAttr(absUrl)}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtmlAttr(title)}" />
    <meta name="twitter:description" content="${escapeHtmlAttr(description)}" />
    <meta name="twitter:image" content="${escapeHtmlAttr(absImage)}" />
    </head><body><script>location.href=${JSON.stringify(url)}</script></body></html>`;
            res.set("Content-Type", "text/html").send(html);
        } catch (error) {
            res.status(500).send(`Error: ${error.message}`);
        }
    });
    app2.post("/api/posts", requireAuth, requireContentCreator, async (req, res) => {
        try {
            const adminId = req.user?.id || "";
            const admin = adminId ? await AdminModel.findById(adminId).lean() : null;
            const adminName = admin?.username || "Unknown";

            // Check quota
            if (admin && admin.create_limit > 0 && admin.posts_created >= admin.create_limit) {
                return res.status(403).json({ error: "Post creation quota exceeded" });
            }

            const data = insertPostSchema.parse(req.body);
            stripOrderingFields(data, req.user?.role || "");
            const readingTime = data.readingTime || calculateReadingTime(data.content);
            const summary = data.summary || generateSummary(data.content);
            const slug = data.slug || slugify(data.title);
            const post = await storage.createPost({
                ...data,
                readingTime,
                summary,
                slug,
                createdByAdminId: adminId,
                createdByAdminName: adminName,
            });

            // Update admin counter
            if (admin) {
                await AdminModel.findByIdAndUpdate(adminId, { $inc: { posts_created: 1 } });
            }

            res.status(201).json(post);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    app2.patch("/api/posts/:id", requireAuth, requireOwnershipOrAdmin("posts"), async (req, res) => {
        try {
            const updates = { ...req.body };
            stripOrderingFields(updates, req.user?.role || "");
            if (updates.content && !updates.readingTime) {
                updates.readingTime = calculateReadingTime(updates.content);
            }
            if (updates.content && !updates.summary) {
                updates.summary = generateSummary(updates.content);
            }
            const post = await storage.updatePost(req.params.id, updates);
            if (!post) {
                return res.status(404).json({ error: "Post not found" });
            }
            res.json(post);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    app2.delete("/api/posts/:id", requireAuth, requireOwnershipOrAdmin("posts"), async (req, res) => {
        try {
            const deleted = await storage.deletePost(req.params.id);
            if (!deleted) {
                return res.status(404).json({ error: "Post not found" });
            }
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.get("/api/public/settings/site", async (req, res) => {
        try {
            const data = fs.readFileSync(path.join(__dirname, "settings.json"), "utf8");
            res.json(JSON.parse(data));
        } catch (e) {
            res.json({ backgroundImageUrl: "" });
        }
    });

    app2.post("/api/admin/settings/site", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const settings = req.body;
            fs.writeFileSync(path.join(__dirname, "settings.json"), JSON.stringify(settings, null, 2));
            res.json({ success: true });
        } catch (e) {
            res.status(500).send("Error saving settings");
        }
    });

    app2.get("/api/events", async (req, res) => {
        try {
            const limit = Math.max(1, Math.min(100, parseInt(String(req.query?.limit || "20"), 10) || 20));
            const offset = Math.max(0, parseInt(String(req.query?.offset || "0"), 10) || 0);
            const all = await storage.getAllEvents();
            const total = Array.isArray(all) ? all.length : 0;
            const items = Array.isArray(all) ? all.slice(offset, offset + limit) : [];
            res.json({ items, total });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.get("/api/events/slug/:slug", async (req, res) => {
        try {
            const { slug } = req.params;
            // Prefer direct slug lookup; fall back to ObjectId and normalized slug
            let ev = await storage.getEventBySlug(slug);
            if (!ev) {
                try {
                    if (mongoose.Types.ObjectId.isValid(slug)) {
                        ev = await storage.getEventById(slug);
                    }
                } catch { }
            }
            if (!ev) {
                try {
                    const alt = slugifyEventName(slug);
                    if (alt && alt !== slug) {
                        ev = await storage.getEventBySlug(alt);
                    }
                } catch { }
            }
            if (!ev) {
                try { await storage.logUrlMatchFailure("event", slug); } catch { }
                return res.status(404).json({ error: "Event not found" });
            }
            return res.json(ev);
        } catch (error) {
            return res.status(404).json({ error: "Event not found" });
        }
    });
    app2.get("/api/events/:id/redirect", async (req, res) => {
        try {
            const ev = await storage.getEventById(req.params.id);
            if (!ev) return res.status(404).json({ error: "Event not found" });
            const base = (process.env.PUBLIC_BASE_URL || "https://crossfire.wiki").replace(/\/$/, "");
            const target = `${base}/events/${ev.event_name_slug || slugifyEventName(ev.title || "")}`;
            res.status(302).set("Location", target).send("Found");
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.get("/api/events/:id/comments", async (req, res) => {
        try {
            const id = req.params.id;
            const rows = await EventCommentModel.find({ eventId: id }).sort({ createdAt: 1 }).lean();
            const out = rows.map(r => {
                const date = r.createdAt instanceof Date ? r.createdAt.toISOString() : (r.createdAt ? String(r.createdAt) : new Date().toISOString());
                return {
                    ...r,
                    id: String(r._id),
                    date,
                };
            });
            res.json(out);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.post("/api/events/:id/comments", async (req, res) => {
        try {
            const id = req.params.id;
            const body = req.body || {};
            const name = String(body.author || body.name || "").trim();
            const content = String(body.content || "").trim();
            if (!name || !content) return res.status(400).json({ error: "Name and content required" });
            const doc = await EventCommentModel.create({
                eventId: id,
                name,
                content,
                parentCommentId: body.parentCommentId ? String(body.parentCommentId) : null,
                userId: body.userId ? String(body.userId) : "",
                userAvatar: body.userAvatar ? String(body.userAvatar) : "",
                email: body.email ? String(body.email) : "",
            });
            const lean = await EventCommentModel.findById(doc._id).lean();
            const date = lean && lean.createdAt instanceof Date ? lean.createdAt.toISOString() : (lean && lean.createdAt ? String(lean.createdAt) : new Date().toISOString());
            res.status(201).json({ ...lean, id: String(lean._id), date });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.delete("/api/events/:eventId/comments/:id", requireAuth, requireAdminOnly, async (req, res) => {
        try {
            const id = req.params.id;
            const result = await EventCommentModel.findByIdAndDelete(id);
            if (!result) return res.status(404).json({ error: "Comment not found" });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.post("/api/event-comments/:id/like", async (req, res) => {
        try {
            const id = req.params.id;
            const userId = String((req.body && req.body.userId) || "").trim();
            const doc = await EventCommentModel.findById(id);
            if (!doc) return res.status(404).json({ error: "Comment not found" });
            if (userId) {
                const idx = doc.likedBy.findIndex(u => String(u) === userId);
                if (idx >= 0) {
                    doc.likedBy.splice(idx, 1);
                    doc.likes = Math.max(0, (doc.likes || 0) - 1);
                } else {
                    doc.likedBy.push(userId);
                    doc.likes = (doc.likes || 0) + 1;
                }
            } else {
                doc.likes = (doc.likes || 0) + 1;
            }
            await doc.save();
            res.json({ id: String(doc._id), likes: doc.likes });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.post("/api/events", requireAuth, requireContentCreator, async (req, res) => {
        try {
            const adminId = req.user?.id || "";
            const admin = adminId ? await AdminModel.findById(adminId).lean() : null;
            const adminName = admin?.username || "Unknown";

            if (admin && admin.create_limit > 0 && admin.events_created >= admin.create_limit) {
                return res.status(403).json({ error: "Event creation quota exceeded" });
            }

            const data = insertEventSchema.parse(req.body);
            stripOrderingFields(data, req.user?.role || "");
            const base = (process.env.PUBLIC_BASE_URL || "https://crossfire.wiki").replace(/\/$/, "");
            const slug = String(data.title || "");
            const eventSlug = slugifyEventName(slug);
            const canonical = `${base}/events/${eventSlug}`;
            const withSeo = { ...data };
            (withSeo).event_name_slug = withSeo.event_name_slug || eventSlug;
            (withSeo).canonicalUrl = withSeo.canonicalUrl || canonical;
            (withSeo).createdByAdminId = adminId;
            (withSeo).createdByAdminName = adminName;
            const event = await storage.createEvent(withSeo);

            if (admin) {
                await AdminModel.findByIdAndUpdate(adminId, { $inc: { events_created: 1 } });
            }

            res.status(201).json(event);
        } catch (error) {
            console.error("Event creation error:", error);
            res.status(400).json({
                error: error.message,
                details: error.issues ? error.issues : null
            });
        }
    });
    app2.post("/api/events/bulk-create", requireAuth, requireContentCreator, async (req, res) => {
        try {
            const { events, createAsNews } = req.body || {};
            if (!Array.isArray(events)) {
                return res.status(400).json({ error: "Events array is required" });
            }
            const createdEvents = [];
            let newsCount = 0;
            for (const raw of events) {
                try {
                    const payload = {
                        title: String(raw.title || "Event"),
                        titleAr: String(raw.titleAr || ""),
                        description: String(raw.description || raw.content || ""),
                        descriptionAr: String(raw.descriptionAr || ""),
                        rawHtmlContent: String(raw.rawHtmlContent || ""),
                        date: String(raw.date || new Date().toISOString().slice(0, 10)),
                        type: String(raw.type || "upcoming"),
                        image: String(raw.image || ""),
                        seoTitle: String(raw.seoTitle || ""),
                        seoDescription: String(raw.seoDescription || ""),
                        seoKeywords: Array.isArray(raw.seoKeywords) ? raw.seoKeywords : [],
                        canonicalUrl: String(raw.canonicalUrl || ""),
                        ogImage: String(raw.ogImage || raw.image || ""),
                        twitterImage: String(raw.twitterImage || raw.ogImage || raw.image || ""),
                        schemaType: String(raw.schemaType || "Event"),
                    };
                    const data = insertEventSchema.parse(payload);
                    stripOrderingFields(data, req.user?.role || "");
                    const base = (process.env.PUBLIC_BASE_URL || "https://crossfire.wiki").replace(/\/$/, "");
                    const slug = String(data.title || "");
                    const eventSlug = slugifyEventName(slug);
                    const canonical = `${base}/events/${eventSlug}`;
                    const withSeo = { ...data };
                    (withSeo).event_name_slug = withSeo.event_name_slug || eventSlug;
                    (withSeo).canonicalUrl = withSeo.canonicalUrl || canonical;
                    const event = await storage.createEvent(withSeo);
                    createdEvents.push(event);

                    if (createAsNews === true) {
                        const newsPayload = {
                            title: data.title,
                            titleAr: data.titleAr || "",
                            dateRange: data.date,
                            image: data.image || data.ogImage || data.twitterImage || "",
                            category: String(raw.category || "Events"),
                            content: String(raw.content || data.description || ""),
                            contentAr: String(raw.contentAr || data.descriptionAr || ""),
                            htmlContent: String(raw.content || data.description || ""),
                            rawHtmlContent: String(raw.rawHtmlContent || ""),
                            author: "Bimora Team",
                            featured: false,
                            seoTitle: data.seoTitle || "",
                            seoDescription: data.seoDescription || "",
                            seoKeywords: data.seoKeywords || [],
                            canonicalUrl: data.canonicalUrl || "",
                            ogImage: data.ogImage || "",
                            twitterImage: data.twitterImage || "",
                            schemaType: "NewsArticle",
                        };
                        try {
                            const newsData = insertNewsSchema.parse(newsPayload);
                            stripOrderingFields(newsData, req.user?.role || "");
                            await storage.createNews(newsData);
                            newsCount++;
                        } catch (err2) {
                            console.warn(`Failed to create news from event: ${err2.message}`);
                        }
                    }
                } catch (err) {
                    console.warn(`Failed to create event: ${err.message}`);
                }
            }
            res.status(201).json({
                message: `Created ${createdEvents.length} events` + (createAsNews ? ` and ${newsCount} news` : ""),
                count: createdEvents.length,
                newsCount,
                events: createdEvents,
            });
        } catch (error) {
            console.error("Bulk event creation error:", error);
            res.status(400).json({ error: error.message });
        }
    });
    app2.delete("/api/events/:id", requireAuth, requireOwnershipOrAdmin("events"), async (req, res) => {
        try {
            const deleted = await storage.deleteEvent(req.params.id);
            if (!deleted) {
                return res.status(404).json({ error: "Event not found" });
            }
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.patch("/api/events/reorder", requireAuth, requireAdminOnly, async (req, res) => {
        try {
            const { orders } = req.body; // Expecting [{ id: string, order: number }]
            if (!Array.isArray(orders)) {
                return res.status(400).json({ error: "Orders array is required" });
                rawHtml: data.rawHtml || data.content,
            }
            
            const updates = orders.map(item => 
                EventModel.findByIdAndUpdate(item.id, { order: item.order })
            );
            
            await Promise.all(updates);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Scrape events endpoint for admin panel
    app2.post("/api/mirror-url", async (req, res) => {
        try {
            const { url } = req.body || {};
            if (!url) return res.status(400).json({ error: "URL is required" });
            
            console.log(`[Route] Mirroring URL: ${url}`);
            const data = await MirrorService.mirror(url);
            
            res.json({ 
                success: true, 
                title: data.title, 
                content: data.content,
                originalUrl: url
            });
        } catch (error) {
            console.error("Mirror error:", error);
            res.status(500).json({ error: error.message });
        }
    });

    app2.post("/api/scrape-events", async (req, res) => {
        try {
            const { url, type } = req.body || {};
            if (url) {
                console.log(`🔍 Scraping custom URL: ${url}`);
                const data = await scrapePage(url);
                if (!data) return res.status(400).json({ error: "Failed to scrape page" });
                
                if (type === 'post') {
                    const postData = {
                        title: data.title,
                        content: data.content,
                        summary: data.summary,
                        image: data.image,
                        category: "News",
                        tags: ["Scraped"],
                        author: "Bimora Scraper",
                        readingTime: calculateReadingTime(data.content),
                        featured: false
                    };
                    const post = await storage.createPost(insertPostSchema.parse(postData));
                    return res.json({ success: true, item: post, type: 'post' });
                } else {
                    const eventData = {
                        title: data.title,
                        description: data.content,
                        date: new Date().toISOString().split('T')[0],
                        type: 'upcoming',
                        image: data.image || 'https://files.catbox.moe/wof38b.jpeg'
                    };
                    const event = await storage.createEvent(insertEventSchema.parse(eventData));
                    return res.json({ success: true, item: event, type: 'event' });
                }
            }

            console.log("🔍 Admin: Easy scrape - Getting forum announcements...");
            const posts = await scrapeForumAnnouncements();
            if (!posts || posts.length === 0) {
                return res.status(400).json({ error: "No announcements found to scrape" });
            }
            const postsToCreate = posts.slice(0, 5);
            const createdEvents = [];
            for (const post of postsToCreate) {
                try {
                    const eventData = {
                        title: post.title.substring(0, 200),
                        titleAr: '',
                        description: post.content || post.title,
                        descriptionAr: '',
                        date: new Date().toISOString().split('T')[0],
                        type: 'upcoming',
                        image: 'https://files.catbox.moe/wof38b.jpeg'
                    };
                    const validated = insertEventSchema.parse(eventData);
                    const event = await storage.createEvent(validated);
                    createdEvents.push(event);
                } catch (err) {
                    console.warn(`Failed to create event: ${err.message}`);
                }
            }
            res.json({
                success: true,
                message: `✅ Created ${createdEvents.length} events from forum`,
                count: createdEvents.length,
                events: createdEvents
            });
        } catch (error) {
            console.error("Scraping error:", error);
            res.status(500).json({ error: error.message || "Failed to scrape events" });
        }
    });

    // Bulk create weapons endpoint
    app2.post("/api/weapons/bulk-create", async (req, res) => {
        try {
            const { weapons } = req.body;
            if (!Array.isArray(weapons)) {
                return res.status(400).json({ error: "Weapons array is required" });
            }
            const createdWeapons = [];
            const failedWeapons = [];
            for (const weaponData of weapons) {
                try {
                    const weapon = await storage.createWeapon({
                        name: weaponData.name || "Unknown",
                        image: weaponData.image || "",
                        description: weaponData.description || "",
                        category: weaponData.category || ""
                    });
                    if (weapon) {
                        createdWeapons.push(weapon);
                    }
                } catch (err) {
                    console.warn(`Failed to create weapon: ${err.message}`);
                    failedWeapons.push({
                        name: weaponData.name,
                        error: err.message
                    });
                }
            }
            res.status(201).json({
                success: true,
                message: `Created ${createdWeapons.length} weapons (${failedWeapons.length} failed)`,
                count: createdWeapons.length,
                failed: failedWeapons.length,
                weapons: createdWeapons,
                failedWeapons: failedWeapons
            });
        } catch (error) {
            console.error("Bulk weapon creation error:", error);
            res.status(400).json({ error: error.message });
        }
    });

    app2.get("/api/stats", async (req, res) => {
        try {
            const posts = await storage.getAllPosts();
            const totalViews = posts.reduce((sum, post) => sum + post.views, 0);
            res.json({
                totalPosts: posts.length,
                totalViews,
                recentPosts: posts.slice(0, 5).map((post) => ({
                    ...post,
                    date: formatDate(post.createdAt),
                })),
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.get("/api/news", async (req, res) => {
        try {
            const q = req.query || {};
            const limitRaw = parseInt(String(q.limit || "20"), 10);
            const limit = isNaN(limitRaw) ? 20 : Math.max(1, Math.min(100, limitRaw));
            const offsetRaw = parseInt(String(q.offset || "0"), 10);
            const offset = isNaN(offsetRaw) ? 0 : Math.max(0, offsetRaw);
            let all = await storage.getAllNews();
            if (q.category) {
                const cat = String(q.category).toLowerCase();
                all = all.filter((n) => String(n?.category || "").toLowerCase().includes(cat));
            }
            const total = Array.isArray(all) ? all.length : 0;
            const items = Array.isArray(all) ? all.slice(offset, offset + limit) : [];
            res.json({ items, total });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.post("/api/news", requireAuth, requireContentCreator, async (req, res) => {
        try {
            const adminId = req.user?.id || "";
            const admin = adminId ? await AdminModel.findById(adminId).lean() : null;
            const adminName = admin?.username || "Unknown";

            if (admin && admin.create_limit > 0 && admin.news_created >= admin.create_limit) {
                return res.status(403).json({ error: "News creation quota exceeded" });
            }

            const data = insertNewsSchema.parse(req.body);
            stripOrderingFields(data, req.user?.role || "");
            data.createdByAdminId = adminId;
            data.createdByAdminName = adminName;
            const news = await storage.createNews(data);

            if (admin) {
                await AdminModel.findByIdAndUpdate(adminId, { $inc: { news_created: 1 } });
            }

            res.status(201).json(news);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    app2.get("/api/news/slug/:slug", async (req, res) => {
        try {
            const { slug } = req.params;
            const news = await storage.getNewsByIdOrSlug(slug);
            if (!news) {
                try { await storage.logUrlMatchFailure("news", slug); } catch { }
                return res.status(404).json({ error: "News not found" });
            }
            return res.json(news);
        } catch (error) {
            return res.status(404).json({ error: "News not found" });
        }
    });
    app2.get("/api/news/:id", async (req, res) => {
        try {
            const idOrSlug = req.params.id;
            const news = await storage.getNewsByIdOrSlug(idOrSlug);
            if (!news) {
                return res.status(404).json({ error: "News not found" });
            }
            res.json(news);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.patch("/api/news/:id", requireAuth, requireOwnershipOrAdmin("news"), async (req, res) => {
        try {
            const updates = { ...req.body };
            stripOrderingFields(updates, req.user?.role || "");
            const news = await storage.updateNews(req.params.id, updates);
            if (!news) {
                return res.status(404).json({ error: "News item not found" });
            }
            res.json(news);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    app2.delete("/api/news/:id", requireAuth, requireOwnershipOrAdmin("news"), async (req, res) => {
        try {
            const deleted = await storage.deleteNews(req.params.id);
            if (!deleted) {
                return res.status(404).json({ error: "News item not found" });
            }
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.get("/api/admin/news/merge/preview", requireAuth, requireSuperAdmin, async (_req, res) => {
        try {
            const base = (process.env.PUBLIC_BASE_URL || "https://crossfire.wiki").replace(/\/$/, "");
            const items = await NewsModel.find().lean();
            const changes = [];
            for (const n of items) {
                const proposed = {};
                const title = String(n.title || "");
                const slug = n.news_slug || slugifyEventName(title);
                if (!n.news_slug && slug) {
                    proposed.news_slug = { from: n.news_slug || "", to: slug };
                }
                const canonical = `${base}/news/${slug || n.news_slug || slugifyEventName(title)}`;
                if (!n.canonicalUrl && canonical) {
                    proposed.canonicalUrl = { from: n.canonicalUrl || "", to: canonical };
                }
                if (!n.seoTitle && title) {
                    proposed.seoTitle = { from: n.seoTitle || "", to: title };
                }
                const plain = String(n.content || n.htmlContent || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
                if (!n.seoDescription && plain) {
                    const d = generateSummary(plain, 160);
                    const to = d.length < 60 ? plain.substring(0, Math.min(160, Math.max(60, plain.length))).trim() : d;
                    proposed.seoDescription = { from: n.seoDescription || "", to };
                }
                if (!n.ogImage && n.image) {
                    proposed.ogImage = { from: n.ogImage || "", to: n.image };
                }
                if (!n.twitterImage && (n.ogImage || n.image)) {
                    proposed.twitterImage = { from: n.twitterImage || "", to: n.ogImage || n.image };
                }
                if (!n.content && n.htmlContent) {
                    proposed.content = { preview: true };
                }
                if (Object.keys(proposed).length) {
                    changes.push({ id: String(n._id), title: n.title, news_slug: n.news_slug || slug, changes: proposed });
                }
            }
            res.json({ total: items.length, changes });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.post("/api/admin/news/merge", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const base = (process.env.PUBLIC_BASE_URL || "https://crossfire.wiki").replace(/\/$/, "");
            const items = await NewsModel.find().lean();
            let updated = 0;
            const applied = [];
            for (const n of items) {
                const title = String(n.title || "");
                const slug = n.news_slug || slugifyEventName(title);
                const plain = String(n.content || n.htmlContent || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
                const canonical = `${base}/news/${slug || slugifyEventName(title)}`;
                const set = {};
                if (!n.news_slug && slug) set.news_slug = slug;
                if (!n.canonicalUrl && canonical) set.canonicalUrl = canonical;
                if (!n.seoTitle && title) set.seoTitle = title;
                if (!n.seoDescription && plain) {
                    const d = generateSummary(plain, 160);
                    set.seoDescription = d.length < 60 ? plain.substring(0, Math.min(160, Math.max(60, plain.length))).trim() : d;
                }
                if (!n.ogImage && n.image) set.ogImage = n.image;
                if (!n.twitterImage && (n.ogImage || n.image)) set.twitterImage = n.ogImage || n.image;
                if (!n.content && n.htmlContent) set.content = String(n.htmlContent).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
                if (Object.keys(set).length) {
                    await NewsModel.updateOne({ _id: n._id }, { $set: set });
                    updated++;
                    applied.push({ id: String(n._id), changes: Object.keys(set) });
                }
            }
            res.json({ updated, items: applied });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.get("/api/scrape/modes", async (_req, res) => {
        try {
            res.json(["normal", "deep", "fast"]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.get("/api/tutorials", async (req, res) => {
        try {
            const limitRaw = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
            const offsetRaw = Array.isArray(req.query.offset) ? req.query.offset[0] : req.query.offset;
            const categoryRaw = Array.isArray(req.query.category) ? req.query.category[0] : req.query.category;
            const qRaw = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
            const limit = Math.max(1, Math.min(parseInt(String(limitRaw || "20"), 10) || 20, 100));
            const offset = Math.max(0, parseInt(String(offsetRaw || "0"), 10) || 0);
            const filter = {};
            if (categoryRaw && String(categoryRaw).trim()) {
                filter["category"] = String(categoryRaw).trim();
            }
            let query = TutorialModel.find(filter).sort({ order: -1, createdAt: -1 });
            if (qRaw && String(qRaw).trim()) {
                const q = String(qRaw).trim();
                query = TutorialModel.find({
                    ...filter,
                    $or: [
                        { title: { $regex: q, $options: "i" } },
                        { description: { $regex: q, $options: "i" } },
                    ],
                }).sort({ order: -1, createdAt: -1 });
            }
            const all = await query.lean();
            const total = all.length;
            const items = all.slice(offset, offset + limit).map((t) => ({ ...t, id: String(t._id) }));
            res.json({ items, total });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.get("/api/tutorials/slug/:slug", async (req, res) => {
        try {
            const { slug } = req.params;
            const item = await TutorialModel.findOne({ tutorial_slug: slug }).lean();
            if (!item) return res.status(404).json({ error: "Tutorial not found" });
            res.json({ ...item, id: String(item._id) });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.get("/api/tutorials/:id", async (req, res) => {
        try {
            const item = await TutorialModel.findById(req.params.id).lean();
            if (!item)
                return res.status(404).json({ error: "Tutorial not found" });
            res.json({ ...item, id: String(item._id) });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Chat API
    app2.get("/api/chat/conversations", requireAuth, async (req, res) => {
        try {
            const username = req.user.username;
            if (!username) return res.status(400).json({ error: "Username not found in token" });

            const conversations = await ConversationModel.find({ participants: username })
                .sort({ lastMessageAt: -1 })
                .lean();
            res.json(conversations);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.post("/api/chat/conversations", requireAuth, async (req, res) => {
        try {
            const data = insertConversationSchema.parse(req.body);
            // Ensure creator is participant
            if (!data.participants.includes(req.user.username)) {
                data.participants.push(req.user.username);
            }

            // Check if direct conversation already exists
            if (data.type === 'direct') {
                const existing = await ConversationModel.findOne({
                    type: 'direct',
                    participants: { $all: data.participants, $size: data.participants.length }
                });
                if (existing) return res.json(existing);
            }

            const conversation = await ConversationModel.create({
                participants: data.participants,
                type: data.type,
                lastMessage: data.initialMessage,
                lastMessageAt: new Date()
            });

            if (data.initialMessage) {
                await MessageModel.create({
                    conversationId: conversation._id,
                    sender: req.user.username,
                    content: data.initialMessage
                });
            }

            res.status(201).json(conversation);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    app2.get("/api/chat/conversations/:id/messages", requireAuth, async (req, res) => {
        try {
            const { id } = req.params;
            // Verify participation
            const conversation = await ConversationModel.findById(id).lean();
            if (!conversation) return res.status(404).json({ error: "Conversation not found" });

            if (!conversation.participants.includes(req.user.username)) {
                return res.status(403).json({ error: "Not a participant" });
            }

            const messages = await MessageModel.find({ conversationId: id })
                .sort({ createdAt: 1 })
                .limit(100)
                .lean();
            res.json(messages);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.post("/api/chat/messages", requireAuth, async (req, res) => {
        try {
            const data = insertMessageSchema.parse(req.body);
            // Verify participation
            const conversation = await ConversationModel.findById(data.conversationId);
            if (!conversation || !conversation.participants.includes(req.user.username)) {
                return res.status(403).json({ error: "Not a participant" });
            }

            const message = await MessageModel.create({
                conversationId: data.conversationId,
                sender: req.user.username,
                content: data.content,
                type: data.type
            });

            await ConversationModel.findByIdAndUpdate(data.conversationId, {
                lastMessage: data.content,
                lastMessageAt: new Date()
            });

            // Broadcast to participants
            const payload = JSON.stringify({
                type: "message",
                conversationId: data.conversationId,
                message: message
            });

            conversation.participants.forEach(p => {
                const userSockets = connectedUsers.get(p);
                if (userSockets) {
                    userSockets.forEach(client => {
                        try {
                            if (client.readyState === 1) client.send(payload);
                        } catch (e) {
                            console.error("Error broadcasting to user", p, e);
                        }
                    });
                }
            });

            res.status(201).json({ ...message.toObject(), id: String(message._id) });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    app2.post("/api/tutorials", requireAuth, requireContentCreator, async (req, res) => {
        try {
            const adminId = req.user?.id || "";
            const admin = adminId ? await AdminModel.findById(adminId).lean() : null;
            const adminName = admin?.username || "Unknown";

            if (admin && admin.create_limit > 0 && admin.tutorials_created >= admin.create_limit) {
                return res.status(403).json({ error: "Tutorial creation quota exceeded" });
            }

            const body = req.body;
            stripOrderingFields(body, req.user?.role || "");
            const url = String(body.youtubeUrl || "").trim();
            const patterns = [
                /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
                /youtube\.com\/embed\/([^&\n?#]+)/,
            ];
            let youtubeId = null;
            for (const p of patterns) {
                const m = url.match(p);
                if (m) {
                    youtubeId = m[1];
                    break;
                }
            }
            if (!youtubeId)
                return res.status(400).json({ error: "Invalid YouTube URL" });
            const baseSlug = slugifyEventName(body.title);
            let finalSlug = baseSlug || "tutorial";
            let attempt = 1;
            while (true) {
                const conflict = await TutorialModel.findOne({ tutorial_slug: finalSlug }).lean();
                if (!conflict) break;
                attempt += 1;
                finalSlug = `${baseSlug}-${attempt}`;
            }
            const created = await TutorialModel.create({
                title: body.title,
                youtubeUrl: url,
                youtubeId,
                description: body.description || "",
                likes: 0,
                order: typeof body.order === "number" && (req.user?.role === "super_admin") ? body.order : 9999,
                tutorial_slug: finalSlug,
            });

            if (admin) {
                await AdminModel.findByIdAndUpdate(adminId, { $inc: { tutorials_created: 1 } });
            }

            const lean = await TutorialModel.findById(created._id).lean();
            res.status(201).json({ ...lean, id: String(lean._id) });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    app2.patch("/api/tutorials/:id", requireAuth, requireAdminOnly, async (req, res) => {
        try {
            const body = req.body;
            const updates = { ...body };
            stripOrderingFields(updates, req.user?.role || "");
            if (updates.youtubeUrl) {
                const url = String(updates.youtubeUrl).trim();
                const patterns = [
                    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
                    /youtube\.com\/embed\/([^&\n?#]+)/,
                ];
                let youtubeId = null;
                for (const p of patterns) {
                    const m = url.match(p);
                    if (m) {
                        youtubeId = m[1];
                        break;
                    }
                }
                if (!youtubeId)
                    return res
                        .status(400)
                        .json({ error: "Invalid YouTube URL" });
                updates.youtubeId = youtubeId;
            }
            if (typeof updates.title === "string" && updates.title.trim().length > 0) {
                const baseSlug = slugifyEventName(updates.title);
                let candidate = baseSlug || "tutorial";
                let attempt = 1;
                while (true) {
                    const conflict = await TutorialModel.findOne({ tutorial_slug: candidate, _id: { $ne: req.params.id } }).lean();
                    if (!conflict) break;
                    attempt += 1;
                    candidate = `${baseSlug}-${attempt}`;
                }
                updates.tutorial_slug = candidate;
            }
            const updated = await TutorialModel.findByIdAndUpdate(
                req.params.id,
                updates,
                { new: true },
            ).lean();
            if (!updated)
                return res.status(404).json({ error: "Tutorial not found" });
            res.json({ ...updated, id: String(updated._id) });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    app2.get("/api/tutorials/:id/redirect", async (req, res) => {
        try {
            const t = await TutorialModel.findById(req.params.id).lean();
            if (!t) return res.status(404).json({ error: "Tutorial not found" });
            const base = (process.env.PUBLIC_BASE_URL || "https://crossfire.wiki").replace(/\/$/, "");
            const target = `${base}/tutorials/${t.tutorial_slug || slugifyEventName(t.title || "")}`;
            res.status(301).set("Location", target).send("Moved Permanently");
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.delete("/api/tutorials/:id", requireAuth, requireAdminOnly, async (req, res) => {
        try {
            const ok = await TutorialModel.findByIdAndDelete(req.params.id);
            if (!ok)
                return res.status(404).json({ error: "Tutorial not found" });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.put("/api/admin/admins/:adminId/permissions", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const { adminId } = req.params;
            const { permissions } = req.body;
            if (!permissions || typeof permissions !== "object") {
                return res.status(400).json({ error: "Permissions object required" });
            }
            const updated = await AdminModel.findByIdAndUpdate(adminId, { permissions }, { new: true }).lean();
            if (!updated) return res.status(404).json({ error: "Admin not found" });
            res.json({ id: String(updated._id), username: updated.username, permissions: updated.permissions });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.put("/api/admin/admins/:adminId/quota", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const { adminId } = req.params;
            const { create_limit } = req.body;
            if (typeof create_limit !== "number") {
                return res.status(400).json({ error: "create_limit must be a number (-1 for unlimited)" });
            }
            const updated = await AdminModel.findByIdAndUpdate(adminId, { create_limit }, { new: true }).lean();
            if (!updated) return res.status(404).json({ error: "Admin not found" });
            res.json({ id: String(updated._id), username: updated.username, create_limit: updated.create_limit, posts_created: updated.posts_created, events_created: updated.events_created, news_created: updated.news_created, tutorials_created: updated.tutorials_created });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.get("/api/admin/admins/:adminId", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const admin = await AdminModel.findById(req.params.adminId).lean();
            if (!admin) return res.status(404).json({ error: "Admin not found" });
            res.json({ id: String(admin._id), username: admin.username, name: admin.name, email: admin.email, role: admin.role, permissions: admin.permissions || {}, create_limit: admin.create_limit, posts_created: admin.posts_created, events_created: admin.events_created, news_created: admin.news_created, tutorials_created: admin.tutorials_created, active: admin.active });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.post("/api/tutorials/:id/like", async (req, res) => {
        try {
            const updated = await TutorialModel.findByIdAndUpdate(
                req.params.id,
                { $inc: { likes: 1 } },
                { new: true },
            ).lean();
            if (!updated)
                return res.status(404).json({ error: "Tutorial not found" });
            res.json({ ...updated, id: String(updated._id) });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Weapons endpoints (used by seeding scripts)
    app2.get("/api/weapons", async (req, res) => {
        try {
            const items = await storage.getAllWeapons();
            res.json(items);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    // Weapons search endpoint
    app2.get("/api/weapons/search", async (req, res) => {
        try {
            const { page, pageSize, q, letter, category, sort, order } = req.query || {};
            const result = await storage.searchWeaponsPaged({ page, pageSize, q, letter, category, sort, order });
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    // Weapon by id
    app2.get("/api/weapons/:id", async (req, res) => {
        try {
            const item = await storage.getWeaponById(req.params.id);
            if (!item) return res.status(404).json({ error: "Weapon not found" });
            res.json(item);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    app2.post("/api/weapons", async (req, res) => {
        try {
            const created = await storage.createWeapon(req.body);
            res.status(201).json(created);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });
    app2.patch("/api/weapons/:id", requireAuth, async (req, res) => {
        try {
            const updated = await storage.updateWeapon(req.params.id, req.body);
            if (!updated)
                return res.status(404).json({ error: "Weapon not found" });
            res.json(updated);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });
    app2.delete("/api/weapons/:id", requireAuth, async (req, res) => {
        try {
            const ok = await storage.deleteWeapon(req.params.id);
            if (!ok) return res.status(404).json({ error: "Weapon not found" });
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Modes endpoints
    app2.get("/api/modes", async (req, res) => {
        try {
            const items = await storage.getAllModes();
            res.json(items);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    app2.post("/api/modes", async (req, res) => {
        try {
            const created = await storage.createMode(req.body);
            res.status(201).json(created);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });
    app2.patch("/api/modes/:id", requireAuth, async (req, res) => {
        try {
            const updated = await storage.updateMode(req.params.id, req.body);
            if (!updated)
                return res.status(404).json({ error: "Mode not found" });
            res.json(updated);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });
    app2.delete("/api/modes/:id", requireAuth, async (req, res) => {
        try {
            const ok = await storage.deleteMode(req.params.id);
            if (!ok) return res.status(404).json({ error: "Mode not found" });
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Ranks endpoints
    app2.get("/api/ranks", async (req, res) => {
        try {
            const items = await storage.getAllRanks();
            res.json(items);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    app2.post("/api/ranks", async (req, res) => {
        try {
            const created = await storage.createRank(req.body);
            res.status(201).json(created);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });
    app2.patch("/api/ranks/:id", requireAuth, async (req, res) => {
        try {
            const updated = await storage.updateRank(req.params.id, req.body);
            if (!updated)
                return res.status(404).json({ error: "Rank not found" });
            res.json(updated);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });
    app2.delete("/api/ranks/:id", requireAuth, async (req, res) => {
        try {
            const ok = await storage.deleteRank(req.params.id);
            if (!ok) return res.status(404).json({ error: "Rank not found" });
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    app2.get("/api/mercenaries", async (req, res) => {
        try {
            const mercenaries = await storage.getAllMercenaries();
            res.json(mercenaries);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.post("/api/mercenaries", requireAuth, async (req, res) => {
        try {
            const merc = req.body;
            if (!merc.name || !merc.image) {
                return res
                    .status(400)
                    .json({ error: "Name and image are required" });
            }
            // Ensure stats object exists
            if (!merc.stats) {
                merc.stats = { health: 75, speed: 75, attack: 75, defense: 75 };
            }
            // Ensure arrays exist
            if (!merc.voiceLines) {
                merc.voiceLines = [];
            }
            const created = await storage.createMercenary(merc);
            res.status(201).json(created);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    app2.delete("/api/mercenaries/:id", requireAuth, async (req, res) => {
        try {
            const ok = await storage.deleteMercenary(req.params.id);
            if (!ok)
                return res.status(404).json({ error: "Mercenary not found" });
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    app2.patch("/api/mercenaries/:id", requireAuth, async (req, res) => {
        try {
            const updates = req.body;
            // Validate required fields if provided
            if (updates.name !== undefined && !updates.name) {
                return res.status(400).json({ error: "Name cannot be empty" });
            }
            if (updates.image !== undefined && !updates.image) {
                return res
                    .status(400)
                    .json({ error: "Image URL cannot be empty" });
            }

            const updated = await storage.updateMercenary(
                req.params.id,
                updates,
            );
            if (!updated)
                return res.status(404).json({ error: "Mercenary not found" });
            res.json(updated);
        } catch (err) {
            const msg = String(err?.message || "Update failed");
            if (/Cast to ObjectId failed/i.test(msg)) {
                return res.status(400).json({ error: "Invalid mercenary id" });
            }
            res.status(500).json({ error: msg });
        }
    });
    app2.get("/api/mercenaries/:id", async (req, res) => {
        try {
            const mercenaries = await storage.getAllMercenaries();
            const merc = mercenaries.find(
                (m) =>
                    m.id === req.params.id || String(m._id) === req.params.id,
            );
            if (!merc)
                return res.status(404).json({ error: "Mercenary not found" });
            res.json(merc);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    app2.post("/api/mercenaries/remove-duplicates", async (req, res) => {
        try {
            const removed = await storage.removeDuplicateMercenaries();
            res.json({ success: true, duplicatesRemoved: removed });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    app2.get("/api/tickets", async (req, res) => {
        try {
            const user = req.user || { role: "guest" };
            const tickets = await storage.getAllTickets();
            const formattedTickets = tickets.map((ticket) => {
                const formatted = {
                    ...ticket,
                    createdAt: formatDate(ticket.createdAt),
                    updatedAt: formatDate(ticket.updatedAt),
                };
                if (user.role !== "super_admin") {
                    delete formatted.userEmail;
                }
                return formatted;
            });
            res.json(formattedTickets);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.get("/robots.txt", async (_req, res) => {
        try {
            res.set("Cache-Control", "no-transform, max-age=0, must-revalidate");
            res.type("text/plain");
            res.send([
                "User-agent: *",
                "Allow: /",
                "Sitemap: https://crossfire.wiki/sitemap.xml",
            ].join("\n"));
        } catch (error) {
            res.status(500).type("text/plain").send("User-agent: *\nAllow: /\nSitemap: https://crossfire.wiki/sitemap.xml\n");
        }
    });

    app2.get("/tutorials/:legacyId([a-fA-F0-9]{24})", async (req, res) => {
        try {
            const { legacyId } = req.params;
            const t = await TutorialModel.findById(legacyId).lean();
            if (!t) {
                return res.redirect(301, "/tutorials");
            }
            const slug = t.tutorial_slug || slugifyEventName(t.title || "");
            if (slug) return res.redirect(301, `/tutorials/${slug}`);
            return res.redirect(301, `/tutorials/id/${legacyId}`);
        } catch {
            return res.redirect(301, "/tutorials");
        }
    });

    app2.get("/favicon.ico", async (_req, res) => {
        try {
            res.set("Cache-Control", "no-transform, max-age=0, must-revalidate");
            res.redirect(302, "/favicon.png?v=20251128");
        } catch (error) {
            res.redirect(302, "/favicon.png");
        }
    });

    app2.post("/api/admin/indexnow", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const body = req.body || {};
            const urlList = Array.isArray(body.urlList) ? body.urlList : [];
            if (!urlList.length) {
                return res.status(400).json({ error: "urlList is required and must be a non-empty array" });
            }
            const KEY = body.key || process.env.INDEXNOW_KEY || "7fb6f19aa8e6478fb6dce57412beeeb3";
            const HOST = body.host || process.env.SITE_HOST || "crossfire.wiki";
            const KEY_LOC = body.keyLocation || `https://${HOST}/${KEY}.txt`;

            const payload = {
                host: HOST,
                key: KEY,
                keyLocation: KEY_LOC,
                urlList,
            };
            const resp = await fetch("https://api.indexnow.org/IndexNow", {
                method: "POST",
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: JSON.stringify(payload),
            });
            const text = await resp.text();
            res.status(resp.status).type("text/plain").send(text);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.post("/api/admin/reseed-mercs-ranks", requireAuth, requireSuperAdmin, async (_req, res) => {
        try {
            const mod = await import("./seed-from-urls.js");
            const mercs = Array.isArray(mod.mercenariesData) ? mod.mercenariesData : [];
            const ranks = Array.isArray(mod.ranksData) ? mod.ranksData : [];
            await MercenaryModel.deleteMany({});
            await RankModel.deleteMany({});
            if (mercs.length) await MercenaryModel.insertMany(mercs);
            if (ranks.length) await RankModel.insertMany(ranks);
            res.json({ success: true, mercenaries: mercs.length, ranks: ranks.length });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.get("/api/tickets/my/:email", async (req, res) => {
        try {
            const { email } = req.params;
            const tickets = await storage.getTicketsByEmail(email);
            const formattedTickets = tickets.map((ticket) => ({
                ...ticket,
                createdAt: formatDate(ticket.createdAt),
                updatedAt: formatDate(ticket.updatedAt),
            }));
            res.json(formattedTickets);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.get("/api/tickets/:id", async (req, res) => {
        try {
            const ticket = await storage.getTicketById(req.params.id);
            if (!ticket) {
                return res.status(404).json({ error: "Ticket not found" });
            }
            const formattedTicket = {
                ...ticket,
                createdAt: formatDate(ticket.createdAt),
                updatedAt: formatDate(ticket.updatedAt),
            };
            res.json(formattedTicket);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.post("/api/tickets", upload.fields([{ name: "image", maxCount: 1 }, { name: "video", maxCount: 1 }]), async (req, res) => {
        try {
            const body = req.body || {};
            let mediaUrl = body.mediaUrl || "";
            let mediaType = body.mediaType || "";

            const imageFile = req.files && Array.isArray(req.files.image) ? req.files.image[0] : undefined;
            const videoFile = req.files && Array.isArray(req.files.video) ? req.files.video[0] : undefined;

            async function uploadToCatbox(file) {
                const fd = new FormData();
                fd.append("reqtype", "fileupload");
                fd.append("fileToUpload", file.buffer, { filename: file.originalname, contentType: file.mimetype });
                const resp = await fetch("https://catbox.moe/user/api.php", { method: "POST", body: fd });
                if (!resp.ok) throw new Error("Failed to upload media");
                const url = await resp.text();
                return url.trim();
            }

            if (videoFile) {
                mediaUrl = await uploadToCatbox(videoFile);
                mediaType = "video";
            } else if (imageFile) {
                mediaUrl = await uploadToCatbox(imageFile);
                mediaType = "image";
            }

            const payload = insertTicketSchema.parse({
                title: body.title,
                description: body.description,
                userName: body.userName,
                userEmail: body.userEmail,
                status: body.status,
                priority: body.priority,
                category: body.category,
                mediaUrl,
                mediaType,
            });
            const ticket = await storage.createTicket(payload);
            const formattedTicket = {
                ...ticket,
                createdAt: formatDate(ticket.createdAt),
                updatedAt: formatDate(ticket.updatedAt),
            };
            res.status(201).json(formattedTicket);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    app2.post("/api/contact", apiLimiter, async (req, res) => {
        try {
            const { name, email, subject, message } = req.body || {};
            if (!name || !email || !message) {
                return res.status(400).json({ error: "name, email, and message are required" });
            }
            const payload = insertTicketSchema.parse({
                title: subject || "Contact Form",
                description: message,
                userName: name,
                userEmail: email,
                status: "open",
                priority: "normal",
                category: "contact",
            });
            const ticket = await storage.createTicket(payload);
            const formatted = {
                ...ticket,
                createdAt: formatDate(ticket.createdAt),
                updatedAt: formatDate(ticket.updatedAt),
            };
            res.status(201).json(formatted);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    app2.patch("/api/tickets/:id", requireAuth, async (req, res) => {
        try {
            const updates = req.body;
            const ticket = await storage.updateTicket(req.params.id, updates);
            if (!ticket) {
                return res.status(404).json({ error: "Ticket not found" });
            }
            const formattedTicket = {
                ...ticket,
                createdAt: formatDate(ticket.createdAt),
                updatedAt: formatDate(ticket.updatedAt),
            };
            res.json(formattedTicket);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    app2.delete("/api/tickets/:id", requireAuth, async (req, res) => {
        try {
            const deleted = await storage.deleteTicket(req.params.id);
            if (!deleted) {
                return res.status(404).json({ error: "Ticket not found" });
            }
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.get("/api/tickets/:id/replies", async (req, res) => {
        try {
            const replies = await storage.getTicketReplies(req.params.id);
            const formattedReplies = replies.map((reply) => ({
                ...reply,
                createdAt: formatDate(reply.createdAt),
            }));
            res.json(formattedReplies);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.post("/api/tickets/:id/replies", async (req, res) => {
        try {
            const { id } = req.params;
            const { authorName, content, isAdmin } = req.body;
            const replyData = {
                ticketId: id,
                authorName,
                content,
                isAdmin: isAdmin || false,
            };
            const data = insertTicketReplySchema.parse(replyData);
            const reply = await storage.createTicketReply(data);
            const formattedReply = {
                ...reply,
                createdAt: formatDate(reply.createdAt),
            };
            res.status(201).json(formattedReply);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    app2.get(
        "/api/admins",
        requireAuth,
        requireSuperAdmin,
        async (req, res) => {
            try {
                const admins = await storage.getAllAdmins();
                const sanitizedAdmins = admins.map(
                    ({ password, ...admin }) => admin,
                );
                res.json(sanitizedAdmins);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        },
    );
    app2.post(
        "/api/admins",
        requireAuth,
        requireSuperAdmin,
        async (req, res) => {
            try {
                const { username, password, role } = req.body;
                if (!username || !password) {
                    return res
                        .status(400)
                        .json({ error: "Username and password are required" });
                }
                const existingAdmin =
                    await storage.getAdminByUsername(username);
                if (existingAdmin) {
                    return res
                        .status(400)
                        .json({ error: "Username already exists" });
                }
                const hashedPassword = await hashPassword(password);
                const data = insertAdminSchema.parse({
                    username,
                    password: hashedPassword,
                    role: role || "admin",
                });
                const admin = await storage.createAdmin(data);
                const { password: _, ...sanitizedAdmin } = admin;
                res.status(201).json(sanitizedAdmin);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        },
    );
    app2.patch(
        "/api/admins/:id",
        requireAuth,
        requireSuperAdmin,
        async (req, res) => {
            try {
                const updates = {};
                if (req.body.username !== void 0)
                    updates.username = req.body.username;
                if (req.body.password !== void 0) {
                    updates.password = await hashPassword(req.body.password);
                }
                if (req.body.role !== void 0) updates.role = req.body.role;
                const admin = await storage.updateAdmin(req.params.id, updates);
                if (!admin) {
                    return res.status(404).json({ error: "Admin not found" });
                }
                const { password: _, ...sanitizedAdmin } = admin;
                res.json(sanitizedAdmin);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        },
    );
    app2.delete(
        "/api/admins/:id",
        requireAuth,
        requireSuperAdmin,
        async (req, res) => {
            try {
                const deleted = await storage.deleteAdmin(req.params.id);
                if (!deleted) {
                    return res.status(404).json({ error: "Admin not found" });
                }
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        },
    );

    // Admin permissions (Super Admin only)
    app2.get(
        "/api/admin-permissions",
        requireAuth,
        requireSuperAdmin,
        async (_req, res) => {
            try {
                const permissions = await storage.getAllAdminPermissions();
                res.json(permissions);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        }
    );

    app2.put(
        "/api/admin-permissions/:adminId",
        requireAuth,
        requireSuperAdmin,
        async (req, res) => {
            try {
                const { adminId } = req.params;
                const { permissions } = req.body;
                if (!permissions || typeof permissions !== "object") {
                    return res.status(400).json({ error: "Permissions object is required" });
                }
                await storage.updateAdminPermissions(adminId, permissions);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        }
    );
    app2.get("/api/events/:id", async (req, res) => {
        try {
            const event = await storage.getEventById(req.params.id);
            if (!event) {
                return res.status(404).json({ error: "Event not found" });
            }
            res.json(event);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.patch("/api/events/:id", requireAuth, requireOwnershipOrAdmin("events"), async (req, res) => {
        try {
            const updates = { ...req.body };
            stripOrderingFields(updates, req.user?.role || "");
            const event = await storage.updateEvent(req.params.id, updates);
            if (!event) {
                return res.status(404).json({ error: "Event not found" });
            }
            res.json(event);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    app2.get(
        "/api/newsletter-subscribers",
        requireAuth,
        requireSuperAdmin,
        async (req, res) => {
            try {
                const subscribers = await storage.getAllNewsletterSubscribers();
                res.json(subscribers);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        },
    );
    app2.post("/api/newsletter-subscribe", async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ error: "Email is required" });
            }
            const existing =
                await storage.getNewsletterSubscriberByEmail(email);
            if (existing) {
                return res
                    .status(400)
                    .json({ error: "Email already subscribed" });
            }
            const data = insertNewsletterSubscriberSchema.parse({ email });
            const subscriber = await storage.createNewsletterSubscriber(data);
            res.status(201).json(subscriber);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    app2.delete(
        "/api/newsletter-subscribers/:id",
        requireAuth,
        requireSuperAdmin,
        async (req, res) => {
            try {
                const deleted = await storage.deleteNewsletterSubscriber(
                    req.params.id,
                );
                if (!deleted) {
                    return res
                        .status(404)
                        .json({ error: "Subscriber not found" });
                }
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        },
    );
    app2.post(
        "/api/upload-image",
        uploadLimiter,
        (req, res, next) => {
            // Dual Auth Check: Bearer or CSRF
            const authHeader = req.headers.authorization;
            let authorized = false;

            if (authHeader && authHeader.startsWith("Bearer ")) {
                const token = authHeader.substring(7);
                const payload = verifyToken(token);
                if (payload) {
                    req.user = payload;
                    authorized = true;
                }
            }

            if (!authorized) {
                const csrf = req.headers["x-csrf-token"] || req.headers["x-api-key"];
                const envToken = String(process.env.CSRF_TOKEN || process.env.CSRF_SECRET || "").trim();
                if (csrf && envToken && csrf === envToken) {
                    authorized = true;
                }
            }

            if (!authorized) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            next();
        },
        upload.single("image"),
        async (req, res) => {
            try {
                if (!req.file) {
                    return res
                        .status(400)
                        .json({ error: "No image file provided" });
                }
                const formData = new FormData();
                formData.append("reqtype", "fileupload");
                formData.append("fileToUpload", req.file.buffer, req.file.originalname);
                const response = await fetch(
                    "https://catbox.moe/user/api.php",
                    {
                        method: "POST",
                        body: formData,
                    },
                );
                if (!response.ok) {
                    throw new Error("Failed to upload to catbox.moe");
                }
                const imageUrl = await response.text();
                res.json({ url: imageUrl.trim() });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        },
    );

    // Scraper API key middleware
    const SCRAPER_API_KEY =
        process.env.SCRAPER_API_KEY || "crossfire-event-scraper-key-2025";

    function hasScraperKey(req) {
        const k = (
            req.headers["x-scraper-api-key"] ||
            req.headers["x-api-key"] ||
            ""
        ).toString();
        return Boolean(SCRAPER_API_KEY && k && k === SCRAPER_API_KEY);
    }

    function requireEventScraperOrApiKey(req, res, next) {
        // allow header key or admins with event_scraper role
        if (hasScraperKey(req)) return next();
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res
                .status(403)
                .json({ error: "Forbidden: need event_scraper or API key" });
        }
        const token = authHeader.substring(7);
        const payload = verifyToken(token);
        if (!payload) {
            return res.status(403).json({ error: "Forbidden: Invalid token" });
        }
        req.user = payload;
        const role = req.user?.role || "";
        const perms = req.user?.permissions || {};
        if (role === "super_admin" || role === "scraper_admin" || perms["events:scrape"] || perms["news:scrape"] || perms["scraper:run"]) {
            return next();
        }
        return res.status(403).json({ error: "Forbidden: Scraper permission required" });
    }

    // Additional scraper auth middleware for clarity
    function requireScraperAuth(req, res, next) {
        return requireEventScraperOrApiKey(req, res, next);
    }

    // Per-route rate limiter for scraping operations
    const scrapeLimiter = rateLimit({
        windowMs: 5 * 60 * 1000,
        max: 20,
        standardHeaders: true,
        legacyHeaders: false,
        message: "Too many scraping requests, please try again later",
    });

    // Cloudinary-style upload endpoint (+ dry-run) — register unconditionally
    app2.options("/images/upload", (_req, res) => res.sendStatus(204));
    app2.all("/images/upload", (req, res, next) => {
        if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed", allowed: ["POST"] });
        next();
    });
    app2.post("/images/upload", uploadLimiter, upload.single("file"), async (req, res) => {
        try {
            const tokenHeader = String(req.headers["x-csrf-token"] || req.headers["X-CSRF-Token"] || "").trim();
            const envToken = String(process.env.CSRF_TOKEN || process.env.CSRF_SECRET || "").trim();
            if (envToken && tokenHeader !== envToken) {
                return res.status(403).json({ ok: false, error: "CSRF validation failed", code: "csrf_failed" });
            }
            if (!req.file) {
                return res.status(400).json({ ok: false, error: "No file provided" });
            }
            const allowed = [
                "image/jpeg", "image/png", "image/webp", "image/gif",
                "video/mp4", "video/webm", "video/ogg", "video/mpeg",
                "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"
            ];
            if (!allowed.includes(req.file.mimetype)) {
                return res.status(415).json({ ok: false, error: `Unsupported type: ${req.file.mimetype}`, code: "unsupported_type" });
            }
            const kind = req.file.mimetype.startsWith("image/") ? "image" : req.file.mimetype.startsWith("video/") ? "video" : req.file.mimetype.startsWith("audio/") ? "audio" : "auto";
            const sizeLimits = { image: 15 * 1024 * 1024, video: 200 * 1024 * 1024, audio: 30 * 1024 * 1024 };
            const limit = sizeLimits[kind] || sizeLimits.image;
            if (req.file.size > limit) {
                return res.status(413).json({ ok: false, error: "File too large", code: "file_too_large", limit });
            }

            const DRY = String(process.env.CLOUDINARY_DRY_RUN || "").toLowerCase() === "true";
            const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || "dkpdidm89").trim();
            const publicIdBase = String((req.query?.public_id || req.body?.public_id || req.file.originalname || "")).replace(/\.[A-Za-z0-9]+$/i, "").trim() || "upload";
            const format = (req.file.mimetype.includes("webp") ? "webp" : req.file.mimetype.includes("jpeg") ? "jpg" : req.file.mimetype.includes("png") ? "png" : req.file.mimetype.includes("gif") ? "gif" : req.file.mimetype.includes("mp4") ? "mp4" : req.file.mimetype.includes("webm") ? "webm" : req.file.mimetype.includes("ogg") ? "ogg" : "bin");
            const secure_url = `https://res.cloudinary.com/${cloudName}/${kind}/upload/v123/${publicIdBase}.${format}`;
            const base = (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
            const domain_url = `${base}/media/${kind === "image" ? "images" : kind === "video" ? "videos" : "audio"}/${publicIdBase}.${format}`;
            if (DRY) {
                return res.json({ ok: true, domain_url, public_id: publicIdBase, format, resource_type: kind, bytes: req.file.size, created_at: new Date().toISOString() });
            }

            return res.status(501).json({ ok: false, error: "Live Cloudinary upload not configured", code: "not_implemented" });
        } catch (error) {
            res.status(500).json({ ok: false, error: error?.message || "Upload failed", code: "server_error" });
        }
    });

    // Proxy pretty image path to Cloudinary
    app2.get("/image/:filename", async (req, res) => {
        try {
            const name = String(req.params.filename || "").replace(/[^A-Za-z0-9._-]+/g, "");
            if (!name) return res.status(400).json({ ok: false, error: "Invalid image name" });
            const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || "dkpdidm89").trim();
            const url = `https://res.cloudinary.com/${cloudName}/image/upload/${name}`;
            const u = new URL(url);
            if (!/res\.cloudinary\.com$/i.test(u.hostname)) {
                return res.status(400).json({ ok: false, error: "Only Cloudinary resources allowed" });
            }
            const upstream = await fetch(url);
            if (!upstream.ok) return res.status(502).json({ ok: false, error: `Upstream failed: ${upstream.status}` });
            const ct = upstream.headers.get("content-type");
            if (ct) res.setHeader("Content-Type", ct);
            upstream.body.pipe(res);
        } catch (error) {
            res.status(500).json({ ok: false, error: error?.message || "Proxy failed" });
        }
    });

    // Unified media proxy under /media/<type>/<path> with Range support and caching
    app2.get("/media/:type/*", async (req, res) => {
        try {
            const type = String(req.params.type || "").toLowerCase();
            const pathPart = String(req.params[0] || "").replace(/[^A-Za-z0-9._\/-]+/g, "");
            if (!pathPart) return res.status(400).json({ ok: false, error: "Invalid media path" });
            const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || "dkpdidm89").trim();
            const cloudType = type === "images" ? "image" : type === "videos" ? "video" : type === "audio" ? "video" : null;
            if (!cloudType) return res.status(400).json({ ok: false, error: "Unsupported media type" });
            const upstreamUrl = `https://res.cloudinary.com/${cloudName}/${cloudType}/upload/${pathPart}`;
            const headers = {};
            const range = req.headers["range"];
            if (range) headers["Range"] = String(range);
            const upstream = await fetch(upstreamUrl, { headers });
            if (!upstream.ok && upstream.status !== 206) {
                return res.status(502).json({ ok: false, error: `Upstream failed: ${upstream.status}` });
            }
            res.status(upstream.status);
            const h = upstream.headers;
            const ct = h.get("content-type");
            if (ct) res.setHeader("Content-Type", ct);
            const cl = h.get("content-length");
            if (cl) res.setHeader("Content-Length", cl);
            const cr = h.get("content-range");
            if (cr) res.setHeader("Content-Range", cr);
            const ar = h.get("accept-ranges") || (range ? "bytes" : "none");
            if (ar) res.setHeader("Accept-Ranges", ar);
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
            upstream.body.pipe(res);
        } catch (error) {
            res.status(500).json({ ok: false, error: error?.message || "Proxy failed" });
        }
    });
    app2.get("/file/:filename", async (req, res) => {
        try {
            const name = String(req.params.filename || "").replace(/[^A-Za-z0-9._-]+/g, "");
            if (!name) return res.status(400).json({ ok: false, error: "Invalid file name" });
            const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || "dkpdidm89").trim();
            const url = `https://res.cloudinary.com/${cloudName}/raw/upload/${name}`;
            const upstream = await fetch(url);
            if (!upstream.ok) return res.status(502).json({ ok: false, error: `Upstream failed: ${upstream.status}` });
            const ct = upstream.headers.get("content-type");
            if (ct) res.setHeader("Content-Type", ct);
            upstream.body.pipe(res);
        } catch (error) {
            res.status(500).json({ ok: false, error: error?.message || "Proxy failed" });
        }
    });
    app2.get("/video/:filename", async (req, res) => {
        try {
            const name = String(req.params.filename || "").replace(/[^A-Za-z0-9._-]+/g, "");
            if (!name) return res.status(400).json({ ok: false, error: "Invalid video name" });
            const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || "dkpdidm89").trim();
            const url = `https://res.cloudinary.com/${cloudName}/video/upload/${name}`;
            const upstream = await fetch(url);
            if (!upstream.ok) return res.status(502).json({ ok: false, error: `Upstream failed: ${upstream.status}` });
            const ct = upstream.headers.get("content-type");
            if (ct) res.setHeader("Content-Type", ct);
            upstream.body.pipe(res);
        } catch (error) {
            res.status(500).json({ ok: false, error: error?.message || "Proxy failed" });
        }
    });

    // Scraping routes (fallback for deployments that don't keep full server)
    try {
        const {
            scrapeForumAnnouncements,
            scrapeEventDetails,
            scrapeMultipleEvents,
            scrapeRanks,
        } = await import("./services/scraper.js");

        app2.get("/api/scrape/forum-list", requireScraperAuth, scrapeLimiter, async (req, res) => {
            try {
                const posts = await scrapeForumAnnouncements();
                try { await storage.auditAdminAction("scrape_forum_list", "-", req.user?.id || "", { count: Array.isArray(posts) ? posts.length : 0 }); } catch { }
                res.json(posts);
            } catch (err) {
                res.status(500).json({
                    error: err.message || "Failed to scrape forum",
                });
            }
        });



        app2.post("/api/scrape/event-details", requireScraperAuth, scrapeLimiter, async (req, res) => {
            try {
                const { url } = req.body;
                if (!url)
                    return res.status(400).json({ error: "URL is required" });
                const event = await scrapeEventDetails(url);
                try { await storage.auditAdminAction("scrape_event_details", url, req.user?.id || "", {}); } catch { }
                res.json(event);
            } catch (err) {
                res.status(500).json({
                    error: err.message || "Failed to scrape event details",
                });
            }
        });

        app2.post("/api/admin/scrape-and-create-events", requireScraperAuth, scrapeLimiter, async (req, res) => {
            try {
                const posts = await scrapeForumAnnouncements();
                const urls = posts.map((p) => p.url);
                const scraped = await scrapeMultipleEvents(urls);
                const created = [];
                for (const ev of scraped) {
                    const payload = {
                        title: ev.title || "Event",
                        titleAr: ev.titleAr || "",
                        description: ev.description || ev.content || "",
                        descriptionAr: ev.descriptionAr || "",
                        date: ev.date || new Date().toISOString().slice(0, 10),
                        type: ev.type || "upcoming",
                        image: ev.image || "",
                        seoTitle: ev.seoTitle || "",
                        seoDescription: ev.seoDescription || "",
                        seoKeywords: Array.isArray(ev.seoKeywords)
                            ? ev.seoKeywords
                            : [],
                        canonicalUrl: ev.canonicalUrl || "",
                        ogImage: ev.ogImage || ev.image || "",
                        twitterImage:
                            ev.twitterImage || ev.ogImage || ev.image || "",
                        schemaType: ev.schemaType || "Event",
                    };
                    const existing = await EventModel.findOne({
                        title: payload.title,
                    }).lean();
                    if (!existing) {
                        const createdEvent = await storage.createEvent(payload);
                        created.push(createdEvent);
                    } else if (!existing.description || String(existing.description).trim() === "") {
                        await storage.updateEvent(String(existing._id || existing.id), { description: payload.description, descriptionAr: payload.descriptionAr || "" });
                    }
                }
                try { await storage.auditAdminAction("scrape_and_create_events", "-", req.user?.id || "", { createdCount: created.length }); } catch { }
                res.json({ events: created });
            } catch (err) {
                res.status(500).json({
                    error: err.message || "Failed to scrape and create events",
                });
            }
        });

        app2.post("/api/files/upload", uploadLimiter, upload.single("file"), async (req, res) => {
            try {
                const token = String(req.headers["x-csrf-token"] || req.headers["X-CSRF-Token"] || "");
                const envToken = String(process.env.CSRF_TOKEN || process.env.CSRF_SECRET || "").trim();
                if (envToken && token !== envToken) return res.status(403).json({ ok: false, error: "CSRF validation failed", code: "csrf_failed" });
                if (!req.file) return res.status(400).json({ ok: false, error: "No file provided", code: "no_file" });
                const MAX_SIZE = 50 * 1024 * 1024;
                if (req.file.size > MAX_SIZE) return res.status(413).json({ ok: false, error: "File too large", code: "file_too_large", limit: MAX_SIZE });
                const allowed = [
                    "image/jpeg", "image/png", "image/webp", "image/gif",
                    "video/mp4", "video/webm", "video/ogg", "video/mpeg",
                    "application/pdf"
                ];
                if (!allowed.includes(req.file.mimetype)) return res.status(415).json({ ok: false, error: `Unsupported type: ${req.file.mimetype}`, code: "unsupported_type" });
                const scan = await maybeScan(req.file.buffer);
                if (!scan.ok) return res.status(400).json({ ok: false, error: scan.error || "Virus scan failed", code: "virus_detected" });
                const UPLOADS_DIR = path.resolve("uploads");
                fs.mkdirSync(UPLOADS_DIR, { recursive: true });
                const baseName = sanitizeFilename(req.file.originalname || req.file.filename || "upload");
                const ext = mimeToExt(req.file.mimetype);
                let filename = baseName.endsWith(`.${ext}`) ? baseName : `${baseName}.${ext}`;

                // Ensure unique filename by appending timestamp if exists
                const existing = await UploadedFileModel.findOne({ bucket: "uploads", filename });
                if (existing) {
                    const namePart = filename.substring(0, filename.lastIndexOf("."));
                    const extPart = filename.substring(filename.lastIndexOf("."));
                    filename = `${namePart}-${Date.now()}${extPart}`;
                }

                const localPath = path.join(UPLOADS_DIR, filename);
                await fs.promises.writeFile(localPath, req.file.buffer);
                let cloudinaryUrl = "";
                let domainUrl = "";
                let publicId = baseName.replace(/\.[a-z0-9]+$/i, "");
                let format = ext;
                let resourceType = pickResourceType(req.file.mimetype);
                try {
                    const cloud = await cloudinarySignedUpload(req.file.buffer, filename, req.file.mimetype, { folder: String(req.query.folder || req.body?.folder || "uploads"), public_id: publicId, resource_type: resourceType });
                    cloudinaryUrl = String(cloud.secure_url || cloud.url || "");
                    publicId = String(cloud.public_id || publicId);
                    format = String(cloud.format || format);
                    resourceType = String(cloud.resource_type || resourceType);
                    domainUrl = buildDomainUrl(resourceType, publicId, format, req);
                } catch (e) {
                    cloudinaryUrl = "";
                    domainUrl = "";
                }
                const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || "").trim();
                const thumb = cloudName && resourceType === "image" ? `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_160,h_160/${publicId}.${format}` : "";
                const wRaw = Array.isArray(req.body?.width) ? req.body.width[0] : req.body?.width;
                const hRaw = Array.isArray(req.body?.height) ? req.body.height[0] : req.body?.height;
                const width = Math.max(0, parseInt(String(wRaw || "0"), 10) || 0);
                const height = Math.max(0, parseInt(String(hRaw || "0"), 10) || 0);
                const doc = await UploadedFileModel.create({ filename, mimetype: req.file.mimetype, size: req.file.size, width, height, localPath, cloudinaryPublicId: publicId, cloudinaryUrl, domainUrl, thumbnailUrl: thumb, resourceType });
                console.log(`[upload] saved ${filename} size=${req.file.size} local=${localPath} cloud=${cloudinaryUrl || "-"}`);
                res.json({ ok: true, id: String(doc._id), filename, mimetype: req.file.mimetype, size: req.file.size, width, height, localPath, cloudinaryUrl, domainUrl, thumbnailUrl: thumb, resourceType });
            } catch (error) {
                console.error("[upload] error", error?.message || error);
                res.status(500).json({ ok: false, error: error?.message || "Upload failed", code: "server_error" });
            }
        });
        app2.post("/images/upload", uploadLimiter, upload.single("file"), async (req, res) => {
            try {
                const token = String(req.headers["x-csrf-token"] || req.headers["X-CSRF-Token"] || "");
                const envToken = String(process.env.CSRF_TOKEN || process.env.CSRF_SECRET || "").trim();
                if (envToken && token !== envToken) return res.status(403).json({ ok: false, error: "CSRF validation failed", code: "csrf_failed" });
                if (!req.file) return res.status(400).json({ ok: false, error: "No file provided", code: "no_file" });
                const MAX_SIZE = 50 * 1024 * 1024;
                if (req.file.size > MAX_SIZE) return res.status(413).json({ ok: false, error: "File too large", code: "file_too_large", limit: MAX_SIZE });
                const allowed = [
                    "image/jpeg", "image/png", "image/webp", "image/gif",
                    "video/mp4", "video/webm", "video/ogg", "video/mpeg",
                    "application/pdf"
                ];
                if (!allowed.includes(req.file.mimetype)) return res.status(415).json({ ok: false, error: `Unsupported type: ${req.file.mimetype}`, code: "unsupported_type" });
                const scan = await maybeScan(req.file.buffer);
                if (!scan.ok) return res.status(400).json({ ok: false, error: scan.error || "Virus scan failed", code: "virus_detected" });
                const UPLOADS_DIR = path.resolve("uploads");
                fs.mkdirSync(UPLOADS_DIR, { recursive: true });
                const baseName = sanitizeFilename(req.file.originalname || req.file.filename || "upload");
                const ext = mimeToExt(req.file.mimetype);
                let filename = baseName.endsWith(`.${ext}`) ? baseName : `${baseName}.${ext}`;
                const existing = await UploadedFileModel.findOne({ bucket: "uploads", filename });
                if (existing) {
                    const namePart = filename.substring(0, filename.lastIndexOf("."));
                    const extPart = filename.substring(filename.lastIndexOf("."));
                    filename = `${namePart}-${Date.now()}${extPart}`;
                }
                const localPath = path.join(UPLOADS_DIR, filename);
                await fs.promises.writeFile(localPath, req.file.buffer);
                let cloudinaryUrl = "";
                let domainUrl = "";
                let publicId = baseName.replace(/\.[a-z0-9]+$/i, "");
                let format = ext;
                let resourceType = pickResourceType(req.file.mimetype);
                try {
                    const cloud = await cloudinarySignedUpload(req.file.buffer, filename, req.file.mimetype, { folder: String(req.query.folder || req.body?.folder || "uploads"), public_id: publicId, resource_type: resourceType });
                    cloudinaryUrl = String(cloud.secure_url || cloud.url || "");
                    publicId = String(cloud.public_id || publicId);
                    format = String(cloud.format || format);
                    resourceType = String(cloud.resource_type || resourceType);
                    domainUrl = buildDomainUrl(resourceType, publicId, format, req);
                } catch (e) {
                    cloudinaryUrl = "";
                    domainUrl = "";
                }
                const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || "").trim();
                const thumb = cloudName && resourceType === "image" ? `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_160,h_160/${publicId}.${format}` : "";
                const wRaw = Array.isArray(req.body?.width) ? req.body.width[0] : req.body?.width;
                const hRaw = Array.isArray(req.body?.height) ? req.body.height[0] : req.body?.height;
                const width = Math.max(0, parseInt(String(wRaw || "0"), 10) || 0);
                const height = Math.max(0, parseInt(String(hRaw || "0"), 10) || 0);
                const doc = await UploadedFileModel.create({ filename, mimetype: req.file.mimetype, size: req.file.size, width, height, localPath, cloudinaryPublicId: publicId, cloudinaryUrl, domainUrl, thumbnailUrl: thumb, resourceType });
                console.log(`[upload] saved ${filename} size=${req.file.size} local=${localPath} cloud=${cloudinaryUrl || "-"}`);
                res.json({ ok: true, id: String(doc._id), filename, mimetype: req.file.mimetype, size: req.file.size, width, height, localPath, cloudinaryUrl, domainUrl, thumbnailUrl: thumb, resourceType });
            } catch (error) {
                console.error("[upload] error", error?.message || error);
                res.status(500).json({ ok: false, error: error?.message || "Upload failed", code: "server_error" });
            }
        });
        app2.get("/api/files/test-list", async (_req, res) => {
            try {
                const UPLOADS_DIR = path.resolve("uploads");
                fs.mkdirSync(UPLOADS_DIR, { recursive: true });
                const files = await UploadedFileModel.find().sort({ createdAt: -1 }).lean();
                const localNames = await fs.promises.readdir(UPLOADS_DIR).catch(() => []);
                const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || "").trim();
                const items = files.map((f) => ({ filename: f.filename, mimetype: f.mimetype, size: f.size, localPath: f.localPath, cloudinaryUrl: f.cloudinaryUrl, domainUrl: f.domainUrl, thumbnailUrl: f.thumbnailUrl }));
                for (const name of localNames) {
                    if (!items.find((x) => x.filename === name)) {
                        const p = path.join(UPLOADS_DIR, name);
                        const stat = await fs.promises.stat(p).catch(() => null);
                        const ext = String(name).split(".").pop() || "";
                        const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
                        items.push({ filename: name, mimetype: isImg ? `image/${ext}` : "application/octet-stream", size: stat ? stat.size : 0, localPath: p, cloudinaryUrl: "", domainUrl: "", thumbnailUrl: isImg && cloudName ? `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_160,h_160/${sanitizeFilename(name).replace(/\.[a-z0-9]+$/i, "")}.${ext}` : "" });
                    }
                }
                res.json({ ok: true, count: items.length, items });
            } catch (error) {
                res.status(500).json({ ok: false, error: error?.message || "list_failed" });
            }
        });
        app2.get("/api/scrape/ranks", requireScraperAuth, scrapeLimiter, async (req, res) => {
            try {
                const ranks = await scrapeRanks();
                try { await storage.auditAdminAction("scrape_ranks", "-", req.user?.id || "", { count: Array.isArray(ranks) ? ranks.length : 0 }); } catch { }
                res.json(ranks);
            } catch (err) {
                res.status(500).json({
                    error: err.message || "Failed to scrape ranks",
                });
            }
        });

        app2.post("/api/scrape/validate-content", async (req, res) => {
            try {
                const htmlRaw = String(req.body?.html || "");
                const sanitized = htmlRaw
                    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
                    .replace(/on\w+="[^"]*"/gi, "")
                    .replace(/javascript:/gi, "");
                const styleColors = [];
                const regex = /style\s*=\s*"([^"]*)"/gi;
                let m;
                while ((m = regex.exec(sanitized))) {
                    const style = m[1];
                    const colorMatch = /color\s*:\s*([^;"]+)/gi.exec(style);
                    if (colorMatch && colorMatch[1]) {
                        const c = colorMatch[1].trim();
                        styleColors.push(c);
                    }
                }
                const uniqueColors = Array.from(new Set(styleColors));
                const tagCounts = {};
                (sanitized.match(/<([a-z0-9-]+)/gi) || []).forEach((t) => {
                    const k = t.replace(/[<\/>]/g, "").toLowerCase();
                    tagCounts[k] = (tagCounts[k] || 0) + 1;
                });
                res.json({
                    ok: true,
                    colors: uniqueColors,
                    tagCounts,
                    length: sanitized.length,
                });
            } catch (error) {
                res.status(500).json({ ok: false, error: error?.message || "validate_failed" });
            }
        });

        app2.post("/api/admin/scrape-full-pages", requireAuth, requireAdminOnly, async (req, res) => {
            console.log("[Route] Registered POST /api/admin/scrape-full-pages");
            try {
                const urls = Array.isArray(req.body?.urls) ? req.body.urls : [];
                if (urls.length === 0) return res.status(400).json({ error: "No URLs provided" });

                const results = [];
                for (const url of urls) {
                    try {
                        const data = await MirrorService.mirror(url);
                        results.push({
                            url,
                            status: 'completed',
                            title: data.title,
                            content: data.content,
                            excerpt: data.excerpt || (data.content ? data.content.replace(/<[^>]*>/g, '').substring(0, 250).trim() + "..." : ""),
                            keywords: data.keywords || [],
                            mainImage: data.mainImage || "",
                            contentLength: data.content?.length || 0,
                            pagesScraped: 1,
                            isFallback: !!data.isFallback
                        });
                    } catch (err) {
                        console.error(`Scrape error for ${url}:`, err.message);
                        results.push({ url, error: err.message, status: 'failed' });
                    }
                }

                res.json({ status: 'completed', pagesScraped: results.filter(r => r.status === 'completed').length, data: results });
            } catch (error) {
                console.error("Scraping endpoint error:", error.message);
                res.status(500).json({ error: error.message });
            }
        });

        // Admin: verify media configuration
        app2.get("/api/admin/media/config", requireAuth, async (req, res) => {
            try {
                const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || "").trim();
                const apiKey = String(process.env.CLOUDINARY_API_KEY || "").trim();
                const apiSecret = String(process.env.CLOUDINARY_API_SECRET || "").trim();
                const ok = Boolean(cloudName && apiKey && apiSecret);
                res.json({ ok, cloudName: cloudName ? "set" : "missing", apiKey: apiKey ? "set" : "missing", apiSecret: apiSecret ? "set" : "missing" });
            } catch (error) {
                res.status(500).json({ ok: false, error: error?.message || "config_error" });
            }
        });

        // Admin: list recent media uploads (from UploadedFileModel)
        app2.get("/api/admin/media", requireAuth, async (req, res) => {
            console.log("[Route] Registered GET /api/admin/media");
            try {
                const q = String(req.query.q || '').toLowerCase();
                const t = String(req.query.type || '').toLowerCase();
                const sort = String(req.query.sort || 'desc').toLowerCase();
                const docs = await UploadedFileModel.find({}).sort({ createdAt: sort === 'asc' ? 1 : -1 }).limit(1000).lean();
                let items = docs.map((d) => ({
                    public_id: String(d.cloudinaryPublicId || ''),
                    secure_url: String(d.cloudinaryUrl || ''),
                    domain_url: String(d.domainUrl || ''),
                    type: String(d.resourceType || 'auto'),
                    size: Number(d.size || 0) || 0,
                    created_at: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
                }));
                if (q) items = items.filter(i => (i.public_id || '').toLowerCase().includes(q) || (i.secure_url || '').toLowerCase().includes(q));
                if (t) items = items.filter(i => (i.type || '').toLowerCase().includes(t));
                res.json({ items });
            } catch (error) {
                res.status(500).json({ ok: false, error: error?.message || 'list_failed' });
            }
        });

        // Admin: audit UI changes (e.g., re-enabled buttons)
        app2.post("/api/admin/audit-ui", requireAuth, async (req, res) => {
            try {
                const adminId = req.user?.id || "";
                const action = String(req.body?.action || "");
                const component = String(req.body?.component || "");
                const details = req.body?.details || {};
                try { await storage.auditAdminAction("ui_change", component || "-", adminId, { action, ...details }); } catch { }
                res.json({ ok: true });
            } catch (error) {
                res.status(500).json({ ok: false, error: error?.message || "audit_failed" });
            }
        });
        app2.post("/api/admin/scrape-and-create-ranks", requireScraperAuth, scrapeLimiter, async (req, res) => {
            try {
                const ranks = await scrapeRanks();
                const created = [];
                for (const r of ranks) {
                    const payload = {
                        name: r.name,
                        image: r.image || "",
                        description: r.description || "",
                        requirements: r.requirements || "",
                    };
                    const exists = (await storage.getAllRanks()).find(
                        (x) => x.name === r.name,
                    );
                    if (!exists) {
                        const createdRank = await storage.createRank(payload);
                        created.push(createdRank);
                    }
                }
                try { await storage.auditAdminAction("scrape_and_create_ranks", "-", req.user?.id || "", { createdCount: created.length }); } catch { }
                res.json({
                    message: `Created ${created.length} ranks`,
                    count: created.length,
                    ranks: created,
                });
            } catch (err) {
                res.status(500).json({
                    error: err.message || "Failed to scrape and create ranks",
                });
            }
        });

        app2.post("/api/admin/reset-ranks", requireScraperAuth, scrapeLimiter, async (req, res) => {
            try {
                const existing = await storage.getAllRanks();
                for (const r of existing) {
                    await storage.deleteRank(r.id);
                }
                const ranks = await scrapeRanks();
                const created = [];
                for (const r of ranks) {
                    const payload = {
                        name: r.name,
                        image: r.image || "",
                        description: r.description || "",
                        requirements: r.requirements || "",
                    };
                    const createdRank = await storage.createRank(payload);
                    created.push(createdRank);
                }
                try { await storage.auditAdminAction("reset_ranks", "-", req.user?.id || "", { createdCount: created.length }); } catch { }
                res.json({
                    message: `Reset ranks and created ${created.length} new ranks`,
                    count: created.length,
                });
            } catch (err) {
                res.status(500).json({
                    error: err.message || "Failed to reset ranks",
                });
            }
        });
        app2.post("/api/scrape/multiple-events", async (req, res) => {
            console.log("[Route] Registered POST /api/scrape/multiple-events");
            try {
                const { urls } = req.body;
                if (!urls || !Array.isArray(urls))
                    return res
                        .status(400)
                        .json({ error: "URLs array is required" });
                const events = await scrapeMultipleEvents(urls);
                res.json(events);
            } catch (err) {
                res.status(500).json({
                    error: err.message || "Failed to scrape multiple events",
                });
            }
        });
    } catch (err) {
        console.warn("Scraper service not available:", err?.message || err);
    }
    // Restoration & Admin Management Endpoints
    app2.post(
        "/api/admin/restore-events",
        requireAuth,
        requireSuperAdmin,
        async (req, res) => {
            try {
                console.log(
                    "🔄 Starting event restoration from admin panel...",
                );
                // Import restoration script
                const restoreModule = await import("./restore-events.js");
                const restoreEvents = restoreModule.default;

                if (restoreEvents && typeof restoreEvents === "function") {
                    await restoreEvents({ closeConnection: false });
                    res.json({
                        success: true,
                        message: "✅ Events and graves restored successfully!",
                        details:
                            "All historical events and zombie modes have been restored to the database.",
                    });
                } else {
                    throw new Error("Restoration function not found");
                }
            } catch (error) {
                console.error("❌ Restoration failed:", error.message);
                res.status(500).json({
                    success: false,
                    error: error.message,
                    message: "Failed to restore events",
                });
            }
        },
    );

    app2.get(
        "/api/admin/verify-restoration",
        requireAuth,
        requireSuperAdmin,
        async (req, res) => {
            try {
                const eventCount = await EventModel.countDocuments();
                const modeCount = await ModeModel.countDocuments();
                const graveModes = await ModeModel.find({
                    name: {
                        $regex: /zombie|grave|evil den|metal rage|forbidden zone/i,
                    },
                }).lean();

                const eventTypes = await EventModel.distinct("type");
                const recentEvents = await EventModel.find({})
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .lean();

                res.json({
                    success: true,
                    database: {
                        events: eventCount,
                        modes: modeCount,
                        graveModes: graveModes.length,
                        eventTypes: eventTypes,
                    },
                    graveModesRestored: graveModes.map((m) => m.name),
                    recentEvents: recentEvents.map((e) => ({
                        id: String(e._id),
                        title: e.title,
                        type: e.type,
                        date: e.date,
                    })),
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message,
                });
            }
        },
    );

    // Mercenary API routes
    app2.get("/api/mercenaries", async (req, res) => {
        try {
            const mercenaries = await storage.getAllMercenaries();
            res.json(mercenaries);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.get("/api/mercenaries/:id", async (req, res) => {
        try {
            const mercenaries = await storage.getAllMercenaries();
            const merc = mercenaries.find(m => String(m.id || m._id) === req.params.id);
            if (!merc) {
                return res.status(404).json({ error: "Mercenary not found" });
            }
            res.json(merc);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.post("/api/mercenaries", requireAuth, async (req, res) => {
        try {
            const { name, image, role, description, voiceLines, order } = req.body;
            if (!name || !image || !role) {
                return res.status(400).json({ error: "name, image, and role required" });
            }
            const merc = await storage.createMercenary({
                name,
                image,
                role,
                description: description || "",
                voiceLines: Array.isArray(voiceLines) ? voiceLines.filter((url) => url.trim() !== "") : [],
                order: typeof order === "number" ? order : (typeof order === "string" && order.trim() ? parseInt(order.trim(), 10) : undefined),
            });
            res.status(201).json(merc);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    app2.patch("/api/mercenaries/:id", requireAuth, async (req, res) => {
        try {
            const { name, image, role, description, voiceLines, order } = req.body;
            const merc = await storage.updateMercenary(req.params.id, {
                id: req.params.id,
                name,
                image,
                role,
                description: description || "",
                voiceLines: Array.isArray(voiceLines) ? voiceLines.filter((url) => url.trim() !== "") : [],
                order: typeof order === "number" ? order : (typeof order === "string" && order.trim() ? parseInt(order.trim(), 10) : undefined),
            });
            if (!merc) {
                return res.status(404).json({ error: "Mercenary not found" });
            }
            res.json(merc);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    app2.delete("/api/mercenaries/:id", requireAuth, async (req, res) => {
        try {
            const deleted = await storage.deleteMercenary(req.params.id);
            if (!deleted) {
                return res.status(404).json({ error: "Mercenary not found" });
            }
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.get("/api/sellers", async (req, res) => {
        try {
            const sellers = await storage.getAllSellers();
            res.json(sellers);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.get("/api/sellers/:id", async (req, res) => {
        try {
            const seller = await storage.getSellerById(req.params.id);
            if (!seller) {
                return res.status(404).json({ error: "Seller not found" });
            }
            res.json(seller);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.post("/api/sellers", requireAuth, async (req, res) => {
        try {
            const data = insertSellerSchema.parse(req.body);
            const seller = await storage.createSeller(data);
            res.json(seller);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.patch("/api/sellers/:id", requireAuth, requireSellerEditPermission, async (req, res) => {
        try {
            const data = insertSellerSchema.partial().parse(req.body);
            stripOrderingFields(data, req.user?.role || "");
            const seller = await storage.updateSeller(req.params.id, data);
            if (!seller) {
                return res.status(404).json({ error: "Seller not found" });
            }
            res.json(seller);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.delete("/api/sellers/:id", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const success = await storage.deleteSeller(req.params.id);
            if (!success) {
                return res.status(404).json({ error: "Seller not found" });
            }
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.get("/api/sellers/:id/reviews", async (req, res) => {
        try {
            const reviews = await storage.getSellerReviews(req.params.id);
            res.json(reviews);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    const reviewLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false });
    app2.post("/api/sellers/:id/reviews", reviewLimiter, requireAuth, async (req, res) => {
        try {
            const payload = insertSellerReviewSchema.parse({
                ...req.body,
                sellerId: req.params.id,
                userId: req.user?.id || "",
            });
            let existing = null;
            if (payload.userId) {
                existing = await SellerReviewModel.findOne({ sellerId: payload.sellerId, userId: payload.userId });
            } else if (payload.userPhone) {
                existing = await SellerReviewModel.findOne({ sellerId: payload.sellerId, phoneLast4: maskLast4(payload.userPhone) });
            } else {
                existing = await SellerReviewModel.findOne({ sellerId: payload.sellerId, userName: payload.userName });
            }
            if (existing) {
                return res.status(409).json({ error: "You have already submitted a review for this seller." });
            }
            const review = await storage.createSellerReview(payload);
            res.json(review);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.get("/api/reviews/seller/by-name/:sellerName", async (req, res) => {
        try {
            const raw = req.params.sellerName;
            const sellerName = sanitizeSellerNameParam(raw);
            if (!sellerName) {
                await storage.logUrlMatchFailure("seller", raw || "");
                return res.status(404).json({ error: "Seller not found" });
            }
            const seller = await storage.getSellerByExactName(sellerName);
            if (!seller) {
                await storage.logUrlMatchFailure("seller", sellerName);
                return res.status(404).json({ error: "Seller not found" });
            }
            const page = parseInt(String(req.query.page || "1"), 10) || 1;
            const pageSize = 20;
            const sortOpt = String(req.query.sort || "newest");
            let sort = { createdAt: -1 };
            if (sortOpt === "highest") sort = { rating: -1, createdAt: -1 };
            if (sortOpt === "helpful") sort = { helpfulVotes: -1, createdAt: -1 };
            const q = SellerReviewModel.find({ sellerId: seller.id }).sort(sort);
            const total = await SellerReviewModel.countDocuments({ sellerId: seller.id });
            const items = await q.skip((page - 1) * pageSize).limit(pageSize).lean();
            const reviews = items.map((r) => ({ id: String(r._id), userName: r.userName, rating: r.rating, comment: r.comment || "", createdAt: r.createdAt, helpfulVotes: r.helpfulVotes || 0 }));
            res.json({ seller: { id: seller.id, name: seller.name, verified: !!seller.verified, averageRating: seller.averageRating || 0, totalReviews: seller.totalReviews || 0 }, reviews, pageInfo: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.get("/api/reviews/seller/by-slug/:slug", async (req, res) => {
        try {
            const raw = req.params.slug;
            const slug = String(raw || "").trim().toLowerCase();
            if (!slug) {
                await storage.logUrlMatchFailure("seller_slug", raw || "");
                return res.status(404).json({ error: "Seller not found" });
            }
            const seller = await storage.getSellerBySlug(slug);
            if (!seller) {
                await storage.logUrlMatchFailure("seller_slug", slug);
                return res.status(404).json({ error: "Seller not found" });
            }
            const page = parseInt(String(req.query.page || "1"), 10) || 1;
            const pageSize = 20;
            const sortOpt = String(req.query.sort || "newest");
            let sort = { createdAt: -1 };
            if (sortOpt === "highest") sort = { rating: -1, createdAt: -1 };
            if (sortOpt === "helpful") sort = { helpfulVotes: -1, createdAt: -1 };
            const q = SellerReviewModel.find({ sellerId: seller.id }).sort(sort);
            const total = await SellerReviewModel.countDocuments({ sellerId: seller.id });
            const items = await q.skip((page - 1) * pageSize).limit(pageSize).lean();
            const reviews = items.map((r) => ({ id: String(r._id), userName: r.userName, rating: r.rating, comment: r.comment || "", createdAt: r.createdAt, helpfulVotes: r.helpfulVotes || 0 }));
            res.json({ seller: { id: seller.id, name: seller.name, verified: !!seller.verified, images: seller.images || [], description: seller.description || "", averageRating: seller.averageRating || 0, totalReviews: seller.totalReviews || 0 }, reviews, pageInfo: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.get("/api/sellers/slug/:slug", async (req, res) => {
        try {
            const seller = await storage.getSellerBySlug(String(req.params.slug || "").trim().toLowerCase());
            if (!seller) {
                await storage.logUrlMatchFailure("seller_slug", req.params.slug || "");
                return res.status(404).json({ error: "Seller not found" });
            }
            res.json(seller);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.get("/api/security/csrf-token", (_req, res) => {
        const envToken = String(process.env.CSRF_TOKEN || process.env.CSRF_SECRET || "").trim();
        const token = envToken || `cf-${Math.random().toString(36).slice(2)}`;
        res.json({ csrfToken: token });
    });

    app2.get("/api/admin/reviews", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const cc = String(req.query.countryCode || "").trim();
            const verified = String(req.query.verified || "").trim();
            const start = String(req.query.startDate || "").trim();
            const end = String(req.query.endDate || "").trim();
            const sellerId = String(req.query.sellerId || "").trim();
            const filter = {};
            if (cc) filter.phoneCountryCode = cc;
            if (verified === "true") filter.phoneVerified = true;
            if (verified === "false") filter.phoneVerified = false;
            if (sellerId) filter.sellerId = sellerId;
            const range = {};
            if (start) range.$gte = new Date(start);
            if (end) range.$lte = new Date(end);
            if (Object.keys(range).length) filter.createdAt = range;
            const rows = await SellerReviewModel.find(filter).sort({ createdAt: -1 }).limit(200).lean();
            const out = rows.map((r) => ({ id: String(r._id), sellerId: r.sellerId, userName: r.userName, phoneMasked: r.phoneLast4 ? `****${r.phoneLast4}` : "", phoneCountryCode: r.phoneCountryCode || "", phoneVerified: !!r.phoneVerified, rating: r.rating, createdAt: r.createdAt }));
            res.json(out);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.get("/api/admin/admins", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const admins = await storage.getAllAdmins(req.query);
            res.json(admins);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.post("/api/admin/admins", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const data = insertAdminSchema.parse(req.body);
            const { username, password } = data;
            const exists = await storage.getAdminByUsername(username);
            if (exists) return res.status(400).json({ error: "Username already exists" });
            const hashed = await hashPassword(password);
            const created = await storage.createAdmin({
                ...data,
                password: hashed,
            });
            try {
                const adminId = req.user?.id || "";
                await storage.auditAdminAction("create_admin", String(created.id || created._id || username), adminId, { username });
            } catch { }
            res.status(201).json(created);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    app2.patch("/api/admin/admins/:id", requireAuth, async (req, res) => {
        try {
            const id = req.params.id;
            const isSelf = (req.user?.id || "") === id;
            const isSuper = (req.user?.role || "") === "super_admin";
            if (!isSelf && !isSuper) return res.status(403).json({ error: "Forbidden" });
            const body = req.body || {};
            const updates = { ...body };
            if (updates.password) {
                updates.password = await hashPassword(String(updates.password));
            }
            const updated = await storage.updateAdmin(id, updates);
            if (!updated) return res.status(404).json({ error: "Admin not found" });
            try {
                const adminId = req.user?.id || "";
                await storage.auditAdminAction("update_admin", id, adminId, { updates: Object.keys(updates) });
            } catch { }
            res.json(updated);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    app2.delete("/api/admin/admins/:id", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const ok = await storage.deleteAdmin(req.params.id);
            if (!ok) return res.status(404).json({ error: "Admin not found" });
            try {
                const adminId = req.user?.id || "";
                await storage.auditAdminAction("delete_admin", req.params.id, adminId, {});
            } catch { }
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.get("/api/admin/admins/:id/logs", requireAuth, async (req, res) => {
        try {
            const id = req.params.id;
            const isSelf = (req.user?.id || "") === id;
            const isSuper = (req.user?.role || "") === "super_admin";
            if (!isSelf && !isSuper) return res.status(403).json({ error: "Forbidden" });
            const logs = await AdminAuditLogModel.find({ adminId: id }).sort({ createdAt: -1 }).lean();
            res.json(logs.map(l => ({ id: String(l._id), ...l })));
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.patch("/api/admin/reviews/:id/verify-phone", requireAuth, requireSuperAdmin, requireCsrf, async (req, res) => {
        try {
            const { id } = req.params;
            const upd = await SellerReviewModel.findByIdAndUpdate(id, { phoneVerified: true }, { new: true }).lean();
            if (!upd) return res.status(404).json({ error: "Review not found" });
            const adminId = req.user?.id || "";
            await storage.auditAdminAction("verify_phone", id, adminId, {});
            res.json({ id: String(upd._id), phoneVerified: !!upd.phoneVerified });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    app2.patch("/api/admin/reviews/:id/anonymize-phone", requireAuth, requireSuperAdmin, requireCsrf, async (req, res) => {
        try {
            const { id } = req.params;
            const upd = await SellerReviewModel.findByIdAndUpdate(id, { userPhoneEncrypted: "", phoneLast4: "", phoneCountryCode: "", phoneVerified: false }, { new: true }).lean();
            if (!upd) return res.status(404).json({ error: "Review not found" });
            const adminId = req.user?.id || "";
            await storage.auditAdminAction("anonymize_phone", id, adminId, {});
            res.json({ id: String(upd._id), phoneMasked: "", phoneVerified: false });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    app2.get("/api/admin/reviews/:id/phone", requireAuth, requireSuperAdmin, requireCsrf, async (req, res) => {
        try {
            const { id } = req.params;
            const rev = await SellerReviewModel.findById(id).lean();
            if (!rev) return res.status(404).json({ error: "Review not found" });
            const enc = rev.userPhoneEncrypted || "";
            const key = process.env.PHONE_ENC_KEY || "";
            if (!enc || !key) return res.status(400).json({ error: "Phone not available" });
            const phone = decryptPhoneNumber(enc);
            const adminId = req.user?.id || "";
            await storage.auditAdminAction("reveal_phone", id, adminId, { sellerId: rev.sellerId });
            res.json({ phone, countryCode: rev.phoneCountryCode || "", last4: rev.phoneLast4 || "" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.get("/api/admin/reviews/backup", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const rows = await SellerReviewModel.find().sort({ createdAt: -1 }).lean();
            const out = rows.map((r) => ({ id: String(r._id), sellerId: r.sellerId, userName: r.userName, rating: r.rating, comment: r.comment || "", createdAt: r.createdAt }));
            res.json({ count: out.length, reviews: out });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.post("/api/admin/images/process", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const dry = String((req.query?.dryRun || "")).toLowerCase() === "true";
            const processedItems = [];
            let processed = 0;
            const fixUrl = (u) => {
                if (!u) return u;
                let s = String(u).trim();
                if (s.startsWith("http://")) s = "https://" + s.substring(7);
                return s;
            };
            const newsItems = await NewsModel.find().lean();
            for (const n of newsItems) {
                const set = {};
                const img = fixUrl(n.image || "");
                if (img && img !== n.image) set.image = img;
                const og = fixUrl(n.ogImage || "");
                if (og && og !== n.ogImage) set.ogImage = og;
                const tw = fixUrl(n.twitterImage || "");
                if (tw && tw !== n.twitterImage) set.twitterImage = tw;
                if (Object.keys(set).length) {
                    processed++;
                    processedItems.push({ type: "news", id: String(n._id), changes: Object.keys(set) });
                    if (!dry) await NewsModel.updateOne({ _id: n._id }, { $set: set });
                }
            }
            res.json({ processed, items: processedItems, dryRun: dry });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.delete("/api/sellers/:id/reviews/:reviewId", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const { id, reviewId } = req.params;
            const success = await storage.deleteSellerReview(id, reviewId);
            if (!success) {
                return res.status(404).json({ error: "Review not found" });
            }
            const adminId = req.user?.id || "";
            await storage.auditAdminAction("delete_review", reviewId, adminId, { sellerId: id });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Chat Admin Routes
    app2.get("/api/admin/chat/users", requireAuth, requireSuperAdmin, async (_req, res) => {
        try {
            const users = await ChatUserModel.find().sort({ createdAt: -1 }).lean();
            res.json(users.map(u => ({ id: String(u._id), userName: u.userName, phone: u.phone || "", verified: !!u.verified, createdAt: u.createdAt })));
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.get("/api/public/settings/review-verification", async (_req, res) => {
        try {
            const settings = await storage.getSiteSettings();
            res.json({
                reviewVerificationEnabled: !!settings.reviewVerificationEnabled,
                reviewVerificationVideoUrl: settings.reviewVerificationVideoUrl || "",
                reviewVerificationTimecode: settings.reviewVerificationTimecode || "",
                reviewVerificationPrompt: settings.reviewVerificationPrompt || "",
                reviewVerificationYouTubeChannelUrl: settings.reviewVerificationYouTubeChannelUrl || "",
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.post("/api/admin/chat/registration", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const { enabled } = req.body || {};
            const updated = await ChatSettingsModel.findOneAndUpdate(
                { name: "chat" },
                { registrationEnabled: !!enabled, updatedAt: new Date() },
                { upsert: true, new: true }
            ).lean();
            res.json({ enabled: !!updated.registrationEnabled, message: updated.registrationEnabled ? "Chat registration opened" : "Chat registration closed" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.post("/api/admin/chat/users/:id/verify", requireAuth, requireSuperAdmin, async (req, res) => {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { id } = req.params;
            const upd = await ChatUserModel.findByIdAndUpdate(id, { verified: true }, { new: true, session }).lean();
            if (!upd) {
                await session.abortTransaction();
                return res.status(404).json({ error: "User not found" });
            }
            await session.commitTransaction();
            res.json({ id: String(upd._id), verified: !!upd.verified });
        } catch (error) {
            await session.abortTransaction();
            res.status(500).json({ error: error.message });
        } finally {
            session.endSession();
        }
    });

    app2.delete("/api/admin/chat/users/:id", requireAuth, requireSuperAdmin, async (req, res) => {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { id } = req.params;
            const del = await ChatUserModel.findByIdAndDelete(id, { session }).lean();
            if (!del) {
                await session.abortTransaction();
                return res.status(404).json({ error: "User not found" });
            }
            await session.commitTransaction();
            res.json({ success: true });
        } catch (error) {
            await session.abortTransaction();
            res.status(500).json({ error: error.message });
        } finally {
            session.endSession();
        }
    });

    // Site Settings Routes
    app2.get("/api/settings/site", async (_req, res) => {
        try {
            const s = await SiteSettingsModel.findOne().lean();
            res.json(s || {});
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.put("/api/settings/site", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const body = req.body || {};
            const payload = {
                publicBaseUrl: String(body.publicBaseUrl || ""),
                seoTitle: String(body.seoTitle || ""),
                seoDescription: String(body.seoDescription || ""),
                seoKeywords: Array.isArray(body.seoKeywords) ? body.seoKeywords.map((k) => String(k)) : (body.seoKeywords ? String(body.seoKeywords).split(',').map((s) => s.trim()).filter(Boolean) : []),
                seoOgImage: String(body.seoOgImage || ""),
                backgroundImageUrl: String(body.backgroundImageUrl || ""),
                robots: String(body.robots || "index, follow"),
                announcementsEnabled: body.announcementsEnabled === false ? false : !!body.announcementsEnabled,
            };
            res.json({
                backgroundImageUrl: s?.backgroundImageUrl || "",
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.get("/api/public/settings/seo", async (_req, res) => {
        try {
            const s = await SiteSettingsModel.findOne().lean();
            const outBase = String(s?.publicBaseUrl || process.env.PUBLIC_BASE_URL || "https://crossfire.wiki").replace(/\/$/, "");
            res.json({
                publicBaseUrl: outBase,
                contentHtmlEn: doc?.contentHtmlEn || "",
                contentHtmlAr: doc?.contentHtmlAr || "",
            const contentHtmlEn = String(req.body?.contentHtmlEn || "");
            const contentHtmlAr = String(req.body?.contentHtmlAr || "");
                contentHtml: String(req.body?.contentHtml || contentHtmlEn || contentHtmlAr || ""),
                contentHtmlEn,
                contentHtmlAr,
                contentHtmlEn: updated.contentHtmlEn || "",
                contentHtmlAr: updated.contentHtmlAr || "",
                contentHtmlEn: doc.contentHtmlEn || "",
                contentHtmlAr: doc.contentHtmlAr || "",
            const contentHtmlEn = String(req.body?.contentHtmlEn || "");
            const contentHtmlAr = String(req.body?.contentHtmlAr || "");
                contentHtml: String(req.body?.contentHtml || contentHtmlEn || contentHtmlAr || ""),
                contentHtmlEn,
                contentHtmlAr,
                contentHtmlEn: updated.contentHtmlEn || "",
                contentHtmlAr: updated.contentHtmlAr || "",
            const out = docs.map((d) => ({ id: String(d._id), contentHtml: d.contentHtml || "", contentHtmlEn: d.contentHtmlEn || "", contentHtmlAr: d.contentHtmlAr || "", imageUrl: d.imageUrl || "", linkUrl: d.linkUrl || "", active: d.active ?? true, dismissible: d.dismissible !== false, updatedAt: d.updatedAt }));
            const contentHtmlEn = String(req.body?.contentHtmlEn || "");
            const contentHtmlAr = String(req.body?.contentHtmlAr || "");
                contentHtml: String(req.body?.contentHtml || contentHtmlEn || contentHtmlAr || ""),
                contentHtmlEn,
                contentHtmlAr,
            res.status(201).json({ id: String(lean._id), contentHtml: lean.contentHtml || "", contentHtmlEn: lean.contentHtmlEn || "", contentHtmlAr: lean.contentHtmlAr || "", imageUrl: lean.imageUrl || "", linkUrl: lean.linkUrl || "", active: lean.active ?? true, dismissible: lean.dismissible !== false, direction: lean.direction || 'auto', updatedAt: lean.updatedAt });
            const out = docs.map((d) => ({ id: String(d._id), sellerSlug: d.sellerSlug, contentHtml: d.contentHtml || "", contentHtmlEn: d.contentHtmlEn || "", contentHtmlAr: d.contentHtmlAr || "", imageUrl: d.imageUrl || "", linkUrl: d.linkUrl || "", active: d.active ?? true, updatedAt: d.updatedAt }));
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

            const contentHtmlEn = String(req.body?.contentHtmlEn || "");
            const contentHtmlAr = String(req.body?.contentHtmlAr || "");
                contentHtml: String(req.body?.contentHtml || contentHtmlEn || contentHtmlAr || ""),
                contentHtmlEn,
                contentHtmlAr,
            res.status(201).json({ id: String(updated._id), sellerSlug: slug, contentHtml: updated.contentHtml || "", contentHtmlEn: updated.contentHtmlEn || "", contentHtmlAr: updated.contentHtmlAr || "", imageUrl: updated.imageUrl || "", linkUrl: updated.linkUrl || "", active: !!updated.active, direction: updated.direction || 'auto', updatedAt: updated.updatedAt });
            const s = await SiteSettingsModel.findOne().lean();
            res.json({ enabled: s?.announcementsEnabled !== false });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Announcements: Global
    app2.get("/api/announcements/global", async (_req, res) => {
        try {
            const doc = await GlobalAnnouncementModel.findOne().sort({ updatedAt: -1 }).lean();
            res.json({
                contentHtml: doc?.contentHtml || "",
                imageUrl: doc?.imageUrl || "",
                linkUrl: doc?.linkUrl || "",
                active: doc?.active ?? true,
                dismissible: doc?.dismissible ?? true,
                direction: doc?.direction || "auto",
                updatedAt: doc?.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date(0).toISOString()
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.put("/api/announcements/global", requireAuth, requireSuperAdmin, requireCsrf, async (req, res) => {
        try {
            const payload = {
                contentHtml: String(req.body?.contentHtml || ""),
                imageUrl: String(req.body?.imageUrl || ""),
                linkUrl: String(req.body?.linkUrl || ""),
                active: !!req.body?.active,
                dismissible: req.body?.dismissible === false ? false : true,
                direction: (req.body?.direction === 'rtl' || req.body?.direction === 'ltr') ? req.body.direction : 'auto',
            };
            const updated = await GlobalAnnouncementModel.findOneAndUpdate(
                {},
                payload,
                { upsert: true, new: true }
            ).lean();
            res.json({
                contentHtml: updated.contentHtml || "",
                imageUrl: updated.imageUrl || "",
                linkUrl: updated.linkUrl || "",
                active: !!updated.active,
                dismissible: updated.dismissible !== false,
                direction: updated.direction || 'auto',
                updatedAt: updated.updatedAt ? new Date(updated.updatedAt).toISOString() : new Date().toISOString()
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    // Announcements: Seller-scoped
    app2.get("/api/announcements/seller/:slug", async (req, res) => {
        try {
            const slug = String(req.params.slug || "").trim().toLowerCase();
            if (!slug) return res.status(400).json({ error: "Missing seller slug" });
            const doc = await SellerAnnouncementModel.findOne({ sellerSlug: slug }).lean();
            if (!doc) return res.status(404).json({ error: "Announcement not found" });
            res.json({
                contentHtml: doc.contentHtml || "",
                imageUrl: doc.imageUrl || "",
                linkUrl: doc.linkUrl || "",
                active: doc.active ?? true,
                direction: doc.direction || 'auto',
                updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date(0).toISOString()
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.put("/api/announcements/seller/:slug", requireAuth, requireSuperAdmin, requireCsrf, async (req, res) => {
        try {
            const slug = String(req.params.slug || "").trim().toLowerCase();
            if (!slug) return res.status(400).json({ error: "Missing seller slug" });
            // Prevent image duplication from seller's own images
            try {
                const imageUrl = String(req.body?.imageUrl || "").trim();
                if (imageUrl) {
                    const sellerDoc = await SellerModel.findOne({ seller_name_slug: slug }).lean();
                    const images = sellerDoc?.images || [];
                    if (images.includes(imageUrl)) {
                        return res.status(400).json({ error: "Image duplicates seller page image" });
                    }
                }
            } catch { }
            const payload = {
                sellerSlug: slug,
                contentHtml: String(req.body?.contentHtml || ""),
                imageUrl: String(req.body?.imageUrl || ""),
                linkUrl: String(req.body?.linkUrl || ""),
                active: !!req.body?.active,
                direction: (req.body?.direction === 'rtl' || req.body?.direction === 'ltr') ? req.body.direction : 'auto',
            };
            const updated = await SellerAnnouncementModel.findOneAndUpdate(
                { sellerSlug: slug },
                payload,
                { upsert: true, new: true }
            ).lean();
            try { await storage.auditAdminAction("seller_announcement_update", slug, req.user?.id || "", { active: !!updated.active }); } catch { }
            res.json({
                contentHtml: updated.contentHtml || "",
                imageUrl: updated.imageUrl || "",
                linkUrl: updated.linkUrl || "",
                active: !!updated.active,
                direction: updated.direction || 'auto',
                updatedAt: updated.updatedAt ? new Date(updated.updatedAt).toISOString() : new Date().toISOString()
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    // Announcements: Admin CRUD endpoints
    app2.get("/api/admin/announcements/global", requireAuth, requireSuperAdmin, async (_req, res) => {
        try {
            const docs = await GlobalAnnouncementModel.find().sort({ updatedAt: -1 }).lean();
            const out = docs.map((d) => ({ id: String(d._id), contentHtml: d.contentHtml || "", imageUrl: d.imageUrl || "", linkUrl: d.linkUrl || "", active: d.active ?? true, dismissible: d.dismissible !== false, updatedAt: d.updatedAt }));
            res.json(out);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.post("/api/announcements/global", requireAuth, requireSuperAdmin, requireCsrf, async (req, res) => {
        try {
            const payload = {
                contentHtml: String(req.body?.contentHtml || ""),
                imageUrl: String(req.body?.imageUrl || ""),
                linkUrl: String(req.body?.linkUrl || ""),
                active: !!req.body?.active,
                dismissible: req.body?.dismissible === false ? false : true,
                direction: (req.body?.direction === 'rtl' || req.body?.direction === 'ltr') ? req.body.direction : 'auto',
            };
            const created = await GlobalAnnouncementModel.create(payload);
            const lean = await GlobalAnnouncementModel.findById(created._id).lean();
            try { await storage.auditAdminAction("global_announcement_create", String(created._id), req.user?.id || "", {}); } catch { }
            res.status(201).json({ id: String(lean._id), contentHtml: lean.contentHtml || "", imageUrl: lean.imageUrl || "", linkUrl: lean.linkUrl || "", active: lean.active ?? true, dismissible: lean.dismissible !== false, direction: lean.direction || 'auto', updatedAt: lean.updatedAt });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    app2.delete("/api/announcements/global/:id", requireAuth, requireSuperAdmin, requireCsrf, async (req, res) => {
        try {
            const { id } = req.params;
            const ok = await GlobalAnnouncementModel.findByIdAndDelete(id);
            if (!ok) return res.status(404).json({ error: "Announcement not found" });
            try { await storage.auditAdminAction("global_announcement_delete", id, req.user?.id || "", {}); } catch { }
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.get("/api/admin/announcements/seller", requireAuth, requireSuperAdmin, async (_req, res) => {
        try {
            const docs = await SellerAnnouncementModel.find().sort({ updatedAt: -1 }).lean();
            const out = docs.map((d) => ({ id: String(d._id), sellerSlug: d.sellerSlug, contentHtml: d.contentHtml || "", imageUrl: d.imageUrl || "", linkUrl: d.linkUrl || "", active: d.active ?? true, updatedAt: d.updatedAt }));
            res.json(out);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.post("/api/announcements/seller/:slug", requireAuth, requireSuperAdmin, requireCsrf, async (req, res) => {
        try {
            const slug = String(req.params.slug || "").trim().toLowerCase();
            if (!slug) return res.status(400).json({ error: "Missing seller slug" });
            const payload = {
                sellerSlug: slug,
                contentHtml: String(req.body?.contentHtml || ""),
                imageUrl: String(req.body?.imageUrl || ""),
                linkUrl: String(req.body?.linkUrl || ""),
                active: !!req.body?.active,
                direction: (req.body?.direction === 'rtl' || req.body?.direction === 'ltr') ? req.body.direction : 'auto',
            };
            // Prevent image duplication from seller's own images
            try {
                const imageUrl = payload.imageUrl.trim();
                if (imageUrl) {
                    const sellerDoc = await SellerModel.findOne({ seller_name_slug: slug }).lean();
                    const images = sellerDoc?.images || [];
                    if (images.includes(imageUrl)) {
                        return res.status(400).json({ error: "Image duplicates seller page image" });
                    }
                }
            } catch { }
            const updated = await SellerAnnouncementModel.findOneAndUpdate(
                { sellerSlug: slug },
                payload,
                { upsert: true, new: true }
            ).lean();
            try { await storage.auditAdminAction("seller_announcement_create_or_update", slug, req.user?.id || "", { active: !!updated.active }); } catch { }
            res.status(201).json({ id: String(updated._id), sellerSlug: slug, contentHtml: updated.contentHtml || "", imageUrl: updated.imageUrl || "", linkUrl: updated.linkUrl || "", active: !!updated.active, direction: updated.direction || 'auto', updatedAt: updated.updatedAt });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    app2.get("/api/seller-pages/:slug", async (req, res) => {
        try {
            const slug = String(req.params.slug || "").trim().toLowerCase();
            if (!slug) return res.status(400).json({ error: "Missing seller slug" });
            const doc = await SellerPageModel.findOne({ sellerSlug: slug }).lean();
            if (!doc) return res.json({ sellerSlug: slug, images: [], descriptionHtml: "", blocks: [] });
            const images = doc.images || [];
            const descriptionHtml = doc.descriptionHtml || "";
            let blocks = Array.isArray(doc.blocks) ? doc.blocks : [];
            if ((!blocks || blocks.length === 0) && images.length > 0) {
                blocks = images.map((img) => ({ image: img, contentHtml: "", description: "" }));
            }
            res.json({ sellerSlug: slug, images, descriptionHtml, blocks });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.patch("/api/seller-pages/:slug", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const slug = String(req.params.slug || "").trim().toLowerCase();
            if (!slug) return res.status(400).json({ error: "Missing seller slug" });
            const images = Array.isArray(req.body?.images) ? req.body.images.filter((s) => !!String(s).trim()) : undefined;
            const descriptionHtml = typeof req.body?.descriptionHtml === "string" ? String(req.body.descriptionHtml) : undefined;
            const blocks = Array.isArray(req.body?.blocks)
                ? req.body.blocks
                    .map((b) => ({
                        image: String(b?.image || ""),
                        contentHtml: String(b?.contentHtml || ""),
                        description: String(b?.description || ""),
                    }))
                : undefined;
            const update = { sellerSlug: slug };
            if (images !== undefined) update.images = images;
            if (descriptionHtml !== undefined) update.descriptionHtml = descriptionHtml;
            if (blocks !== undefined) update.blocks = blocks;

    app2.get("/api/admin/custom-pages", requireAuth, requireSuperAdmin, async (_req, res) => {
        try {
            const pages = await CustomPageModel.find().sort({ updatedAt: -1 }).lean();
            res.json(pages.map((page) => ({ ...page, id: String(page._id) })));
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.post("/api/admin/custom-pages", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const sourceUrl = String(req.body?.sourceUrl || "").trim();
            const inputSlug = String(req.body?.slug || "").trim();
            if (!sourceUrl) return res.status(400).json({ error: "sourceUrl is required" });
            const mirrored = await MirrorService.mirror(sourceUrl);
            const htmlContent = String(mirrored.rawHtml || mirrored.content || "");
            const title = String(req.body?.title || mirrored.title || "").trim() || "Custom Page";
            const slug = slugifyEventName(inputSlug || title);
            if (!slug) return res.status(400).json({ error: "Valid slug is required" });
            const exists = await CustomPageModel.findOne({ slug }).lean();
            if (exists) return res.status(409).json({ error: "Slug already exists" });
            const derived = deriveSeoFromHtml(htmlContent, title);
            const doc = await CustomPageModel.create({
                slug,
                title,
                sourceUrl,
                htmlContent,
                seoTitle: String(req.body?.seoTitle || derived.seoTitle || ""),
                seoDescription: String(req.body?.seoDescription || derived.seoDescription || ""),
                seoKeywords: Array.isArray(req.body?.seoKeywords) ? req.body.seoKeywords : derived.seoKeywords,
                ogImage: String(req.body?.ogImage || derived.ogImage || ""),
                active: req.body?.active === undefined ? true : !!req.body.active,
            });
            res.status(201).json({ ...doc.toObject(), id: String(doc._id) });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.get("/api/admin/custom-pages/:id", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const page = await CustomPageModel.findById(req.params.id).lean();
            if (!page) return res.status(404).json({ error: "Custom page not found" });
            res.json({ ...page, id: String(page._id) });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.patch("/api/admin/custom-pages/:id", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const page = await CustomPageModel.findById(req.params.id);
            if (!page) return res.status(404).json({ error: "Custom page not found" });

            if (req.body?.sourceUrl !== undefined) page.sourceUrl = String(req.body.sourceUrl || "");

            if (req.body?.remirror) {
                if (!page.sourceUrl) return res.status(400).json({ error: "No sourceUrl to remirror" });
                const mirrored = await MirrorService.mirror(page.sourceUrl);
                page.htmlContent = String(mirrored.rawHtml || mirrored.content || page.htmlContent || "");
                if (!req.body?.title) {
                    page.title = String(mirrored.title || page.title || "");
                }
                const derived = deriveSeoFromHtml(page.htmlContent, page.title);
                if (!req.body?.seoTitle) page.seoTitle = derived.seoTitle;
                if (!req.body?.seoDescription) page.seoDescription = derived.seoDescription;
                if (!Array.isArray(req.body?.seoKeywords)) page.seoKeywords = derived.seoKeywords;
                if (!req.body?.ogImage) page.ogImage = derived.ogImage;
            }

            if (req.body?.slug !== undefined) {
                const nextSlug = slugifyEventName(String(req.body.slug || ""));
                if (!nextSlug) return res.status(400).json({ error: "Valid slug is required" });
                const exists = await CustomPageModel.findOne({ slug: nextSlug, _id: { $ne: page._id } }).lean();
                if (exists) return res.status(409).json({ error: "Slug already exists" });
                page.slug = nextSlug;
            }
            if (req.body?.title !== undefined) page.title = String(req.body.title || "");
            if (req.body?.htmlContent !== undefined) page.htmlContent = String(req.body.htmlContent || "");
            if (req.body?.seoTitle !== undefined) page.seoTitle = String(req.body.seoTitle || "");
            if (req.body?.seoDescription !== undefined) page.seoDescription = String(req.body.seoDescription || "");
            if (req.body?.seoKeywords !== undefined) page.seoKeywords = Array.isArray(req.body.seoKeywords) ? req.body.seoKeywords : [];
            if (req.body?.ogImage !== undefined) page.ogImage = String(req.body.ogImage || "");
            if (req.body?.active !== undefined) page.active = !!req.body.active;
            await page.save();
            res.json({ ...page.toObject(), id: String(page._id) });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.delete("/api/admin/custom-pages/:id", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const deleted = await CustomPageModel.findByIdAndDelete(req.params.id);
            if (!deleted) return res.status(404).json({ error: "Custom page not found" });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.get("/pages/:slug", async (req, res, next) => {
        try {
            const slug = slugifyEventName(String(req.params.slug || ""));
            if (!slug) return res.status(404).send("Not Found");
            const page = await CustomPageModel.findOne({ slug, active: true }).lean();
            if (!page || !page.htmlContent) return next();

            const base = String(process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
            const fullUrl = `${base}/pages/${slug}`;
            const ogMeta = {
                title: page.seoTitle || page.title || slug,
                description: page.seoDescription || "",
                url: fullUrl,
                image: page.ogImage || "",
                type: "article",
                imageWidth: 1200,
                imageHeight: 630,
            };
            const html = injectOgMeta(String(page.htmlContent || ""), ogMeta);
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.status(200).send(html);
        } catch (error) {
            res.status(500).send("Failed to render page");
        }
    });

            const updated = await SellerPageModel.findOneAndUpdate(
                { sellerSlug: slug },
                update,
                { upsert: true, new: true }
            ).lean();
            const outImages = updated.images || [];
            const outDescriptionHtml = updated.descriptionHtml || "";
            const outBlocks = Array.isArray(updated.blocks) ? updated.blocks : [];
            res.json({ sellerSlug: slug, images: outImages, descriptionHtml: outDescriptionHtml, blocks: outBlocks });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.delete("/api/announcements/seller/:slug", requireAuth, requireSuperAdmin, requireCsrf, async (req, res) => {
        try {
            const slug = String(req.params.slug || "").trim().toLowerCase();
            const ok = await SellerAnnouncementModel.findOneAndDelete({ sellerSlug: slug });
            if (!ok) return res.status(404).json({ error: "Announcement not found" });
            try { await storage.auditAdminAction("seller_announcement_delete", slug, req.user?.id || "", {}); } catch { }
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    const httpServer = createServer(app2);
    return httpServer;
}

// server/index-production.ts
import cors from "cors";
var app = express();
var app2 = app;
function log(message, source = "express") {
    const formattedTime = /* @__PURE__ */ new Date().toLocaleTimeString(
        "en-US",
        {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
        },
    );
    console.log(`${formattedTime} [${source}] ${message}`);
}
var frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
try { frontendUrl = String(frontendUrl).trim().replace(/^[`'"]|[`'"]$/g, ""); } catch { }
var connectedUsers = new Map();
app.use(
    cors({
        origin: frontendUrl == "*" ? "*" : [frontendUrl],
        credentials: true,
        methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "x-csrf-token", "X-Analytics-Session", "x-analytics-session", "X-Geo-Country", "x-geo-country"],
    }),
);

// Request tracking middleware for debugging
app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        if (res.statusCode >= 400) {
            console.warn(`[DEBUG] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
        }
    });
    next();
});
// Ensure preflight succeeds for all routes
app.options("*", cors());
app.use(
    express.json({
        limit: "50mb",
        verify: (req, _res, buf) => {
            req.rawBody = buf;
        },
    }),
);
app.use(express.urlencoded({ limit: "50mb", extended: false }));
app.set("trust proxy", 1); // Trust the first proxy

// Content Security Policy & Performance Middleware
app.use((req, res, next) => {
    // Generate a nonce for inline scripts
    const nonce = crypto.randomBytes(16).toString('base64');
    res.locals.cspNonce = nonce;

    // Content Security Policy - Optimized for Cloudflare and performance
    // Removed 'none' restrictions that conflict with Rocket Loader
    const cspDirectives = [
        "default-src 'self'",
        `script-src 'self' 'unsafe-inline' 'unsafe-eval' 'nonce-${nonce}' https:`,
        `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net`,
        "img-src 'self' data: https: blob:",
        "font-src 'self' https://fonts.gstatic.com data:",
        "connect-src 'self' https: wss: blob:",
        "frame-src 'self' https://www.youtube.com https://youtube.com https://player.vimeo.com",
        "media-src 'self' https: blob:",
        "worker-src 'self' blob:",
        "manifest-src 'self'"
    ];

    res.setHeader("Content-Security-Policy", cspDirectives.join('; '));

    // Additional security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    next();
});

// Lightweight request logging: avoid capturing response bodies to save CPU/RAM
// Force non-www canonical host
app.use((req, res, next) => {
    try {
        const host = req.get("host") || "";
        if (host.toLowerCase().startsWith("www.crossfire.wiki")) {
            const target = `https://crossfire.wiki${req.originalUrl || ''}`;
            return res.redirect(301, target);
        }
    } catch { }
    next();
});
app.use((req, res, next) => {
    const start = Date.now();
    const path2 = req.path;
    res.on("finish", () => {
        const duration = Date.now() - start;
        if (path2.startsWith("/api")) {
            let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
            // keep logs short to reduce memory/cpu (no JSON.stringify of response)
            if (logLine.length > 160) {
                logLine = logLine.slice(0, 159) + "\u2026";
            }
            log(logLine);
        }
    });
    next();
});
(async () => {
    const server = await registerRoutes(app);
    // Serve images from MongoDB buckets
    app.get("/:bucket/:filename", async (req, res, next) => {
        try {
            const { bucket, filename } = req.params;
            // Only handle known buckets or patterns to avoid conflicts with other routes
            if (!['events', 'news', 'modes', 'weapons', 'characters', 'uploads'].includes(bucket) && !bucket.startsWith('bucket')) {
                return next();
            }

            const file = await UploadedFileModel.findOne({
                bucket,
                filename
            });

            if (!file || !file.data) {
                // Try to find by partial match or fallback?
                // Or maybe it is a route conflict?
                return next();
            }

            res.set('Content-Type', file.mimetype);
            res.set('Content-Length', String(file.size));
            res.set('Cache-Control', 'public, max-age=31536000'); // 1 year cache
            res.send(file.data);
        } catch (error) {
            next(error);
        }
    });

    app.post("/api/files/upload", uploadLimiter, upload.single("file"), async (req, res) => {
        try {
            const token = String(req.headers["x-csrf-token"] || req.headers["X-CSRF-Token"] || "");
            const envToken = String(process.env.CSRF_TOKEN || process.env.CSRF_SECRET || "").trim();
            if (envToken && token !== envToken) return res.status(403).json({ ok: false, error: "CSRF validation failed", code: "csrf_failed" });

            if (!req.file) return res.status(400).json({ ok: false, error: "No file provided", code: "no_file" });

            const MAX_SIZE = 15 * 1024 * 1024; // 15MB Limit (BSON limit is 16MB)
            if (req.file.size > MAX_SIZE) return res.status(413).json({ ok: false, error: "File too large for DB storage", code: "file_too_large", limit: MAX_SIZE });

            const allowed = [
                "image/jpeg", "image/png", "image/webp", "image/gif",
                "video/mp4", "video/webm", "video/ogg", "video/mpeg",
                "application/pdf"
            ];
            if (!allowed.includes(req.file.mimetype)) return res.status(415).json({ ok: false, error: `Unsupported type: ${req.file.mimetype}`, code: "unsupported_type" });

            // Get bucket and custom name from body
            const bucket = String(req.body.bucket || "uploads").toLowerCase().replace(/[^a-z0-9-_]/g, "");
            const customName = String(req.body.customName || "").trim();
            const ext = mimeToExt(req.file.mimetype);

            let filename = "";
            if (customName) {
                filename = sanitizeFilename(customName);
                // Append extension if not present
                if (!filename.toLowerCase().endsWith(`.${ext}`)) {
                    filename = `${filename}.${ext}`;
                }
            } else {
                // Auto-generate name if not provided (UUID + ext)
                filename = `${crypto.randomUUID()}.${ext}`;
            }

            // Check for duplicate in bucket
            let existing = await UploadedFileModel.findOne({ bucket, filename });
            if (existing) {
                const namePart = filename.substring(0, filename.lastIndexOf("."));
                const extPart = filename.substring(filename.lastIndexOf("."));
                filename = `${namePart}-${Date.now()}${extPart}`;
            }

            // Store in MongoDB
            const domainUrl = `${process.env.PUBLIC_BASE_URL || "https://crossfire.wiki"}/${bucket}/${filename}`;

            const wRaw = Array.isArray(req.body?.width) ? req.body.width[0] : req.body?.width;
            const hRaw = Array.isArray(req.body?.height) ? req.body.height[0] : req.body?.height;
            const width = Math.max(0, parseInt(String(wRaw || "0"), 10) || 0);
            const height = Math.max(0, parseInt(String(hRaw || "0"), 10) || 0);
            const doc = await UploadedFileModel.create({
                filename,
                mimetype: req.file.mimetype,
                size: req.file.size,
                width,
                height,
                data: req.file.buffer,
                bucket,
                domainUrl,
                resourceType: pickResourceType(req.file.mimetype)
            });

            console.log(`[upload] saved to DB: ${bucket}/${filename} size=${req.file.size}`);

            res.json({
                ok: true,
                id: String(doc._id),
                filename,
                mimetype: req.file.mimetype,
                size: req.file.size,
                width,
                height,
                domainUrl,
                bucket
            });
        } catch (error) {
            console.error("[upload] error", error?.message || error);
            res.status(500).json({ ok: false, error: error?.message || "Upload failed", code: "server_error" });
        }
    });
    app.post("/images/upload", uploadLimiter, upload.single("file"), async (req, res) => {
        try {
            const token = String(req.headers["x-csrf-token"] || req.headers["X-CSRF-Token"] || "");
            const envToken = String(process.env.CSRF_TOKEN || process.env.CSRF_SECRET || "").trim();
            if (envToken && token !== envToken) return res.status(403).json({ ok: false, error: "CSRF validation failed", code: "csrf_failed" });

            if (!req.file) return res.status(400).json({ ok: false, error: "No file provided", code: "no_file" });

            const MAX_SIZE = 15 * 1024 * 1024; // 15MB Limit (BSON limit is 16MB)
            if (req.file.size > MAX_SIZE) return res.status(413).json({ ok: false, error: "File too large for DB storage", code: "file_too_large", limit: MAX_SIZE });

            const allowed = [
                "image/jpeg", "image/png", "image/webp", "image/gif",
                "video/mp4", "video/webm", "video/ogg", "video/mpeg",
                "application/pdf"
            ];
            if (!allowed.includes(req.file.mimetype)) return res.status(415).json({ ok: false, error: `Unsupported type: ${req.file.mimetype}`, code: "unsupported_type" });

            const bucket = String(req.body.bucket || "uploads").toLowerCase().replace(/[^a-z0-9-_]/g, "");
            const customName = String(req.body.customName || "").trim();
            const ext = mimeToExt(req.file.mimetype);

            let filename = "";
            if (customName) {
                filename = sanitizeFilename(customName);
                if (!filename.toLowerCase().endsWith(`.${ext}`)) {
                    filename = `${filename}.${ext}`;
                }
            } else {
                filename = `${crypto.randomUUID()}.${ext}`;
            }

            let existing = await UploadedFileModel.findOne({ bucket, filename });
            if (existing) {
                const namePart = filename.substring(0, filename.lastIndexOf("."));
                const extPart = filename.substring(filename.lastIndexOf("."));
                filename = `${namePart}-${Date.now()}${extPart}`;
            }

            const domainUrl = `${process.env.PUBLIC_BASE_URL || "https://crossfire.wiki"}/${bucket}/${filename}`;

            const wRaw = Array.isArray(req.body?.width) ? req.body.width[0] : req.body?.width;
            const hRaw = Array.isArray(req.body?.height) ? req.body.height[0] : req.body?.height;
            const width = Math.max(0, parseInt(String(wRaw || "0"), 10) || 0);
            const height = Math.max(0, parseInt(String(hRaw || "0"), 10) || 0);
            const doc = await UploadedFileModel.create({
                filename,
                mimetype: req.file.mimetype,
                size: req.file.size,
                width,
                height,
                data: req.file.buffer,
                bucket,
                domainUrl,
                resourceType: pickResourceType(req.file.mimetype)
            });

            console.log(`[upload] saved to DB: ${bucket}/${filename} size=${req.file.size}`);

            res.json({
                ok: true,
                id: String(doc._id),
                filename,
                mimetype: req.file.mimetype,
                size: req.file.size,
                width,
                height,
                domainUrl,
                bucket
            });
        } catch (error) {
            console.error("[upload] error", error?.message || error);
            res.status(500).json({ ok: false, error: error?.message || "Upload failed", code: "server_error" });
        }
    });
    app.get("/api/files/test-list", async (_req, res) => {
        try {
            const UPLOADS_DIR = path.resolve("backend-deploy-full", "backend-deploy-full", "uploads");
            fs.mkdirSync(UPLOADS_DIR, { recursive: true });
            const files = await UploadedFileModel.find().sort({ createdAt: -1 }).lean();
            const localNames = await fs.promises.readdir(UPLOADS_DIR).catch(() => []);
            const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || "").trim();
            const items = files.map((f) => ({ filename: f.filename, mimetype: f.mimetype, size: f.size, localPath: f.localPath, cloudinaryUrl: f.cloudinaryUrl, domainUrl: f.domainUrl, thumbnailUrl: f.thumbnailUrl }));
            for (const name of localNames) {
                if (!items.find((x) => x.filename === name)) {
                    const p = path.join(UPLOADS_DIR, name);
                    const stat = await fs.promises.stat(p).catch(() => null);
                    const ext = String(name).split(".").pop() || "";
                    const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
                    items.push({ filename: name, mimetype: isImg ? `image/${ext}` : "application/octet-stream", size: stat ? stat.size : 0, localPath: p, cloudinaryUrl: "", domainUrl: "", thumbnailUrl: isImg && cloudName ? `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_160,h_160/${sanitizeFilename(name).replace(/\.[a-z0-9]+$/i, "")}.${ext}` : "" });
                }
            }
            res.json({ ok: true, count: items.length, items });
        } catch (error) {
            res.status(500).json({ ok: false, error: error?.message || "list_failed" });
        }
    });
    // Ensure MongoDB is connected before seeding
    await connectMongoDB();

    // Auto-seed weapons on startup if collection is empty
    try {
        const weaponCount = await WeaponModel.countDocuments();
        if (weaponCount === 0 && weaponsData && weaponsData.length > 0) {
            console.log(`[seed] Weapons collection is empty. Seeding ${weaponsData.length} weapons...`);
            await WeaponModel.insertMany(weaponsData);
            console.log(`[seed] Successfully seeded ${weaponsData.length} weapons from CrossFire wiki.`);
        } else {
            console.log(`[seed] Weapons collection already has ${weaponCount} weapons. Skipping seed.`);
        }
    } catch (seedError) {
        console.error("[seed] Error seeding weapons:", seedError.message);
    }

    const currentFile = fileURLToPath(import.meta.url);
    const currentDir = path.dirname(currentFile);
    // Allow configuring the assets folder via env var so deployed backends can
    // point to a different location without copying files.
    // Optional: serve static assets from a local folder (if ATTACHED_ASSETS_PATH is set)
    // Otherwise, assets are served as URLs from database (recommended for low-disk deployments)
    if (process.env.ATTACHED_ASSETS_PATH) {
        const assetsPath = path.resolve(process.env.ATTACHED_ASSETS_PATH);
        console.log(`[assets] Serving static assets from: ${assetsPath}`);
        app.use("/assets", express.static(assetsPath));
    } else {
        console.log(
            `[assets] No ATTACHED_ASSETS_PATH set. Assets are served as URLs from database.`,
        );
    }

    // Serve a fixed intro audio file for autoplay
    try {
        const envIntro = String(process.env.INTRO_AUDIO_PATH || "").trim();
        const fallbackIntro = path.resolve(process.cwd(), "Hazbin Hotel S2 Ultimate Sing-Along - PART 2 _ Prime Video (mp3cut.net) (1).mp3");
        const introAudioPath = fs.existsSync(envIntro) ? envIntro : fallbackIntro;
        app.get("/media/intro.mp3", (_req, res) => {
            try {
                if (!fs.existsSync(introAudioPath)) {
                    return res.status(404).json({ error: "Audio file not found" });
                }
                res.sendFile(introAudioPath, (err) => {
                    if (err) {
                        res.status(404).json({ error: "Audio file not found" });
                    }
                });
            } catch {
                res.status(404).json({ error: "Audio file not found" });
            }
        });
    } catch { }

    // Serve built client files from root dist/client if available, otherwise fallback to local
    const rootDistClient = path.resolve(process.cwd(), "dist", "client");
    const localDistClient = path.resolve(currentDir, "dist", "client");
    const clientDistPath = fs.existsSync(rootDistClient) ? rootDistClient : localDistClient;
    app.use("/assets", express.static(path.join(clientDistPath, "assets"), { maxAge: "7d", immutable: true }));
    app.use(express.static(clientDistPath, { maxAge: "7d", immutable: true }));

    app.use((err, _req, res, _next) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        console.error(`[ERROR] ${status} - ${message}`, err);
        res.setHeader('Content-Type', 'application/json');
        res.status(status).json({ error: message, ok: false, status });
    });

    app.get("/api/health", async (_req, res) => {
        try {
            // Touch the DB with a lightweight command to verify connectivity
            const ok = isConnected;
            res.json({ ok: true, dbConnected: ok });
        } catch (err) {
            res.status(500).json({ ok: false, error: err?.message || "health check failed" });
        }
    });

    // 404 handler for API routes
    app.all("/api/*", (req, res) => {
        res.status(404).json({ error: "API endpoint not found", path: req.path });
    });

    // Serve index.html for all non-API routes (SPA routing)
    app.get("*", async (req, res) => {
        const indexPath = path.join(clientDistPath, "index.html");
        
        // Performance: Use a nonce to satisfy CSP and Rocket Loader
        const nonce = res.locals.cspNonce || "";
        
        res.set({
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        });

        if (fs.existsSync(indexPath)) {
            let html = fs.readFileSync(indexPath, "utf8");

            try {
                if (isCrawlerUserAgent(req.headers["user-agent"])) {
                    const settings = await SiteSettingsModel.findOne().lean();
                    const base = String(settings?.publicBaseUrl || process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
                    const fallbackOg = toCloudinary1200x630(resolveAbsoluteUrl(settings?.seoOgImage || "", base) || `${base}/feature-crossfire.jpg`);
                    const pathname = String(req.path || "");
                    const fullUrl = `${base}${pathname}`;

                    let meta = null;
                    if (/^\/events\//i.test(pathname)) {
                        const slug = pathname.replace(/^\/events\//i, "").split("?")[0];
                        const ev = await storage.getEventByIdOrSlug(slug);
                        if (ev) {
                            let ogImage = ev.ogImage || ev.image || "";
                            if (!ogImage && ev.description) {
                                const m = String(ev.description).match(/<img[^>]+src=["']([^"']+)["']/i);
                                if (m && m[1]) ogImage = m[1];
                            }
                            const img = toCloudinary1200x630(resolveAbsoluteUrl(ogImage || "", base) || fallbackOg);
                            meta = {
                                title: ev.seoTitle || ev.title,
                                description: ev.seoDescription || String(ev.description || "").replace(/<[^>]*>/g, "").slice(0, 200),
                                image: img,
                                url: fullUrl,
                                type: "article",
                                imageWidth: 1200,
                                imageHeight: 630,
                            };
                        }
                    }
                    else if (/^\/news\//i.test(pathname)) {
                        const slug = pathname.replace(/^\/news\//i, "").split("?")[0];
                        const nw = await storage.getNewsByIdOrSlug(slug);
                        if (nw) {
                            const img = toCloudinary1200x630(resolveAbsoluteUrl(nw.ogImage || nw.image || "", base) || fallbackOg);
                            meta = {
                                title: nw.seoTitle || nw.title,
                                description: nw.seoDescription || String(nw.content || "").replace(/<[^>]*>/g, "").slice(0, 200),
                                image: img,
                                url: fullUrl,
                                type: "article",
                                imageWidth: 1200,
                                imageHeight: 630,
                            };
                        }
                    }
                    else if (/^\/article\//i.test(pathname)) {
                        const slug = pathname.replace(/^\/article\//i, "").split("?")[0];
                        const post = await storage.getPostByIdOrSlug(slug);
                        if (post) {
                            const img = toCloudinary1200x630(resolveAbsoluteUrl(post.ogImage || post.image || "", base) || fallbackOg);
                            meta = {
                                title: post.seoTitle || post.title,
                                description: post.seoDescription || post.summary || String(post.content || "").replace(/<[^>]*>/g, "").slice(0, 200),
                                image: img,
                                url: fullUrl,
                                type: "article",
                                imageWidth: 1200,
                                imageHeight: 630,
                            };
                        }
                    }

                    if (meta && meta.image) {
                        html = injectOgMeta(html, meta);
                    }
                }
            }
            catch {
                // Never break SPA serving due to OG injection
            }
            
            // Inject nonce into script and style tags
            // This handles inline scripts/styles for Rocket Loader and common libraries
            if (nonce) {
                html = html.replace(/<script(?![^>]*nonce=)/g, `<script nonce="${nonce}"`);
                html = html.replace(/<style(?![^>]*nonce=)/g, `<style nonce="${nonce}"`);
            }
            
            return res.send(html);
        }

        res.status(404).json({
            message: "Frontend not found. Make sure the client is built.",
            hint: "Run: npm run build",
        });
    });

    // Debug endpoints for deployment checks
    app.get("/api/debug/assets", (_req, res) => {
        res.json({
            assetsPath,
            hasScraperApiKey: Boolean(process.env.SCRAPER_API_KEY),
        });
    });

    // Full AUTO_SEED (weapons/modes/mercs/ranks) is now opt-in
    if (process.env.AUTO_SEED === void 0) process.env.AUTO_SEED = "false";
    if (String(process.env.AUTO_SEED).toLowerCase() === "true") {
        (async () => {
            try {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                log("🌱 AUTO_SEED enabled: seeding data from seed-from-urls.js...");
                const seedModule = await import("./seed-from-urls.js");
                const run = seedModule?.default;
                if (typeof run === "function") {
                    await run();
                    log("✅ Seeded mercenaries, weapons, modes, and ranks successfully");
                } else {
                    log("⚠️ seed-from-urls.js default export is not a function");
                }
            } catch (err) {
                log(`⚠️ Auto-seeding error: ${err?.message || err}`);
            }
        })();
    }

    // Reseed only Mercenaries and Ranks on startup (requested behavior)
    if (process.env.RESEED_MERCS_RANKS_ON_START === void 0) process.env.RESEED_MERCS_RANKS_ON_START = "true";
    if (String(process.env.RESEED_MERCS_RANKS_ON_START).toLowerCase() === "true") {
        (async () => {
            try {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const mod = await import("./seed-from-urls.js");
                const mercs = Array.isArray(mod.mercenariesData) ? mod.mercenariesData : [];
                const ranks = Array.isArray(mod.ranksData) ? mod.ranksData : [];
                log(`🔁 Reseeding mercenaries (${mercs.length}) and ranks (${ranks.length}) from seed module...`);
                await MercenaryModel.deleteMany({});
                await RankModel.deleteMany({});
                if (mercs.length) {
                    const cleanedMercs = mercs.map(m => {
                        const { id, ...rest } = m;
                        return { ...rest, mercenaryId: id };
                    });
                    await MercenaryModel.insertMany(cleanedMercs);
                }
                if (ranks.length) await RankModel.insertMany(ranks);
                log("✅ Reseeded mercenaries and ranks successfully");
            } catch (err) {
                log(`⚠️ Merc/Ranks reseed error: ${err?.message || err}`);
            }
        })();
    }

    const wsModule = await import("ws");
    const WSSCtor =
        wsModule?.Server ||
        wsModule?.WebSocketServer ||
        wsModule?.default?.Server ||
        wsModule?.default?.WebSocketServer;
    if (typeof WSSCtor === "function") {
        const wss = new WSSCtor({ noServer: true, perMessageDeflate: false });
        server.on("upgrade", (req, socket, head) => {
            try {
                const url = new URL(req.url || "", `http://${req.headers.host}`);
                if (url.pathname !== "/ws") {
                    socket.destroy();
                    return;
                }

                const token = url.searchParams.get("token");
                if (!token) {
                    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
                    socket.destroy();
                    return;
                }

                const user = verifyToken(token);
                if (!user) {
                    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
                    socket.destroy();
                    return;
                }

                wss.handleUpgrade(req, socket, head, (ws) => {
                    wss.emit("connection", ws, req, user);
                });
            } catch (err) {
                try {
                    socket.destroy();
                } catch { }
            }
        });
        function broadcastPresence() {
            const users = Array.from(connectedUsers.keys());
            const payload = JSON.stringify({ type: "presence", users });
            connectedUsers.forEach((set) => {
                set.forEach((client) => {
                    try {
                        if (client.readyState === 1) client.send(payload);
                    } catch { }
                });
            });
        }
        wss.on("connection", (ws, req, user) => {
            try {
                const username = user.username;
                let set = connectedUsers.get(username);
                if (!set) {
                    set = new Set();
                    connectedUsers.set(username, set);
                }
                set.add(ws);
                broadcastPresence();

                // Note: Messages are now handled via REST API /api/chat/messages
                // We keep the socket open for receiving broadcasts

                ws.on("close", () => {
                    const s = connectedUsers.get(username);
                    if (s) {
                        s.delete(ws);
                        if (s.size === 0) connectedUsers.delete(username);
                    }
                    broadcastPresence();
                });
            } catch { }
        });
        app.get("/api/online-users", (_req, res) => {
            res.json(Array.from(connectedUsers.keys()));
        });
    }

    const port = parseInt(process.env.PORT || "20032", 10);
    server.listen(
        {
            port,
            host: "0.0.0.0",
            reusePort: true,
        },
        () => {
            log(`\u{1F680} Backend API server running on port ${port}`);
            log(`\u{1F4E1} Serving API endpoints at /api/*`);
            log(`\u{1F5BC}\uFE0F  Serving assets at /assets/*`);
            log(`\u{1F310} Frontend should be deployed to Netlify`);
        },
    );
})();
// Admin: Users management and registration toggle
app.get(
    "/api/admin/users",
    requireAuth,
    requireSuperAdmin,
    async (_req, res) => {
        try {
            const users = await UserModel.find().sort({ createdAt: -1 }).lean();
            res.json(
                users.map((u) => ({
                    id: String(u._id),
                    username: u.username,
                    email: u.email,
                    phone: u.phone,
                    verifiedEmail: !!u.verifiedEmail,
                    verifiedPhone: !!u.verifiedPhone,
                    emailVerificationCode: u.emailVerificationCode || "",
                    phoneVerificationCode: u.phoneVerificationCode || "",
                    createdAt: u.createdAt,
                })),
            );
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
);

function hashVisitor(req) {
    var ip = String(req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim();
    var ua = String(req.headers["user-agent"] || "");
    var sid = String(req.headers["x-analytics-session"] || req.headers["X-Analytics-Session"] || "");
    return crypto.createHash("sha256").update("".concat(ip, "|").concat(ua, "|").concat(sid)).digest("hex");
}
function parseDevice(req) {
    var ua = String(req.headers["user-agent"] || "").toLowerCase();
    var mobile = /mobile|android|iphone|ipad/.test(ua) ? "mobile" : "desktop";
    var browser = /chrome\//.test(ua) ? "chrome" : /firefox\//.test(ua) ? "firefox" : /safari\//.test(ua) ? "safari" : /edg\//.test(ua) ? "edge" : "unknown";
    var country = String(req.headers["x-geo-country"] || req.headers["X-Geo-Country"] || "").toUpperCase() || "unknown";
    return { device: mobile, browser: browser, country: country };
}
function sanitizeFilename(name) {
    return String(name || "").toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "file";
}
function mimeToExt(mime) {
    if (!mime) return "bin";
    if (/image\/jpeg/i.test(mime)) return "jpg";
    if (/image\/png/i.test(mime)) return "png";
    if (/image\/webp/i.test(mime)) return "webp";
    if (/image\/gif/i.test(mime)) return "gif";
    if (/video\/mp4/i.test(mime)) return "mp4";
    if (/video\/webm/i.test(mime)) return "webm";
    if (/video\/ogg/i.test(mime)) return "ogg";
    if (/application\/pdf/i.test(mime)) return "pdf";
    return "bin";
}
function pickResourceType(mime) {
    if (!mime) return "auto";
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    return "auto";
}
function buildDomainUrl(kind, publicId, format, req) {
    var base = String(process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
    if (kind === "image") return `${base}/media/images/${publicId}.${format}`;
    if (kind === "video") return `${base}/media/videos/${publicId}.${format}`;
    return `${base}/media/audio/${publicId}.${format}`;
}
async function cloudinarySignedUpload(buffer, filename, mimetype, opts) {
    const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || "").trim();
    const apiKey = String(process.env.CLOUDINARY_API_KEY || "").trim();
    const apiSecret = String(process.env.CLOUDINARY_API_SECRET || "").trim();
    if (!cloudName || !apiKey || !apiSecret) throw new Error("cloudinary_not_configured");
    const resourceType = String(opts?.resource_type || pickResourceType(mimetype));
    const folder = String(opts?.folder || "uploads");
    const public_id = String(opts?.public_id || sanitizeFilename(filename).replace(/\.[a-z0-9]+$/i, ""));
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = `folder=${folder}&public_id=${public_id}&timestamp=${timestamp}`;
    const signature = crypto.createHash("sha1").update(paramsToSign + apiSecret).digest("hex");
    const form = new FormData();
    form.append("file", buffer, { filename, contentType: mimetype });
    form.append("folder", folder);
    form.append("public_id", public_id);
    form.append("timestamp", String(timestamp));
    form.append("api_key", apiKey);
    form.append("signature", signature);
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
    const resp = await fetch(url, { method: "POST", body: form, headers: form.getHeaders() });
    if (!resp.ok) {
        const text = await resp.text();
        const err = new Error(`cloudinary_upload_failed:${resp.status}`);
        err.details = text;
        throw err;
    }
    const json = await resp.json();
    return json;
}
async function maybeScan(buffer) {
    const enable = String(process.env.ENABLE_VIRUS_SCAN || "false").toLowerCase() === "true";
    if (!enable) return { ok: true };
    return { ok: true };
}
app.get("/admin/dashboard", (req, res) => {
    res.sendFile(path.join(process.cwd(), "public/admin/dashboard.html"));
});
/* moved into registerRoutes (app2) */
app.get("/api/files/test-list", async (_req, res) => {
    res.status(404).json({ ok: false, error: "route_moved" });
});
app.post("/api/analytics/tutorials/:id/event", apiLimiter, async (req, res) => {
    try {
        var visitorHash = hashVisitor(req);
        var _a = parseDevice(req), device = _a.device, browser = _a.browser, country = _a.country;
        var event = String((req.body && req.body.event) || "view");
        var durationMs = Number((req.body && req.body.durationMs) || 0) || 0;
        var doc = await AnalyticsTutorialModel.create({ tutorialId: req.params.id, visitorHash: visitorHash, event: event, durationMs: durationMs, country: country, device: device, browser: browser });
        res.json({ ok: true, id: String(doc._id) });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: (error && error.message) || "failed" });
    }
});
app.post("/api/analytics/sellers/:slug/event", apiLimiter, async (req, res) => {
    try {
        var visitorHash = hashVisitor(req);
        var _a = parseDevice(req), device = _a.device, browser = _a.browser, country = _a.country;
        var event = String((req.body && req.body.event) || "view");
        var timeSpentMs = Number((req.body && req.body.timeSpentMs) || 0) || 0;
        var doc = await AnalyticsSellerModel.create({ sellerSlug: req.params.slug, visitorHash: visitorHash, event: event, timeSpentMs: timeSpentMs, country: country, device: device, browser: browser });
        res.json({ ok: true, id: String(doc._id) });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: (error && error.message) || "failed" });
    }
});
app.post("/api/analytics/announcements/:id/event", apiLimiter, async (req, res) => {
    try {
        var visitorHash = hashVisitor(req);
        var _a = parseDevice(req), device = _a.device, browser = _a.browser, country = _a.country;
        var event = String((req.body && req.body.event) || "learn_more_click");
        var doc = await AnalyticsAnnouncementModel.create({ announcementId: req.params.id, visitorHash: visitorHash, event: event, country: country, device: device, browser: browser });
        res.json({ ok: true, id: String(doc._id) });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: (error && error.message) || "failed" });
    }
});
function parseRange(req) {
    var now = new Date();
    var to = new Date(String(req.query.to || now));
    var fromQ = String(req.query.from || "");
    var period = String(req.query.period || "").toLowerCase();
    var from = fromQ ? new Date(fromQ) : new Date(to.getTime() - 30 * 24 * 3600 * 1000);
    if (period === "daily")
        from = new Date(to.getTime() - 1 * 24 * 3600 * 1000);
    if (period === "weekly")
        from = new Date(to.getTime() - 7 * 24 * 3600 * 1000);
    if (period === "monthly")
        from = new Date(to.getTime() - 30 * 24 * 3600 * 1000);
    return { from: from, to: to };
}
function toCsv(rows) {
    if (!rows || rows.length === 0)
        return "key,value\n";
    var keys = Object.keys(rows[0]);
    var head = keys.join(",");
    var body = rows.map(function (r) { return keys.map(function (k) { var _a; return String((_a = r[k]) !== null && _a !== void 0 ? _a : ""); }).join(","); }).join("\n");
    return "".concat(head, "\n").concat(body);
}
app.get("/api/admin/analytics/tutorials", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        var _a = parseRange(req), from = _a.from, to = _a.to;
        var id = String(req.query.id || "");
        var match = { createdAt: { $gte: from, $lte: to } };
        if (id)
            Object.assign(match, { tutorialId: id });
        var group = await AnalyticsTutorialModel.aggregate([
            { $match: match },
            { $group: { _id: "$tutorialId", total: { $sum: 1 }, unique: { $addToSet: "$visitorHash" }, avgDuration: { $avg: "$durationMs" } } },
            { $project: { tutorialId: "$_id", total: 1, uniqueCount: { $size: "$unique" }, avgDuration: 1, _id: 0 } }
        ]);
        var geo = await AnalyticsTutorialModel.aggregate([
            { $match: match },
            { $group: { _id: "$country", count: { $sum: 1 } } },
            { $project: { country: "$_id", count: 1, _id: 0 } },
            { $sort: { count: -1 } }
        ]);
        var devices = await AnalyticsTutorialModel.aggregate([
            { $match: match },
            { $group: { _id: { device: "$device", browser: "$browser" }, count: { $sum: 1 } } },
            { $project: { device: "$_id.device", browser: "$_id.browser", count: 1, _id: 0 } }
        ]);
        var result = { ok: true, group: group, geo: geo, devices: devices };
        if (String(req.query.format || "").toLowerCase() === "csv") {
            res.type("text/csv").send(toCsv(group));
        }
        else {
            res.json(result);
        }
    }
    catch (error) {
        res.status(500).json({ ok: false, error: (error && error.message) || "failed" });
    }
});
app.get("/api/admin/analytics/sellers", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        var _a = parseRange(req), from = _a.from, to = _a.to;
        var slug = String(req.query.slug || "");
        var match = { createdAt: { $gte: from, $lte: to } };
        if (slug)
            Object.assign(match, { sellerSlug: slug });
        var group = await AnalyticsSellerModel.aggregate([
            { $match: match },
            { $group: { _id: "$sellerSlug", views: { $sum: { $cond: [{ $eq: ["$event", "view"] }, 1, 0] } }, clicks: { $sum: { $cond: [{ $eq: ["$event", "click"] }, 1, 0] } }, avgTimeSpent: { $avg: "$timeSpentMs" }, unique: { $addToSet: "$visitorHash" } } },
            { $project: { sellerSlug: "$_id", views: 1, clicks: 1, ctr: { $cond: [{ $gt: ["$views", 0] }, { $divide: ["$clicks", "$views"] }, 0] }, avgTimeSpent: 1, uniqueCount: { $size: "$unique" }, _id: 0 } }
        ]);
        var result = { ok: true, group: group };
        if (String(req.query.format || "").toLowerCase() === "csv") {
            res.type("text/csv").send(toCsv(group));
        }
        else {
            res.json(result);
        }
    }
    catch (error) {
        res.status(500).json({ ok: false, error: (error && error.message) || "failed" });
    }
});
app.get("/api/admin/analytics/announcements", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        var _a = parseRange(req), from = _a.from, to = _a.to;
        var id = String(req.query.id || "");
        var match = { createdAt: { $gte: from, $lte: to } };
        if (id)
            Object.assign(match, { announcementId: id });
        var group = await AnalyticsAnnouncementModel.aggregate([
            { $match: match },
            { $group: { _id: "$announcementId", clicks: { $sum: { $cond: [{ $eq: ["$event", "learn_more_click"] }, 1, 0] } }, conversions: { $sum: { $cond: [{ $eq: ["$event", "conversion"] }, 1, 0] } }, unique: { $addToSet: "$visitorHash" } } },
            { $project: { announcementId: "$_id", clicks: 1, conversions: 1, conversionRate: { $cond: [{ $gt: ["$clicks", 0] }, { $divide: ["$conversions", "$clicks"] }, 0] }, uniqueCount: { $size: "$unique" }, _id: 0 } }
        ]);
        var result = { ok: true, group: group };
        if (String(req.query.format || "").toLowerCase() === "csv") {
            res.type("text/csv").send(toCsv(group));
        }
        else {
            res.json(result);
        }
    }
    catch (error) {
        res.status(500).json({ ok: false, error: (error && error.message) || "failed" });
    }
});

app.post(
    "/api/admin/users/:id/generate-phone-code",
    requireAuth,
    requireSuperAdmin,
    async (req, res) => {
        try {
            const id = req.params.id;
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const updated = await UserModel.findByIdAndUpdate(
                id,
                { phoneVerificationCode: code, verifiedPhone: false },
                { new: true },
            ).lean();
            if (!updated)
                return res.status(404).json({ error: "User not found" });
            res.json({
                id: String(updated._id),
                phone: updated.phone,
                phoneCode: code,
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
);

app.patch(
    "/api/admin/users/:id/verify",
    requireAuth,
    requireSuperAdmin,
    async (req, res) => {
        try {
            const id = req.params.id;
            const { verifiedEmail, verifiedPhone } = req.body || {};
            const update = {};
            if (verifiedEmail === true)
                Object.assign(update, {
                    verifiedEmail: true,
                    emailVerificationCode: "",
                });
            if (verifiedPhone === true)
                Object.assign(update, {
                    verifiedPhone: true,
                    phoneVerificationCode: "",
                });
            const updated = await UserModel.findByIdAndUpdate(id, update, {
                new: true,
            }).lean();
            if (!updated)
                return res.status(404).json({ error: "User not found" });
            res.json({
                id: String(updated._id),
                verifiedEmail: !!updated.verifiedEmail,
                verifiedPhone: !!updated.verifiedPhone,
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
);

app.delete(
    "/api/admin/users/:id",
    requireAuth,
    requireSuperAdmin,
    async (req, res) => {
        try {
            const id = req.params.id;
            const result = await UserModel.findByIdAndDelete(id);
            if (!result)
                return res.status(404).json({ error: "User not found" });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
);

app.post(
    "/api/admin/users/reset-code",
    requireAuth,
    requireSuperAdmin,
    async (req, res) => {
        try {
            const email = (req.body && req.body.email) || "";
            if (!email) return res.status(400).json({ error: "Email required" });
            const user = await UserModel.findOne({ email }).lean();
            if (!user) return res.status(404).json({ error: "User not found" });
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            await UserModel.updateOne({ _id: user._id }, { $set: { emailVerificationCode: code } });
            res.json({ resetCode: code });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
);

app.get(
    "/api/admin/registration",
    requireAuth,
    requireSuperAdmin,
    (_req, res) => {
        res.json({ closed: registrationClosed });
    },
);
app.post(
    "/api/admin/registration/close",
    requireAuth,
    requireSuperAdmin,
    (_req, res) => {
        registrationClosed = true;
        res.json({ closed: true });
    },
);
app.post(
    "/api/admin/registration/open",
    requireAuth,
    requireSuperAdmin,
    (_req, res) => {
        registrationClosed = false;
        res.json({ closed: false });
    },
);

app.get("/api/admin/seo/bulk", requireAuth, requireSettingsManager, async (req, res) => {
    try {
        const posts = await storage.getAllPosts();
        const news = await storage.getAllNews();
        const events = await storage.getAllEvents();
        const sellers = await storage.getAllSellers();
        const results = [
            ...posts.map(p => ({ id: p.id, title: p.title, type: 'post', seoTitle: p.seoTitle, seoDescription: p.seoDescription, seoKeywords: p.seoKeywords, ogImage: p.ogImage })),
            ...news.map(n => ({ id: n.id, title: n.title, type: 'news', seoTitle: n.seoTitle, seoDescription: n.seoDescription, seoKeywords: n.seoKeywords, ogImage: n.ogImage })),
            ...events.map(e => ({ id: e.id, title: e.title, type: 'event', seoTitle: e.seoTitle, seoDescription: e.seoDescription, seoKeywords: e.seoKeywords, ogImage: e.ogImage })),
            ...sellers.map(s => ({ id: s.id, title: s.name, type: 'seller', seoTitle: s.name, seoDescription: s.description ? s.description.substring(0, 160) : "", seoKeywords: [], ogImage: s.images && s.images[0] ? s.images[0] : "" }))
        ];
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/api/admin/seo/bulk", requireAuth, requireSettingsManager, async (req, res) => {
    try {
        const items = req.body.items || req.body.updates; // Handle both formats
        if (!Array.isArray(items)) return res.status(400).json({ error: "Items/Updates must be an array" });

        const results = [];
        for (const item of items) {
            try {
                const updateData = {};
                if (item.seoTitle !== undefined) updateData.seoTitle = item.seoTitle;
                if (item.seoDescription !== undefined) updateData.seoDescription = item.seoDescription;
                if (item.seoKeywords !== undefined) updateData.seoKeywords = item.seoKeywords;
                if (item.ogImage !== undefined) updateData.ogImage = item.ogImage;

                let updated = null;
                if (item.type === 'news') {
                    updated = await storage.updateNews(item.id, updateData);
                } else if (item.type === 'post') {
                    updated = await storage.updatePost(item.id, updateData);
                } else if (item.type === 'event') {
                    updated = await storage.updateEvent(item.id, updateData);
                } else if (item.type === 'seller') {
                    // updateSeller handles seo fields implicitly? Or ignore for now if seller schema lacks explicit seo fields (checked schema, it seems to lack them but let's try anyway)
                    // SellerSchema lacks seoTitle etc. Skip for now or just log.
                }

                if (updated) {
                    results.push({ id: item.id, success: true });
                } else {
                    // Seller schema doesn't have SEO fields, so skipping 'seller' here is fine/expected
                    if (item.type !== 'seller') results.push({ id: item.id, success: false, error: "Not found" });
                }
            } catch (e) {
                results.push({ id: item.id, success: false, error: e.message });
            }
        }
        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/api/admin/migrate-slugs", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        let eventsUpdated = 0;
        let postsUpdated = 0;
        let newsUpdated = 0;
        const base = (process.env.PUBLIC_BASE_URL || "https://crossfire.wiki").replace(/\/$/, "");
        const events = await EventModel.find().lean();
        for (const ev of events) {
            const slug = ev.event_name_slug || slugifyEventName(ev.title || "");
            const canonical = `${base}/events/${slug}`;
            if (!ev.event_name_slug || !ev.canonicalUrl) {
                await EventModel.updateOne({ _id: ev._id }, { $set: { event_name_slug: slug, canonicalUrl: canonical } });
                eventsUpdated++;
            }
        }
        const posts = await PostModel.find().lean();
        for (const p of posts) {
            const slug = p.post_slug || slugifyEventName(p.title || "");
            const canonical = `${base}/article/${slug}`;
            if (!p.post_slug || !p.canonicalUrl) {
                await PostModel.updateOne({ _id: p._id }, { $set: { post_slug: slug, canonicalUrl: canonical } });
                postsUpdated++;
            }
        }
        const newsItems = await NewsModel.find().lean();
        for (const n of newsItems) {
            const slug = n.news_slug || slugifyEventName(n.title || "");
            const canonical = `${base}/news/${slug}`;
            if (!n.news_slug || !n.canonicalUrl) {
                await NewsModel.updateOne({ _id: n._id }, { $set: { news_slug: slug, canonicalUrl: canonical } });
                newsUpdated++;
            }
        }
        res.json({ success: true, eventsUpdated, postsUpdated, newsUpdated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Static serving for predictable insert URLs
try {
    const insertDir = path.resolve("backend-deploy-full/uploads/insert");
    fs.mkdirSync(insertDir, { recursive: true });
    const imagesDir = path.resolve("backend-deploy-full/uploads/images");
    try { fs.mkdirSync(imagesDir, { recursive: true }); } catch { }
    app2.use("/images", express.static(imagesDir, { maxAge: "7d" }));
} catch { }
// Upload to predictable /insert/{element_name}.{ext}
const insertStorage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        try {
            const dir = path.resolve("backend-deploy-full/uploads/images");
            fs.mkdirSync(dir, { recursive: true });
            cb(null, dir);
        } catch (e) {
            cb(e);
        }
    },
    filename: function (req, file, cb) {
        try {
            const raw = String(req.body?.element_name || file.originalname || "file");
            const base = raw.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
            const ext = (file.originalname.split(".").pop() || "").toLowerCase();
            const allowed = ["png", "jpg", "jpeg", "gif", "webp", "mp4", "webm", "ogg", "mp3", "wav"];
            const finalExt = allowed.includes(ext) ? ext : "bin";
            let candidate = `${base}.${finalExt}`;
            const dir = path.resolve("backend-deploy-full/uploads/images");
            if (fs.existsSync(path.join(dir, candidate))) {
                let attempt = 1;
                while (attempt < 1000 && fs.existsSync(path.join(dir, `${base}-${attempt}.${finalExt}`))) {
                    attempt++;
                }
                candidate = `${base}-${attempt}.${finalExt}`;
            }
            cb(null, candidate);
        } catch (err) {
            cb(err);
        }
    }
});
const uploadInsert = multer({ storage: insertStorage, limits: { fileSize: 25 * 1024 * 1024 } });
function requireAuthOrUploadKey(req, res, next) {
    try {
        const expected = String(process.env.UPLOAD_API_KEY || "").trim();
        const provided = String((req.headers["x-upload-api-key"] || "")).trim();
        if (expected && provided && expected === provided) return next();
    } catch { }
    return requireAuth(req, res, next);
}
app2.post("/api/upload/insert", uploadLimiter, requireAuthOrUploadKey, uploadInsert.single("file"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file provided" });
        const settings = await SiteSettingsModel.findOne().lean();
        const base = (settings?.publicBaseUrl && settings.publicBaseUrl.trim()) ? settings.publicBaseUrl.trim() : `${req.protocol}://${req.get("host")}`;
        const url = `${base}/images/${req.file.filename}`;
        res.json({ url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
