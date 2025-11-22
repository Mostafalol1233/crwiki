// Ensure environment variables from .env are loaded when node runs index.js directly
import "dotenv/config";

// server/index-production.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

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
  createdAt: { type: Date, default: Date.now }
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
  createdAt: { type: Date, default: Date.now }
});
var CommentSchema = new Schema({
  postId: { type: String, required: true },
  parentCommentId: { type: String },
  name: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
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
  schemaType: { type: String, default: "Event" }
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
  createdAt: { type: Date, default: Date.now }
});
var TutorialSchema = new Schema({
  title: { type: String, required: true },
  youtubeUrl: { type: String, required: true },
  youtubeId: { type: String, required: true },
  description: { type: String, default: "" },
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
var TutorialCommentSchema = new Schema({
  tutorialId: { type: String, required: true },
  author: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
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
  updatedAt: { type: Date, default: Date.now }
});
var TicketReplySchema = new Schema({
  ticketId: { type: String, required: true },
  authorName: { type: String, required: true },
  content: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
var AdminSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "admin" },
  createdAt: { type: Date, default: Date.now }
});
var NewsletterSubscriberSchema = new Schema({
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});
var SellerSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  images: { type: [String], default: [] },
  prices: { type: [{ item: String, price: Number }], default: [] },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  whatsapp: { type: String, default: "" },
  discord: { type: String, default: "" },
  website: { type: String, default: "" },
  featured: { type: Boolean, default: false },
  promotionText: { type: String, default: "" },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
var SellerReviewSchema = new Schema({
  sellerId: { type: String, required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});
var UserModel = mongoose.model("User", UserSchema);
var PostModel = mongoose.model("Post", PostSchema);
var CommentModel = mongoose.model("Comment", CommentSchema);
var EventModel = mongoose.model("Event", EventSchema);
var NewsModel = mongoose.model("News", NewsSchema);
var TicketModel = mongoose.model("Ticket", TicketSchema);
var TutorialModel = mongoose.model("Tutorial", TutorialSchema);
var TutorialCommentModel = mongoose.model("TutorialComment", TutorialCommentSchema);
var TicketReplyModel = mongoose.model("TicketReply", TicketReplySchema);
var AdminModel = mongoose.model("Admin", AdminSchema);
var NewsletterSubscriberModel = mongoose.model("NewsletterSubscriber", NewsletterSubscriberSchema);
var SellerModel = mongoose.model("Seller", SellerSchema);
var SellerReviewModel = mongoose.model("SellerReview", SellerReviewSchema);
// Weapons / Modes / Ranks / Mercenaries schemas (added to support seeding endpoints)
var MercenarySchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  role: { type: String, default: "" },
  description: { type: String, default: "" },
  voiceLines: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});
var WeaponSchema = new Schema({
  name: { type: String, required: true },
  image: { type: String, default: "" },
  description: { type: String, default: "" },
  category: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});
var ModeSchema = new Schema({
  name: { type: String, required: true },
  image: { type: String, default: "" },
  description: { type: String, default: "" },
  video: { type: String, default: "" },
  type: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});
var RankSchema = new Schema({
  name: { type: String, required: true },
  tier: { type: Number, default: 0 },
  emblem: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});
var MercenaryModel = mongoose.model("Mercenary", MercenarySchema);
var WeaponModel = mongoose.model("Weapon", WeaponSchema);
var ModeModel = mongoose.model("Mode", ModeSchema);
var RankModel = mongoose.model("Rank", RankSchema);
var insertUserSchema = z.object({
  username: z.string(),
  password: z.string()
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
  featured: z.boolean().optional()
});
var insertCommentSchema = z.object({
  postId: z.string(),
  parentCommentId: z.string().optional(),
  name: z.string(),
  content: z.string()
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
  schemaType: z.string().optional()
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
  schemaType: z.string().optional()
});
var insertTicketSchema = z.object({
  title: z.string(),
  description: z.string(),
  userName: z.string(),
  userEmail: z.string(),
  status: z.string().optional(),
  priority: z.string().optional(),
  category: z.string()
});
var insertTicketReplySchema = z.object({
  ticketId: z.string(),
  authorName: z.string(),
  content: z.string(),
  isAdmin: z.boolean().optional()
});
var insertAdminSchema = z.object({
  username: z.string(),
  password: z.string(),
  role: z.string().optional()
});
var insertNewsletterSubscriberSchema = z.object({
  email: z.string().email()
});
var insertSellerSchema = z.object({
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
  promotionText: z.string().optional()
});
var insertSellerReviewSchema = z.object({
  sellerId: z.string(),
  userName: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional()
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
      { id: "1", name: "Wolf", image: "https://files.catbox.moe/6npa73.jpeg", role: "Assault", description: "Aggressive assault specialist" },
      { id: "2", name: "Vipers", image: "https://files.catbox.moe/4il6hi.jpeg", role: "Sniper", description: "Precision sniper expert" },
      { id: "3", name: "Sisterhood", image: "https://files.catbox.moe/3o58nb.jpeg", role: "Medic", description: "Support and healing specialist" },
      { id: "4", name: "Black Mamba", image: "https://files.catbox.moe/r26ox6.jpeg", role: "Scout", description: "Fast reconnaissance scout" },
      { id: "5", name: "Arch Honorary", image: "https://files.catbox.moe/ctwnqz.jpeg", role: "Guardian", description: "Protective guardian role" },
      { id: "6", name: "Desperado", image: "https://files.catbox.moe/hh7h5u.jpeg", role: "Engineer", description: "Technical engineer specialist" },
      { id: "7", name: "Ronin", image: "https://files.catbox.moe/eck3jc.jpeg", role: "Samurai", description: "Melee combat warrior" },
      { id: "8", name: "Dean", image: "https://files.catbox.moe/t78mvu.jpeg", role: "Specialist", description: "Specialized tactics expert" },
      { id: "9", name: "Thoth", image: "https://files.catbox.moe/g4zfzn.jpeg", role: "Guardian", description: "Protective guardian role" },
      { id: "10", name: "SFG", image: "https://files.catbox.moe/3bba2g.jpeg", role: "Special Forces", description: "Special forces operative" }
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
    const updated = await UserModel.findByIdAndUpdate(id, updates, { new: true }).lean();
    if (!updated) return void 0;
    return { ...updated, id: String(updated._id) };
  }
  async getAllPosts() {
    const posts = await PostModel.find().sort({ createdAt: -1 }).lean();
    return posts.map((post) => ({
      ...post,
      id: String(post._id),
      tags: post.tags || [],
      views: post.views || 0,
      category: post.category || "",
      author: post.author || "Unknown"
    }));
  }
  async getPostById(id) {
    const post = await PostModel.findById(id).lean();
    if (!post) return void 0;
    return {
      ...post,
      id: String(post._id),
      tags: post.tags || [],
      views: post.views || 0,
      category: post.category || "",
      author: post.author || "Unknown"
    };
  }
  async createPost(post) {
    const newPost = await PostModel.create(post);
    const lean = await PostModel.findById(newPost._id).lean();
    if (!lean) throw new Error("Failed to create post");
    return {
      ...lean,
      id: String(lean._id),
      tags: lean.tags || [],
      views: lean.views || 0,
      category: lean.category || "",
      author: lean.author || "Unknown"
    };
  }
  async updatePost(id, post) {
    const updated = await PostModel.findByIdAndUpdate(id, post, { new: true }).lean();
    if (!updated) return void 0;
    return {
      ...updated,
      id: String(updated._id),
      tags: updated.tags || [],
      views: updated.views || 0,
      category: updated.category || "",
      author: updated.author || "Unknown"
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
    const comments = await CommentModel.find({ postId }).sort({ createdAt: -1 });
    return comments;
  }
  async createComment(comment) {
    const newComment = await CommentModel.create(comment);
    return newComment;
  }
  async getAllEvents() {
    const events = await EventModel.find().lean();
    return events.map((event) => ({
      ...event,
      id: String(event._id)
    }));
  }
  async createEvent(event) {
    const newEvent = await EventModel.create(event);
    const lean = await EventModel.findById(newEvent._id).lean();
    if (!lean) throw new Error("Failed to create event");
    return {
      ...lean,
      id: String(lean._id)
    };
  }
  async deleteEvent(id) {
    const result = await EventModel.findByIdAndDelete(id);
    return !!result;
  }
  async getAllNews() {
    const news = await NewsModel.find().sort({ createdAt: -1 });
    return news.map((item) => ({
      id: String(item._id),
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
      createdAt: item.createdAt
    }));
  }
  async createNews(news) {
    const newNews = await NewsModel.create(news);
    return {
      id: String(newNews._id),
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
      createdAt: newNews.createdAt
    };
  }
  async updateNews(id, news) {
    const updated = await NewsModel.findByIdAndUpdate(id, news, { new: true });
    if (!updated) return void 0;
    return {
      id: String(updated._id),
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
      createdAt: updated.createdAt
    };
  }
  async deleteNews(id) {
    const result = await NewsModel.findByIdAndDelete(id);
    return !!result;
  }
  async getAllMercenaries() {
    const mercenaries = await MercenaryModel.find().sort({ createdAt: -1 }).lean();
    return mercenaries.map((m) => ({ ...m, id: m.id || String(m._id), voiceLines: Array.isArray(m.voiceLines) ? m.voiceLines : [] }));
  }
  async createMercenary(merc) {
    const newMerc = await MercenaryModel.create(merc);
    const lean = await MercenaryModel.findById(newMerc._id).lean();
    if (!lean) throw new Error('Failed to create mercenary');
    return { ...lean, id: lean.id || String(lean._id) };
  }
  async deleteMercenary(id) {
    const res = await MercenaryModel.findByIdAndDelete(id);
    return !!res;
  }
  async updateMercenary(id, data) {
    const updated = await MercenaryModel.findOneAndUpdate({ id }, data, { new: true }).lean();
    if (!updated) return void 0;
    return { ...updated, id: updated.id || String(updated._id) };
  }
  async removeDuplicateMercenaries() {
    const all = await MercenaryModel.find().lean().sort({ createdAt: 1 });
    const seen = new Map();
    const toDelete = [];
    for (const merc of all) {
      const key = (merc.name || '').toLowerCase();
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
      id: String(ticket._id)
    }));
  }
  async getTicketById(id) {
    const ticket = await TicketModel.findById(id).lean();
    if (!ticket) return void 0;
    return {
      ...ticket,
      id: String(ticket._id)
    };
  }
  async getTicketsByEmail(email) {
    const tickets = await TicketModel.find({ userEmail: email }).sort({ createdAt: -1 }).lean();
    return tickets.map((ticket) => ({
      ...ticket,
      id: String(ticket._id)
    }));
  }
  async createTicket(ticket) {
    const newTicket = await TicketModel.create(ticket);
    const ticketObj = await TicketModel.findById(newTicket._id).lean();
    return {
      ...ticketObj,
      id: String(ticketObj._id)
    };
  }
  async updateTicket(id, ticket) {
    const updated = await TicketModel.findByIdAndUpdate(
      id,
      { ...ticket, updatedAt: /* @__PURE__ */ new Date() },
      { new: true }
    ).lean();
    if (!updated) return void 0;
    return {
      ...updated,
      id: String(updated._id)
    };
  }
  async deleteTicket(id) {
    const result = await TicketModel.findByIdAndDelete(id);
    return !!result;
  }
  async getTicketReplies(ticketId) {
    const replies = await TicketReplyModel.find({ ticketId }).sort({ createdAt: 1 });
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
      id: String(admin._id)
    }));
  }
  async getAdminById(id) {
    const admin = await AdminModel.findById(id).lean();
    if (!admin) return void 0;
    return {
      ...admin,
      id: String(admin._id)
    };
  }
  async getAdminByUsername(username) {
    const admin = await AdminModel.findOne({ username }).lean();
    if (!admin) return void 0;
    return {
      ...admin,
      id: String(admin._id)
    };
  }
  async createAdmin(admin) {
    const newAdmin = await AdminModel.create(admin);
    const adminObj = await AdminModel.findById(newAdmin._id).lean();
    return {
      ...adminObj,
      id: String(adminObj._id)
    };
  }
  async updateAdmin(id, admin) {
    const updated = await AdminModel.findByIdAndUpdate(id, admin, { new: true }).lean();
    if (!updated) return void 0;
    return {
      ...updated,
      id: String(updated._id)
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
      id: String(event._id)
    };
  }
  async updateEvent(id, event) {
    const updated = await EventModel.findByIdAndUpdate(id, event, { new: true }).lean();
    if (!updated) return void 0;
    return {
      ...updated,
      id: String(updated._id)
    };
  }
  async getAllNewsletterSubscribers() {
    const subscribers = await NewsletterSubscriberModel.find().sort({ createdAt: -1 });
    return subscribers;
  }
  async getNewsletterSubscriberByEmail(email) {
    const subscriber = await NewsletterSubscriberModel.findOne({ email });
    return subscriber || void 0;
  }
  async createNewsletterSubscriber(subscriber) {
    const newSubscriber = await NewsletterSubscriberModel.create(subscriber);
    return newSubscriber;
  }
  async deleteNewsletterSubscriber(id) {
    const result = await NewsletterSubscriberModel.findByIdAndDelete(id);
    return !!result;
  }
  async getAllSellers() {
    const sellers = await SellerModel.find().sort({ createdAt: -1 }).lean();
    return sellers.map((seller) => ({
      ...seller,
      id: String(seller._id),
      images: seller.images || [],
      prices: seller.prices || [],
      averageRating: seller.averageRating || 0,
      totalReviews: seller.totalReviews || 0
    }));
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
      totalReviews: seller.totalReviews || 0
    };
  }
  async createSeller(seller) {
    const newSeller = await SellerModel.create(seller);
    const lean = await SellerModel.findById(newSeller._id).lean();
    if (!lean) throw new Error("Failed to create seller");
    return {
      ...lean,
      id: String(lean._id),
      images: lean.images || [],
      prices: lean.prices || [],
      averageRating: lean.averageRating || 0,
      totalReviews: lean.totalReviews || 0
    };
  }
  async updateSeller(id, seller) {
    const updated = await SellerModel.findByIdAndUpdate(id, seller, { new: true }).lean();
    if (!updated) return void 0;
    return {
      ...updated,
      id: String(updated._id),
      images: updated.images || [],
      prices: updated.prices || [],
      averageRating: updated.averageRating || 0,
      totalReviews: updated.totalReviews || 0
    };
  }
  async deleteSeller(id) {
    const result = await SellerModel.findByIdAndDelete(id);
    await SellerReviewModel.deleteMany({ sellerId: id });
    return !!result;
  }
  async getSellerReviews(sellerId) {
    const reviews = await SellerReviewModel.find({ sellerId }).sort({ createdAt: -1 }).lean();
    return reviews.map((review) => ({
      ...review,
      id: String(review._id)
    }));
  }
  async createSellerReview(review) {
    const newReview = await SellerReviewModel.create(review);
    await this.updateSellerRating(review.sellerId);
    const lean = await SellerReviewModel.findById(newReview._id).lean();
    if (!lean) throw new Error("Failed to create review");
    return {
      ...lean,
      id: String(lean._id)
    };
  }
  async updateSellerRating(sellerId) {
    const reviews = await SellerReviewModel.find({ sellerId });
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0;
    await SellerModel.findByIdAndUpdate(sellerId, {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews
    });
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
    if (!lean) throw new Error('Failed to create weapon');
    return { ...lean, id: String(lean._id) };
  }
  async updateWeapon(id, weapon) {
    const updated = await WeaponModel.findByIdAndUpdate(id, weapon, { new: true }).lean();
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
    if (!lean) throw new Error('Failed to create mode');
    return { ...lean, id: String(lean._id) };
  }
  async updateMode(id, mode) {
    const updated = await ModeModel.findByIdAndUpdate(id, mode, { new: true }).lean();
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
    if (!lean) throw new Error('Failed to create rank');
    return { ...lean, id: String(lean._id) };
  }
  async updateRank(id, rank) {
    const updated = await RankModel.findByIdAndUpdate(id, rank, { new: true }).lean();
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
var JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
var ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "SuperAdmin#2024$SecurePass!9x";
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
  console.log("[AUTH] Authorization header:", authHeader ? "present" : "missing");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("[AUTH] No Bearer token found");
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.substring(7);
  console.log("[AUTH] Token extracted, length:", token.length);
  const payload = verifyToken(token);
  console.log("[AUTH] Token verification result:", payload ? "valid" : "invalid");
  if (!payload) {
    return res.status(401).json({ error: "Invalid token" });
  }
  req.user = payload;
  next();
}
function requireSuperAdmin(req, res, next) {
  const user = req.user;
  if (!user || user.role !== "super_admin") {
    return res.status(403).json({ error: "Forbidden: Super Admin access required" });
  }
  next();
}

// server/utils/helpers.ts
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
      year: "numeric"
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
  legacyHeaders: false
});
var apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 100,
  // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false
});
  async function registerRoutes(app2) {
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
  app2.post("/api/users/register", authLimiter, async (req, res) => {
    try {
      const { username, email, phone, password } = req.body || {};
      if (!username || !email || !phone || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }
      if (typeof password !== "string" || password.length < 8 || !/[^A-Za-z0-9]/.test(password)) {
        return res.status(400).json({ error: "Password must be at least 8 characters and include a special character" });
      }
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) return res.status(400).json({ error: "Email already registered" });
      const existingPhone = await storage.getUserByPhone(phone);
      if (existingPhone) return res.status(400).json({ error: "Phone already registered" });
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) return res.status(400).json({ error: "Username already taken" });
      const hash = await hashPassword(password);
      const emailCode = Math.floor(100000 + Math.random() * 900000).toString();
      const phoneCode = Math.floor(100000 + Math.random() * 900000).toString();
      const user = await storage.createUser({ username, email, phone, password: hash });
      const id = (user && (user.id || user._id?.toString?.() || user._id)) || undefined;
      await storage.updateUser(id, {
        emailVerificationCode: emailCode,
        phoneVerificationCode: phoneCode,
        verifiedEmail: false,
        verifiedPhone: false
      });
      res.status(201).json({ message: "Registered. Verify email and phone.", emailCode, phoneCode });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/users/login", authLimiter, async (req, res) => {
    try {
      const { identifier, password } = req.body || {};
      if (!identifier || !password) return res.status(400).json({ error: "Identifier and password required" });
      const byEmail = await storage.getUserByEmail(identifier);
      const byUsername = await storage.getUserByUsername(identifier);
      const byPhone = await storage.getUserByPhone(identifier);
      const user = byEmail || byUsername || byPhone;
      if (!user) return res.status(401).json({ error: "Invalid credentials" });
      const ok = await comparePassword(password, user.password);
      if (!ok) return res.status(401).json({ error: "Invalid credentials" });
      const id = (user && (user.id || user._id?.toString?.() || user._id)) || undefined;
      const token = generateToken({ id, username: user.username });
      res.json({ token, user: { id, username: user.username, verifiedEmail: user.verifiedEmail, verifiedPhone: user.verifiedPhone } });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/users/verify-email", authLimiter, async (req, res) => {
    try {
      const { email, code } = req.body || {};
      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(404).json({ error: "User not found" });
      if (user.emailVerificationCode !== code) return res.status(400).json({ error: "Invalid code" });
      const id = (user && (user.id || user._id?.toString?.() || user._id)) || undefined;
      const updated = await storage.updateUser(id, { verifiedEmail: true, emailVerificationCode: "" });
      res.json({ success: true, user: { id: updated?.id, verifiedEmail: true } });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/users/verify-phone", authLimiter, async (req, res) => {
    try {
      const { phone, code } = req.body || {};
      const user = await storage.getUserByPhone(phone);
      if (!user) return res.status(404).json({ error: "User not found" });
      if (user.phoneVerificationCode !== code) return res.status(400).json({ error: "Invalid code" });
      const id = (user && (user.id || user._id?.toString?.() || user._id)) || undefined;
      const updated = await storage.updateUser(id, { verifiedPhone: true, phoneVerificationCode: "" });
      res.json({ success: true, user: { id: updated?.id, verifiedPhone: true } });
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
          return res.status(401).json({ error: "Invalid credentials" });
        }
        const isValid = await comparePassword(password, admin.password);
        if (!isValid) {
          return res.status(401).json({ error: "Invalid credentials" });
        }
        const token = generateToken({
          id: admin.id,
          username: admin.username,
          role: admin.role
        });
        res.json({
          token,
          admin: {
            id: admin.id,
            username: admin.username,
            role: admin.role
          }
        });
      } else if (password) {
        const isValid = await verifyAdminPassword(password);
        if (!isValid) {
          return res.status(401).json({ error: "Invalid password" });
        }
        const token = generateToken({ role: "super_admin" });
        res.json({ token, admin: { role: "super_admin" } });
      } else {
        return res.status(400).json({ error: "Username and password or password required" });
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
          (post) => post.category.toLowerCase() === category.toLowerCase()
        );
      }
      if (search) {
        const searchLower = search.toLowerCase();
        posts = posts.filter(
          (post) => post.title.toLowerCase().includes(searchLower) || post.summary.toLowerCase().includes(searchLower) || post.content.toLowerCase().includes(searchLower) || post.tags.some((tag) => tag.toLowerCase().includes(searchLower))
        );
      }
      if (featured === "true") {
        posts = posts.filter((post) => post.featured);
      }
      const formattedPosts = posts.map((post) => ({
        ...post,
        date: formatDate(post.createdAt)
      }));
      res.json(formattedPosts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/posts/:id", async (req, res) => {
    try {
      const post = await storage.getPostById(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      await storage.incrementPostViews(req.params.id);
      const formattedPost = {
        ...post,
        date: formatDate(post.createdAt)
      };
      res.json(formattedPost);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/posts", requireAuth, async (req, res) => {
    try {
      const data = insertPostSchema.parse(req.body);
      const readingTime = data.readingTime || calculateReadingTime(data.content);
      const summary = data.summary || generateSummary(data.content);
      const post = await storage.createPost({
        ...data,
        readingTime,
        summary
      });
      res.status(201).json(post);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.patch("/api/posts/:id", requireAuth, async (req, res) => {
    try {
      const updates = req.body;
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
  app2.delete("/api/posts/:id", requireAuth, async (req, res) => {
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
        ...comment,
        date: formatDate(comment.createdAt)
      }));
      res.json(formattedComments);
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
        parentCommentId: parentCommentId || void 0
      };
      const data = insertCommentSchema.parse(commentData);
      const comment = await storage.createComment(data);
      const formattedComment = {
        ...comment,
        date: formatDate(comment.createdAt)
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
  app2.post("/api/events", requireAuth, async (req, res) => {
    try {
      const data = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(data);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.delete("/api/events/:id", requireAuth, async (req, res) => {
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
  app2.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const posts = await storage.getAllPosts();
      const allComments = await Promise.all(
        posts.map((post) => storage.getCommentsByPostId(post.id))
      );
      const totalComments = allComments.flat().length;
      const totalViews = posts.reduce((sum, post) => sum + post.views, 0);
      res.json({
        totalPosts: posts.length,
        totalComments,
        totalViews,
        recentPosts: posts.slice(0, 5).map((post) => ({
          ...post,
          date: formatDate(post.createdAt)
        }))
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
  app2.post("/api/news", requireAuth, async (req, res) => {
    try {
      const data = insertNewsSchema.parse(req.body);
      const news = await storage.createNews(data);
      res.status(201).json(news);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.patch("/api/news/:id", requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      const news = await storage.updateNews(req.params.id, updates);
      if (!news) {
        return res.status(404).json({ error: "News item not found" });
      }
      res.json(news);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.delete("/api/news/:id", requireAuth, async (req, res) => {
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
      const items = await TutorialModel.find().sort({ createdAt: -1 }).lean();
      res.json(items.map((it) => ({ ...it, id: String(it._id) })));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app2.get("/api/tutorials/:id", async (req, res) => {
    try {
      const item = await TutorialModel.findById(req.params.id).lean();
      if (!item) return res.status(404).json({ error: "Tutorial not found" });
      res.json({ ...item, id: String(item._id) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app2.post("/api/tutorials", requireAuth, async (req, res) => {
    try {
      const body = req.body;
      const url = String(body.youtubeUrl || "").trim();
      const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/, /youtube\.com\/embed\/([^&\n?#]+)/];
      let youtubeId = null;
      for (const p of patterns) {
        const m = url.match(p);
        if (m) { youtubeId = m[1]; break; }
      }
      if (!youtubeId) return res.status(400).json({ error: "Invalid YouTube URL" });
      const created = await TutorialModel.create({
        title: body.title,
        youtubeUrl: url,
        youtubeId,
        description: body.description || "",
        likes: 0
      });
      const lean = await TutorialModel.findById(created._id).lean();
      res.status(201).json({ ...lean, id: String(lean._id) });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app2.patch("/api/tutorials/:id", requireAuth, async (req, res) => {
    try {
      const body = req.body;
      const updates = { ...body };
      if (updates.youtubeUrl) {
        const url = String(updates.youtubeUrl).trim();
        const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/, /youtube\.com\/embed\/([^&\n?#]+)/];
        let youtubeId = null;
        for (const p of patterns) {
          const m = url.match(p);
          if (m) { youtubeId = m[1]; break; }
        }
        if (!youtubeId) return res.status(400).json({ error: "Invalid YouTube URL" });
        updates.youtubeId = youtubeId;
      }
      const updated = await TutorialModel.findByIdAndUpdate(req.params.id, updates, { new: true }).lean();
      if (!updated) return res.status(404).json({ error: "Tutorial not found" });
      res.json({ ...updated, id: String(updated._id) });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app2.delete("/api/tutorials/:id", requireAuth, async (req, res) => {
    try {
      const ok = await TutorialModel.findByIdAndDelete(req.params.id);
      if (!ok) return res.status(404).json({ error: "Tutorial not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app2.post("/api/tutorials/:id/like", async (req, res) => {
    try {
      const updated = await TutorialModel.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true }).lean();
      if (!updated) return res.status(404).json({ error: "Tutorial not found" });
      res.json({ ...updated, id: String(updated._id) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app2.get("/api/tutorials/:id/comments", async (req, res) => {
    try {
      const comments = await TutorialCommentModel.find({ tutorialId: req.params.id }).sort({ createdAt: -1 }).lean();
      res.json(comments.map((c) => ({ ...c, id: String(c._id) })));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app2.post("/api/tutorials/:id/comments", async (req, res) => {
    try {
      const { author, content } = req.body;
      if (!author || !content) return res.status(400).json({ error: "author and content required" });
      const created = await TutorialCommentModel.create({ tutorialId: req.params.id, author, content });
      const lean = await TutorialCommentModel.findById(created._id).lean();
      res.status(201).json({ ...lean, id: String(lean._id) });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  // Weapons endpoints (used by seeding scripts)
  app2.get('/api/weapons', async (req, res) => {
    try {
      const items = await storage.getAllWeapons();
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.post('/api/weapons', async (req, res) => {
    try {
      const created = await storage.createWeapon(req.body);
      res.status(201).json(created);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app2.patch('/api/weapons/:id', requireAuth, async (req, res) => {
    try {
      const updated = await storage.updateWeapon(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Weapon not found' });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app2.delete('/api/weapons/:id', requireAuth, async (req, res) => {
    try {
      const ok = await storage.deleteWeapon(req.params.id);
      if (!ok) return res.status(404).json({ error: 'Weapon not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Modes endpoints
  app2.get('/api/modes', async (req, res) => {
    try {
      const items = await storage.getAllModes();
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.post('/api/modes', async (req, res) => {
    try {
      const created = await storage.createMode(req.body);
      res.status(201).json(created);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app2.patch('/api/modes/:id', requireAuth, async (req, res) => {
    try {
      const updated = await storage.updateMode(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Mode not found' });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app2.delete('/api/modes/:id', requireAuth, async (req, res) => {
    try {
      const ok = await storage.deleteMode(req.params.id);
      if (!ok) return res.status(404).json({ error: 'Mode not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Ranks endpoints
  app2.get('/api/ranks', async (req, res) => {
    try {
      const items = await storage.getAllRanks();
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.post('/api/ranks', async (req, res) => {
    try {
      const created = await storage.createRank(req.body);
      res.status(201).json(created);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app2.patch('/api/ranks/:id', requireAuth, async (req, res) => {
    try {
      const updated = await storage.updateRank(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Rank not found' });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app2.delete('/api/ranks/:id', requireAuth, async (req, res) => {
    try {
      const ok = await storage.deleteRank(req.params.id);
      if (!ok) return res.status(404).json({ error: 'Rank not found' });
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
        return res.status(400).json({ error: "Name and image are required" });
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
      if (!ok) return res.status(404).json({ error: 'Mercenary not found' });
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
        return res.status(400).json({ error: 'Name cannot be empty' });
      }
      if (updates.image !== undefined && !updates.image) {
        return res.status(400).json({ error: 'Image URL cannot be empty' });
      }

      const updated = await storage.updateMercenary(req.params.id, updates);
      if (!updated) return res.status(404).json({ error: 'Mercenary not found' });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app2.get("/api/mercenaries/:id", async (req, res) => {
    try {
      const mercenaries = await storage.getAllMercenaries();
      const merc = mercenaries.find(m => m.id === req.params.id || String(m._id) === req.params.id);
      if (!merc) return res.status(404).json({ error: 'Mercenary not found' });
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
          updatedAt: formatDate(ticket.updatedAt)
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
  app2.get("/api/tickets/my/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const tickets = await storage.getTicketsByEmail(email);
      const formattedTickets = tickets.map((ticket) => ({
        ...ticket,
        createdAt: formatDate(ticket.createdAt),
        updatedAt: formatDate(ticket.updatedAt)
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
        updatedAt: formatDate(ticket.updatedAt)
      };
      res.json(formattedTicket);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/tickets", async (req, res) => {
    try {
      const data = insertTicketSchema.parse(req.body);
      const ticket = await storage.createTicket(data);
      const formattedTicket = {
        ...ticket,
        createdAt: formatDate(ticket.createdAt),
        updatedAt: formatDate(ticket.updatedAt)
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
        updatedAt: formatDate(ticket.updatedAt)
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
        createdAt: formatDate(reply.createdAt)
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
        isAdmin: isAdmin || false
      };
      const data = insertTicketReplySchema.parse(replyData);
      const reply = await storage.createTicketReply(data);
      const formattedReply = {
        ...reply,
        createdAt: formatDate(reply.createdAt)
      };
      res.status(201).json(formattedReply);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.get("/api/admins", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const admins = await storage.getAllAdmins();
      const sanitizedAdmins = admins.map(({ password, ...admin }) => admin);
      res.json(sanitizedAdmins);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/admins", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { username, password, role } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      const existingAdmin = await storage.getAdminByUsername(username);
      if (existingAdmin) {
        return res.status(400).json({ error: "Username already exists" });
      }
      const hashedPassword = await hashPassword(password);
      const data = insertAdminSchema.parse({
        username,
        password: hashedPassword,
        role: role || "admin"
      });
      const admin = await storage.createAdmin(data);
      const { password: _, ...sanitizedAdmin } = admin;
      res.status(201).json(sanitizedAdmin);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.patch("/api/admins/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const updates = {};
      if (req.body.username !== void 0) updates.username = req.body.username;
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
  });
  app2.delete("/api/admins/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteAdmin(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Admin not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
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
  app2.patch("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      const event = await storage.updateEvent(req.params.id, updates);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.get("/api/newsletter-subscribers", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const subscribers = await storage.getAllNewsletterSubscribers();
      res.json(subscribers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/newsletter-subscribe", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      const existing = await storage.getNewsletterSubscriberByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "Email already subscribed" });
      }
      const data = insertNewsletterSubscriberSchema.parse({ email });
      const subscriber = await storage.createNewsletterSubscriber(data);
      res.status(201).json(subscriber);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.delete("/api/newsletter-subscribers/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteNewsletterSubscriber(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Subscriber not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/upload-image", uploadLimiter, requireAuth, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }
      const formData = new FormData();
      formData.append("reqtype", "fileupload");
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append("fileToUpload", blob, req.file.originalname);
      const response = await fetch("https://catbox.moe/user/api.php", {
        method: "POST",
        body: formData
      });
      if (!response.ok) {
        throw new Error("Failed to upload to catbox.moe");
      }
      const imageUrl = await response.text();
      res.json({ url: imageUrl.trim() });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Scraper API key middleware
  const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || "crossfire-event-scraper-key-2025";

  function hasScraperKey(req) {
    const k = (req.headers['x-scraper-api-key'] || req.headers['x-api-key'] || '').toString();
    return Boolean(SCRAPER_API_KEY && k && k === SCRAPER_API_KEY);
  }

  function requireEventScraperOrApiKey(req, res, next) {
    // allow header key or admins with event_scraper role
    if (hasScraperKey(req)) return next();
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(403).json({ error: 'Forbidden: need event_scraper or API key' });
    }
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(403).json({ error: 'Forbidden: Invalid token' });
    }
    req.user = payload;
    next();
  }

  // Scraping routes (fallback for deployments that don't keep full server)
  try {
    const { scrapeForumAnnouncements, scrapeEventDetails, scrapeMultipleEvents, scrapeRanks } = await import('./services/scraper.js');

    app2.get('/api/scrape/forum-list', async (req, res) => {
      try {
        const posts = await scrapeForumAnnouncements();
        res.json(posts);
      } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to scrape forum' });
      }
    });

    app2.post('/api/scrape/event-details', async (req, res) => {
      try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL is required' });
        const event = await scrapeEventDetails(url);
        res.json(event);
      } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to scrape event details' });
      }
    });

    app2.post('/api/admin/scrape-and-create-events', async (req, res) => {
      try {
        const posts = await scrapeForumAnnouncements();
        const urls = posts.map((p) => p.url);
        const scraped = await scrapeMultipleEvents(urls);
        const created = [];
        for (const ev of scraped) {
          const payload = {
            title: ev.title || 'Event',
            titleAr: ev.titleAr || '',
            description: ev.description || '',
            descriptionAr: ev.descriptionAr || '',
            date: ev.date || new Date().toISOString().slice(0, 10),
            type: ev.type || 'upcoming',
            image: ev.image || '',
            seoTitle: ev.seoTitle || '',
            seoDescription: ev.seoDescription || '',
            seoKeywords: Array.isArray(ev.seoKeywords) ? ev.seoKeywords : [],
            canonicalUrl: ev.canonicalUrl || '',
            ogImage: ev.ogImage || ev.image || '',
            twitterImage: ev.twitterImage || ev.ogImage || ev.image || '',
            schemaType: ev.schemaType || 'Event'
          };
          const existing = await EventModel.findOne({ title: payload.title }).lean();
          if (!existing) {
            const createdEvent = await storage.createEvent(payload);
            created.push(createdEvent);
          }
        }
        res.json({ events: created });
      } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to scrape and create events' });
      }
    });

    app2.get('/api/scrape/ranks', async (req, res) => {
      try {
        const ranks = await scrapeRanks();
        res.json(ranks);
      } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to scrape ranks' });
      }
    });

    app2.post('/api/admin/scrape-and-create-ranks', async (req, res) => {
      try {
        const ranks = await scrapeRanks();
        const created = [];
        for (const r of ranks) {
          const payload = {
            name: r.name,
            image: r.image || '',
            description: r.description || '',
            requirements: r.requirements || '',
          };
          const exists = (await storage.getAllRanks()).find((x) => x.name === r.name);
          if (!exists) {
            const createdRank = await storage.createRank(payload);
            created.push(createdRank);
          }
        }
        res.json({ message: `Created ${created.length} ranks`, count: created.length, ranks: created });
      } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to scrape and create ranks' });
      }
    });

    app2.post('/api/admin/reset-ranks', async (req, res) => {
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
            image: r.image || '',
            description: r.description || '',
            requirements: r.requirements || '',
          };
          const createdRank = await storage.createRank(payload);
          created.push(createdRank);
        }
        res.json({ message: `Reset ranks and created ${created.length} new ranks`, count: created.length });
      } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to reset ranks' });
      }
    });
    app2.post('/api/scrape/multiple-events', async (req, res) => {
      try {
        const { urls } = req.body;
        if (!urls || !Array.isArray(urls)) return res.status(400).json({ error: 'URLs array is required' });
        const events = await scrapeMultipleEvents(urls);
        res.json(events);
      } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to scrape multiple events' });
      }
    });

  } catch (err) {
    console.warn('Scraper service not available:', err?.message || err);
  }
  // Restoration & Admin Management Endpoints
  app2.post("/api/admin/restore-events", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      console.log("🔄 Starting event restoration from admin panel...");
      // Import restoration script
      const restoreModule = await import('./restore-events.js');
      const restoreEvents = restoreModule.default;
      
      if (restoreEvents && typeof restoreEvents === 'function') {
        await restoreEvents({ closeConnection: false });
        res.json({ 
          success: true, 
          message: "✅ Events and graves restored successfully!",
          details: "All historical events and zombie modes have been restored to the database."
        });
      } else {
        throw new Error('Restoration function not found');
      }
    } catch (error) {
      console.error("❌ Restoration failed:", error.message);
      res.status(500).json({ 
        success: false,
        error: error.message,
        message: "Failed to restore events"
      });
    }
  });

  app2.get("/api/admin/verify-restoration", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const eventCount = await EventModel.countDocuments();
      const modeCount = await ModeModel.countDocuments();
      const graveModes = await ModeModel.find({ 
        name: { $regex: /zombie|grave|evil den|metal rage|forbidden zone/i } 
      }).lean();
      
      const eventTypes = await EventModel.distinct('type');
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
          eventTypes: eventTypes
        },
        graveModesRestored: graveModes.map(m => m.name),
        recentEvents: recentEvents.map(e => ({
          id: String(e._id),
          title: e.title,
          type: e.type,
          date: e.date
        }))
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
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
  app2.patch("/api/sellers/:id", requireAuth, async (req, res) => {
    try {
      const data = insertSellerSchema.partial().parse(req.body);
      const seller = await storage.updateSeller(req.params.id, data);
      if (!seller) {
        return res.status(404).json({ error: "Seller not found" });
      }
      res.json(seller);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.delete("/api/sellers/:id", requireAuth, async (req, res) => {
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
  app2.post("/api/sellers/:id/reviews", async (req, res) => {
    try {
      const data = insertSellerReviewSchema.parse({
        ...req.body,
        sellerId: req.params.id
      });
      const review = await storage.createSellerReview(data);
      res.json(review);
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
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
var frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
var connectedUsers = new Map();
app.use(cors({
  origin: frontendUrl === "*" ? "*" : [frontendUrl],
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));
app.set('trust proxy', 1); // Trust the first proxy
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
    console.log(`[assets] No ATTACHED_ASSETS_PATH set. Assets are served as URLs from database.`);
  }
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  app.get("*", (_req, res) => {
    res.status(404).json({
      message: "API endpoint not found. Frontend is hosted on Netlify.",
      hint: "Make sure your frontend is pointing to this backend URL"
    });
  });

  // Debug endpoints for deployment checks
  app.get('/api/debug/assets', (_req, res) => {
    res.json({ assetsPath, hasScraperApiKey: Boolean(process.env.SCRAPER_API_KEY) });
  });

  // Auto-seed database if AUTO_SEED=true (runs once on startup)
  if (process.env.AUTO_SEED === 'true') {
    (async () => {
      try {
        // Wait a bit for server to fully start
        await new Promise(resolve => setTimeout(resolve, 1000));
        log('🌱 AUTO_SEED enabled: running seed-from-urls...');
        // Import and run seed script
        const seedModule = await import('./seed-from-urls.js');
        const seedDatabase = seedModule.default;
        if (seedDatabase && typeof seedDatabase === 'function') {
          await seedDatabase({ closeConnection: false });
          log('✅ Seeding completed');
        } else {
          log('⚠️ seed-from-urls.js default export is not a function');
        }
      } catch (err) {
        log(`⚠️ Auto-seeding error: ${err.message}`);
      }
    })();
  }

  const wsModule = await import("ws");
  const WSSCtor = wsModule?.Server || wsModule?.WebSocketServer || wsModule?.default?.Server || wsModule?.default?.WebSocketServer;
  if (typeof WSSCtor === "function") {
    const wss = new WSSCtor({ server, path: "/ws" });
    function broadcastPresence() {
      const users = Array.from(connectedUsers.keys());
      const payload = JSON.stringify({ type: "presence", users });
      connectedUsers.forEach((set) => {
        set.forEach((client) => {
          try { client.send(payload); } catch {}
        });
      });
    }
    wss.on("connection", (ws, req) => {
      try {
        const url = new URL(req.url || "", `http://${req.headers.host}`);
        const username = url.searchParams.get("username") || "Anonymous";
        let set = connectedUsers.get(username);
        if (!set) { set = new Set(); connectedUsers.set(username, set); }
        set.add(ws);
        broadcastPresence();
        ws.on("message", (data) => {
          let msg = null;
          try { msg = JSON.parse(String(data)); } catch {}
          if (!msg) return;
          const payload = JSON.stringify({ type: "message", from: msg.from || username, text: msg.text || "" });
          connectedUsers.forEach((s) => s.forEach((c) => { try { c.send(payload); } catch {} }));
        });
        ws.on("close", () => {
          const s = connectedUsers.get(username);
          if (s) { s.delete(ws); if (s.size === 0) connectedUsers.delete(username); }
          broadcastPresence();
        });
      } catch {}
    });
    app.get("/api/online-users", (_req, res) => {
      res.json(Array.from(connectedUsers.keys()));
    });
  }

  const port = parseInt(process.env.PORT || "20032", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`\u{1F680} Backend API server running on port ${port}`);
    log(`\u{1F4E1} Serving API endpoints at /api/*`);
    log(`\u{1F5BC}\uFE0F  Serving assets at /assets/*`);
    log(`\u{1F310} Frontend should be deployed to Netlify`);
  });
})();