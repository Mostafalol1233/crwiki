// Ensure environment variables from .env are loaded when node runs index.js directly
import "dotenv/config";

// server/index-production.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

// server/routes.ts
import { createServer } from "http";
import multer from "multer";
import rateLimit from "express-rate-limit";

// shared/mongodb-schema.ts
import mongoose, { Schema } from "mongoose";
import { z } from "zod";
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
var PostSchema = new Schema({
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
  order: { type: Number, default: 0 },
  post_slug: { type: String, default: "", unique: true },
  createdAt: { type: Date, default: Date.now },
});
var CommentSchema = new Schema({
    postId: { type: String, required: true },
    parentCommentId: { type: String },
    name: { type: String, required: true },
    content: { type: String, required: true },
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
  seoTitle: { type: String, default: "" },
  seoDescription: { type: String, default: "" },
  seoKeywords: { type: [String], default: [] },
  canonicalUrl: { type: String, default: "" },
  ogImage: { type: String, default: "" },
  twitterImage: { type: String, default: "" },
  schemaType: { type: String, default: "Event" },
  order: { type: Number, default: 0 },
  event_name_slug: { type: String, default: "", unique: true },
});
var NewsSchema = new Schema({
  title: { type: String, required: true },
  titleAr: { type: String, default: "" },
  dateRange: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  content: { type: String, required: true },
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
  createdAt: { type: Date, default: Date.now },
});
NewsSchema.index({ news_slug: 1 }, { unique: true });
var TutorialSchema = new Schema({
    title: { type: String, required: true },
    youtubeUrl: { type: String, required: true },
    youtubeId: { type: String, required: true },
    description: { type: String, default: "" },
    likes: { type: Number, default: 0 },
    order: { type: Number, default: 9999 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
var TutorialCommentSchema = new Schema({
    tutorialId: { type: String, required: true },
    author: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
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
var UserModel = mongoose.model("User", UserSchema);
var PostModel = mongoose.model("Post", PostSchema);
var CommentModel = mongoose.model("Comment", CommentSchema);
var EventModel = mongoose.model("Event", EventSchema);
var NewsModel = mongoose.model("News", NewsSchema);
var TicketModel = mongoose.model("Ticket", TicketSchema);
var TutorialModel = mongoose.model("Tutorial", TutorialSchema);
var TutorialCommentModel = mongoose.model(
    "TutorialComment",
    TutorialCommentSchema,
);
var TicketReplyModel = mongoose.model("TicketReply", TicketReplySchema);
var AdminModel = mongoose.model("Admin", AdminSchema);
var NewsletterSubscriberModel = mongoose.model(
    "NewsletterSubscriber",
    NewsletterSubscriberSchema,
);
var SellerModel = mongoose.model("Seller", SellerSchema);
var SellerReviewModel = mongoose.model("SellerReview", SellerReviewSchema);
var UrlMatchFailureSchema = new Schema({
    type: { type: String, required: true },
    value: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});
var UrlMatchFailureModel = mongoose.model("UrlMatchFailure", UrlMatchFailureSchema);
var UrlGenerationAuditSchema = new Schema({
    type: { type: String, required: true },
    source: { type: String, required: true },
    slug: { type: String, required: true },
    ok: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});
var UrlGenerationAuditModel = mongoose.model("UrlGenerationAudit", UrlGenerationAuditSchema);
SellerSchema.index({ name: 1 });
SellerSchema.index({ seller_name_slug: 1 }, { unique: true });
EventSchema.index({ event_name_slug: 1 }, { unique: true });
PostSchema.index({ post_slug: 1 }, { unique: true });
SellerReviewSchema.index({ sellerId: 1, userId: 1 }, { unique: true, partialFilterExpression: { userId: { $type: "string" } } });
var AdminAuditLogSchema = new Schema({
    action: { type: String, required: true },
    reviewId: { type: String, required: true },
    adminId: { type: String, required: true },
    details: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
});
var AdminAuditLogModel = mongoose.model("AdminAuditLog", AdminAuditLogSchema);
// Weapons / Modes / Ranks / Mercenaries schemas (added to support seeding endpoints)
var MercenarySchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
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
var MercenaryModel = mongoose.model("Mercenary", MercenarySchema);
var WeaponModel = mongoose.model("Weapon", WeaponSchema);
var ModeModel = mongoose.model("Mode", ModeSchema);
var RankModel = mongoose.model("Rank", RankSchema);
var ChatMessageSchema = new Schema({
    sender: { type: String, required: true },
    text: { type: String, required: true },
    replyTo: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
});
var ChatMessageModel = mongoose.model("ChatMessage", ChatMessageSchema);
var ChatUserSchema = new Schema({
    userName: { type: String, required: true },
    phone: { type: String, default: "" },
    verified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});
var ChatUserModel = mongoose.model("ChatUser", ChatUserSchema);
var ChatSettingsSchema = new Schema({
    name: { type: String, default: "chat" },
    registrationEnabled: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now },
});
var ChatSettingsModel = mongoose.model("ChatSettings", ChatSettingsSchema);
var insertUserSchema = z.object({
    username: z.string(),
    password: z.string(),
});
var insertPostSchema = z.object({
  title: z.string(),
  content: z.string(),
  summary: z.string(),
  image: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  author: z.string(),
  readingTime: z.number(),
  featured: z.boolean().optional(),
  order: z.number().optional(),
});
var insertCommentSchema = z.object({
    postId: z.string(),
    parentCommentId: z.string().optional(),
    name: z.string(),
    content: z.string(),
});
var insertChatMessageSchema = z.object({
    sender: z.string(),
    text: z.string(),
    replyTo: z.string().optional(),
});
var insertEventSchema = z.object({
  title: z.string(),
  titleAr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  date: z.string(),
  type: z.string(),
  image: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).optional(),
  canonicalUrl: z.string().optional(),
  ogImage: z.string().optional(),
  twitterImage: z.string().optional(),
  schemaType: z.string().optional(),
  order: z.number().optional(),
});
var insertNewsSchema = z.object({
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
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).optional(),
  canonicalUrl: z.string().optional(),
  ogImage: z.string().optional(),
  twitterImage: z.string().optional(),
  schemaType: z.string().optional(),
  order: z.number().optional(),
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
async function connectMongoDB() {
    if (isConnected) {
        console.log("MongoDB is already connected");
        return;
    }
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error("MONGODB_URI environment variable is not defined");
        }
        await mongoose2.connect(mongoUri);
        isConnected = true;
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        throw error;
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
        this.connect();
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
                id: "1",
                name: "Wolf",
                image: "https://files.catbox.moe/6npa73.jpeg",
                role: "Assault",
                description: "Aggressive assault specialist",
            },
            {
                id: "2",
                name: "Vipers",
                image: "https://files.catbox.moe/4il6hi.jpeg",
                role: "Sniper",
                description: "Precision sniper expert",
            },
            {
                id: "3",
                name: "Sisterhood",
                image: "https://files.catbox.moe/3o58nb.jpeg",
                role: "Medic",
                description: "Support and healing specialist",
            },
            {
                id: "4",
                name: "Black Mamba",
                image: "https://files.catbox.moe/r26ox6.jpeg",
                role: "Scout",
                description: "Fast reconnaissance scout",
            },
            {
                id: "5",
                name: "Arch Honorary",
                image: "https://files.catbox.moe/ctwnqz.jpeg",
                role: "Guardian",
                description: "Protective guardian role",
            },
            {
                id: "6",
                name: "Desperado",
                image: "https://files.catbox.moe/hh7h5u.jpeg",
                role: "Engineer",
                description: "Technical engineer specialist",
            },
            {
                id: "7",
                name: "Ronin",
                image: "https://files.catbox.moe/eck3jc.jpeg",
                role: "Samurai",
                description: "Melee combat warrior",
            },
            {
                id: "8",
                name: "Dean",
                image: "https://files.catbox.moe/t78mvu.jpeg",
                role: "Specialist",
                description: "Specialized tactics expert",
            },
            {
                id: "9",
                name: "Thoth",
                image: "https://files.catbox.moe/g4zfzn.jpeg",
                role: "Guardian",
                description: "Protective guardian role",
            },
            {
                id: "10",
                name: "SFG",
                image: "https://files.catbox.moe/3bba2g.jpeg",
                role: "Special Forces",
                description: "Special forces operative",
            },
        ];
        mercenaries.forEach((merc) => this.mercenaries.set(merc.id, merc));
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
    async getAllPosts() {
        const posts = await PostModel.find().sort({ order: -1, createdAt: -1 }).lean();
        return posts.map((post) => ({
            ...post,
            id: String(post._id),
            slug: post.slug || "",
            tags: post.tags || [],
            views: post.views || 0,
            category: post.category || "",
            author: post.author || "Unknown",
            order: post.order || 0,
        }));
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
        const plainDesc = String(payload.summary || "").replace(/<[^>]*>/g, "");
        if (!payload.seoDescription) payload.seoDescription = plainDesc.substring(0, 155);
        if (!payload.seoKeywords) payload.seoKeywords = (payload.title || "").toLowerCase().split(/\s+/).filter(Boolean).slice(0, 8);
        if (!payload.canonicalUrl) payload.canonicalUrl = `${baseUrl}/article/${payload.post_slug}`;
        if (!payload.ogImage && payload.image) payload.ogImage = payload.image;
        if (!payload.twitterImage && (payload.ogImage || payload.image)) payload.twitterImage = payload.ogImage || payload.image;
        if (!payload.schemaType) payload.schemaType = "Article";
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
    async getCommentsByPostId(postId) {
        const comments = await CommentModel.find({ postId }).sort({
            createdAt: -1,
        });
        return comments;
    }
    async createComment(comment) {
        const newComment = await CommentModel.create(comment);
        return newComment;
    }
    async deleteComment(commentId) {
        const result = await CommentModel.findByIdAndDelete(commentId);
        return !!result;
    }
    async getAllEvents() {
        const events = await EventModel.find().sort({ order: -1, _id: -1 }).lean();
        return events.map((event) => ({
            ...event,
            id: String(event._id),
            order: event.order || 0,
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
        return { ...ev, id: String(ev._id) };
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
            createdAt: news.createdAt,
        };
    }
    async getAllMercenaries() {
        const mercenaries = await MercenaryModel.find()
            .sort({ order: 1, createdAt: -1 })
            .lean();
        return mercenaries.map((m) => ({
            ...m,
            id: m.id || String(m._id),
            voiceLines: Array.isArray(m.voiceLines) ? m.voiceLines : [],
        }));
    }
    async createMercenary(merc) {
        const newMerc = await MercenaryModel.create(merc);
        const lean = await MercenaryModel.findById(newMerc._id).lean();
        if (!lean) throw new Error("Failed to create mercenary");
        return { ...lean, id: lean.id || String(lean._id) };
    }
    async deleteMercenary(id) {
        const res = await MercenaryModel.findByIdAndDelete(id);
        return !!res;
    }
    async updateMercenary(id, data) {
        const updated = await MercenaryModel.findOneAndUpdate({ id }, data, {
            new: true,
        }).lean();
        if (!updated) return void 0;
        return { ...updated, id: updated.id || String(updated._id) };
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
    } catch {}
}

function requireContentCreator(req, res, next) {
    const role = req.user?.role || "";
    if (role === "super_admin" || role === "admin") return next();
    return res.status(403).json({ error: "Forbidden: Content creator role required" });
}

function requireAdminOnly(req, res, next) {
    const role = req.user?.role || "";
    if (role === "super_admin" || role === "admin") return next();
    return res.status(403).json({ error: "Forbidden: Admin role required" });
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

function requireCsrf(req, res, next) {
    const method = String(req.method || "").toUpperCase();
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        const token = req.headers["x-csrf-token"] || req.body?.csrfToken;
        const base = process.env.CSRF_SECRET || "";
        if (!base || !token || String(token) !== base) {
            return res.status(403).json({ error: "CSRF validation failed" });
        }
    }
    next();
}

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
function generateSummary(content, maxLength = 200) {
    const plainText = content.replace(/[#*`]/g, "").trim();
    if (plainText.length <= maxLength) {
        return plainText;
    }
    return plainText.substring(0, maxLength).trim() + "...";
}
function formatDate(date) {
    const now = /* @__PURE__ */ new Date();
    const diffMs = now.getTime() - date.getTime();
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
        return date.toLocaleDateString("en-US", {
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
            res.status(201).json({
                message: "Registered. Verify email and phone.",
                emailCode,
                phoneCode,
            });
        } catch (error) {
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
            if (!user)
                return res.status(401).json({ error: "Invalid credentials" });
            const ok = await comparePassword(password, user.password);
            if (!ok)
                return res.status(401).json({ error: "Invalid credentials" });
            const id =
                (user && (user.id || user._id?.toString?.() || user._id)) ||
                undefined;
            const token = generateToken({ id, username: user.username });
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
            const { category, search, featured } = req.query;
            let posts = await storage.getAllPosts();
            if (category && category !== "all") {
                posts = posts.filter(
                    (post) =>
                        post.category.toLowerCase() === category.toLowerCase(),
                );
            }
            if (search) {
                const searchLower = search.toLowerCase();
                posts = posts.filter(
                    (post) =>
                        post.title.toLowerCase().includes(searchLower) ||
                        post.summary.toLowerCase().includes(searchLower) ||
                        post.content.toLowerCase().includes(searchLower) ||
                        post.tags.some((tag) =>
                            tag.toLowerCase().includes(searchLower),
                        ),
                );
            }
            if (featured === "true") {
                posts = posts.filter((post) => post.featured);
            }
            const formattedPosts = posts.map((post) => ({
                ...post,
                date: formatDate(post.createdAt),
            }));
            res.json(formattedPosts);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.get("/api/posts/:id", async (req, res) => {
        try {
            const idOrSlug = req.params.id;
            let post = null;
            // Try to find by MongoDB ObjectId first
            if (/^[a-f\d]{24}$/i.test(idOrSlug)) {
                post = await storage.getPostById(idOrSlug);
            }
            // If not found by ID, try to find by slug
            if (!post) {
                post = await storage.getPostBySlug(idOrSlug);
            }
            if (!post) {
                return res.status(404).json({ error: "Post not found" });
            }
            // Increment views using the actual ID
            await storage.incrementPostViews(post.id);
            const formattedPost = {
                ...post,
                date: formatDate(post.createdAt),
            };
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
    app2.post("/api/posts", requireAuth, requireContentCreator, async (req, res) => {
        try {
            const data = insertPostSchema.parse(req.body);
            stripOrderingFields(data, req.user?.role || "");
            const readingTime =
                data.readingTime || calculateReadingTime(data.content);
            const summary = data.summary || generateSummary(data.content);
            // Generate slug from title if not provided
            const slug = data.slug || slugify(data.title);
            const post = await storage.createPost({
                ...data,
                readingTime,
                summary,
                slug,
            });
            res.status(201).json(post);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    app2.patch("/api/posts/:id", requireAuth, requireAdminOnly, async (req, res) => {
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
    app2.delete("/api/posts/:id", requireAuth, requireAdminOnly, async (req, res) => {
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
    app2.get("/api/posts/:id/comments", async (req, res) => {
        try {
            const comments = await storage.getCommentsByPostId(req.params.id);
            const formattedComments = comments.map((comment) => ({
                id: String(comment._id),
                name: comment.name,
                content: comment.content,
                date: formatDate(comment.createdAt),
                parentCommentId: comment.parentCommentId || null,
            }));
            res.json(formattedComments);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.delete("/api/posts/:id/comments/:commentId", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const { id, commentId } = req.params;
            const ok = await storage.deleteComment(commentId);
            if (!ok) return res.status(404).json({ error: "Comment not found" });
            const adminId = req.user?.id || "";
            await storage.auditAdminAction("delete_post_comment", commentId, adminId, { postId: id });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.post("/api/posts/:id/comments", async (req, res) => {
        try {
            const { id } = req.params;
            const { author, content, parentCommentId } = req.body;
            const commentData = {
                postId: id,
                name: author,
                content,
                parentCommentId: parentCommentId || void 0,
            };
            const data = insertCommentSchema.parse(commentData);
            const comment = await storage.createComment(data);
            const formattedComment = {
                ...comment,
                date: formatDate(comment.createdAt),
            };
            res.status(201).json(formattedComment);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    app2.get("/api/events", async (req, res) => {
        try {
            const events = await storage.getAllEvents();
            res.json(events);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.get("/api/events/slug/:slug", async (req, res) => {
        try {
            const { slug } = req.params;
            let ev = await storage.getEventBySlug(slug);
            if (!ev) {
                const alt = slugifyEventName(String(slug).replace(/-/g, " "));
                if (alt && alt !== slug) {
                    ev = await storage.getEventBySlug(alt);
                }
            }
            if (!ev) {
                try {
                    const byCanonical = await EventModel.findOne({ canonicalUrl: { $regex: new RegExp(`/events/${slug}$`, "i") } }).lean();
                    if (byCanonical) {
                        ev = { ...byCanonical, id: String(byCanonical._id) };
                    }
                } catch {}
            }
            if (!ev) {
                try {
                    const candidates = await EventModel.find().select("title").lean();
                    for (const c of candidates) {
                        if (slugifyEventName(c.title || "") === slug) {
                            const found = await EventModel.findById(c._id).lean();
                            if (found) {
                                ev = { ...found, id: String(found._id) };
                                break;
                            }
                        }
                    }
                } catch {}
            }
            if (!ev) {
                try { await storage.logUrlMatchFailure("event", slug); } catch {}
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
    app2.post("/api/events", requireAuth, requireContentCreator, async (req, res) => {
        try {
            const data = insertEventSchema.parse(req.body);
            stripOrderingFields(data, req.user?.role || "");
            const base = (process.env.PUBLIC_BASE_URL || "https://crossfire.wiki").replace(/\/$/, "");
            const slug = String(data.title || "");
            const eventSlug = slugifyEventName(slug);
            const canonical = `${base}/events/${eventSlug}`;
            const withSeo = { ...data };
            (withSeo).event_name_slug = withSeo.event_name_slug || eventSlug;
            (withSeo).canonicalUrl = withSeo.canonicalUrl || canonical;
            const event = await storage.createEvent(withSeo);
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
                            htmlContent: undefined,
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
                    failedEvents.push({
                        title: eventData.title,
                        error: err.message
                    });
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
    app2.delete("/api/events/:id", requireAuth, requireAdminOnly, async (req, res) => {
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

    // Scrape events endpoint for admin panel
    app2.post("/api/scrape-events", async (req, res) => {
        try {
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

    app2.get("/api/stats", requireAuth, async (req, res) => {
        try {
            const posts = await storage.getAllPosts();
            const allComments = await Promise.all(
                posts.map((post) => storage.getCommentsByPostId(post.id)),
            );
            const totalComments = allComments.flat().length;
            const totalViews = posts.reduce((sum, post) => sum + post.views, 0);
            res.json({
                totalPosts: posts.length,
                totalComments,
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
            const news = await storage.getAllNews();
            res.json(news);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.post("/api/news", requireAuth, requireContentCreator, async (req, res) => {
        try {
            const data = insertNewsSchema.parse(req.body);
            stripOrderingFields(data, req.user?.role || "");
            const news = await storage.createNews(data);
            res.status(201).json(news);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    app2.get("/api/news/slug/:slug", async (req, res) => {
        try {
            const { slug } = req.params;
            let news = await storage.getNewsBySlug(slug);
            if (!news) {
                const alt = slugifyEventName(String(slug).replace(/-/g, " "));
                if (alt && alt !== slug) {
                    news = await storage.getNewsBySlug(alt);
                }
            }
            if (!news) {
                try {
                    const byCanonical = await NewsModel.findOne({ canonicalUrl: { $regex: new RegExp(`/news/${slug}$`, "i") } }).lean();
                    if (byCanonical) {
                        news = { ...byCanonical, id: String(byCanonical._id), news_slug: byCanonical.news_slug || "" };
                    }
                } catch {}
            }
            if (!news) {
                try {
                    const candidates = await NewsModel.find().select("title").lean();
                    for (const c of candidates) {
                        if (slugifyEventName(c.title || "") === slug) {
                            const found = await NewsModel.findById(c._id).lean();
                            if (found) {
                                news = { ...found, id: String(found._id), news_slug: found.news_slug || "" };
                                break;
                            }
                        }
                    }
                } catch {}
            }
            if (!news) {
                try { await storage.logUrlMatchFailure("news", slug); } catch {}
                return res.status(404).json({ error: "News not found" });
            }
            return res.json(news);
        } catch (error) {
            return res.status(404).json({ error: "News not found" });
        }
    });
    app2.get("/api/news/:id", async (req, res) => {
        try {
            const news = await storage.getNewsById(req.params.id);
            if (!news) {
                return res.status(404).json({ error: "News not found" });
            }
            res.json(news);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app2.patch("/api/news/:id", requireAuth, requireAdminOnly, async (req, res) => {
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
    app2.delete("/api/news/:id", requireAuth, requireAdminOnly, async (req, res) => {
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

    app2.get("/api/tutorials", async (req, res) => {
        try {
            const items = await TutorialModel.find()
                .sort({ order: 1, createdAt: -1 })
                .lean();
            res.json(items.map((it) => ({ ...it, id: String(it._id) })));
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

    app2.get("/api/chat/messages", async (req, res) => {
        try {
            const limit = Math.min(
                parseInt(String(req.query.limit || "50"), 10) || 50,
                200,
            );
            const items = await ChatMessageModel.find()
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean();
            res.json(
                items.reverse().map((it) => ({ ...it, id: String(it._id) })),
            );
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.post("/api/chat/messages", async (req, res) => {
        try {
            const data = insertChatMessageSchema.parse(req.body);
            const saved = await ChatMessageModel.create({
                sender: data.sender,
                text: data.text,
                replyTo: data.replyTo || "",
            });
            const doc = await ChatMessageModel.findById(saved._id).lean();
            const payload = JSON.stringify({
                type: "message",
                from: doc.sender,
                text: doc.text,
                replyTo: doc.replyTo || "",
            });
            connectedUsers.forEach((s) =>
                s.forEach((c) => {
                    try {
                        c.send(payload);
                    } catch {}
                }),
            );
            res.status(201).json({ ...doc, id: String(doc._id) });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    app2.post("/api/tutorials", requireAuth, requireContentCreator, async (req, res) => {
        try {
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
            const created = await TutorialModel.create({
                title: body.title,
                youtubeUrl: url,
                youtubeId,
                description: body.description || "",
                likes: 0,
                order: typeof body.order === "number" && (req.user?.role === "super_admin") ? body.order : 9999,
            });
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

    app2.get("/api/tutorials/:id/comments", async (req, res) => {
        try {
            const comments = await TutorialCommentModel.find({
                tutorialId: req.params.id,
            })
                .sort({ createdAt: -1 })
                .lean();
            res.json(comments.map((c) => ({ ...c, id: String(c._id) })));
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.post("/api/tutorials/:id/comments", async (req, res) => {
        try {
            const { author, content } = req.body;
            if (!author || !content)
                return res
                    .status(400)
                    .json({ error: "author and content required" });
            const created = await TutorialCommentModel.create({
                tutorialId: req.params.id,
                author,
                content,
            });
            const lean = await TutorialCommentModel.findById(
                created._id,
            ).lean();
            res.status(201).json({ ...lean, id: String(lean._id) });
        } catch (error) {
            res.status(400).json({ error: error.message });
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
            res.status(400).json({ error: err.message });
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
    app2.get("/api/tickets", requireAuth, async (req, res) => {
        try {
            const user = req.user;
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
            res.send(`# CrossFire Wiki - Robots.txt
User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/*
Disallow: /login
Disallow: /register
Disallow: /reset-password
Disallow: /my-tickets
Disallow: /api/

# Allow important pages
Allow: /weapons
Allow: /modes
Allow: /ranks
Allow: /tutorials
Allow: /news
Allow: /events
Allow: /posts
Allow: /article/*
Allow: /news/*
Allow: /events/*
Allow: /tutorials/*
Allow: /category/*

# Crawl delay for politeness
Crawl-delay: 0.5

# Sitemap location
Sitemap: https://crossfire.wiki/sitemap.xml
`);
        } catch (error) {
            res.status(500).type("text/plain").send("User-agent: *\nAllow: /\nSitemap: https://crossfire.wiki/sitemap.xml\n");
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
                const blob = new Blob([file.buffer], { type: file.mimetype });
                fd.append("fileToUpload", blob, file.originalname);
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
    app2.patch("/api/events/:id", requireAuth, requireAdminOnly, async (req, res) => {
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
        requireAuth,
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
                const blob = new Blob([req.file.buffer], {
                    type: req.file.mimetype,
                });
                formData.append("fileToUpload", blob, req.file.originalname);
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
        next();
    }

    // Scraping routes (fallback for deployments that don't keep full server)
    try {
        const {
            scrapeForumAnnouncements,
            scrapeEventDetails,
            scrapeMultipleEvents,
            scrapeRanks,
        } = await import("./services/scraper.js");

        app2.get("/api/scrape/forum-list", async (req, res) => {
            try {
                const posts = await scrapeForumAnnouncements();
                res.json(posts);
            } catch (err) {
                res.status(500).json({
                    error: err.message || "Failed to scrape forum",
                });
            }
        });

        app2.post("/api/scrape/event-details", async (req, res) => {
            try {
                const { url } = req.body;
                if (!url)
                    return res.status(400).json({ error: "URL is required" });
                const event = await scrapeEventDetails(url);
                res.json(event);
            } catch (err) {
                res.status(500).json({
                    error: err.message || "Failed to scrape event details",
                });
            }
        });

        app2.post("/api/admin/scrape-and-create-events", async (req, res) => {
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
                res.json({ events: created });
            } catch (err) {
                res.status(500).json({
                    error: err.message || "Failed to scrape and create events",
                });
            }
        });

        app2.get("/api/scrape/ranks", async (req, res) => {
            try {
                const ranks = await scrapeRanks();
                res.json(ranks);
            } catch (err) {
                res.status(500).json({
                    error: err.message || "Failed to scrape ranks",
                });
            }
        });

        app2.post("/api/admin/scrape-and-create-ranks", async (req, res) => {
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

        app2.post("/api/admin/reset-ranks", async (req, res) => {
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

    app2.get("/api/security/csrf-token", (req, res) => {
        const token = process.env.CSRF_SECRET || "";
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
    app2.get("/api/admin/admins", requireAuth, requireSuperAdmin, async (_req, res) => {
        try {
            const admins = await storage.getAllAdmins();
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
            } catch {}
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
            } catch {}
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
            } catch {}
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
    app2.get("/api/settings/site", requireAuth, requireSuperAdmin, async (_req, res) => {
        try {
            const s = await storage.getSiteSettings();
            res.json(s);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app2.put("/api/settings/site", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const updated = await storage.updateSiteSettings(req.body || {});
            res.json(updated);
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
var connectedUsers = new Map();
app.use(
    cors({
        origin: frontendUrl === "*" ? "*" : [frontendUrl],
        credentials: true,
        methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }),
);
app.use(
    express.json({
        verify: (req, _res, buf) => {
            req.rawBody = buf;
        },
    }),
);
app.use(express.urlencoded({ extended: false }));
app.set("trust proxy", 1); // Trust the first proxy
// Lightweight request logging: avoid capturing response bodies to save CPU/RAM
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
    
    // Serve built client files from dist/client
    const clientDistPath = path.resolve(currentDir, "dist", "client");
    app.use("/assets", express.static(path.join(clientDistPath, "assets"), { maxAge: "1d" }));
    app.use(express.static(clientDistPath, { maxAge: "1d" }));
    
    app.use((err, _req, res, _next) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
        throw err;
    });
    
    // Serve index.html for all non-API routes (SPA routing)
    app.get("*", (_req, res) => {
        const indexPath = path.join(clientDistPath, "index.html");
        res.set({
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        });
        res.sendFile(indexPath, (err) => {
            if (err) {
                res.status(404).json({
                    message: "Frontend not found. Make sure the client is built.",
                    hint: "Run: npm run build",
                });
            }
        });
    });

    // Debug endpoints for deployment checks
    app.get("/api/debug/assets", (_req, res) => {
        res.json({
            assetsPath,
            hasScraperApiKey: Boolean(process.env.SCRAPER_API_KEY),
        });
    });

    // Auto-seed database if AUTO_SEED=true - uses ranksData from seed-from-urls.js
    if (process.env.AUTO_SEED === "true") {
        (async () => {
            try {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                log("🌱 AUTO_SEED enabled: seeding ranks from seed-from-urls.js...");
                await RankModel.deleteMany({});
                
                // Import ranks data from seed-from-urls.js
                const seedModule = await import("./seed-from-urls.js");
                const allRanks = seedModule.ranksData || [];
                
                if (allRanks.length > 0) {
                    await RankModel.insertMany(allRanks);
                    log(`✅ Seeded ${allRanks.length} ranks successfully`);
                } else {
                    log("⚠️ No ranks data found in seed-from-urls.js");
                }
            } catch (err) {
                log(`⚠️ Auto-seeding error: ${err.message}`);
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
                const url = new URL(
                    req.url || "",
                    `http://${req.headers.host}`,
                );
                if (url.pathname === "/ws") {
                    wss.handleUpgrade(req, socket, head, (ws) => {
                        wss.emit("connection", ws, req);
                    });
                } else {
                    socket.destroy();
                }
            } catch {
                try {
                    socket.destroy();
                } catch {}
            }
        });
        function broadcastPresence() {
            const users = Array.from(connectedUsers.keys());
            const payload = JSON.stringify({ type: "presence", users });
            connectedUsers.forEach((set) => {
                set.forEach((client) => {
                    try {
                        client.send(payload);
                    } catch {}
                });
            });
        }
        wss.on("connection", (ws, req) => {
            try {
                const url = new URL(
                    req.url || "",
                    `http://${req.headers.host}`,
                );
                const username =
                    url.searchParams.get("username") || "Anonymous";
                let set = connectedUsers.get(username);
                if (!set) {
                    set = new Set();
                    connectedUsers.set(username, set);
                }
                set.add(ws);
                broadcastPresence();
                ws.on("message", (data) => {
                    let msg = null;
                    try {
                        msg = JSON.parse(String(data));
                    } catch {}
                    if (!msg) return;
                    const payload = JSON.stringify({
                        type: "message",
                        from: msg.from || username,
                        text: msg.text || "",
                    });
                    connectedUsers.forEach((s) =>
                        s.forEach((c) => {
                            try {
                                c.send(payload);
                            } catch {}
                        }),
                    );
                });
                ws.on("close", () => {
                    const s = connectedUsers.get(username);
                    if (s) {
                        s.delete(ws);
                        if (s.size === 0) connectedUsers.delete(username);
                    }
                    broadcastPresence();
                });
            } catch {}
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

    app.post("/api/admin/migrate-slugs", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            let eventsUpdated = 0;
            let postsUpdated = 0;
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
            res.json({ success: true, eventsUpdated, postsUpdated });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

