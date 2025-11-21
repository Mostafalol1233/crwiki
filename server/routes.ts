import type { Express } from "express";
import { createServer, type Server } from "http";
import fs from 'fs';
import path from 'path';
import multer from "multer";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { storage } from "./storage";
import express from "express";
import { insertPostSchema, insertCommentSchema, insertEventSchema, insertNewsSchema, insertTicketSchema, insertTicketReplySchema, insertAdminSchema, insertNewsletterSubscriberSchema, insertSellerSchema, insertSellerReviewSchema, insertTutorialSchema, updateTutorialSchema, insertTutorialCommentSchema, siteSettingsSchema, insertWeaponSchema, insertModeSchema, insertRankSchema } from "@shared/mongodb-schema";
import type { InsertSellerReview } from "@shared/mongodb-schema";
import { generateToken, verifyAdminPassword, requireAuth, requireSuperAdmin, requireScraperAuth, requireSettingsManager, requireAdminOrTicketManager, requireEventManager, requireEventScraper, requireNewsManager, requireNewsScraper, requireSellerManager, requireTutorialManager, requireWeaponManager, requirePostManager, comparePassword, hashPassword } from "./utils/auth";
import { calculateReadingTime, generateSummary, formatDate } from "./utils/helpers";
import { scrapeForumAnnouncements, scrapeEventDetails, scrapeMultipleEvents, scrapeFirstFiveEvents, scrapeRanks, scrapeModes, scrapeWeapons } from "./services/scraper";
import DOMPurify from 'isomorphic-dompurify';
import type { ScrapedEvent } from "@shared/types";
import { weaponsData, modesData, ranksData } from './data/seed-data.js';

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Rate limiter for image uploads - 10 uploads per hour per IP
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: "Too many upload requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter - 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // SEO: robots.txt
  app.get('/robots.txt', (_req, res) => {
    const base = (process.env.PUBLIC_BASE_URL || 'https://crossfire.wiki').replace(/\/$/, '');
    const robots = [
      'User-agent: *',
      'Allow: /',
      `Sitemap: ${base}/sitemap.xml`,
    ].join('\n');
    res.type('text/plain').send(robots);
  });

  // SEO: sitemap.xml (basic dynamic)
  app.get('/sitemap.xml', async (_req, res) => {
    const base = (process.env.PUBLIC_BASE_URL || 'https://crossfire.wiki').replace(/\/$/, '');
    const urls: { loc: string; priority?: number; changefreq?: string; lastmod?: string }[] = [];
    const push = (path: string, opt: Partial<typeof urls[number]> = {}) => {
      urls.push({ loc: `${base}${path}`, priority: opt.priority, changefreq: opt.changefreq, lastmod: opt.lastmod });
    };

    // Static pages
    push('/', { priority: 1.0, changefreq: 'daily' });
    push('/posts', { priority: 0.7, changefreq: 'weekly' });
    push('/news', { priority: 0.8, changefreq: 'daily' });
    push('/weapons', { priority: 0.6, changefreq: 'weekly' });
    push('/modes', { priority: 0.6, changefreq: 'weekly' });
    push('/ranks', { priority: 0.6, changefreq: 'weekly' });
    push('/tutorials', { priority: 0.5, changefreq: 'weekly' });
    push('/sellers', { priority: 0.4, changefreq: 'weekly' });
    push('/terms', { priority: 0.2, changefreq: 'yearly' });
    push('/privacy', { priority: 0.2, changefreq: 'yearly' });

    // Dynamic: posts, news, events
    try {
      const [posts, news, events] = await Promise.all([
        storage.getAllPosts().catch(() => []),
        storage.getAllNews().catch(() => []),
        storage.getAllEvents().catch(() => []),
      ]);

      for (const p of posts as any[]) {
        push(`/article/${p.id}`, { priority: 0.5, changefreq: 'monthly' });
      }
      for (const n of news as any[]) {
        push(`/news/${n.id}`, { priority: 0.6, changefreq: 'weekly' });
      }
      for (const e of events as any[]) {
        push(`/events/${e.id}`, { priority: 0.4, changefreq: 'monthly' });
      }
    } catch {}

    const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map(u => {
        return [
          '  <url>',
          `    <loc>${u.loc}</loc>`,
          u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>` : '',
          u.changefreq ? `    <changefreq>${u.changefreq}</changefreq>` : '',
          u.priority ? `    <priority>${u.priority.toFixed(1)}</priority>` : '',
          '  </url>'
        ].filter(Boolean).join('\n');
      }).join('\n') +
      `\n</urlset>`;

    res.type('application/xml').send(body);
  });

  // Path aliases: 301 redirects to canonical routes
  app.get(['/terms-of-service', '/terms-of-use'], (_req, res) => res.redirect(301, '/terms'));
  app.get(['/privacy-policy', '/privacy-pol'], (_req, res) => res.redirect(301, '/privacy'));
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
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

        // load admin permissions (mapping) and include in token payload
        let permissions: Record<string, boolean> | undefined = undefined;
        try {
          const allPerms = await storage.getAllAdminPermissions();
          permissions = allPerms?.[admin.id] || undefined;
        } catch (err) {
          console.error('Failed to load admin permissions during login', err);
        }

        const tokenPayload: any = {
          id: admin.id,
          username: admin.username,
          roles: admin.roles,
        };
        if (permissions) tokenPayload.permissions = permissions;

        const token = generateToken(tokenPayload);

        res.json({
          token,
          admin: {
            id: admin.id,
            username: admin.username,
            roles: admin.roles,
            permissions: permissions || {},
          }
        });
      } else if (password) {
        const isValid = await verifyAdminPassword(password);

        if (!isValid) {
          return res.status(401).json({ error: "Invalid password" });
        }

        const token = generateToken({ roles: ["super_admin"] });
        res.json({ token, admin: { roles: ["super_admin"] } });
      } else {
        return res.status(400).json({ error: "Username and password or password required" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Post routes
  app.get("/api/posts", async (req, res) => {
    try {
      const { category, search, featured } = req.query;
      let posts = await storage.getAllPosts();

      if (category && category !== "all") {
        posts = posts.filter(
          (post) => post.category.toLowerCase() === (category as string).toLowerCase()
        );
      }

      if (search) {
        const searchLower = (search as string).toLowerCase();
        posts = posts.filter(
          (post) =>
            post.title.toLowerCase().includes(searchLower) ||
            post.summary.toLowerCase().includes(searchLower) ||
            post.content.toLowerCase().includes(searchLower) ||
            post.tags.some((tag) => tag.toLowerCase().includes(searchLower))
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/posts/:id", async (req, res) => {
    try {
      const post = await storage.getPostById(req.params.id);
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      await storage.incrementPostViews(req.params.id);

      const formattedPost = {
        ...post,
        date: formatDate(post.createdAt),
      };

      res.json(formattedPost);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/posts", requireAuth, requirePostManager, async (req, res) => {
    try {
      const data = insertPostSchema.parse(req.body);
      
      const readingTime = data.readingTime || calculateReadingTime(data.content);
      const summary = data.summary || generateSummary(data.content);
      
      const post = await storage.createPost({
        ...data,
        readingTime,
        summary,
      });

      res.status(201).json(post);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/posts/:id", requireAuth, requirePostManager, async (req, res) => {
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
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/posts/:id", requireAuth, requirePostManager, async (req, res) => {
    try {
      const deleted = await storage.deletePost(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Post not found" });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Comment routes
  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getCommentsByPostId(req.params.id);
      
      const formattedComments = comments.map((comment) => ({
        ...comment,
        date: formatDate(comment.createdAt),
      }));

      res.json(formattedComments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/posts/:id/comments", async (req, res) => {
    try {
      const { id } = req.params;
      const { author, content, parentCommentId } = req.body;
      
      const commentData = {
        postId: id,
        name: author,
        content,
        parentCommentId: parentCommentId || undefined,
      };
      
      const data = insertCommentSchema.parse(commentData);
      const comment = await storage.createComment(data);
      
      const formattedComment = {
        ...comment,
        date: formatDate(comment.createdAt),
      };

      res.status(201).json(formattedComment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Event routes
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Health check for load balancers / Netlify proxy
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, time: Date.now() });
  });

  // Welcome endpoint with logging
  app.get('/api/welcome', (req, res) => {
    console.log(`Request received: ${req.method} ${req.path}`);
    res.json({ message: 'Welcome to the API' });
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEventById(req.params.id);
      
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      res.json(event);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const sanitizeHTML = (html: string): string => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'strike', 's', 'del',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li',
        'a', 'img',
        'blockquote', 'pre', 'code',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'div', 'span',
        'hr'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title',
        'style', 'class',
        'width', 'height',
        'target', 'rel'
      ],
      ALLOW_DATA_ATTR: false,
      KEEP_CONTENT: true
    });
  };

  app.post("/api/events", requireAuth, requireEventManager, async (req, res) => {
    try {
      const data = insertEventSchema.parse(req.body);
      if (data.description) {
        data.description = sanitizeHTML(data.description);
      }
      if (data.descriptionAr) {
        data.descriptionAr = sanitizeHTML(data.descriptionAr);
      }
      const event = await storage.createEvent(data);
      res.status(201).json(event);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/events/:id", requireAuth, requireEventManager, async (req, res) => {
    try {
      const updates = req.body;
      if (updates.description) {
        updates.description = sanitizeHTML(updates.description);
      }
      if (updates.descriptionAr) {
        updates.descriptionAr = sanitizeHTML(updates.descriptionAr);
      }
      const event = await storage.updateEvent(req.params.id, updates);

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      res.json(event);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/events/:id", requireAuth, requireEventManager, async (req, res) => {
    try {
      const deleted = await storage.deleteEvent(req.params.id);

      if (!deleted) {
        return res.status(404).json({ error: "Event not found" });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Scraping routes
  
  // Easy one-click scrape for admins (scrapes and creates events automatically)
  app.post("/api/scrape-events", requireAuth, async (req, res) => {
    try {
      console.log("🔍 Admin: Easy scrape - Getting forum announcements...");
      const posts = await scrapeForumAnnouncements();

      if (!posts || posts.length === 0) {
        return res.status(400).json({ error: "No announcements found to scrape" });
      }

      // Take first 5 posts
      const postsToCreate = posts.slice(0, 5);
      const createdEvents = [];

      for (const post of postsToCreate) {
        try {
          const eventData = {
            title: post.title.substring(0, 200),
            titleAr: '',
            description: (post as any).content || post.title,
            descriptionAr: '',
            date: new Date().toISOString().split('T')[0],
            type: 'upcoming' as const,
            image: 'https://files.catbox.moe/wof38b.jpeg'
          };

          const validated = insertEventSchema.parse(eventData);
          const event = await storage.createEvent(validated);
          createdEvents.push(event);
        } catch (err: any) {
          console.warn(`Failed to create event: ${err.message}`);
        }
      }

      res.json({
        message: `✅ Created ${createdEvents.length} events from forum`,
        count: createdEvents.length,
        events: createdEvents
      });
    } catch (error: any) {
      console.error("Scraping error:", error);
      res.status(500).json({ error: error.message || "Failed to scrape events" });
    }
  });

  // Super Admin: Scrape first 5 events from forum announcements
  app.post("/api/admin/scrape-first-five-events", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      console.log("🔍 Super Admin: Scraping first 5 events from forum announcements...");
      const events = await scrapeFirstFiveEvents();
      res.json({
        message: `✅ Scraped ${events.length} events from forum`,
        events
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Super Admin: Scrape forum and auto-create events (easy one-click for admins)
  app.post("/api/admin/scrape-and-create-events", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      console.log("🔍 Super Admin: Scraping forum announcements and creating events...");
      
      // Scrape forum announcements
      const posts = await scrapeForumAnnouncements();
      
      if (!posts || posts.length === 0) {
        return res.status(400).json({ error: "No announcements found to scrape" });
      }

      // Create events from scraped posts
      const createdEvents = [];
      for (const post of posts) {
        try {
          const eventData = {
            title: post.title.substring(0, 200),
            description: post.title,
            date: new Date().toISOString().split('T')[0],
            type: 'announcement',
            image: 'https://files.catbox.moe/wof38b.jpeg'
          };
          
          const event = await storage.createEvent(eventData);
          createdEvents.push(event);
        } catch (err: any) {
          console.warn(`Failed to create event from post: ${err.message}`);
          // Continue with next post
        }
      }

      res.json({
        message: `✅ Scraped and created ${createdEvents.length} events from forum`,
        events: createdEvents
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/scrape/forum-list", async (req, res) => {
    try {
      const posts = await scrapeForumAnnouncements();
      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/scrape/event-details", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const event = await scrapeEventDetails(url);
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/scrape/multiple-events", async (req, res) => {
    try {
      const { urls } = req.body;

      if (!urls || !Array.isArray(urls)) {
        return res.status(400).json({ error: "URLs array is required" });
      }

      const events = await scrapeMultipleEvents(urls);
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Scrape CrossFire official pages (Admin only)
  app.get("/api/scrape/ranks", requireScraperAuth, async (req, res) => {
    try {
      const ranks = await scrapeRanks();
      res.json(ranks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/scrape/modes", requireScraperAuth, async (req, res) => {
    try {
      const modes = await scrapeModes();
      res.json(modes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/scrape/weapons", requireScraperAuth, async (req, res) => {
    try {
      const weapons = await scrapeWeapons();
      res.json(weapons);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Public API routes for CF data (cached scraped data)
  app.get("/api/cf/ranks", async (req, res) => {
    try {
      // For now, scrape on demand. Later can be cached in DB
      const ranks = await scrapeRanks();
      res.json(ranks);
    } catch (error: any) {
      console.error('Error in /api/cf/ranks:', error);
      res.status(500).json({ error: error.message || "Failed to fetch ranks" });
    }
  });

  app.post("/api/admin/scrape-and-create-ranks", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const ranks = await scrapeRanks();
      const created: any[] = [];
      for (const r of ranks) {
        const data = insertRankSchema.parse({
          name: r.name,
          image: r.image,
          description: r.description || '',
          requirements: r.requirements || '',
        });
        const existingList = await storage.getAllRanks?.();
        const exists = Array.isArray(existingList) ? existingList.find((x: any) => x.name === r.name) : undefined;
        if (!exists) {
          const createdRank = await storage.createRank(data);
          created.push(createdRank);
        }
      }
      res.json({ message: `Created ${created.length} ranks`, count: created.length, ranks: created });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to scrape and create ranks" });
    }
  });

  app.post("/api/admin/reset-ranks", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const existing = await storage.getAllRanks();
      for (const r of existing) {
        await storage.deleteRank(r.id);
      }
      const ranks = await scrapeRanks();
      const created: any[] = [];
      for (const r of ranks) {
        const data = insertRankSchema.parse({
          name: r.name,
          image: r.image,
          description: r.description || '',
          requirements: r.requirements || '',
        });
        const createdRank = await storage.createRank(data);
        created.push(createdRank);
      }
      res.json({ message: `Reset ranks and created ${created.length} new ranks`, count: created.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to reset ranks" });
    }
  });

  app.get("/api/cf/modes", async (req, res) => {
    try {
      const modes = await scrapeModes();
      res.json(modes);
    } catch (error: any) {
      console.error('Error in /api/cf/modes:', error);
      res.status(500).json({ error: error.message || "Failed to fetch modes" });
    }
  });

  app.get("/api/cf/weapons", async (req, res) => {
    try {
      const weapons = await scrapeWeapons();
      res.json(weapons);
    } catch (error: any) {
      console.error('Error in /api/cf/weapons:', error);
      res.status(500).json({ error: error.message || "Failed to fetch weapons" });
    }
  });

  // Seed CF data into MongoDB (one-time utility)
  app.post("/api/seed/cf-data", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      // Weapons
      let createdWeapons = 0;
      for (const w of weaponsData) {
        const all = await storage.getAllWeapons();
        if (!all.find((x: any) => x.name === w.name)) {
          try {
            const parsed = insertWeaponSchema.parse(w);
            await storage.createWeapon(parsed);
            createdWeapons += 1;
          } catch {}
        }
      }

      // Modes
      let createdModes = 0;
      for (const m of modesData) {
        const all = await storage.getAllModes();
        if (!all.find((x: any) => x.name === m.name)) {
          try {
            const parsed = insertModeSchema.parse(m);
            await storage.createMode(parsed);
            createdModes += 1;
          } catch {}
        }
      }

      // Ranks
      let createdRanks = 0;
      for (const r of ranksData) {
        const all = await storage.getAllRanks();
        if (!all.find((x: any) => x.name === r.name)) {
          try {
            const parsed = insertRankSchema.parse(r);
            await storage.createRank(parsed);
            createdRanks += 1;
          } catch {}
        }
      }

      res.status(201).json({ success: true, createdWeapons, createdModes, createdRanks });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to seed CF data' });
    }
  });

  // SEO Routes - Sitemap and Robots.txt
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = process.env.BASE_URL || "https://crossfire.wiki";
      const posts = await storage.getAllPosts();
      const news = await storage.getAllNews();
      const events = await storage.getAllEvents();

      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;

      // Add posts
      posts.forEach((post: any) => {
        const lastmod = post.updatedAt || post.createdAt;
        sitemap += `  <url>
    <loc>${baseUrl}/post/${post.id}</loc>
    <lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      });

      // Add news
      news.forEach((item: any) => {
        const lastmod = item.updatedAt || item.createdAt;
        sitemap += `  <url>
    <loc>${baseUrl}/news/${item.id}</loc>
    <lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      });

      // Add events
      events.forEach((event: any) => {
        sitemap += `  <url>
    <loc>${baseUrl}/events/${event.id}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      });

      // Add category pages
      const categories = [...new Set(posts.map((p: any) => p.category))];
      categories.forEach((category: string) => {
        sitemap += `  <url>
    <loc>${baseUrl}/category/${category.toLowerCase()}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      });

      sitemap += `</urlset>`;

      res.setHeader("Content-Type", "application/xml");
      res.send(sitemap);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/robots.txt", async (req, res) => {
    const robots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Sitemap: ${process.env.BASE_URL || "https://crossfire.wiki"}/sitemap.xml
`;

    res.setHeader("Content-Type", "text/plain");
    res.send(robots);
  });

  // Weapons API routes
  app.get("/api/weapons", async (req, res) => {
    try {
      const weapons = await storage.getAllWeapons();
      res.json(weapons);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/weapons/:id", async (req, res) => {
    try {
      const weapon = await storage.getWeaponById(req.params.id);
      if (!weapon) {
        return res.status(404).json({ error: "Weapon not found" });
      }
      res.json(weapon);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/weapons", requireAuth, requireWeaponManager, async (req, res) => {
    try {
      const data = insertWeaponSchema.parse(req.body);
      const weapon = await storage.createWeapon(data);
      res.status(201).json(weapon);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Bulk create weapons (Admin only) - accepts { weapons: [...] }
  app.post("/api/weapons/bulk-create", requireAuth, requireWeaponManager, async (req, res) => {
    try {
      const { weapons } = req.body;

      if (!weapons || !Array.isArray(weapons)) {
        return res.status(400).json({ error: "weapons array is required" });
      }

      const created: any[] = [];
      for (const w of weapons) {
        try {
          const parsed = insertWeaponSchema.parse(w);
          const createdWeapon = await storage.createWeapon(parsed);
          created.push(createdWeapon);
        } catch (innerErr: any) {
          // skip invalid item but continue with others
          console.error('Skipping weapon due to validation error:', innerErr?.message || innerErr);
        }
      }

      res.status(201).json({ success: true, count: created.length, weapons: created });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/weapons/:id", requireAuth, requireWeaponManager, async (req, res) => {
    try {
      const updates = insertWeaponSchema.partial().parse(req.body);
      const weapon = await storage.updateWeapon(req.params.id, updates);
      if (!weapon) {
        return res.status(404).json({ error: "Weapon not found" });
      }
      res.json(weapon);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/weapons/:id", requireAuth, requireWeaponManager, async (req, res) => {
    try {
      const deleted = await storage.deleteWeapon(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Weapon not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Modes API routes
  app.get("/api/modes", async (req, res) => {
    try {
      const modes = await storage.getAllModes();
      res.json(modes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/modes/:id", async (req, res) => {
    try {
      const mode = await storage.getModeById(req.params.id);
      if (!mode) {
        return res.status(404).json({ error: "Mode not found" });
      }
      res.json(mode);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/modes", requireAuth, requireWeaponManager, async (req, res) => {
    try {
      const data = insertModeSchema.parse(req.body);
      const mode = await storage.createMode(data);
      res.status(201).json(mode);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/modes/:id", requireAuth, requireWeaponManager, async (req, res) => {
    try {
      const updates = insertModeSchema.partial().parse(req.body);
      const mode = await storage.updateMode(req.params.id, updates);
      if (!mode) {
        return res.status(404).json({ error: "Mode not found" });
      }
      res.json(mode);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/modes/:id", requireAuth, requireWeaponManager, async (req, res) => {
    try {
      const deleted = await storage.deleteMode(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Mode not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Ranks API routes
  app.get("/api/ranks", async (req, res) => {
    try {
      const ranks = await storage.getAllRanks();
      res.json(ranks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/ranks/:id", async (req, res) => {
    try {
      const rank = await storage.getRankById(req.params.id);
      if (!rank) {
        return res.status(404).json({ error: "Rank not found" });
      }
      res.json(rank);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ranks", requireAuth, requireWeaponManager, async (req, res) => {
    try {
      const data = insertRankSchema.parse(req.body);
      const rank = await storage.createRank(data);
      res.status(201).json(rank);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/ranks/:id", requireAuth, requireWeaponManager, async (req, res) => {
    try {
      const updates = insertRankSchema.partial().parse(req.body);
      const rank = await storage.updateRank(req.params.id, updates);
      if (!rank) {
        return res.status(404).json({ error: "Rank not found" });
      }
      res.json(rank);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/ranks/:id", requireAuth, requireWeaponManager, async (req, res) => {
    try {
      const deleted = await storage.deleteRank(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Rank not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/events/bulk-create", requireAuth, requireEventScraper, async (req, res) => {
    try {
      const { events, createAsNews } = req.body;

      if (!events || !Array.isArray(events)) {
        return res.status(400).json({ error: "Events array is required" });
      }

      const createdEvents = [];
      const createdNews = [];

      for (const eventData of events) {
        const scrapedEvent = eventData as ScrapedEvent;

        // Create as Event
        const eventToCreate = {
          title: scrapedEvent.title,
          titleAr: '',
          description: sanitizeHTML(scrapedEvent.content),
          descriptionAr: '',
          date: scrapedEvent.date,
          type: 'upcoming',
          image: scrapedEvent.image
        };

        const validated = insertEventSchema.parse(eventToCreate);
        const created = await storage.createEvent(validated);
        createdEvents.push(created);

        // Also create as News if requested
        if (createAsNews) {
          const newsToCreate = {
            title: scrapedEvent.title,
            titleAr: '',
            dateRange: scrapedEvent.date,
            image: scrapedEvent.image || '',
            category: scrapedEvent.category || 'Announcement',
            content: sanitizeHTML(scrapedEvent.content),
            contentAr: '',
            htmlContent: sanitizeHTML(scrapedEvent.content),
            author: 'Forum Scraper',
            featured: false
          };

          const validatedNews = insertNewsSchema.parse(newsToCreate);
          const createdNewsItem = await storage.createNews(validatedNews);
          createdNews.push(createdNewsItem);
        }
      }

      res.status(201).json({
        success: true,
        count: createdEvents.length,
        events: createdEvents,
        newsCount: createdNews.length,
        news: createdNews
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Stats route for admin
  app.get("/api/stats", requireAuth, async (req, res) => {
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
          date: formatDate(post.createdAt),
        })),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Site settings (Super Admin or Settings Manager)
  app.get("/api/settings/site", requireAuth, requireSettingsManager, async (_req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/settings/site", requireAuth, requireSettingsManager, async (req, res) => {
    try {
      const raw = req.body ?? {};

      const toBoolean = (value: unknown): boolean => {
        if (typeof value === "string") {
          return ["true", "1", "on", "yes"].includes(value.toLowerCase());
        }
        return Boolean(value);
      };

      const normalized = {
        reviewVerificationEnabled: toBoolean(raw.reviewVerificationEnabled),
        reviewVerificationVideoUrl: raw.reviewVerificationVideoUrl ?? "",
        reviewVerificationPassphrase: raw.reviewVerificationPassphrase ?? "",
        reviewVerificationPrompt: raw.reviewVerificationPrompt ?? "",
        reviewVerificationTimecode: raw.reviewVerificationTimecode ?? "",
      };

      const parsed = siteSettingsSchema.parse(normalized);

      if (parsed.reviewVerificationEnabled) {
        if (!parsed.reviewVerificationPassphrase.trim()) {
          return res.status(400).json({ error: "Verification phrase is required when review verification is enabled." });
        }
        if (!parsed.reviewVerificationVideoUrl.trim()) {
          return res.status(400).json({ error: "Verification video URL is required when review verification is enabled." });
        }
      }

      const updated = await storage.updateSiteSettings({
        ...parsed,
        reviewVerificationVideoUrl: parsed.reviewVerificationVideoUrl.trim(),
        reviewVerificationPassphrase: parsed.reviewVerificationPassphrase.trim(),
        reviewVerificationPrompt: parsed.reviewVerificationPrompt.trim(),
        reviewVerificationTimecode: parsed.reviewVerificationTimecode.trim(),
        reviewVerificationYouTubeChannelUrl: parsed.reviewVerificationYouTubeChannelUrl.trim(),
      });

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/public/settings/review-verification", async (_req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json({
        reviewVerificationEnabled: settings.reviewVerificationEnabled,
        reviewVerificationVideoUrl: settings.reviewVerificationVideoUrl,
        reviewVerificationPrompt: settings.reviewVerificationPrompt,
        reviewVerificationTimecode: settings.reviewVerificationTimecode,
        reviewVerificationYouTubeChannelUrl: settings.reviewVerificationYouTubeChannelUrl,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // News routes
  app.get("/api/news", async (req, res) => {
    try {
      const news = await storage.getAllNews();
      res.json(news);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/news", requireAuth, requireNewsManager, async (req, res) => {
    try {
      const data = insertNewsSchema.parse(req.body);
      if (data.content) {
        data.content = sanitizeHTML(data.content);
      }
      if (data.contentAr) {
        data.contentAr = sanitizeHTML(data.contentAr);
      }
      const news = await storage.createNews(data);
      res.status(201).json(news);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/news/:id", requireAuth, requireNewsManager, async (req, res) => {
    try {
      const updates = req.body;
      if (updates.content) {
        updates.content = sanitizeHTML(updates.content);
      }
      if (updates.contentAr) {
        updates.contentAr = sanitizeHTML(updates.contentAr);
      }
      const news = await storage.updateNews(req.params.id, updates);

      if (!news) {
        return res.status(404).json({ error: "News item not found" });
      }

      res.json(news);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/news/:id", requireAuth, requireNewsManager, async (req, res) => {
    try {
      const deleted = await storage.deleteNews(req.params.id);

      if (!deleted) {
        return res.status(404).json({ error: "News item not found" });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mercenaries routes
  app.get("/api/mercenaries", async (req, res) => {
    try {
      const mercenaries = await storage.getAllMercenaries();
      res.json(mercenaries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/mercenaries", async (req, res) => {
    try {
      const { name, image, role, description, voiceLines } = req.body;
      if (!name || !image || !role) {
        return res.status(400).json({ error: "name, image, and role required" });
      }
      const merc = await storage.createMercenary({ 
        name, 
        image, 
        role, 
        description: description || "",
        voiceLines: Array.isArray(voiceLines) ? voiceLines.filter((url: string) => url.trim() !== "") : []
      });
      res.status(201).json(merc);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/mercenaries/:id", async (req, res) => {
    try {
      const ok = await storage.deleteMercenary(req.params.id);
      if (!ok) return res.status(404).json({ error: 'Mercenary not found' });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Update Mercenary (name, role, image and sounds)
  app.patch("/api/mercenaries/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, role, image, description, voiceLines } = req.body;

      // Get all mercenaries and find the one with matching id
      const allMercenaries = await storage.getAllMercenaries();
      const current = allMercenaries.find((m) => m.id === id);

      if (!current) {
        return res.status(404).json({ error: "Mercenary not found" });
      }

      // Build update object with only provided fields
      const updated = {
        ...current,
        ...(typeof name === 'string' && name.trim() ? { name: name.trim() } : {}),
        ...(typeof role === 'string' && role.trim() ? { role: role.trim() } : {}),
        ...(typeof description === 'string' && description.trim() ? { description: description.trim() } : {}),
        ...(image ? { image } : {}),
        voiceLines: Array.isArray(voiceLines) ? voiceLines.filter((url: string) => url.trim() !== "") : current.voiceLines || []
      };

      // Update mercenary in storage
      await storage.updateMercenary(id, updated);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/mercenaries/remove-duplicates", async (req, res) => {
    try {
      const removed = await (storage as any).removeDuplicateMercenaries();
      res.json({ success: true, duplicatesRemoved: removed });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Ticket routes
  app.get("/api/tickets", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const tickets = await storage.getAllTickets();
      
      const formattedTickets = tickets.map((ticket) => {
        const formatted = {
          ...ticket,
          createdAt: formatDate(ticket.createdAt),
          updatedAt: formatDate(ticket.updatedAt),
        };
        
        if (!user.roles || !user.roles.includes('super_admin')) {
          delete (formatted as any).userEmail;
        }
        
        return formatted;
      });
      
      res.json(formattedTickets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/tickets/my/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const tickets = await storage.getTicketsByEmail(email);
      const formattedTickets = tickets.map((ticket) => ({
        ...ticket,
        createdAt: formatDate(ticket.createdAt),
        updatedAt: formatDate(ticket.updatedAt),
      }));
      res.json(formattedTickets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/tickets/:id", async (req, res) => {
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tickets", upload.fields([{ name: "image", maxCount: 1 }, { name: "video", maxCount: 1 }]), async (req, res) => {
    try {
      const body = req.body as any;
      let mediaUrl: string | undefined = body.mediaUrl;
      let mediaType: string | undefined = body.mediaType;

      const imageFile = (req.files as any)?.image?.[0];
      const videoFile = (req.files as any)?.video?.[0];

      const file = videoFile || imageFile;
      if (file) {
        const formData = new (global as any).FormData();
        formData.append("reqtype", "fileupload");
        const blob = new (global as any).Blob([file.buffer], { type: file.mimetype });
        formData.append("fileToUpload", blob, file.originalname);
        const response = await fetch("https://catbox.moe/user/api.php", {
          method: "POST",
          body: formData as any,
        });
        if (!response.ok) {
          throw new Error("Failed to upload attachment");
        }
        const urlText = await response.text();
        mediaUrl = urlText.trim();
        mediaType = videoFile ? "video" : "image";
      }

      const data = insertTicketSchema.parse({
        ...body,
        mediaUrl,
        mediaType,
      });
      const ticket = await storage.createTicket(data);
      
      const formattedTicket = {
        ...ticket,
        createdAt: formatDate(ticket.createdAt),
        updatedAt: formatDate(ticket.updatedAt),
      };

      res.status(201).json(formattedTicket);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/tickets/:id", requireAuth, async (req, res) => {
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
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/tickets/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteTicket(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/tickets/:id/replies", async (req, res) => {
    try {
      const replies = await storage.getTicketReplies(req.params.id);
      
      const formattedReplies = replies.map((reply) => ({
        ...reply,
        createdAt: formatDate(reply.createdAt),
      }));

      res.json(formattedReplies);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tickets/:id/replies", upload.single("attachment"), async (req, res) => {
    try {
      const { id } = req.params;
      const { authorName, content, isAdmin } = req.body as any;
      let mediaUrl: string | undefined = undefined;
      let mediaType: string | undefined = undefined;

      if (req.file) {
        const formData = new (global as any).FormData();
        formData.append("reqtype", "fileupload");
        const blob = new (global as any).Blob([req.file.buffer], { type: req.file.mimetype });
        formData.append("fileToUpload", blob, req.file.originalname);
        const response = await fetch("https://catbox.moe/user/api.php", {
          method: "POST",
          body: formData as any,
        });
        if (!response.ok) {
          throw new Error("Failed to upload attachment");
        }
        const urlText = await response.text();
        mediaUrl = urlText.trim();
        mediaType = (req.file.mimetype || '').startsWith('video') ? 'video' : 'image';
      }
      
      const replyData = {
        ticketId: id,
        authorName,
        content,
        isAdmin: (typeof isAdmin === 'boolean')
          ? isAdmin
          : String(isAdmin || '').toLowerCase() === 'true',
        mediaUrl,
        mediaType,
      };
      
      const data = insertTicketReplySchema.parse(replyData);
      const reply = await storage.createTicketReply(data);
      
      const formattedReply = {
        ...reply,
        createdAt: formatDate(reply.createdAt),
      };

      res.status(201).json(formattedReply);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin management routes (restricted to super admins only)
  app.get("/api/admins", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const admins = await storage.getAllAdmins();
      const sanitizedAdmins = admins.map(({ password, ...admin }) => admin);
      res.json(sanitizedAdmins);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admins", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { username, password, role, roles: rolesFromBody, permissions } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const existingAdmin = await storage.getAdminByUsername(username);
      if (existingAdmin) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const hashedPassword = await hashPassword(password);
      // Determine roles to assign. Prefer explicit roles array, else derive from role string or permissions.
      let finalRoles: string[] = [];
      if (Array.isArray(rolesFromBody) && rolesFromBody.length > 0) {
        finalRoles = rolesFromBody;
      } else if (role) {
        finalRoles = [role];
      } else {
        finalRoles = ["admin"];
      }

      // If permissions object provided, map those permissions to roles as well.
      if (permissions && typeof permissions === 'object') {
        const permToRole: Record<string, string> = {
          'events:add': 'event_manager',
          'events:scrape': 'event_scraper',
          'news:add': 'news_manager',
          'news:scrape': 'news_scraper',
          'posts:manage': 'post_manager',
          'sellers:manage': 'seller_manager',
          'tutorials:manage': 'tutorial_manager',
          'tickets:manage': 'ticket_manager',
          'mercenaries:manage': 'mercenary_manager',
          'settings:manage': 'settings_manager',
        };

        for (const [perm, enabled] of Object.entries(permissions)) {
          if (enabled && permToRole[perm]) {
            if (!finalRoles.includes(permToRole[perm])) finalRoles.push(permToRole[perm]);
          }
        }
      }

      const data = insertAdminSchema.parse({
        username,
        password: hashedPassword,
        roles: finalRoles,
      });
      
      const admin = await storage.createAdmin(data);
      const { password: _, ...sanitizedAdmin } = admin;
      
      res.status(201).json(sanitizedAdmin);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/admins/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const updates: any = {};

      if (req.body.username !== undefined) updates.username = req.body.username;
      if (req.body.password !== undefined) {
        updates.password = await hashPassword(req.body.password);
      }

      // Accept role string ("admin" | "super_admin"), roles array and permissions object
      const baseRoles: string[] = [];
      if (typeof req.body.role === 'string' && req.body.role.trim()) {
        baseRoles.push(req.body.role.trim());
      }

      if (Array.isArray(req.body.roles) && req.body.roles.length > 0) {
        const rolesArr: string[] = req.body.roles;
        if (baseRoles.length && !rolesArr.includes(baseRoles[0])) {
          rolesArr.unshift(baseRoles[0]);
        }
        updates.roles = rolesArr;
      } else if (req.body.permissions && typeof req.body.permissions === 'object') {
        const permissions = req.body.permissions as Record<string, boolean>;
        const permToRole: Record<string, string> = {
          'events:add': 'event_manager',
          'events:scrape': 'event_scraper',
          'news:add': 'news_manager',
          'news:scrape': 'news_scraper',
          'posts:manage': 'post_manager',
          'sellers:manage': 'seller_manager',
          'tutorials:manage': 'tutorial_manager',
          'tickets:manage': 'ticket_manager',
          'mercenaries:manage': 'mercenary_manager',
          'settings:manage': 'settings_manager',
        };

        const rolesFromPerms: string[] = [...baseRoles];
        for (const [perm, enabled] of Object.entries(permissions)) {
          if (enabled && permToRole[perm]) {
            const role = permToRole[perm];
            if (!rolesFromPerms.includes(role)) rolesFromPerms.push(role);
          }
        }

        if (rolesFromPerms.length > 0) {
          updates.roles = rolesFromPerms;
        }
      } else if (baseRoles.length > 0) {
        // Only explicit role was provided
        updates.roles = baseRoles;
      }

      const admin = await storage.updateAdmin(req.params.id, updates);
      
      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }

      const { password: _, ...sanitizedAdmin } = admin;
      res.json(sanitizedAdmin);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/admins/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteAdmin(req.params.id);

      if (!deleted) {
        return res.status(404).json({ error: "Admin not found" });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin permissions routes (restricted to super admins only)
  app.get("/api/admin-permissions", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const permissions = await storage.getAllAdminPermissions();
      res.json(permissions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/admin-permissions/:adminId", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { adminId } = req.params;
      const { permissions } = req.body;

      if (!permissions || typeof permissions !== 'object') {
        return res.status(400).json({ error: "Permissions object is required" });
      }

      await storage.updateAdminPermissions(adminId, permissions);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // Newsletter subscriber routes (restricted to super admins only)
  app.get("/api/newsletter-subscribers", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const subscribers = await storage.getAllNewsletterSubscribers();
      res.json(subscribers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/newsletter-subscribe", async (req, res) => {
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
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/newsletter-subscribers/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteNewsletterSubscriber(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Subscriber not found" });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Image upload route with rate limiting
  app.post("/api/upload-image", uploadLimiter, requireAuth, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Create form data for catbox.moe
      const formData = new FormData();
      formData.append('reqtype', 'fileupload');
      
      // Convert buffer to blob for FormData
      const blob = new Blob([new Uint8Array(req.file.buffer)], { type: req.file.mimetype });
      formData.append('fileToUpload', blob, req.file.originalname);

      // Upload to catbox.moe
      const response = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload to catbox.moe');
      }

      const imageUrl = await response.text();
      
      res.json({ url: imageUrl.trim() });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Seed data from attached_assets on server (super admin only)
  app.post("/api/admin/seed-from-assets", requireAuth, requireWeaponManager, async (_req, res) => {
    try {
      const assetsPath = path.join(process.cwd(), 'attached_assets');
      const exists = fs.existsSync(assetsPath);
      if (!exists) {
        return res.status(400).json({ error: 'attached_assets directory not found on server' });
      }

      const files = await fs.promises.readdir(assetsPath);
      let createdWeapons: any[] = [];
      let createdModes: any[] = [];
      let createdRanks: any[] = [];

      const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|jfif|webp)$/i.test(f));

      for (const fileName of imageFiles) {
        const filePath = path.join(assetsPath, fileName);
        const buffer = await fs.promises.readFile(filePath);

        // upload to catbox
        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        const blob = new Blob([new Uint8Array(buffer)]);
        formData.append('fileToUpload', blob, fileName);

        const response = await fetch('https://catbox.moe/user/api.php', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          console.error('Failed to upload', fileName);
          continue;
        }

        const imageUrl = (await response.text()).trim();

        // Heuristic: categorize by filename
        const lower = fileName.toLowerCase();
        if (lower.includes('weap') || lower.includes('weapon') || lower.includes('feature-weap') || lower.includes('image_')) {
          try {
            const created = await storage.createWeapon({ name: path.parse(fileName).name, image: imageUrl, category: '', description: '' });
            createdWeapons.push(created);
          } catch (err) {
            console.error('Failed to create weapon for', fileName, err);
          }
        } else if (lower.includes('coop') || lower.includes('mode') || lower.includes('feature-coop')) {
          try {
            const created = await storage.createMode({ name: path.parse(fileName).name, image: imageUrl, description: '', type: '' });
            createdModes.push(created);
          } catch (err) {
            console.error('Failed to create mode for', fileName, err);
          }
        } else if (lower.includes('comp') || lower.includes('rank') || lower.includes('feature-comp')) {
          try {
            const created = await storage.createRank({ name: path.parse(fileName).name, image: imageUrl, description: '', requirements: '' });
            createdRanks.push(created);
          } catch (err) {
            console.error('Failed to create rank for', fileName, err);
          }
        } else {
          // default to weapon
          try {
            const created = await storage.createWeapon({ name: path.parse(fileName).name, image: imageUrl, category: '', description: '' });
            createdWeapons.push(created);
          } catch (err) {
            console.error('Failed to create default weapon for', fileName, err);
          }
        }
      }

      // Process subfolders for modes, ranks, weapons
      const subfolders = ['modes', 'ranks', 'weapons'];
      for (const subfolder of subfolders) {
        const subDir = path.join(assetsPath, subfolder);
        if (fs.existsSync(subDir)) {
          const subFiles = await fs.promises.readdir(subDir);
          for (const fileName of subFiles) {
            if (!/\.(jpg|jpeg|png|gif|jfif|webp)$/i.test(fileName)) continue;
            const filePath = path.join(subDir, fileName);
            const buffer = await fs.promises.readFile(filePath);

            const formData = new FormData();
            formData.append('reqtype', 'fileupload');
            const blob = new Blob([new Uint8Array(buffer)]);
            formData.append('fileToUpload', blob, fileName);

            const response = await fetch('https://catbox.moe/user/api.php', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              console.error('Failed to upload', fileName);
              continue;
            }

            const imageUrl = (await response.text()).trim();

            try {
              if (subfolder === 'modes') {
                const created = await storage.createMode({ name: path.parse(fileName).name, image: imageUrl, description: '', type: '' });
                createdModes.push(created);
              } else if (subfolder === 'ranks') {
                const created = await storage.createRank({ name: path.parse(fileName).name, image: imageUrl, description: '', requirements: '' });
                createdRanks.push(created);
              } else if (subfolder === 'weapons') {
                const created = await storage.createWeapon({ name: path.parse(fileName).name, image: imageUrl, category: '', description: '' });
                createdWeapons.push(created);
              }
            } catch (err) {
              console.error('Failed to create item for', fileName, err);
            }
          }
        }
      }

      // Also process crossfire_images folder if exists
      const crossfireDir = path.join(assetsPath, 'crossfire_images');
      if (fs.existsSync(crossfireDir)) {
        const cfFiles = await fs.promises.readdir(crossfireDir);
        for (const fileName of cfFiles) {
          if (!/\.(jpg|jpeg|png|gif|jfif|webp)$/i.test(fileName)) continue;
          const filePath = path.join(crossfireDir, fileName);
          const buffer = await fs.promises.readFile(filePath);

            const formData = new FormData();
            formData.append('reqtype', 'fileupload');
            const blob = new Blob([new Uint8Array(buffer)]);
            formData.append('fileToUpload', blob, fileName);

            const response = await fetch('https://catbox.moe/user/api.php', {
              method: 'POST',
              body: formData,
            });

          if (!response.ok) {
            console.error('Failed to upload', fileName);
            continue;
          }

          const imageUrl = (await response.text()).trim();
          try {
            const created = await storage.createWeapon({ name: path.parse(fileName).name, image: imageUrl, category: '', description: '' });
            createdWeapons.push(created);
          } catch (err) {
            console.error('Failed to create weapon for', fileName, err);
          }
        }
      }

      res.json({ success: true, weapons: createdWeapons.length, modes: createdModes.length, ranks: createdRanks.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Seller routes
  app.get("/api/sellers", async (req, res) => {
    try {
      const sellers = await storage.getAllSellers();
      res.json(sellers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/sellers/:id", async (req, res) => {
    try {
      const seller = await storage.getSellerById(req.params.id);
      if (!seller) {
        return res.status(404).json({ error: "Seller not found" });
      }
      res.json(seller);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sellers", requireAuth, requireSellerManager, async (req, res) => {
    try {
      const data = insertSellerSchema.parse(req.body);
      const seller = await storage.createSeller(data);
      res.json(seller);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/sellers/:id", requireAuth, requireSellerManager, async (req, res) => {
    try {
      const data = insertSellerSchema.partial().parse(req.body);
      const seller = await storage.updateSeller(req.params.id, data);
      if (!seller) {
        return res.status(404).json({ error: "Seller not found" });
      }
      res.json(seller);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/sellers/:id", requireAuth, requireSellerManager, async (req, res) => {
    try {
      const success = await storage.deleteSeller(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Seller not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Seller Review routes
  app.get("/api/sellers/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getSellerReviews(req.params.id);
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Limit reviews to 1 per IP per seller per hour to reduce spam
  const reviewLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1,
    // Generate a key per IP + seller id. Use a safe accessor and cast to any to avoid TS mismatches.
    // Use express-rate-limit's ipKeyGenerator to correctly handle IPv6 and forwarded headers.
    keyGenerator: (req: any) => {
      const ip = (ipKeyGenerator as any)(req) || 'unknown';
      const sellerId = req.params?.id || '';
      return `${ip}:${sellerId}`;
    },
    handler: (_req, res /*, next */) => {
      res.status(429).json({ error: 'Too many reviews from this IP for this seller. Try again later.' });
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.post("/api/sellers/:id/reviews", reviewLimiter, async (req, res) => {
    try {
      const parsed = insertSellerReviewSchema.parse({
        ...req.body,
        sellerId: req.params.id,
        verificationAnswer: req.body?.verificationAnswer,
      });
      const { verificationAnswer, ...rest } = parsed;
      const reviewPayload: InsertSellerReview = { ...rest } as InsertSellerReview;

      const settings = await storage.getSiteSettings();
      if (settings.reviewVerificationEnabled) {
        const expected = (settings.reviewVerificationPassphrase || "").trim().toLowerCase();
        const provided = (verificationAnswer || "").trim().toLowerCase();

        if (!expected) {
          return res.status(403).json({ error: "Reviews are temporarily locked. Please try again later." });
        }

        if (!provided || provided !== expected) {
          return res.status(403).json({ error: "Verification failed. Please enter the correct verification word." });
        }
      }

      // Prevent multiple reviews by the same userName for the same seller
      const existing = await storage.getSellerReviews(req.params.id);
      const exists = existing.some((r) => (r.userName || '').toLowerCase() === (reviewPayload.userName || '').toLowerCase());
      if (exists) {
        return res.status(400).json({ error: 'You have already reviewed this seller' });
      }

      const review = await storage.createSellerReview(reviewPayload);
      res.json(review);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Allow admins to delete a seller review
  app.delete("/api/sellers/:id/reviews/:reviewId", requireAuth, requireAdminOrTicketManager, async (req, res) => {
    try {
      const { reviewId } = req.params;
      const deleted = await storage.deleteSellerReview(reviewId);
      if (!deleted) {
        return res.status(404).json({ error: 'Review not found' });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Tutorial routes
  app.get("/api/tutorials", async (req, res) => {
    try {
      const tutorials = await storage.getAllTutorials();
      res.json(tutorials);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/tutorials/:id", async (req, res) => {
    try {
      const tutorial = await storage.getTutorialById(req.params.id);
      
      if (!tutorial) {
        return res.status(404).json({ error: "Tutorial not found" });
      }

      res.json(tutorial);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tutorials", requireAuth, requireTutorialManager, async (req, res) => {
    try {
      const data = insertTutorialSchema.parse(req.body);
      const tutorial = await storage.createTutorial(data);
      res.status(201).json(tutorial);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/tutorials/:id", requireAuth, requireTutorialManager, async (req, res) => {
    try {
      const updates = updateTutorialSchema.parse(req.body);
      const tutorial = await storage.updateTutorial(req.params.id, updates);

      if (!tutorial) {
        return res.status(404).json({ error: "Tutorial not found" });
      }

      res.json(tutorial);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/tutorials/:id", requireAuth, requireTutorialManager, async (req, res) => {
    try {
      const deleted = await storage.deleteTutorial(req.params.id);

      if (!deleted) {
        return res.status(404).json({ error: "Tutorial not found" });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tutorials/:id/like", async (req, res) => {
    try {
      const tutorial = await storage.incrementTutorialLikes(req.params.id);
      
      if (!tutorial) {
        return res.status(404).json({ error: "Tutorial not found" });
      }

      res.json(tutorial);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/tutorials/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getTutorialComments(req.params.id);
      res.json(comments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tutorials/:id/comments", async (req, res) => {
    try {
      const data = insertTutorialCommentSchema.parse({
        ...req.body,
        tutorialId: req.params.id
      });
      const comment = await storage.createTutorialComment(data);
      res.status(201).json(comment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/tutorials/comments/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteTutorialComment(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Comment not found" });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}