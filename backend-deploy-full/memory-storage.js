import { v4 as uuidv4 } from 'uuid';
// Lightweight, in-memory storage used as a fallback when MongoDB isn't available.
export class MemoryStorage {
    posts = [];
    comments = [];
    events = [];
    news = [];
    mercenaries = new Map();
    tickets = [];
    ticketReplies = [];
    admins = [];
    newsletterSubscribers = [];
    sellers = [];
    sellerReviews = [];
    tutorials = [];
    tutorialComments = [];
    weapons = [];
    modes = [];
    ranks = [];
    users = [];
    conversations = [];
    messages = [];
    siteSettings = {
        reviewVerificationEnabled: false,
        reviewVerificationVideoUrl: "",
        reviewVerificationPassphrase: "",
        reviewVerificationPrompt: "",
        reviewVerificationTimecode: "",
        reviewVerificationYouTubeChannelUrl: "",
        announcementsEnabled: true,
    };
    constructor() {
        // Seed a default admin so login can work in development.
        const admin = {
            id: uuidv4(),
            username: 'admin',
            password: '$2a$10$eW91ci1kZWZhdWx0LXBhc3N3b3JkLWhhc2g........', // dummy
            roles: ['admin'],
            createdAt: new Date(),
        };
        this.admins.push(admin);
        this.mercenaries.set('1', { id: '1', name: 'Wolf', image: '/assets/merc-wolf.jpg', role: 'Assault' });
        this.mercenaries.set('2', { id: '2', name: 'Vipers', image: '/assets/merc-vipers.jpg', role: 'Sniper' });
        this.mercenaries.set('3', { id: '3', name: 'Sisterhood', image: '/assets/merc-sisterhood.jpg', role: 'Medic' });
        // Seed some sample posts and news so the site has visible content when MongoDB isn't available.
        const now = new Date();
        const samplePost1 = {
            id: uuidv4(),
            title: 'Top 5 CrossFire Weapons — 2025 Review',
            content: 'A deep dive into the top 5 weapons in CrossFire for 2025...',
            summary: 'Quick guide to the best weapons in 2025 for competitive play.',
            image: '/assets/feature-crossfire.jpg',
            category: 'Reviews',
            tags: ['Weapons', 'Review'],
            author: 'Bimora Team',
            featured: false,
            readingTime: 4,
            views: 123,
            createdAt: now,
        };
        const samplePost2 = {
            id: uuidv4(),
            title: 'How to Master the New Mid Line Map',
            content: 'Strategies and tips to control Mid Line map...',
            summary: 'Learn pro tips to dominate Mid Line in Search & Destroy.',
            image: '/assets/feature-crossfire.jpg',
            category: 'Tutorials',
            tags: ['Maps', 'Guide'],
            author: 'Bimora Team',
            featured: true,
            readingTime: 6,
            views: 98,
            createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
        };
        const samplePost3 = {
            id: uuidv4(),
            title: 'Player Experience: CFS Super Fans Event Review',
            content: 'Our hands-on review of the CFS Super Fans event and rewards...',
            summary: 'Event review and what you should aim to collect.',
            image: '/assets/news-superfans.jpg',
            category: 'Reviews',
            tags: ['Event', 'Review'],
            author: 'Bimora Team',
            featured: false,
            readingTime: 3,
            views: 45,
            createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 48),
        };
        this.posts = [samplePost1, samplePost2, samplePost3];
        this.news = [
            {
                id: uuidv4(),
                title: 'Mystic Moonlight Market',
                dateRange: 'Oct 29 - Nov 11',
                image: '/assets/news-sapphire.jpg',
                category: 'Event',
                content: 'Explore the enchanting Mystic Moonlight Market event!',
                author: '[GM]Xenon',
                featured: true,
                createdAt: now,
            },
            {
                id: uuidv4(),
                title: 'CF Shop Special Sale',
                dateRange: 'Oct 8 - Oct 22',
                image: '/assets/news-shop.jpg',
                category: 'Sale',
                content: 'Don\'t miss our biggest CF Shop sale of the year!',
                author: '[GM]Xenon',
                featured: false,
                createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
            },
        ];
        const today = new Date().toISOString().split('T')[0];
        const seedEvents = [
            { title: 'Sleighbell Bonus', description: 'Seasonal rewards and bonuses.', date: today, type: 'upcoming', image: '/attached_assets/feature-crossfire.jpg', event_name_slug: 'sleighbell-bonus' },
            { title: 'Noble Beast Collection', description: 'Collect rare items from the Noble Beast series.', date: today, type: 'upcoming', image: '/attached_assets/feature-crossfire.jpg', event_name_slug: 'noble-beast-collection' },
            { title: 'Gratitude Gathering', description: 'Community appreciation event.', date: today, type: 'upcoming', image: '/attached_assets/feature-crossfire.jpg', event_name_slug: 'gratitude-gathering' },
            { title: 'Black Friday Weapon Loot', description: 'Exclusive Black Friday weapon loot.', date: today, type: 'upcoming', image: '/attached_assets/feature-crossfire.jpg', event_name_slug: 'black-friday-weapon-loot' },
            { title: 'Black Friday 2025', description: 'Annual Black Friday event for 2025.', date: today, type: 'upcoming', image: '/attached_assets/feature-crossfire.jpg', event_name_slug: 'black-friday-2025' },
            { title: 'CF Event Pass Season 5 Rewind', description: 'Relive Season 5 event pass rewards.', date: today, type: 'upcoming', image: '/attached_assets/feature-crossfire.jpg', event_name_slug: 'cf-event-pass-season-5-rewind' },
        ];
        for (const ev of seedEvents) {
            this.events.unshift({ id: uuidv4(), createdAt: new Date(), ...ev });
        }
    }
    // Users
    async getUser(id) {
        const u = this.users.find((x) => x.id === id);
        return u;
    }
    async getUserByUsername(username) {
        const u = this.users.find((x) => (x.username || '').toLowerCase() === username.toLowerCase());
        return u;
    }
    async getUserByEmail(email) {
        const u = this.users.find((x) => (x.email || '').toLowerCase() === email.toLowerCase());
        return u;
    }
    async getUserByPhone(phone) {
        const u = this.users.find((x) => (x.phone || '') === phone);
        return u;
    }
    async createUser(user) {
        const u = { ...user, id: uuidv4(), createdAt: new Date(), verifiedEmail: false, verifiedPhone: false };
        this.users.push(u);
        return u;
    }
    async updateUser(id, updates) {
        const idx = this.users.findIndex((x) => x.id === id);
        if (idx === -1)
            return undefined;
        this.users[idx] = { ...this.users[idx], ...updates };
        return this.users[idx];
    }
    // Posts
    async getAllPosts() {
        return this.posts;
    }
    async getPostById(id) {
        return this.posts.find((p) => p.id === id);
    }
    async createPost(post) {
        const p = { ...post, id: uuidv4(), createdAt: new Date(), views: 0 };
        this.posts.unshift(p);
        return p;
    }
    async updatePost(id, post) {
        const idx = this.posts.findIndex((p) => p.id === id);
        if (idx === -1)
            return undefined;
        this.posts[idx] = { ...this.posts[idx], ...post };
        return this.posts[idx];
    }
    async deletePost(id) {
        const before = this.posts.length;
        this.posts = this.posts.filter((p) => p.id !== id);
        return this.posts.length < before;
    }
    async incrementPostViews(id) {
        const p = this.posts.find((p) => p.id === id);
        if (p)
            p.views = (p.views || 0) + 1;
    }
    // Comments
    async getCommentsByPostId(postId) {
        return this.comments.filter((c) => c.postId === postId);
    }
    async getCommentsByEventId(eventId) {
        return this.comments.filter((c) => c.eventId === eventId);
    }
    async createComment(comment) {
        const c = { ...comment, id: uuidv4(), createdAt: new Date(), likes: 0, likedBy: [] };
        this.comments.push(c);
        return c;
    }
    async deleteComment(id) {
        const before = this.comments.length;
        this.comments = this.comments.filter((c) => c.id !== id);
        return this.comments.length < before;
    }
    async likeComment(id, userId) {
        const comment = this.comments.find(c => c.id === id);
        if (!comment)
            return undefined;
        const uid = userId || "anon";
        const likedBy = comment.likedBy || [];
        const hasLiked = likedBy.includes(uid);
        if (hasLiked) {
            comment.likes = Math.max(0, (comment.likes || 0) - 1);
            comment.likedBy = likedBy.filter(u => u !== uid);
        }
        else {
            comment.likes = (comment.likes || 0) + 1;
            comment.likedBy = [...likedBy, uid];
        }
        return comment;
    }
    // Events
    async getAllEvents() {
        return this.events;
    }
    async getEventById(id) {
        return this.events.find((e) => e.id === id);
    }
    async getEventBySlug(slug) {
        return this.events.find((e) => e.event_name_slug === slug);
    }
    async createEvent(event) {
        const e = { ...event, id: uuidv4(), createdAt: new Date() };
        this.events.unshift(e);
        return e;
    }
    async updateEvent(id, event) {
        const idx = this.events.findIndex((e) => e.id === id);
        if (idx === -1)
            return undefined;
        this.events[idx] = { ...this.events[idx], ...event };
        return this.events[idx];
    }
    async deleteEvent(id) {
        const before = this.events.length;
        this.events = this.events.filter((e) => e.id !== id);
        return this.events.length < before;
    }
    // News
    async getAllNews() {
        return this.news;
    }
    async getNewsById(id) {
        return this.news.find((n) => n.id === id);
    }
    async getNewsBySlug(slug) {
        return this.news.find((n) => n.slug === slug);
    }
    async getPostBySlug(slug) {
        return this.posts.find((p) => p.slug === slug);
    }
    async createNews(news) {
        const n = { ...news, id: uuidv4(), createdAt: new Date() };
        this.news.unshift(n);
        return n;
    }
    async updateNews(id, news) {
        const idx = this.news.findIndex((n) => n.id === id);
        if (idx === -1)
            return undefined;
        this.news[idx] = { ...this.news[idx], ...news };
        return this.news[idx];
    }
    async deleteNews(id) {
        const before = this.news.length;
        this.news = this.news.filter((n) => n.id !== id);
        return this.news.length < before;
    }
    // Mercenaries
    async getAllMercenaries() {
        return Array.from(this.mercenaries.values());
    }
    async createMercenary(mercenary) {
        const id = String(this.mercenaries.size + 1);
        const newMercenary = { ...mercenary, id };
        this.mercenaries.set(id, newMercenary);
        return newMercenary;
    }
    async updateMercenary(id, mercenary) {
        this.mercenaries.set(id, mercenary);
    }
    async deleteMercenary(id) {
        return this.mercenaries.delete(id);
    }
    async removeDuplicateMercenaries() {
        const all = Array.from(this.mercenaries.values());
        const seen = new Map();
        const toDelete = [];
        for (const merc of all) {
            const key = (merc.name || '').toLowerCase();
            if (seen.has(key)) {
                toDelete.push(merc.id);
            }
            else {
                seen.set(key, merc.id);
            }
        }
        for (const id of toDelete) {
            this.mercenaries.delete(id);
        }
        return toDelete.length;
    }
    // Admin Permissions
    async getAllAdminPermissions() {
        return {}; // In-memory, no permissions stored
    }
    async updateAdminPermissions(adminId, permissions) {
        // No-op for in-memory
    }
    // Tickets
    async getAllTickets() {
        return this.tickets;
    }
    async getTicketById(id) {
        return this.tickets.find((t) => t.id === id);
    }
    async getTicketsByEmail(email) {
        return this.tickets.filter((t) => t.userEmail === email);
    }
    async createTicket(ticket) {
        const t = { ...ticket, id: uuidv4(), createdAt: new Date(), updatedAt: new Date() };
        this.tickets.unshift(t);
        return t;
    }
    async updateTicket(id, ticket) {
        const idx = this.tickets.findIndex((t) => t.id === id);
        if (idx === -1)
            return undefined;
        this.tickets[idx] = { ...this.tickets[idx], ...ticket, updatedAt: new Date() };
        return this.tickets[idx];
    }
    async deleteTicket(id) {
        const before = this.tickets.length;
        this.tickets = this.tickets.filter((t) => t.id !== id);
        return this.tickets.length < before;
    }
    async getTicketReplies(ticketId) {
        return this.ticketReplies.filter((r) => r.ticketId === ticketId);
    }
    async createTicketReply(reply) {
        const r = { ...reply, id: uuidv4(), createdAt: new Date() };
        this.ticketReplies.push(r);
        return r;
    }
    // Admins
    async getAllAdmins() {
        return this.admins;
    }
    async getAdminById(id) {
        return this.admins.find((a) => a.id === id);
    }
    async getAdminByUsername(username) {
        return this.admins.find((a) => a.username === username);
    }
    async createAdmin(admin) {
        const a = { ...admin, id: uuidv4(), createdAt: new Date() };
        this.admins.unshift(a);
        return a;
    }
    async updateAdmin(id, admin) {
        const idx = this.admins.findIndex((a) => a.id === id);
        if (idx === -1)
            return undefined;
        this.admins[idx] = { ...this.admins[idx], ...admin };
        return this.admins[idx];
    }
    async deleteAdmin(id) {
        const before = this.admins.length;
        this.admins = this.admins.filter((a) => a.id !== id);
        return this.admins.length < before;
    }
    // Newsletter subscribers
    async getAllNewsletterSubscribers() {
        return this.newsletterSubscribers;
    }
    async getNewsletterSubscriberByEmail(email) {
        return this.newsletterSubscribers.find((s) => s.email === email);
    }
    async createNewsletterSubscriber(subscriber) {
        const s = { ...subscriber, id: uuidv4(), createdAt: new Date() };
        this.newsletterSubscribers.unshift(s);
        return s;
    }
    async deleteNewsletterSubscriber(id) {
        const before = this.newsletterSubscribers.length;
        this.newsletterSubscribers = this.newsletterSubscribers.filter((s) => s.id !== id);
        return this.newsletterSubscribers.length < before;
    }
    // Sellers
    async getAllSellers() {
        return this.sellers;
    }
    async getSellerById(id) {
        return this.sellers.find((s) => s.id === id);
    }
    async createSeller(seller) {
        const s = { ...seller, id: uuidv4(), createdAt: new Date(), images: seller.images || [], prices: seller.prices || [], averageRating: 0, totalReviews: 0 };
        this.sellers.unshift(s);
        return s;
    }
    async updateSeller(id, seller) {
        const idx = this.sellers.findIndex((s) => s.id === id);
        if (idx === -1)
            return undefined;
        this.sellers[idx] = { ...this.sellers[idx], ...seller };
        return this.sellers[idx];
    }
    async deleteSeller(id) {
        const before = this.sellers.length;
        this.sellers = this.sellers.filter((s) => s.id !== id);
        this.sellerReviews = this.sellerReviews.filter((r) => r.sellerId !== id);
        return this.sellers.length < before;
    }
    async getSellerReviews(sellerId) {
        return this.sellerReviews.filter((r) => r.sellerId === sellerId);
    }
    async createSellerReview(review) {
        const r = { ...review, id: uuidv4(), createdAt: new Date() };
        this.sellerReviews.push(r);
        await this.updateSellerRating(review.sellerId);
        return r;
    }
    async deleteSellerReview(reviewId) {
        const before = this.sellerReviews.length;
        const removed = this.sellerReviews.find((r) => r.id === reviewId);
        if (!removed)
            return false;
        this.sellerReviews = this.sellerReviews.filter((r) => r.id !== reviewId);
        await this.updateSellerRating(removed.sellerId);
        return this.sellerReviews.length < before;
    }
    async updateSellerRating(sellerId) {
        const reviews = this.sellerReviews.filter((r) => r.sellerId === sellerId);
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / totalReviews : 0;
        const seller = this.sellers.find((s) => s.id === sellerId);
        if (seller) {
            seller.averageRating = Math.round(averageRating * 10) / 10;
            seller.totalReviews = totalReviews;
        }
    }
    async getSiteSettings() {
        return { ...this.siteSettings };
    }
    async updateSiteSettings(settings) {
        this.siteSettings = {
            ...this.siteSettings,
            ...(settings || {}),
        };
        return { ...this.siteSettings };
    }
    async createConversation(conv) {
        const c = { id: uuidv4(), participants: conv.participants, createdAt: new Date(), lastMessageAt: undefined };
        this.conversations.push(c);
        return c;
    }
    async getConversationById(id) {
        return this.conversations.find((c) => c.id === id);
    }
    async getConversationsByUser(userId) {
        return this.conversations.filter((c) => (c.participants || []).includes(userId));
    }
    async getMessagesByConversation(conversationId) {
        return this.messages.filter((m) => m.conversationId === conversationId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }
    async createMessage(msg) {
        const m = { id: uuidv4(), conversationId: msg.conversationId, senderId: msg.senderId, content: msg.content, mentions: msg.mentions || [], replyTo: msg.replyTo, readBy: [], status: 'sent', createdAt: new Date() };
        this.messages.push(m);
        const conv = this.conversations.find((c) => c.id === msg.conversationId);
        if (conv)
            conv.lastMessageAt = new Date();
        return m;
    }
    async markMessageRead(messageId, userId) {
        const m = this.messages.find((x) => x.id === messageId);
        if (m) {
            if (!m.readBy.includes(userId))
                m.readBy.push(userId);
            m.status = 'read';
        }
    }
    // Tutorials
    async getAllTutorials() {
        return this.tutorials;
    }
    async getTutorialById(id) {
        return this.tutorials.find((t) => t.id === id);
    }
    async getTutorialBySlug(slug) {
        return this.tutorials.find((t) => t.tutorial_slug === slug);
    }
    async createTutorial(tutorial) {
        const base = String(tutorial.title || '').toLowerCase().trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        let slug = base || 'tutorial';
        const existing = this.tutorials.filter((x) => String(x.tutorial_slug || '').toLowerCase().startsWith(slug.toLowerCase()));
        if (existing.length > 0) {
            const nums = existing
                .map((x) => String(x.tutorial_slug || ''))
                .map((s) => {
                const m = s.match(/-(\d+)$/);
                return m ? parseInt(m[1], 10) : (s.toLowerCase() === slug.toLowerCase() ? 1 : 0);
            })
                .filter((n) => !isNaN(n));
            const next = (nums.length > 0 ? Math.max(...nums) + 1 : 2);
            slug = `${slug}-${next}`;
        }
        const t = { ...tutorial, id: uuidv4(), createdAt: new Date(), likes: 0, tutorial_slug: slug };
        this.tutorials.unshift(t);
        return t;
    }
    async updateTutorial(id, tutorial) {
        const idx = this.tutorials.findIndex((t) => t.id === id);
        if (idx === -1)
            return undefined;
        this.tutorials[idx] = { ...this.tutorials[idx], ...tutorial };
        return this.tutorials[idx];
    }
    async deleteTutorial(id) {
        const before = this.tutorials.length;
        this.tutorials = this.tutorials.filter((t) => t.id !== id);
        this.tutorialComments = this.tutorialComments.filter((c) => c.tutorialId !== id);
        return this.tutorials.length < before;
    }
    async incrementTutorialLikes(id) {
        const t = this.tutorials.find((t) => t.id === id);
        if (!t)
            return undefined;
        t.likes = (t.likes || 0) + 1;
        return t;
    }
    async getTutorialComments(tutorialId) {
        return this.tutorialComments.filter((c) => c.tutorialId === tutorialId);
    }
    async createTutorialComment(comment) {
        const c = { ...comment, id: uuidv4(), createdAt: new Date() };
        this.tutorialComments.push(c);
        return c;
    }
    async deleteTutorialComment(id) {
        const before = this.tutorialComments.length;
        this.tutorialComments = this.tutorialComments.filter((c) => c.id !== id);
        return this.tutorialComments.length < before;
    }
    // Weapons
    async getAllWeapons() {
        return this.weapons;
    }
    async getWeaponById(id) {
        return this.weapons.find((w) => w.id === id);
    }
    async createWeapon(weapon) {
        const w = { ...weapon, id: uuidv4(), createdAt: new Date(), updatedAt: new Date() };
        this.weapons.unshift(w);
        return w;
    }
    async updateWeapon(id, weapon) {
        const idx = this.weapons.findIndex((w) => w.id === id);
        if (idx === -1)
            return undefined;
        this.weapons[idx] = { ...this.weapons[idx], ...weapon, updatedAt: new Date() };
        return this.weapons[idx];
    }
    async deleteWeapon(id) {
        const before = this.weapons.length;
        this.weapons = this.weapons.filter((w) => w.id !== id);
        return this.weapons.length < before;
    }
    // Modes
    async getAllModes() {
        return this.modes;
    }
    async getModeById(id) {
        return this.modes.find((m) => m.id === id);
    }
    async createMode(mode) {
        const m = { ...mode, id: uuidv4(), createdAt: new Date(), updatedAt: new Date() };
        this.modes.unshift(m);
        return m;
    }
    async updateMode(id, mode) {
        const idx = this.modes.findIndex((m) => m.id === id);
        if (idx === -1)
            return undefined;
        this.modes[idx] = { ...this.modes[idx], ...mode, updatedAt: new Date() };
        return this.modes[idx];
    }
    async deleteMode(id) {
        const before = this.modes.length;
        this.modes = this.modes.filter((m) => m.id !== id);
        return this.modes.length < before;
    }
    // Ranks
    async getAllRanks() {
        return this.ranks;
    }
    async getRankById(id) {
        return this.ranks.find((r) => r.id === id);
    }
    async createRank(rank) {
        const r = { ...rank, id: uuidv4(), createdAt: new Date(), updatedAt: new Date() };
        this.ranks.unshift(r);
        return r;
    }
    async updateRank(id, rank) {
        const idx = this.ranks.findIndex((r) => r.id === id);
        if (idx === -1)
            return undefined;
        this.ranks[idx] = { ...this.ranks[idx], ...rank, updatedAt: new Date() };
        return this.ranks[idx];
    }
    async deleteRank(id) {
        const before = this.ranks.length;
        this.ranks = this.ranks.filter((r) => r.id !== id);
        return this.ranks.length < before;
    }
}
