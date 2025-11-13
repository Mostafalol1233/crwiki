import {
  UserModel,
  PostModel,
  CommentModel,
  EventModel,
  NewsModel,
  TicketModel,
  TicketReplyModel,
  AdminModel,
  NewsletterSubscriberModel,
  SellerModel,
  SellerReviewModel,
  TutorialModel,
  TutorialCommentModel,
  SiteSettingsModel,
  WeaponModel,
  ModeModel,
  RankModel,
  AdminPermissionModel,
  type User,
  type InsertUser,
  type Post,
  type InsertPost,
  type Comment,
  type InsertComment,
  type Event,
  type InsertEvent,
  type News as NewsType,
  type InsertNews,
  type Ticket,
  type InsertTicket,
  type TicketReply,
  type InsertTicketReply,
  type Admin,
  type InsertAdmin,
  type NewsletterSubscriber,
  type InsertNewsletterSubscriber,
  type Seller,
  type InsertSeller,
  type SellerReview,
  type InsertSellerReview,
  type Tutorial,
  type InsertTutorial,
  type TutorialComment,
  type InsertTutorialComment,
  type SiteSettings,
  type SiteSettingsUpdate,
  type Weapon,
  type InsertWeapon,
  type Mode,
  type InsertMode,
  type Rank,
  type InsertRank,
} from "@shared/mongodb-schema";
import { connectMongoDB } from "./mongodb";

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
  htmlContent?: string;
  author: string;
  createdAt?: Date;
}

export interface Mercenary {
  id: string;
  name: string;
  image: string;
  role: string;
  sounds?: string[]; // MP3 URLs for voice lines (1-30 sounds)
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllPosts(): Promise<Post[]>;
  getPostById(id: string): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, post: Partial<InsertPost>): Promise<Post | undefined>;
  deletePost(id: string): Promise<boolean>;
  incrementPostViews(id: string): Promise<void>;
  
  getCommentsByPostId(postId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  getAllEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  deleteEvent(id: string): Promise<boolean>;

  getAllNews(): Promise<NewsItem[]>;
  createNews(news: Partial<NewsItem>): Promise<NewsItem>;
  updateNews(id: string, news: Partial<NewsItem>): Promise<NewsItem | undefined>;
  deleteNews(id: string): Promise<boolean>;

  getAllMercenaries(): Promise<Mercenary[]>;
  createMercenary(mercenary: Omit<Mercenary, 'id'>): Promise<Mercenary>;
  updateMercenary(id: string, mercenary: Mercenary): Promise<void>;
  deleteMercenary(id: string): Promise<boolean>;

  getAllAdminPermissions(): Promise<Record<string, Record<string, boolean>>>;
  updateAdminPermissions(adminId: string, permissions: Record<string, boolean>): Promise<void>;

  getAllTickets(): Promise<Ticket[]>;
  getTicketById(id: string): Promise<Ticket | undefined>;
  getTicketsByEmail(email: string): Promise<Ticket[]>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: string, ticket: Partial<InsertTicket>): Promise<Ticket | undefined>;
  deleteTicket(id: string): Promise<boolean>;

  getTicketReplies(ticketId: string): Promise<TicketReply[]>;
  createTicketReply(reply: InsertTicketReply): Promise<TicketReply>;

  getAllAdmins(): Promise<Admin[]>;
  getAdminById(id: string): Promise<Admin | undefined>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  updateAdmin(id: string, admin: Partial<InsertAdmin>): Promise<Admin | undefined>;
  deleteAdmin(id: string): Promise<boolean>;

  getEventById(id: string): Promise<Event | undefined>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;

  getAllNewsletterSubscribers(): Promise<NewsletterSubscriber[]>;
  getNewsletterSubscriberByEmail(email: string): Promise<NewsletterSubscriber | undefined>;
  createNewsletterSubscriber(subscriber: InsertNewsletterSubscriber): Promise<NewsletterSubscriber>;
  deleteNewsletterSubscriber(id: string): Promise<boolean>;

  getAllSellers(): Promise<Seller[]>;
  getSellerById(id: string): Promise<Seller | undefined>;
  createSeller(seller: InsertSeller): Promise<Seller>;
  updateSeller(id: string, seller: Partial<InsertSeller>): Promise<Seller | undefined>;
  deleteSeller(id: string): Promise<boolean>;

  getSellerReviews(sellerId: string): Promise<SellerReview[]>;
  createSellerReview(review: InsertSellerReview): Promise<SellerReview>;
  deleteSellerReview(reviewId: string): Promise<boolean>;
  updateSellerRating(sellerId: string): Promise<void>;

  getAllTutorials(): Promise<Tutorial[]>;
  getTutorialById(id: string): Promise<Tutorial | undefined>;
  createTutorial(tutorial: InsertTutorial): Promise<Tutorial>;
  updateTutorial(id: string, tutorial: Partial<InsertTutorial>): Promise<Tutorial | undefined>;
  deleteTutorial(id: string): Promise<boolean>;
  incrementTutorialLikes(id: string): Promise<Tutorial | undefined>;

  getTutorialComments(tutorialId: string): Promise<TutorialComment[]>;
  createTutorialComment(comment: InsertTutorialComment): Promise<TutorialComment>;
  deleteTutorialComment(id: string): Promise<boolean>;
  // Weapons
  getAllWeapons(): Promise<Weapon[]>;
  getWeaponById(id: string): Promise<Weapon | undefined>;
  createWeapon(weapon: InsertWeapon): Promise<Weapon>;
  updateWeapon(id: string, weapon: Partial<InsertWeapon>): Promise<Weapon | undefined>;
  deleteWeapon(id: string): Promise<boolean>;
  // Modes
  getAllModes(): Promise<Mode[]>;
  getModeById(id: string): Promise<Mode | undefined>;
  createMode(mode: InsertMode): Promise<Mode>;
  updateMode(id: string, mode: Partial<InsertMode>): Promise<Mode | undefined>;
  deleteMode(id: string): Promise<boolean>;
  // Ranks
  getAllRanks(): Promise<Rank[]>;
  getRankById(id: string): Promise<Rank | undefined>;
  createRank(rank: InsertRank): Promise<Rank>;
  updateRank(id: string, rank: Partial<InsertRank>): Promise<Rank | undefined>;
  deleteRank(id: string): Promise<boolean>;

  getSiteSettings(): Promise<SiteSettings>;
  updateSiteSettings(settings: SiteSettingsUpdate): Promise<SiteSettings>;
}

export class MongoDBStorage implements IStorage {
  private mercenaries: Map<string, Mercenary>;
  private initialized = false;
  private readonly defaultSiteSettings: SiteSettings = {
    reviewVerificationEnabled: false,
    reviewVerificationVideoUrl: "",
    reviewVerificationPassphrase: "",
    reviewVerificationPrompt: "",
    reviewVerificationTimecode: "",
    reviewVerificationYouTubeChannelUrl: "",
  };

  constructor() {
    this.mercenaries = new Map();
    this.initializeMercenaries();
    // Note: do NOT call connect() here to avoid unhandled promise rejections
    // during module initialization. Call initialize() explicitly to connect.
  }

  // Call this to establish the MongoDB connection. Separated from the
  // constructor so callers can catch connection failures and fall back.
  public async initialize() {
    await this.connect();
  }

  private async connect() {
    if (!this.initialized) {
      await connectMongoDB();
      this.initialized = true;
    }
  }

  private initializeMercenaries() {
    // Import mercenaries from seed data
    import('./data/seed-data').then(({ mercenariesData }) => {
      mercenariesData.forEach((merc, index) => {
        const mercenary: Mercenary = {
          id: String(index + 1),
          name: merc.name,
          image: merc.image,
          role: merc.role,
          sounds: merc.sounds
        };
        this.mercenaries.set(mercenary.id, mercenary);
      });
    }).catch(err => {
      console.error('Failed to load mercenaries from seed data:', err);
      // Fallback to hardcoded data if import fails
      const mercenaries: Mercenary[] = [
        {
          id: "1",
          name: "Wolf",
          image: "/assets/merc-wolf.jpg",
          role: "Assault",
          sounds: [
            "/sounds/merc/wolf-line1.mp3",
            "/sounds/merc/wolf-line2.mp3",
            "/sounds/merc/wolf-line3.mp3",
          ]
        },
        {
          id: "2",
          name: "Vipers",
          image: "/assets/merc-vipers.jpg",
          role: "Sniper",
          sounds: [
            "/sounds/merc/vipers-line1.mp3",
            "/sounds/merc/vipers-line2.mp3",
          ]
        },
        {
          id: "3",
          name: "Sisterhood",
          image: "/assets/merc-sisterhood.jpg",
          role: "Medic",
          sounds: [
            "/sounds/merc/sisterhood-line1.mp3",
          ]
        },
        { id: "4", name: "Black Mamba", image: "/assets/merc-blackmamba.jpg", role: "Scout" },
        { id: "5", name: "Arch Honorary", image: "/assets/merc-archhonorary.jpg", role: "Tank" },
        { id: "6", name: "Desperado", image: "/assets/merc-desperado.jpg", role: "Engineer" },
        { id: "7", name: "Ronin", image: "/assets/merc-ronin.jpg", role: "Samurai" },
        { id: "8", name: "Dean", image: "/assets/merc-dean.jpg", role: "Specialist" },
        { id: "9", name: "Thoth", image: "/assets/merc-thoth.jpg", role: "Guardian" },
        { id: "10", name: "SFG", image: "/assets/merc-sfg.jpg", role: "Special Forces Group" },
      ];
      mercenaries.forEach((merc) => this.mercenaries.set(merc.id, merc));
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const user = await UserModel.findById(id);
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ username });
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser = await UserModel.create(user);
    return newUser;
  }

  async getAllPosts(): Promise<Post[]> {
    const posts = await PostModel.find().sort({ createdAt: -1 }).lean();
    return posts.map(post => ({
      ...post,
      id: String(post._id),
      tags: post.tags || [],
      views: post.views || 0,
      category: post.category || '',
      author: post.author || 'Unknown'
    })) as any;
  }

  async getPostById(id: string): Promise<Post | undefined> {
    const post = await PostModel.findById(id).lean();
    if (!post) return undefined;
    return {
      ...post,
      id: String(post._id),
      tags: post.tags || [],
      views: post.views || 0,
      category: post.category || '',
      author: post.author || 'Unknown'
    } as any;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const newPost = await PostModel.create(post);
    const lean = await PostModel.findById(newPost._id).lean();
    if (!lean) throw new Error('Failed to create post');
    return {
      ...lean,
      id: String(lean._id),
      tags: lean.tags || [],
      views: lean.views || 0,
      category: lean.category || '',
      author: lean.author || 'Unknown'
    } as any;
  }

  async updatePost(id: string, post: Partial<InsertPost>): Promise<Post | undefined> {
    const updated = await PostModel.findByIdAndUpdate(id, post, { new: true }).lean();
    if (!updated) return undefined;
    return {
      ...updated,
      id: String(updated._id),
      tags: updated.tags || [],
      views: updated.views || 0,
      category: updated.category || '',
      author: updated.author || 'Unknown'
    } as any;
  }

  async deletePost(id: string): Promise<boolean> {
    const result = await PostModel.findByIdAndDelete(id);
    return !!result;
  }

  async incrementPostViews(id: string): Promise<void> {
    await PostModel.findByIdAndUpdate(id, { $inc: { views: 1 } });
  }

  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    const comments = await CommentModel.find({ postId }).sort({ createdAt: -1 });
    return comments;
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const newComment = await CommentModel.create(comment);
    return newComment;
  }

  async getAllEvents(): Promise<Event[]> {
    const events = await EventModel.find().lean();
    return events.map(event => ({
      ...event,
      id: String(event._id),
    })) as any;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const newEvent = await EventModel.create(event);
    const lean = await EventModel.findById(newEvent._id).lean();
    if (!lean) throw new Error('Failed to create event');
    return {
      ...lean,
      id: String(lean._id),
    } as any;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await EventModel.findByIdAndDelete(id);
    return !!result;
  }

  async getAllNews(): Promise<NewsItem[]> {
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
      createdAt: item.createdAt,
    }));
  }

  async createNews(news: Partial<NewsItem>): Promise<NewsItem> {
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
      createdAt: newNews.createdAt,
    };
  }

  async updateNews(id: string, news: Partial<NewsItem>): Promise<NewsItem | undefined> {
    const updated = await NewsModel.findByIdAndUpdate(id, news, { new: true });
    if (!updated) return undefined;
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
      createdAt: updated.createdAt,
    };
  }

  async deleteNews(id: string): Promise<boolean> {
    const result = await NewsModel.findByIdAndDelete(id);
    return !!result;
  }

  async getAllMercenaries(): Promise<Mercenary[]> {
    return Array.from(this.mercenaries.values());
  }

  async createMercenary(mercenary: Omit<Mercenary, 'id'>): Promise<Mercenary> {
    const id = String(this.mercenaries.size + 1);
    const newMercenary = { ...mercenary, id };
    this.mercenaries.set(id, newMercenary);
    return newMercenary;
  }

  async updateMercenary(id: string, mercenary: Mercenary): Promise<void> {
    this.mercenaries.set(id, mercenary);
  }

  async deleteMercenary(id: string): Promise<boolean> {
    return this.mercenaries.delete(id);
  }

  async getAllAdminPermissions(): Promise<Record<string, Record<string, boolean>>> {
    try {
      const permissions = await AdminPermissionModel.find().lean();
      const result: Record<string, Record<string, boolean>> = {};

      permissions.forEach(perm => {
        result[perm.adminId] = perm.permissions;
      });

      return result;
    } catch (error) {
      console.error('Error getting admin permissions:', error);
      return {};
    }
  }

  async updateAdminPermissions(adminId: string, permissions: Record<string, boolean>): Promise<void> {
    try {
      await AdminPermissionModel.findOneAndUpdate(
        { adminId },
        { permissions, updatedAt: new Date() },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error updating admin permissions:', error);
      throw error;
    }
  }

  async getAllTickets(): Promise<Ticket[]> {
    const tickets = await TicketModel.find().sort({ createdAt: -1 }).lean();
    return tickets.map(ticket => ({
      ...ticket,
      id: String(ticket._id),
    })) as any;
  }

  async getTicketById(id: string): Promise<Ticket | undefined> {
    const ticket = await TicketModel.findById(id).lean();
    if (!ticket) return undefined;
    return {
      ...ticket,
      id: String(ticket._id),
    } as any;
  }

  async getTicketsByEmail(email: string): Promise<Ticket[]> {
    const tickets = await TicketModel.find({ userEmail: email }).sort({ createdAt: -1 }).lean();
    return tickets.map(ticket => ({
      ...ticket,
      id: String(ticket._id),
    })) as any;
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const newTicket = await TicketModel.create(ticket);
    const ticketObj = await TicketModel.findById(newTicket._id).lean();
    return {
      ...ticketObj,
      id: String(ticketObj!._id),
    } as any;
  }

  async updateTicket(id: string, ticket: Partial<InsertTicket>): Promise<Ticket | undefined> {
    const updated = await TicketModel.findByIdAndUpdate(
      id,
      { ...ticket, updatedAt: new Date() },
      { new: true }
    ).lean();
    if (!updated) return undefined;
    return {
      ...updated,
      id: String(updated._id),
    } as any;
  }

  async deleteTicket(id: string): Promise<boolean> {
    const result = await TicketModel.findByIdAndDelete(id);
    return !!result;
  }

  async getTicketReplies(ticketId: string): Promise<TicketReply[]> {
    const replies = await TicketReplyModel.find({ ticketId }).sort({ createdAt: 1 });
    return replies;
  }

  async createTicketReply(reply: InsertTicketReply): Promise<TicketReply> {
    const newReply = await TicketReplyModel.create(reply);
    return newReply;
  }

  async getAllAdmins(): Promise<Admin[]> {
    const admins = await AdminModel.find().sort({ createdAt: -1 }).lean();
    return admins.map(admin => ({
      ...admin,
      id: String(admin._id),
    })) as any;
  }

  async getAdminById(id: string): Promise<Admin | undefined> {
    const admin = await AdminModel.findById(id).lean();
    if (!admin) return undefined;
    return {
      ...admin,
      id: String(admin._id),
    } as any;
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const admin = await AdminModel.findOne({ username }).lean();
    if (!admin) return undefined;
    return {
      ...admin,
      id: String(admin._id),
    } as any;
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const newAdmin = await AdminModel.create(admin);
    const adminObj = await AdminModel.findById(newAdmin._id).lean();
    return {
      ...adminObj,
      id: String(adminObj!._id),
    } as any;
  }

  async updateAdmin(id: string, admin: Partial<InsertAdmin>): Promise<Admin | undefined> {
    const updated = await AdminModel.findByIdAndUpdate(id, admin, { new: true }).lean();
    if (!updated) return undefined;
    return {
      ...updated,
      id: String(updated._id),
    } as any;
  }

  async deleteAdmin(id: string): Promise<boolean> {
    const result = await AdminModel.findByIdAndDelete(id);
    return !!result;
  }

  async getEventById(id: string): Promise<Event | undefined> {
    const event = await EventModel.findById(id).lean();
    if (!event) return undefined;
    return {
      ...event,
      id: String(event._id),
    } as any;
  }

  async updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const updated = await EventModel.findByIdAndUpdate(id, event, { new: true }).lean();
    if (!updated) return undefined;
    return {
      ...updated,
      id: String(updated._id),
    } as any;
  }

  async getAllNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    const subscribers = await NewsletterSubscriberModel.find().sort({ createdAt: -1 });
    return subscribers;
  }

  async getNewsletterSubscriberByEmail(email: string): Promise<NewsletterSubscriber | undefined> {
    const subscriber = await NewsletterSubscriberModel.findOne({ email });
    return subscriber || undefined;
  }

  async createNewsletterSubscriber(subscriber: InsertNewsletterSubscriber): Promise<NewsletterSubscriber> {
    const newSubscriber = await NewsletterSubscriberModel.create(subscriber);
    return newSubscriber;
  }

  async deleteNewsletterSubscriber(id: string): Promise<boolean> {
    const result = await NewsletterSubscriberModel.findByIdAndDelete(id);
    return !!result;
  }

  async getAllSellers(): Promise<Seller[]> {
    const sellers = await SellerModel.find().sort({ createdAt: -1 }).lean();
    return sellers.map(seller => ({
      ...seller,
      id: String(seller._id),
      images: seller.images || [],
      prices: seller.prices || [],
      averageRating: seller.averageRating || 0,
      totalReviews: seller.totalReviews || 0,
    })) as any;
  }

  async getSellerById(id: string): Promise<Seller | undefined> {
    const seller = await SellerModel.findById(id).lean();
    if (!seller) return undefined;
    return {
      ...seller,
      id: String(seller._id),
      images: seller.images || [],
      prices: seller.prices || [],
      averageRating: seller.averageRating || 0,
      totalReviews: seller.totalReviews || 0,
    } as any;
  }

  async createSeller(seller: InsertSeller): Promise<Seller> {
    const newSeller = await SellerModel.create(seller);
    const lean = await SellerModel.findById(newSeller._id).lean();
    if (!lean) throw new Error('Failed to create seller');
    return {
      ...lean,
      id: String(lean._id),
      images: lean.images || [],
      prices: lean.prices || [],
      averageRating: lean.averageRating || 0,
      totalReviews: lean.totalReviews || 0,
    } as any;
  }

  async updateSeller(id: string, seller: Partial<InsertSeller>): Promise<Seller | undefined> {
    const updated = await SellerModel.findByIdAndUpdate(id, seller, { new: true }).lean();
    if (!updated) return undefined;
    return {
      ...updated,
      id: String(updated._id),
      images: updated.images || [],
      prices: updated.prices || [],
      averageRating: updated.averageRating || 0,
      totalReviews: updated.totalReviews || 0,
    } as any;
  }

  async deleteSeller(id: string): Promise<boolean> {
    const result = await SellerModel.findByIdAndDelete(id);
    await SellerReviewModel.deleteMany({ sellerId: id });
    return !!result;
  }

  async getSellerReviews(sellerId: string): Promise<SellerReview[]> {
    const reviews = await SellerReviewModel.find({ sellerId }).sort({ createdAt: -1 }).lean();
    return reviews.map(review => ({
      ...review,
      id: String(review._id),
    })) as any;
  }

  async createSellerReview(review: InsertSellerReview): Promise<SellerReview> {
    const newReview = await SellerReviewModel.create(review);
    await this.updateSellerRating(review.sellerId);
    const lean = await SellerReviewModel.findById(newReview._id).lean();
    if (!lean) throw new Error('Failed to create review');
    return {
      ...lean,
      id: String(lean._id),
    } as any;
  }

  async deleteSellerReview(reviewId: string): Promise<boolean> {
    const review = await SellerReviewModel.findByIdAndDelete(reviewId);
    if (!review) return false;
    // Update the seller rating after deletion
    await this.updateSellerRating(review.sellerId);
    return true;
  }

  async updateSellerRating(sellerId: string): Promise<void> {
    const reviews = await SellerReviewModel.find({ sellerId });
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;
    await SellerModel.findByIdAndUpdate(sellerId, { 
      averageRating: Math.round(averageRating * 10) / 10, 
      totalReviews 
    });
  }

  async getAllTutorials(): Promise<Tutorial[]> {
    const tutorials = await TutorialModel.find().sort({ createdAt: -1 }).lean();
    return tutorials.map(tutorial => ({
      ...tutorial,
      id: String(tutorial._id),
    })) as any;
  }

  async getTutorialById(id: string): Promise<Tutorial | undefined> {
    const tutorial = await TutorialModel.findById(id).lean();
    if (!tutorial) return undefined;
    return {
      ...tutorial,
      id: String(tutorial._id),
    } as any;
  }

  async createTutorial(tutorial: InsertTutorial): Promise<Tutorial> {
    const newTutorial = await TutorialModel.create(tutorial);
    const lean = await TutorialModel.findById(newTutorial._id).lean();
    if (!lean) throw new Error('Failed to create tutorial');
    return {
      ...lean,
      id: String(lean._id),
    } as any;
  }

  async updateTutorial(id: string, tutorial: Partial<InsertTutorial>): Promise<Tutorial | undefined> {
    const updated = await TutorialModel.findByIdAndUpdate(id, tutorial, { new: true }).lean();
    if (!updated) return undefined;
    return {
      ...updated,
      id: String(updated._id),
    } as any;
  }

  async deleteTutorial(id: string): Promise<boolean> {
    const result = await TutorialModel.findByIdAndDelete(id);
    await TutorialCommentModel.deleteMany({ tutorialId: id });
    return !!result;
  }

  async incrementTutorialLikes(id: string): Promise<Tutorial | undefined> {
    const updated = await TutorialModel.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    ).lean();
    if (!updated) return undefined;
    return {
      ...updated,
      id: String(updated._id),
    } as any;
  }

  async getTutorialComments(tutorialId: string): Promise<TutorialComment[]> {
    const comments = await TutorialCommentModel.find({ tutorialId }).sort({ createdAt: -1 }).lean();
    return comments.map(comment => ({
      ...comment,
      id: String(comment._id),
    })) as any;
  }

  async createTutorialComment(comment: InsertTutorialComment): Promise<TutorialComment> {
    const newComment = await TutorialCommentModel.create(comment);
    const lean = await TutorialCommentModel.findById(newComment._id).lean();
    if (!lean) throw new Error('Failed to create tutorial comment');
    return {
      ...lean,
      id: String(lean._id),
    } as any;
  }

  async deleteTutorialComment(id: string): Promise<boolean> {
    const result = await TutorialCommentModel.findByIdAndDelete(id);
    return !!result;
  }

  private mapSiteSettings(doc: any | null | undefined): SiteSettings {
    if (!doc) {
      return { ...this.defaultSiteSettings };
    }

    return {
      reviewVerificationEnabled: Boolean(doc.reviewVerificationEnabled),
      reviewVerificationVideoUrl: doc.reviewVerificationVideoUrl || "",
      reviewVerificationPassphrase: doc.reviewVerificationPassphrase || "",
      reviewVerificationPrompt: doc.reviewVerificationPrompt || "",
      reviewVerificationTimecode: doc.reviewVerificationTimecode || "",
      reviewVerificationYouTubeChannelUrl: doc.reviewVerificationYouTubeChannelUrl || "",
    };
  }

  async getSiteSettings(): Promise<SiteSettings> {
    await this.connect();
    const existing = await SiteSettingsModel.findOne().lean();
    if (!existing) {
      await SiteSettingsModel.create(this.defaultSiteSettings);
      return { ...this.defaultSiteSettings };
    }

    return this.mapSiteSettings(existing);
  }

  async updateSiteSettings(settings: SiteSettingsUpdate): Promise<SiteSettings> {
    await this.connect();
    const update: Record<string, unknown> = {
      ...settings,
    };

    for (const key of Object.keys(update)) {
      if (update[key] === undefined) {
        delete update[key];
      }
    }

    const updated = await SiteSettingsModel.findOneAndUpdate({}, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }).lean();

    return this.mapSiteSettings(updated);
  }

  // Weapons methods
  async getAllWeapons(): Promise<Weapon[]> {
    await this.connect();
    const weapons = await WeaponModel.find().sort({ createdAt: -1 });
    return weapons.map((w: any) => ({
      ...w.toObject(),
      id: w._id.toString(),
    })) as any;
  }

  async getWeaponById(id: string): Promise<Weapon | undefined> {
    await this.connect();
    const weapon = await WeaponModel.findById(id).lean();
    if (!weapon) return undefined;
    return {
      id: weapon._id.toString(),
      name: weapon.name,
      image: weapon.image,
      category: weapon.category || "",
      description: weapon.description || "",
      stats: weapon.stats || {},
      createdAt: weapon.createdAt,
      updatedAt: weapon.updatedAt,
    } as any;
  }

  async createWeapon(weapon: InsertWeapon): Promise<Weapon> {
    await this.connect();
    const created = await WeaponModel.create(weapon);
    const lean = await WeaponModel.findById(created._id).lean();
    if (!lean) throw new Error('Failed to create weapon');
    return {
      id: lean._id.toString(),
      name: lean.name,
      image: lean.image,
      category: lean.category || "",
      description: lean.description || "",
      stats: lean.stats || {},
      createdAt: lean.createdAt,
      updatedAt: lean.updatedAt,
    } as any;
  }

  async updateWeapon(id: string, weapon: Partial<InsertWeapon>): Promise<Weapon | undefined> {
    await this.connect();
    const updated = await WeaponModel.findByIdAndUpdate(id, { ...weapon, updatedAt: new Date() }, { new: true }).lean();
    if (!updated) return undefined;
    return {
      id: updated._id.toString(),
      name: updated.name,
      image: updated.image,
      category: updated.category || "",
      description: updated.description || "",
      stats: updated.stats || {},
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    } as any;
  }

  async deleteWeapon(id: string): Promise<boolean> {
    await this.connect();
    const result = await WeaponModel.findByIdAndDelete(id);
    return !!result;
  }

  // Modes methods
  async getAllModes(): Promise<Mode[]> {
    await this.connect();
    const modes = await ModeModel.find().sort({ createdAt: -1 });
    return modes.map((m: any) => ({
      ...m.toObject(),
      id: m._id.toString(),
    })) as any;
  }

  async getModeById(id: string): Promise<Mode | undefined> {
    await this.connect();
    const mode = await ModeModel.findById(id).lean();
    if (!mode) return undefined;
    return {
      id: mode._id.toString(),
      name: mode.name,
      image: mode.image,
      description: mode.description || "",
      type: mode.type || "",
      createdAt: mode.createdAt,
      updatedAt: mode.updatedAt,
    } as any;
  }

  async createMode(mode: InsertMode): Promise<Mode> {
    await this.connect();
    const created = await ModeModel.create(mode);
    return {
      id: (created as any)._id.toString(),
      name: created.name,
      image: created.image,
      description: created.description || "",
      type: created.type || "",
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    } as any;
  }

  async updateMode(id: string, mode: Partial<InsertMode>): Promise<Mode | undefined> {
    await this.connect();
    const updated = await ModeModel.findByIdAndUpdate(id, { ...mode, updatedAt: new Date() }, { new: true }).lean();
    if (!updated) return undefined;
    return {
      id: updated._id.toString(),
      name: updated.name,
      image: updated.image,
      description: updated.description || "",
      type: updated.type || "",
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    } as any;
  }

  async deleteMode(id: string): Promise<boolean> {
    await this.connect();
    const result = await ModeModel.findByIdAndDelete(id);
    return !!result;
  }

  // Ranks methods
  async getAllRanks(): Promise<Rank[]> {
    await this.connect();
    const ranks = await RankModel.find().sort({ createdAt: -1 }).lean();
    return ranks.map((r: any) => ({
      id: r._id.toString(),
      name: r.name,
      image: r.image,
      description: r.description || "",
      requirements: r.requirements || "",
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })) as any;
  }

  async getRankById(id: string): Promise<Rank | undefined> {
    await this.connect();
    const rank = await RankModel.findById(id).lean();
    if (!rank) return undefined;
    return {
      id: rank._id.toString(),
      name: rank.name,
      image: rank.image,
      description: rank.description || "",
      requirements: rank.requirements || "",
      createdAt: rank.createdAt,
      updatedAt: rank.updatedAt,
    } as any;
  }

  async createRank(rank: InsertRank): Promise<Rank> {
    await this.connect();
    const created = await RankModel.create(rank);
    return {
      id: (created as any)._id.toString(),
      name: created.name,
      image: created.image,
      description: created.description || "",
      requirements: created.requirements || "",
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    } as any;
  }

  async updateRank(id: string, rank: Partial<InsertRank>): Promise<Rank | undefined> {
    await this.connect();
    const updated = await RankModel.findByIdAndUpdate(id, { ...rank, updatedAt: new Date() }, { new: true }).lean();
    if (!updated) return undefined;
    return {
      id: updated._id.toString(),
      name: updated.name,
      image: updated.image,
      description: updated.description || "",
      requirements: updated.requirements || "",
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    } as any;
  }

  async deleteRank(id: string): Promise<boolean> {
    await this.connect();
    const result = await RankModel.findByIdAndDelete(id);
    return !!result;
  }
}
