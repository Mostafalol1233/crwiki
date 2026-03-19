import mongoose from 'mongoose';
import {
    UserModel,
    PostModel,
    EventModel,
    NewsModel,
    TicketModel,
    TicketReplyModel,
    AdminModel,
    NewsletterSubscriberModel,
    SellerModel,
    SellerReviewModel,
    TutorialModel,
    SiteSettingsModel,
    WeaponModel,
    ModeModel,
    MapModel,
    RankModel,
    MercenaryModel,
    AdminPermissionModel,
    ConversationModel,
    MessageModel,
} from './shared/mongodb-schema.js';

export class MongoDBStorage {
    constructor() {
        this.initialized = false;
        this.mercenaries = new Map();
        this.defaultSiteSettings = {
            reviewVerificationEnabled: false,
            reviewVerificationVideoUrl: "",
            reviewVerificationPassphrase: "",
            reviewVerificationPrompt: "",
            reviewVerificationTimecode: "",
            reviewVerificationYouTubeChannelUrl: "",
            announcementsEnabled: true,
            publicBaseUrl: "",
            seoTitle: "",
            seoDescription: "",
            seoKeywords: [],
            seoOgImage: "",
            robots: "index, follow",
        };
    }

    slugify(text) {
        return String(text)
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    async initialize() {
        if (!this.initialized) {
            const mongoUri = process.env.DATABASE_URL || process.env.MONGODB_URI;
            if (!mongoUri) {
                throw new Error("DATABASE_URL or MONGODB_URI environment variable must be set");
            }
            await mongoose.connect(mongoUri);
            this.initialized = true;
        }
    }

    async getUser(id) {
        if (!id) return undefined;
        const user = await UserModel.findById(id);
        return user || undefined;
    }

    async getUserByUsername(username) {
        const user = await UserModel.findOne({ username });
        return user || undefined;
    }

    async createUser(user) {
        const newUser = await UserModel.create(user);
        return newUser;
    }

    async getUserByEmail(email) {
        const user = await UserModel.findOne({ email });
        return user || undefined;
    }

    async getUserByPhone(phone) {
        const user = await UserModel.findOne({ phone });
        return user || undefined;
    }

    async updateUser(id, updates) {
        const user = await UserModel.findByIdAndUpdate(id, updates, { new: true });
        return user || undefined;
    }

    // Posts
    async getAllPosts(filters = {}) {
        const query = {};
        if (filters.category && filters.category !== "all") {
            query.category = { $regex: new RegExp(`^${filters.category}$`, "i") };
        }
        if (filters.featured === "true" || filters.featured === true) {
            query.featured = true;
        }
        if (filters.search) {
            const searchRegex = { $regex: filters.search, $options: "i" };
            query.$or = [
                { title: searchRegex },
                { summary: searchRegex },
                { content: searchRegex },
                { tags: searchRegex },
            ];
        }
        
        // Performance: Use limit and lean() for faster queries
        const limitRaw = parseInt(filters.limit);
        const limit = isNaN(limitRaw) ? 100 : Math.max(1, Math.min(1000, limitRaw));
        const offsetRaw = parseInt(filters.offset);
        const offset = isNaN(offsetRaw) ? 0 : Math.max(0, offsetRaw);
        
        const [posts, total] = await Promise.all([
            PostModel.find(query)
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .lean(),
            PostModel.countDocuments(query)
        ]);
            
        return {
            items: posts.map(post => ({
                ...post,
                id: String(post._id),
            })),
            total
        };
    }

    async getPostById(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
        const post = await PostModel.findById(id).lean();
        if (!post) return undefined;
        return { ...post, id: String(post._id) };
    }

    async getPostByIdOrSlug(idOrSlug) {
        let post = null;
        if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
            post = await PostModel.findById(idOrSlug).lean();
        }
        if (!post) {
            post = await PostModel.findOne({ post_slug: idOrSlug }).lean();
        }
        if (!post) return undefined;
        return { ...post, id: String(post._id) };
    }

    async createPost(post) {
        if (!post.post_slug && post.title) {
            post.post_slug = this.slugify(post.title);
        }
        const newPost = await PostModel.create(post);
        return { ...newPost.toObject(), id: String(newPost._id) };
    }

    async updatePost(id, post) {
        if (post.title && !post.post_slug) {
            post.post_slug = this.slugify(post.title);
        }
        const updated = await PostModel.findByIdAndUpdate(id, post, { new: true }).lean();
        if (!updated) return undefined;
        return { ...updated, id: String(updated._id) };
    }

    async deletePost(id) {
        const result = await PostModel.findByIdAndDelete(id);
        return !!result;
    }

    async incrementPostViews(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) return;
        await PostModel.findByIdAndUpdate(id, { $inc: { views: 1 } });
    }

    async getPostBySlug(slug) {
        const post = await PostModel.findOne({ post_slug: slug }).lean();
        if (!post) return undefined;
        return { ...post, id: String(post._id) };
    }

    // Events
    async getAllEvents(filters = {}) {
        const query = {};
        const limit = parseInt(filters.limit) || 100;
        const offset = parseInt(filters.offset) || 0;
        const [events, total] = await Promise.all([
            EventModel.find(query)
                .sort({ order: 1, createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .lean(),
            EventModel.countDocuments(query)
        ]);
        return {
            items: events.map(event => ({ ...event, id: String(event._id) })),
            total
        };
    }

    async getEventById(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
        const event = await EventModel.findById(id).lean();
        if (!event) return undefined;
        return { ...event, id: String(event._id) };
    }

    async getEventBySlug(slug) {
        const event = await EventModel.findOne({ event_name_slug: slug }).lean();
        if (!event) return undefined;
        return { ...event, id: String(event._id) };
    }

    async getEventByIdOrSlug(idOrSlug) {
        let event = null;
        if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
            event = await EventModel.findById(idOrSlug).lean();
        }
        if (!event) {
            event = await EventModel.findOne({ event_name_slug: idOrSlug }).lean();
        }
        if (!event) return undefined;
        return { ...event, id: String(event._id) };
    }

    async createEvent(event) {
        if (!event.event_name_slug && event.title) {
            event.event_name_slug = this.slugify(event.title);
        }
        const newEvent = await EventModel.create(event);
        return { ...newEvent.toObject(), id: String(newEvent._id) };
    }

    async updateEvent(id, event) {
        if (event.title && !event.event_name_slug) {
            event.event_name_slug = this.slugify(event.title);
        }
        const updated = await EventModel.findByIdAndUpdate(id, event, { new: true }).lean();
        if (!updated) return undefined;
        return { ...updated, id: String(updated._id) };
    }

    async deleteEvent(id) {
        const result = await EventModel.findByIdAndDelete(id);
        return !!result;
    }

    // News
    async getAllNews(filters = {}) {
        const query = {};
        const limit = parseInt(filters.limit) || 100;
        const offset = parseInt(filters.offset) || 0;
        const [news, total] = await Promise.all([
            NewsModel.find(query)
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .lean(),
            NewsModel.countDocuments(query)
        ]);
        return {
            items: news.map(item => ({ ...item, id: String(item._id) })),
            total
        };
    }

    async getNewsById(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
        const news = await NewsModel.findById(id).lean();
        if (!news) return undefined;
        return { ...news, id: String(news._id) };
    }

    async getNewsBySlug(slug) {
        const news = await NewsModel.findOne({ news_slug: slug }).lean();
        if (!news) return undefined;
        return { ...news, id: String(news._id) };
    }

    async getNewsByIdOrSlug(idOrSlug) {
        let news = null;
        if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
            news = await NewsModel.findById(idOrSlug).lean();
        }
        if (!news) {
            news = await NewsModel.findOne({ news_slug: idOrSlug }).lean();
        }
        if (!news) return undefined;
        return { ...news, id: String(news._id) };
    }

    async createNews(news) {
        if (!news.news_slug && news.title) {
            news.news_slug = this.slugify(news.title);
        }
        const newNews = await NewsModel.create(news);
        return { ...newNews.toObject(), id: String(newNews._id) };
    }

    async updateNews(id, news) {
        if (news.title && !news.news_slug) {
            news.news_slug = this.slugify(news.title);
        }
        const updated = await NewsModel.findByIdAndUpdate(id, news, { new: true }).lean();
        if (!updated) return undefined;
        return { ...updated, id: String(updated._id) };
    }

    async deleteNews(id) {
        const result = await NewsModel.findByIdAndDelete(id);
        return !!result;
    }

    // Sellers
    async getAllSellers() {
        const sellers = await SellerModel.find().sort({ rank: 1, createdAt: -1 }).lean();
        return sellers.map(seller => ({
            ...seller,
            id: String(seller._id),
            rank: typeof seller.rank === 'number' ? seller.rank : 9999,
        }));
    }

    async getSellerById(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
        const seller = await SellerModel.findById(id).lean();
        if (!seller) return undefined;
        return {
            ...seller,
            id: String(seller._id),
            rank: typeof seller.rank === 'number' ? seller.rank : 9999,
        };
    }

    async createSeller(seller) {
        const newSeller = await SellerModel.create(seller);
        return { ...newSeller.toObject(), id: String(newSeller._id) };
    }

    async updateSeller(id, seller) {
        const updated = await SellerModel.findByIdAndUpdate(id, seller, { new: true }).lean();
        if (!updated) return undefined;
        return { ...updated, id: String(updated._id) };
    }

    async deleteSeller(id) {
        const result = await SellerModel.findByIdAndDelete(id);
        await SellerReviewModel.deleteMany({ sellerId: id });
        return !!result;
    }

    async getSellerReviews(sellerId) {
        const reviews = await SellerReviewModel.find({ sellerId }).sort({ helpfulVotes: -1, createdAt: -1 }).lean();
        return reviews.map(review => ({ ...review, id: String(review._id) }));
    }

    async getSellerByName(name) {
        const seller = await SellerModel.findOne({ name }).lean();
        if (!seller) return undefined;
        return {
            ...seller,
            id: String(seller._id),
            rank: typeof seller.rank === 'number' ? seller.rank : 9999,
        };
    }

    async createSellerReview(review) {
        const newReview = await SellerReviewModel.create(review);
        await this.updateSellerRating(review.sellerId);
        return { ...newReview.toObject(), id: String(newReview._id) };
    }

    async deleteSellerReview(reviewId) {
        const review = await SellerReviewModel.findByIdAndDelete(reviewId);
        if (!review) return false;
        await this.updateSellerRating(review.sellerId);
        return true;
    }

    async updateSellerRating(sellerId) {
        const reviews = await SellerReviewModel.find({ sellerId }).lean();
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
            : 0;
        await SellerModel.findByIdAndUpdate(sellerId, {
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews
        });
    }

    // Admins
    async getAllAdmins(filters = {}) {
        const limit = parseInt(filters.limit) || 100;
        const offset = parseInt(filters.offset) || 0;
        const admins = await AdminModel.find()
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .lean();
        return admins.map(admin => ({ ...admin, id: String(admin._id) }));
    }

    async getAdminById(id) {
        const admin = await AdminModel.findById(id).lean();
        if (!admin) return undefined;
        return { ...admin, id: String(admin._id) };
    }

    async getAdminByUsername(username) {
        const admin = await AdminModel.findOne({ username }).lean();
        if (!admin) return undefined;
        return { ...admin, id: String(admin._id) };
    }

    async createAdmin(admin) {
        const newAdmin = await AdminModel.create(admin);
        return { ...newAdmin.toObject(), id: String(newAdmin._id) };
    }

    async updateAdmin(id, admin) {
        const updated = await AdminModel.findByIdAndUpdate(id, admin, { new: true }).lean();
        if (!updated) return undefined;
        return { ...updated, id: String(updated._id) };
    }

    async deleteAdmin(id) {
        const result = await AdminModel.findByIdAndDelete(id);
        return !!result;
    }

    async getAllAdminPermissions() {
        try {
            const permissions = await AdminPermissionModel.find().lean();
            const result = {};
            permissions.forEach(perm => {
                result[perm.adminId] = perm.permissions;
            });
            return result;
        } catch (error) {
            console.error('Error getting admin permissions:', error);
            return {};
        }
    }

    async updateAdminPermissions(adminId, permissions) {
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

    // Tickets
    async getAllTickets() {
        const tickets = await TicketModel.find().sort({ createdAt: -1 }).lean();
        return tickets.map(ticket => ({ ...ticket, id: String(ticket._id) }));
    }

    async getTicketById(id) {
        const ticket = await TicketModel.findById(id).lean();
        if (!ticket) return undefined;
        return { ...ticket, id: String(ticket._id) };
    }

    async getTicketsByEmail(email) {
        const tickets = await TicketModel.find({ userEmail: email }).sort({ createdAt: -1 }).lean();
        return tickets.map(ticket => ({ ...ticket, id: String(ticket._id) }));
    }

    async createTicket(ticket) {
        const newTicket = await TicketModel.create(ticket);
        return { ...newTicket.toObject(), id: String(newTicket._id) };
    }

    async updateTicket(id, ticket) {
        const updated = await TicketModel.findByIdAndUpdate(id, { ...ticket, updatedAt: new Date() }, { new: true }).lean();
        if (!updated) return undefined;
        return { ...updated, id: String(updated._id) };
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

    // Tutorials
    async getAllTutorials(filters = {}) {
        const query = {};
        const limit = parseInt(filters.limit) || 100;
        const offset = parseInt(filters.offset) || 0;
        const [tutorials, total] = await Promise.all([
            TutorialModel.find(query)
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .lean(),
            TutorialModel.countDocuments(query)
        ]);
        return {
            items: tutorials.map(tutorial => ({ ...tutorial, id: String(tutorial._id) })),
            total
        };
    }

    async getTutorialById(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
        const tutorial = await TutorialModel.findById(id).lean();
        if (!tutorial) return undefined;
        return { ...tutorial, id: String(tutorial._id) };
    }

    async getTutorialBySlug(slug) {
        const tutorial = await TutorialModel.findOne({ tutorial_slug: slug }).lean();
        if (!tutorial) return undefined;
        return { ...tutorial, id: String(tutorial._id) };
    }

    async createTutorial(tutorial) {
        const created = await TutorialModel.create(tutorial);
        return { ...created.toObject(), id: String(created._id) };
    }

    async updateTutorial(id, tutorial) {
        const updated = await TutorialModel.findByIdAndUpdate(id, tutorial, { new: true }).lean();
        if (!updated) return undefined;
        return { ...updated, id: String(updated._id) };
    }

    async deleteTutorial(id) {
        const result = await TutorialModel.findByIdAndDelete(id);
        return !!result;
    }

    async incrementTutorialLikes(id) {
        const updated = await TutorialModel.findByIdAndUpdate(id, { $inc: { likes: 1 } }, { new: true }).lean();
        if (!updated) return undefined;
        return { ...updated, id: String(updated._id) };
    }

    // Site Settings
    async getSiteSettings() {
        const existing = await SiteSettingsModel.findOne().lean();
        if (!existing) {
            await SiteSettingsModel.create(this.defaultSiteSettings);
            return { ...this.defaultSiteSettings };
        }
        return this.mapSiteSettings(existing);
    }

    async updateSiteSettings(settings) {
        const update = { ...settings };
        const updated = await SiteSettingsModel.findOneAndUpdate({}, update, {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
        }).lean();
        return this.mapSiteSettings(updated);
    }

    mapSiteSettings(doc) {
        if (!doc) return { ...this.defaultSiteSettings };
        return {
            reviewVerificationEnabled: Boolean(doc.reviewVerificationEnabled),
            reviewVerificationVideoUrl: doc.reviewVerificationVideoUrl || "",
            reviewVerificationPassphrase: doc.reviewVerificationPassphrase || "",
            reviewVerificationPrompt: doc.reviewVerificationPrompt || "",
            reviewVerificationTimecode: doc.reviewVerificationTimecode || "",
            reviewVerificationYouTubeChannelUrl: doc.reviewVerificationYouTubeChannelUrl || "",
            announcementsEnabled: doc.announcementsEnabled !== false,
            publicBaseUrl: doc.publicBaseUrl || "",
            seoTitle: doc.seoTitle || "",
            seoDescription: doc.seoDescription || "",
            seoKeywords: doc.seoKeywords || [],
            seoOgImage: doc.seoOgImage || "",
            robots: doc.robots || "index, follow",
        };
    }

    // Newsletter
    async getAllNewsletterSubscribers() {
        return await NewsletterSubscriberModel.find().sort({ createdAt: -1 });
    }

    async getNewsletterSubscriberByEmail(email) {
        return await NewsletterSubscriberModel.findOne({ email });
    }

    async createNewsletterSubscriber(subscriber) {
        return await NewsletterSubscriberModel.create(subscriber);
    }

    async deleteNewsletterSubscriber(id) {
        const result = await NewsletterSubscriberModel.findByIdAndDelete(id);
        return !!result;
    }

    // Weapons
    async getAllWeapons() {
        const weapons = await WeaponModel.find().sort({ createdAt: -1 });
        return weapons.map(w => ({ ...w.toObject(), id: String(w._id) }));
    }

    async getWeaponById(id) {
        const weapon = await WeaponModel.findById(id).lean();
        if (!weapon) return undefined;
        return { ...weapon, id: String(weapon._id) };
    }

    async createWeapon(weapon) {
        const created = await WeaponModel.create(weapon);
        return { ...created.toObject(), id: String(created._id) };
    }

    async updateWeapon(id, weapon) {
        const updated = await WeaponModel.findByIdAndUpdate(id, { ...weapon, updatedAt: new Date() }, { new: true }).lean();
        if (!updated) return undefined;
        return { ...updated, id: String(updated._id) };
    }

    async deleteWeapon(id) {
        const result = await WeaponModel.findByIdAndDelete(id);
        return !!result;
    }

    // Modes
    async getAllModes() {
        const modes = await ModeModel.find().sort({ createdAt: -1 });
        return modes.map(m => ({ ...m.toObject(), id: String(m._id) }));
    }

    async getModeById(id) {
        const mode = await ModeModel.findById(id).lean();
        if (!mode) return undefined;
        return { ...mode, id: String(mode._id) };
    }

    async createMode(mode) {
        const created = await ModeModel.create(mode);
        return { ...created.toObject(), id: String(created._id) };
    }

    async updateMode(id, mode) {
        const updated = await ModeModel.findByIdAndUpdate(id, { ...mode, updatedAt: new Date() }, { new: true }).lean();
        if (!updated) return undefined;
        return { ...updated, id: String(updated._id) };
    }

    async deleteMode(id) {
        const result = await ModeModel.findByIdAndDelete(id);
        return !!result;
    }

    // Maps
    async getAllMaps() {
        const maps = await MapModel.find().sort({ createdAt: -1 });
        return maps.map(m => ({ ...m.toObject(), id: String(m._id) }));
    }

    async getMapById(id) {
        const map = await MapModel.findById(id).lean();
        if (!map) return undefined;
        return { ...map, id: String(map._id) };
    }

    async createMap(map) {
        const created = await MapModel.create(map);
        return { ...created.toObject(), id: String(created._id) };
    }

    async updateMap(id, map) {
        const updated = await MapModel.findByIdAndUpdate(id, { ...map, updatedAt: new Date() }, { new: true }).lean();
        if (!updated) return undefined;
        return { ...updated, id: String(updated._id) };
    }

    async deleteMap(id) {
        const result = await MapModel.findByIdAndDelete(id);
        return !!result;
    }

    // Ranks
    async getAllRanks() {
        const ranks = await RankModel.find().sort({ createdAt: -1 }).lean();
        return ranks.map(r => ({ ...r, id: String(r._id) }));
    }

    async getRankById(id) {
        const rank = await RankModel.findById(id).lean();
        if (!rank) return undefined;
        return { ...rank, id: String(rank._id) };
    }

    async createRank(rank) {
        const created = await RankModel.create(rank);
        return { ...created.toObject(), id: String(created._id) };
    }

    async updateRank(id, rank) {
        const updated = await RankModel.findByIdAndUpdate(id, { ...rank, updatedAt: new Date() }, { new: true }).lean();
        if (!updated) return undefined;
        return { ...updated, id: String(updated._id) };
    }

    async deleteRank(id) {
        const result = await RankModel.findByIdAndDelete(id);
        return !!result;
    }

    // Mercenaries
    async getAllMercenaries() {
        const mercs = await MercenaryModel.find().lean();
        return mercs.map(m => ({ ...m, id: String(m._id) }));
    }

    async createMercenary(merc) {
        const created = await MercenaryModel.create(merc);
        return { ...created.toObject(), id: String(created._id) };
    }

    async updateMercenary(id, merc) {
        await MercenaryModel.findByIdAndUpdate(id, merc, { new: true });
    }

    async deleteMercenary(id) {
        const result = await MercenaryModel.findByIdAndDelete(id);
        return !!result;
    }

    // Chat/Conversations
    async getConversationsByUser(userId) {
        const list = await ConversationModel.find({ participants: userId }).sort({ lastMessageAt: -1 }).lean();
        return list.map(c => ({ ...c, id: String(c._id) }));
    }

    async createConversation(conv) {
        const created = await ConversationModel.create(conv);
        return { ...created.toObject(), id: String(created._id) };
    }

    async getMessagesByConversation(conversationId) {
        const list = await MessageModel.find({ conversationId }).sort({ createdAt: 1 }).lean();
        return list.map(m => ({ ...m, id: String(m._id) }));
    }

    async createMessage(msg) {
        const created = await MessageModel.create({ ...msg, status: 'sent', readBy: [] });
        await ConversationModel.findByIdAndUpdate(msg.conversationId, { lastMessageAt: new Date() });
        const lean = await MessageModel.findById(created._id).lean();
        return { ...lean, id: String(lean._id) };
    }

    async markMessageRead(messageId, userId) {
        await MessageModel.findByIdAndUpdate(messageId, { $addToSet: { readBy: userId }, status: 'read' });
    }
}
