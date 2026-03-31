import { createServer } from "http";
import fs from 'fs';
import path from 'path';
import express from 'express';
import crypto from 'crypto';
import multer from "multer";
import { rateLimit } from "express-rate-limit";
import { storage, initializeStorage } from "./storage.js";
import { insertPostSchema, insertEventSchema, insertNewsSchema, insertTicketSchema, insertTicketReplySchema, insertAdminSchema, insertNewsletterSubscriberSchema, insertSellerSchema, insertSellerReviewSchema, insertTutorialSchema, updateTutorialSchema, siteSettingsSchema, insertWeaponSchema, insertModeSchema, insertMapSchema, insertRankSchema, insertMercenarySchema } from "./shared/mongodb-schema.js";
import { generateToken, verifyAdminPassword, requireAuth, requireSuperAdmin, requireScraperAuth, requireSettingsManager, requireAdminOrTicketManager, requireEventManager, requireEventScraper, requireNewsManager, requireSellerManager, requireTutorialManager, requireWeaponManager, requirePostManager, comparePassword, hashPassword } from "./utils/auth.js";
import { calculateReadingTime, generateSummary, formatDate } from "./utils/helpers.js";
import { scrapeForumAnnouncements, scrapeEventDetails, scrapeMultipleEvents, scrapeFirstFiveEvents, scrapeRanks, scrapeModes, scrapeWeapons, scrapeMaps, scrapePage } from "./services/scraper.js";
import DOMPurify from 'isomorphic-dompurify';
import sharp from 'sharp';
import fetch from 'node-fetch';
import axios from 'axios';
import FormData from 'form-data';
import mongoose from 'mongoose';
import { weaponsData, modesData, ranksData } from './data/seed-data.js';
import { extractKeywords, generateSeoTitle, summarize, generateSeoImage, parseFlexibleDate, formatEnglishDate, slugifySafe } from './seo-utils.js';
// Configure multer for memory storage
import { uploadStream, deleteAsset } from './services/cloudinary.js';

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/webm', 'video/quicktime', 'audio/mpeg', 'audio/wav', 'audio/ogg'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only Images, MP4, WebM, MOV, and Audio are allowed.'), false);
        }
    }
});
// Rate limiter for image uploads - 200 uploads per hour per IP
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 200,
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
const CSRF_TOKEN = process.env.CSRF_TOKEN || process.env.CSRF_SECRET || ('cf-' + Math.random().toString(36).slice(2));
const ensureDir = (p) => { try { fs.mkdirSync(p, { recursive: true }); } catch { } };
const IMAGES_DIR = path.resolve('backend-deploy-full/uploads/images');
const BACKUP_DIR = path.resolve('backend-deploy-full/uploads/images_backup');
ensureDir(IMAGES_DIR);
ensureDir(BACKUP_DIR);

async function optimizeToWebP(srcPath, destBase, kind) {
    const sizes = [
        { name: 'thumb', width: 320 },
        { name: 'medium', width: 800 },
        { name: 'large', width: 1200 },
    ];
    const outputs = [];
    for (const s of sizes) {
        const outPath = path.join(IMAGES_DIR, `${destBase}-${s.name}.webp`);
        const pipeline = sharp(srcPath, { animated: true }).resize({ width: s.width, height: 1080, fit: 'inside' });
        if (kind === 'graphics') {
            await pipeline.webp({ lossless: true }).toFile(outPath);
        } else {
            await pipeline.webp({ quality: 72 }).toFile(outPath);
        }
        outputs.push({ size: s.name, path: outPath });
    }
    const mainOut = path.join(IMAGES_DIR, `${destBase}.webp`);
    const mainPipe = sharp(srcPath, { animated: true }).resize({ width: 1920, height: 1080, fit: 'inside' });
    if (kind === 'graphics') {
        await mainPipe.webp({ lossless: true }).toFile(mainOut);
    } else {
        await mainPipe.webp({ quality: 72 }).toFile(mainOut);
    }
    outputs.push({ size: 'main', path: mainOut });
    return outputs;
}

function pickKindFromContext(title, category) {
    const t = String(title || '').toLowerCase();
    const c = String(category || '').toLowerCase();
    if (c.includes('event') || t.includes('screenshot')) return 'graphics';
    return 'photo';
}

function buildSeoFilename({ title, category, date, feature }) {
    const game = 'crossfire';
    const theme = slugifySafe(category || 'general');
    const content = slugifySafe(title || 'image');
    const year = String((date && new Date(date).getFullYear()) || new Date().getFullYear());
    const feat = slugifySafe(feature || 'feature');
    return `${game}-${theme}-${content}-${year}-${feat}`;
}

const LOG_DIR = path.resolve('backend-deploy-full/logs');
ensureDir(LOG_DIR);
const LOG_FILE = path.join(LOG_DIR, 'image-processing.jsonl');
const logChange = (entry) => { try { fs.appendFileSync(LOG_FILE, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n'); } catch { } };
const SEO_LOG_FILE = path.join(LOG_DIR, 'seo-changes.jsonl');
const logSeoChange = (entry) => { try { fs.appendFileSync(SEO_LOG_FILE, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n'); } catch { } };
const UPLOAD_LOG_FILE = path.join(LOG_DIR, 'upload-events.jsonl');
const logUpload = (entry) => { try { fs.appendFileSync(UPLOAD_LOG_FILE, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n'); } catch { } };
const uploadStats = { total: 0, success: 0, failed: 0, durations: [] };
function recordUpload(ok, durationMs) {
    uploadStats.total++;
    if (ok) uploadStats.success++; else uploadStats.failed++;
    if (typeof durationMs === 'number' && isFinite(durationMs)) uploadStats.durations.push(durationMs);
    if (uploadStats.durations.length > 1000) uploadStats.durations.splice(0, uploadStats.durations.length - 1000);
}

function sanitizeFilename(name) {
    const n = String(name || '').trim();
    if (!n) return '';
    return n.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
}

function mimeToExt(mime) {
    const map = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'video/mp4': 'mp4',
        'video/webm': 'webm',
        'video/ogg': 'ogv',
        'audio/mpeg': 'mp3',
        'audio/ogg': 'ogg',
        'audio/wav': 'wav',
    };
    return map[mime] || 'bin';
}

export async function registerRoutes(app) {
    await initializeStorage();
    // Ensure non-POST methods on /images/upload return 405 before static middleware
    app.get('/images/upload', (_req, res) => res.status(405).json({ ok: false, error: 'Method not allowed', allowed: ['POST'] }));
    app.put('/images/upload', (_req, res) => res.status(405).json({ ok: false, error: 'Method not allowed', allowed: ['POST'] }));
    app.patch('/images/upload', (_req, res) => res.status(405).json({ ok: false, error: 'Method not allowed', allowed: ['POST'] }));
    app.delete('/images/upload', (_req, res) => res.status(405).json({ ok: false, error: 'Method not allowed', allowed: ['POST'] }));
    app.get('/uploads/*', async (req, res) => {
        try {
            const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dkpdidm89';
            const assetPath = req.params[0] || req.path.replace(/^\/uploads\//, '');
            const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${assetPath}`;
            
            const response = await axios({
                method: 'get',
                url: cloudinaryUrl,
                responseType: 'stream',
                timeout: 10000,
            });

            res.set({
                'Content-Type': response.headers['content-type'],
                'Cache-Control': 'public, max-age=31536000, immutable',
                'ETag': response.headers['etag'],
                'Last-Modified': response.headers['last-modified'],
                'Access-Control-Allow-Origin': '*',
                'X-Content-Type-Options': 'nosniff',
            });

            response.data.pipe(res);
        } catch (error) {
            if (error.response?.status === 404) {
                return res.status(404).send('Asset not found');
            }
            res.status(500).send('Error proxying to Cloudinary');
        }
    });

    app.post("/api/upload", requireAuth, uploadLimiter, upload.single('file'), async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        try {
            const start = Date.now();
            const result = await uploadStream(req.file.buffer, {
                folder: 'crossfire-wiki',
                transformation: [
                    { width: 1200, height: 1200, crop: 'limit' },
                    { quality: 'auto', fetch_format: 'auto' }
                ]
            });
            recordUpload(true, Date.now() - start);
            res.json({ 
                url: result.secure_url, 
                public_id: result.public_id,
                domainUrl: result.secure_url,
                domain_url: result.secure_url
            });
        } catch (error) {
            recordUpload(false, 0);
            res.status(500).json({ error: 'Error uploading to Cloudinary.' });
        }
    });

    app.use('/images', express.static(IMAGES_DIR));
    async function resolveBaseUrl() {
        let base = (process.env.PUBLIC_BASE_URL || 'https://crossfire.wiki');
        try { base = String(base).trim().replace(/^[`'\"]|[`'\"]$/g, ''); } catch { }
        base = base.replace(/\/$/, '');
        try {
            const s = await storage.getSiteSettings();
            if (s?.publicBaseUrl) base = String(s.publicBaseUrl).replace(/\/$/, '');
        } catch { }
        return base;
    }
    function ensureUniqueSlug(list, field, base) {
        let candidate = slugifySafe(base);
        if (!candidate) candidate = 'item';
        const existing = new Set(list.map(x => String(x[field] || '').toLowerCase()).filter(Boolean));
        let suffix = 2;
        while (existing.has(candidate.toLowerCase())) {
            candidate = slugifySafe(`${base}-${suffix++}`);
        }
        return candidate.slice(0, 60);
    }
    // SEO: robots.txt
    app.get('/robots.txt', async (_req, res) => {
        let base = (process.env.PUBLIC_BASE_URL || 'https://crossfire.wiki');
        try { base = String(base).trim().replace(/^[`'\"]|[`'\"]$/g, ''); } catch { }
        base = base.replace(/\/$/, '');
        try {
            const s = await storage.getSiteSettings();
            if (s?.publicBaseUrl) base = String(s.publicBaseUrl).replace(/\/$/, '');
        } catch { }
        const robots = [
            'User-agent: *',
            'Allow: /',
            `Sitemap: ${base}/sitemap.xml`,
        ].join('\n');
        res.type('text/plain').send(robots);
    });
    // SEO: sitemap.xml (basic dynamic)
    app.get('/sitemap.xml', async (_req, res) => {
        let base = (process.env.PUBLIC_BASE_URL || 'https://crossfire.wiki');
        try { base = String(base).trim().replace(/^[`'\"]|[`'\"]$/g, ''); } catch { }
        base = base.replace(/\/$/, '');
        try {
            const s = await storage.getSiteSettings();
            if (s?.publicBaseUrl) base = String(s.publicBaseUrl).replace(/\/$/, '');
        } catch { }
        const urls = [];
        const push = (path, opt = {}) => {
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
            for (const p of posts) {
                const slug = p.post_slug || '';
                if (slug) {
                    push(`/article/${slug}`, { priority: 0.5, changefreq: 'monthly' });
                } else {
                    push(`/article/${p.id}`, { priority: 0.5, changefreq: 'monthly' });
                }
            }
            for (const n of news) {
                push(`/news/${n.id}`, { priority: 0.6, changefreq: 'weekly' });
            }
            for (const e of events) {
                const slug = e.event_name_slug || '';
                if (slug) {
                    push(`/events/${slug}`, { priority: 0.4, changefreq: 'monthly' });
                } else {
                    push(`/events/${e.id}`, { priority: 0.4, changefreq: 'monthly' });
                }
            }
        }
        catch { }
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
                let permissions = undefined;
                try {
                    const allPerms = await storage.getAllAdminPermissions();
                    permissions = allPerms?.[admin.id] || undefined;
                }
                catch (err) {
                    console.error('Failed to load admin permissions during login', err);
                }
                const tokenPayload = {
                    id: admin.id,
                    username: admin.username,
                    roles: admin.roles,
                };
                if (permissions)
                    tokenPayload.permissions = permissions;
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
            }
            else if (password) {
                const isValid = await verifyAdminPassword(password);
                if (!isValid) {
                    return res.status(401).json({ error: "Invalid password" });
                }
                const token = generateToken({ roles: ["super_admin"] });
                res.json({ token, admin: { roles: ["super_admin"] } });
            }
            else {
                return res.status(400).json({ error: "Username and password or password required" });
            }
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/admin/migrate-slugs', requireAuth, requireSuperAdmin, async (_req, res) => {
        try {
            const baseUrl = await resolveBaseUrl();
            const site = await storage.getSiteSettings().catch(() => ({}));
            const defaultOg = site.seoOgImage || '';
            let eventsUpdated = 0, postsUpdated = 0, newsUpdated = 0;
            const [events, posts, news] = await Promise.all([
                storage.getAllEvents().catch(() => []),
                storage.getAllPosts().catch(() => []),
                storage.getAllNews().catch(() => []),
            ]);
            // Events
            for (const e of events) {
                const baseSlug = e.event_name_slug || e.title || '';
                const unique = ensureUniqueSlug(events, 'event_name_slug', baseSlug);
                const canonical = `${baseUrl}/events/${unique}`;
                const updates = {};
                if (!e.event_name_slug || e.event_name_slug !== unique) updates.event_name_slug = unique;
                if (!e.canonicalUrl || e.canonicalUrl !== canonical) updates.canonicalUrl = canonical;
                const baseText = String(e.description || e.title || '');
                const kws = extractKeywords(baseText);
                const nextKeywords = Array.from(new Set([...(e.seoKeywords || []), ...kws]));
                if (!e.seoKeywords || String(e.seoKeywords.join(',')) !== String(nextKeywords.join(','))) updates.seoKeywords = nextKeywords;
                const nextTitle = (e.seoTitle && e.seoTitle.trim()) ? e.seoTitle : generateSeoTitle(e.title, baseText);
                if (!e.seoTitle || e.seoTitle !== nextTitle) updates.seoTitle = nextTitle;
                const nextDesc = (e.seoDescription && e.seoDescription.trim()) ? e.seoDescription : summarize(baseText);
                if (!e.seoDescription || e.seoDescription !== nextDesc) updates.seoDescription = nextDesc;
                if (!e.ogImage) updates.ogImage = defaultOg || e.ogImage;
                if (!e.twitterImage) updates.twitterImage = updates.ogImage || e.twitterImage;
                updates.schemaType = e.schemaType || 'Event';
                if (Object.keys(updates).length > 0) {
                    await storage.updateEvent(e.id || e._id, updates);
                    logSeoChange({ action: 'normalize_event_seo', id: e.id || e._id, updates });
                    eventsUpdated++;
                }
            }
            // Posts
            for (const p of posts) {
                const unique = ensureUniqueSlug(posts, 'post_slug', p.post_slug || p.title || '');
                const canonical = `${baseUrl}/article/${unique}`;
                const updates = {};
                if (!p.post_slug || p.post_slug !== unique) updates.post_slug = unique;
                if (!p.canonicalUrl || p.canonicalUrl !== canonical) updates.canonicalUrl = canonical;
                const baseText = String(p.content || p.summary || p.title || '');
                const kws = extractKeywords(baseText);
                const nextKeywords = Array.from(new Set([...(p.seoKeywords || []), ...kws]));
                if (!p.seoKeywords || String(p.seoKeywords.join(',')) !== String(nextKeywords.join(','))) updates.seoKeywords = nextKeywords;
                const nextTitle = (p.seoTitle && p.seoTitle.trim()) ? p.seoTitle : generateSeoTitle(p.title, baseText);
                if (!p.seoTitle || p.seoTitle !== nextTitle) updates.seoTitle = nextTitle;
                const nextDesc = (p.seoDescription && p.seoDescription.trim()) ? p.seoDescription : summarize(baseText);
                if (!p.seoDescription || p.seoDescription !== nextDesc) updates.seoDescription = nextDesc;
                if (!p.ogImage) updates.ogImage = defaultOg || p.ogImage;
                if (!p.twitterImage) updates.twitterImage = updates.ogImage || p.twitterImage;
                updates.schemaType = p.schemaType || 'Article';
                if (Object.keys(updates).length > 0) {
                    await storage.updatePost(p.id || p._id, updates);
                    logSeoChange({ action: 'normalize_post_seo', id: p.id || p._id, updates });
                    postsUpdated++;
                }
            }
            // News
            for (const n of news) {
                const unique = ensureUniqueSlug(news, 'news_slug', n.news_slug || n.title || '');
                const canonical = `${baseUrl}/news/${unique}`;
                const updates = {};
                if (!n.news_slug || n.news_slug !== unique) updates.news_slug = unique;
                if (!n.canonicalUrl || n.canonicalUrl !== canonical) updates.canonicalUrl = canonical;
                const baseText = String(n.htmlContent || n.content || n.title || '');
                const kws = extractKeywords(baseText);
                const nextKeywords = Array.from(new Set([...(n.seoKeywords || []), ...kws]));
                if (!n.seoKeywords || String(n.seoKeywords.join(',')) !== String(nextKeywords.join(','))) updates.seoKeywords = nextKeywords;
                const nextTitle = (n.seoTitle && n.seoTitle.trim()) ? n.seoTitle : generateSeoTitle(n.title, baseText);
                if (!n.seoTitle || n.seoTitle !== nextTitle) updates.seoTitle = nextTitle;
                const nextDesc = (n.seoDescription && n.seoDescription.trim()) ? n.seoDescription : summarize(baseText);
                if (!n.seoDescription || n.seoDescription !== nextDesc) updates.seoDescription = nextDesc;
                if (!n.ogImage) updates.ogImage = defaultOg || n.ogImage;
                if (!n.twitterImage) updates.twitterImage = updates.ogImage || n.twitterImage;
                updates.schemaType = n.schemaType || 'NewsArticle';
                if (Object.keys(updates).length > 0) {
                    await storage.updateNews(n.id || n._id, updates);
                    logSeoChange({ action: 'normalize_news_seo', id: n.id || n._id, updates });
                    newsUpdated++;
                }
            }
            res.json({ success: true, eventsUpdated, postsUpdated, newsUpdated });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/admin/migrate-to-cloudinary', requireAuth, requireSuperAdmin, async (_req, res) => {
        try {
            const collections = ['posts', 'events', 'news', 'users', 'sellers', 'weapons', 'modes', 'maps', 'ranks', 'mercenaries'];
            const results = {};

            for (const collection of collections) {
                results[collection] = { migrated: 0, failed: 0 };
                const itemsRaw = await storage[`getAll${collection.charAt(0).toUpperCase() + collection.slice(1)}`]();
                const items = itemsRaw.items || itemsRaw;

                for (const item of items) {
                    const updates = {};
                    let changed = false;

                    const urlFields = ['imageUrl', 'backgroundUrl', 'avatarUrl', 'seoOgImageUrl', 'image'];
                    for (const field of urlFields) {
                        if (item[field] && typeof item[field] === 'string' && !item[field].startsWith('http') && !item[field].startsWith('data:')) {
                            try {
                                const filePath = path.resolve('backend-deploy-full', item[field].replace(/^\//, ''));
                                if (fs.existsSync(filePath)) {
                                    const fileBuffer = await fs.promises.readFile(filePath);
                                    const result = await uploadStream(fileBuffer, { folder: collection });
                                    updates[field] = result.secure_url;
                                    updates[`${field}PublicId`] = result.public_id;
                                    changed = true;
                                    results[collection].migrated++;
                                }
                            } catch (error) {
                                results[collection].failed++;
                                console.error(`Failed to migrate ${collection} ${item.id} ${field}: ${error.message}`);
                            }
                        }
                    }

                    if (item.imageUrls && Array.isArray(item.imageUrls)) {
                        const newImageUrls = [];
                        const newPublicIds = [];
                        for (const imageUrl of item.imageUrls) {
                            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
                                try {
                                    const filePath = path.resolve('backend-deploy-full', imageUrl.replace(/^\//, ''));
                                    if (fs.existsSync(filePath)) {
                                        const fileBuffer = await fs.promises.readFile(filePath);
                                        const result = await uploadStream(fileBuffer, { folder: collection });
                                        newImageUrls.push(result.secure_url);
                                        newPublicIds.push(result.public_id);
                                        results[collection].migrated++;
                                    } else {
                                        newImageUrls.push(imageUrl);
                                    }
                                } catch (error) {
                                    results[collection].failed++;
                                    newImageUrls.push(imageUrl);
                                }
                            } else {
                                newImageUrls.push(imageUrl);
                            }
                        }
                        updates.imageUrls = newImageUrls;
                        updates.imagePublicIds = newPublicIds;
                        changed = true;
                    }

                    if (changed) {
                        const singular = collection.endsWith('ies') ? collection.slice(0, -3) + 'y' : collection.slice(0, -1);
                        const updateMethod = `update${singular.charAt(0).toUpperCase() + singular.slice(1)}`;
                        if (typeof storage[updateMethod] === 'function') {
                            await storage[updateMethod](item.id, updates);
                        }
                    }
                }
            }

            res.json({ success: true, results });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    // User auth for chat
    const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
    app.post("/api/users/register", authLimiter, async (req, res) => {
        try {
            const { username, email, phone, password } = req.body;
            if (!username || !email || !phone || !password) {
                return res.status(400).json({ error: "All fields are required" });
            }
            if (typeof password !== 'string' || password.length < 8 || !/[^A-Za-z0-9]/.test(password)) {
                return res.status(400).json({ error: "Password must be at least 8 characters and include a special character" });
            }
            const existingEmail = await storage.getUserByEmail(email);
            if (existingEmail)
                return res.status(400).json({ error: "Email already registered" });
            const existingPhone = await storage.getUserByPhone(phone);
            if (existingPhone)
                return res.status(400).json({ error: "Phone already registered" });
            const existingUsername = await storage.getUserByUsername(username);
            if (existingUsername)
                return res.status(400).json({ error: "Username already taken" });
            const hash = await hashPassword(password);
            const emailCode = Math.floor(100000 + Math.random() * 900000).toString();
            const phoneCode = Math.floor(100000 + Math.random() * 900000).toString();
            const user = await storage.createUser({ username, email, phone, password: hash });
            await storage.updateUser(user.id || user._id?.toString?.() || user._id, {
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.post("/api/users/login", authLimiter, async (req, res) => {
        try {
            const { identifier, password } = req.body;
            if (!identifier || !password)
                return res.status(400).json({ error: "Identifier and password required" });
            const byEmail = await storage.getUserByEmail(identifier);
            const byUsername = await storage.getUserByUsername(identifier);
            const byPhone = await storage.getUserByPhone(identifier);
            const user = byEmail || byUsername || byPhone;
            if (!user)
                return res.status(401).json({ error: "Invalid credentials" });
            const ok = await comparePassword(password, user.password);
            if (!ok)
                return res.status(401).json({ error: "Invalid credentials" });
            const token = generateToken({ id: user.id || user._id?.toString?.(), username: user.username });
            res.json({ token, user: { id: user.id || user._id?.toString?.(), username: user.username, verifiedEmail: user.verifiedEmail, verifiedPhone: user.verifiedPhone } });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.post("/api/users/verify-email", authLimiter, async (req, res) => {
        try {
            const { email, code } = req.body;
            const user = await storage.getUserByEmail(email);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            if (user.emailVerificationCode !== code)
                return res.status(400).json({ error: "Invalid code" });
            const updated = await storage.updateUser(user.id || user._id?.toString?.(), { verifiedEmail: true, emailVerificationCode: '' });
            res.json({ success: true, user: { id: updated.id || updated._id?.toString?.(), verifiedEmail: true } });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.post("/api/users/verify-phone", authLimiter, async (req, res) => {
        try {
            const { phone, code } = req.body;
            const user = await storage.getUserByPhone(phone);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            if (user.phoneVerificationCode !== code)
                return res.status(400).json({ error: "Invalid code" });
            const updated = await storage.updateUser(user.id || user._id?.toString?.(), { verifiedPhone: true, phoneVerificationCode: '' });
            res.json({ success: true, user: { id: updated.id || updated._id?.toString?.(), verifiedPhone: true } });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.post("/api/users/request-reset", authLimiter, async (req, res) => {
        try {
            const { email } = req.body;
            const user = await storage.getUserByEmail(email);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            await storage.updateUser(user.id || user._id?.toString?.(), { resetCode: code, resetCodeIssuedAt: new Date() });
            res.json({ resetCode: code });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.post("/api/admin/users/reset-code", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const { email } = req.body;
            const user = await storage.getUserByEmail(email);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            await storage.updateUser(user.id || user._id?.toString?.(), { resetCode: code, resetCodeIssuedAt: new Date() });
            res.json({ resetCode: code });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.post("/api/users/reset-password", authLimiter, async (req, res) => {
        try {
            const { email, code, newPassword } = req.body;
            if (!email || !code || !newPassword)
                return res.status(400).json({ error: "Email, code and new password required" });
            if (typeof newPassword !== 'string' || newPassword.length < 8 || !/[^A-Za-z0-9]/.test(newPassword)) {
                return res.status(400).json({ error: "Password must be at least 8 characters and include a special character" });
            }
            const user = await storage.getUserByEmail(email);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            if (user.resetCode !== code)
                return res.status(400).json({ error: "Invalid reset code" });
            const hash = await hashPassword(newPassword);
            await storage.updateUser(user.id || user._id?.toString?.(), { password: hash, resetCode: '' });
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    // Chat REST endpoints
    const messageLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });
    app.post("/api/conversations", requireAuth, async (req, res) => {
        try {
            const { participants } = req.body;
            if (!Array.isArray(participants) || participants.length < 2)
                return res.status(400).json({ error: "At least two participants required" });
            const conv = await storage.createConversation({ participants });
            res.status(201).json(conv);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.get("/api/conversations/my", requireAuth, async (req, res) => {
        try {
            const userId = req.user.id;
            const list = await storage.getConversationsByUser(userId);
            res.json(list);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.get("/api/conversations/:id/messages", requireAuth, async (req, res) => {
        try {
            const { id } = req.params;
            const messages = await storage.getMessagesByConversation(id);
            res.json(messages);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.post("/api/messages", requireAuth, messageLimiter, async (req, res) => {
        try {
            const { conversationId, content, replyTo } = req.body;
            if (!conversationId || !content)
                return res.status(400).json({ error: "conversationId and content required" });
            const safeContent = DOMPurify.sanitize(String(content));
            const senderId = req.user.id;
            const mentions = (safeContent.match(/@([A-Za-z0-9_]+)/g) || []).map((m) => m.substring(1));
            const msg = await storage.createMessage({ conversationId, senderId, content: safeContent, replyTo, mentions });
            res.status(201).json(msg);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.post("/api/messages/:id/read", requireAuth, async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            await storage.markMessageRead(id, userId);
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    // Post routes
    app.get("/api/posts", async (req, res) => {
        try {
            const { category, search, featured, limit, offset } = req.query;
            const result = await storage.getAllPosts({
                category,
                search,
                featured,
                limit: limit ? parseInt(limit) : undefined,
                offset: offset ? parseInt(offset) : undefined
            });

            const formattedItems = (result?.items || []).map((post) => ({
                ...post,
                date: formatDate(post.createdAt),
            }));

            res.json({
                items: formattedItems,
                total: result.total
            });
        }
        catch (error) {
            console.error('Error in /api/posts:', error);
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.get("/api/posts/slug/:slug", async (req, res) => {
        try {
            const post = await storage.getPostBySlug(req.params.slug);
            if (!post) {
                return res.status(404).json({ error: "Post not found" });
            }
            await storage.incrementPostViews(post.id);
            const formattedPost = {
                ...post,
                date: formatDate(post.createdAt),
            };
            res.json(formattedPost);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.post("/api/posts", requireAuth, requirePostManager, upload.single('image'), async (req, res) => {
        try {
            const data = insertPostSchema.parse(req.body);
            if (req.file) {
                const result = await uploadStream(req.file.buffer, { folder: 'posts' });
                data.imageUrl = result.secure_url;
                data.imagePublicId = result.public_id;
            }
            const readingTime = data.readingTime || calculateReadingTime(data.content);
            const summary = data.summary || generateSummary(data.content);
            const kws = extractKeywords(String(data.content || ''));
            data.seoKeywords = Array.from(new Set([...(data.seoKeywords || []), ...kws]));
            data.seoTitle = data.seoTitle && data.seoTitle.trim() ? data.seoTitle : generateSeoTitle(data.title, data.content);
            data.seoDescription = data.seoDescription && data.seoDescription.trim() ? data.seoDescription : summarize(data.content);
            data.schemaType = data.schemaType || 'Article';
            const allResult = await storage.getAllPosts().catch(() => ({ items: [] }));
            const all = allResult.items || [];
            const baseUrl = await resolveBaseUrl();
            const baseSlug = data.post_slug || data.title || '';
            const unique = ensureUniqueSlug(all, 'post_slug', baseSlug);
            const canonical = `${baseUrl}/article/${unique}`;
            const post = await storage.createPost({
                ...data,
                readingTime,
                summary,
                post_slug: unique,
                canonicalUrl: canonical,
            });
            res.status(201).json(post);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    app.patch("/api/posts/:id", requireAuth, requirePostManager, async (req, res) => {
        try {
            const updates = req.body;
            const userOgImage = req.body.ogImage !== undefined ? req.body.ogImage : undefined;
            const userTwitterImage = req.body.twitterImage !== undefined ? req.body.twitterImage : undefined;
            if (updates.content && !updates.readingTime) {
                updates.readingTime = calculateReadingTime(updates.content);
            }
            if (updates.content && !updates.summary) {
                updates.summary = generateSummary(updates.content);
            }
            if (updates.title || updates.content || updates.seoTitle || updates.seoDescription || updates.seoKeywords) {
                const title = updates.title || '';
                const content = updates.content || '';
                const kws = extractKeywords(String(content || ''));
                updates.seoKeywords = Array.from(new Set([...(updates.seoKeywords || []), ...kws]));
                updates.seoTitle = updates.seoTitle && updates.seoTitle.trim() ? updates.seoTitle : generateSeoTitle(title, content);
                updates.seoDescription = updates.seoDescription && updates.seoDescription.trim() ? updates.seoDescription : summarize(content);
                if (userOgImage !== undefined) updates.ogImage = userOgImage;
                if (userTwitterImage !== undefined) updates.twitterImage = userTwitterImage;
                updates.schemaType = updates.schemaType || 'Article';
            }
            const post = await storage.updatePost(req.params.id, updates);
            if (!post) {
                return res.status(404).json({ error: "Post not found" });
            }
            res.json(post);
        }
        catch (error) {
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // SEO settings for a post (GET/PUT)
    app.get('/api/posts/:id/seo', requireAuth, requirePostManager, async (req, res) => {
        try {
            const p = await storage.getPostById(req.params.id);
            if (!p) return res.status(404).json({ ok: false, error: 'Post not found' });
            res.json({
                ok: true,
                seoTitle: p.seoTitle || '',
                seoDescription: p.seoDescription || '',
                seoKeywords: p.seoKeywords || [],
                canonicalUrl: p.canonicalUrl || '',
                ogImage: p.ogImage || '',
                twitterImage: p.twitterImage || '',
                schemaType: p.schemaType || 'Article',
            });
        } catch (error) {
            res.status(500).json({ ok: false, error: error.message });
        }
    });

    app.put('/api/posts/:id/seo', requireAuth, requirePostManager, async (req, res) => {
        try {
            const body = req.body || {};
            const updates = {};
            if (body.seoTitle !== undefined) updates.seoTitle = body.seoTitle;
            if (body.seoDescription !== undefined) updates.seoDescription = body.seoDescription;
            if (body.seoKeywords !== undefined) updates.seoKeywords = body.seoKeywords;
            if (body.canonicalUrl !== undefined) updates.canonicalUrl = body.canonicalUrl;
            if (body.ogImage !== undefined) updates.ogImage = body.ogImage;
            if (body.twitterImage !== undefined) updates.twitterImage = body.twitterImage;
            if (body.schemaType !== undefined) updates.schemaType = body.schemaType;

            const post = await storage.updatePost(req.params.id, updates);
            if (!post) return res.status(404).json({ ok: false, error: 'Post not found' });

            // Log SEO change
            try {
                logSeoChange({ actor: req.user?.username || 'system', action: 'update_post_seo', id: req.params.id, updates });
            } catch { }

            res.json({ ok: true, post });
        } catch (error) {
            res.status(500).json({ ok: false, error: error.message });
        }
    });
    // Event routes
    app.get("/api/events", async (req, res) => {
        try {
            const { limit, offset } = req.query;
            const result = await storage.getAllEvents({
                limit: limit ? parseInt(limit) : undefined,
                offset: offset ? parseInt(offset) : undefined
            });
            const items = (result.items || []).map(e => ({
                ...e,
                image: e.image || e.imageUrl || '',
                imageUrl: e.imageUrl || e.image || '',
            }));
            res.json({
                items,
                total: result.total
            });
        }
        catch (error) {
            console.error('Error in /api/events:', error);
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
    app.get('/api/security/csrf-token', async (_req, res) => {
        res.json({ csrfToken: CSRF_TOKEN });
    });
    app.get("/api/events/:id", async (req, res) => {
        try {
            const event = await storage.getEventById(req.params.id);
            if (!event) {
                return res.status(404).json({ error: "Event not found" });
            }
            res.json({ ...event, image: event.image || event.imageUrl || '', imageUrl: event.imageUrl || event.image || '' });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.get("/api/events/slug/:slug", async (req, res) => {
        try {
            const event = await storage.getEventBySlug(req.params.slug);
            if (!event) {
                return res.status(404).json({ error: "Event not found" });
            }
            res.json({ ...event, image: event.image || event.imageUrl || '', imageUrl: event.imageUrl || event.image || '' });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    const sanitizeHTML = (html, options = {}) => {
        const allowAdvanced = Boolean(options?.allowAdvanced);
        const allowedTags = [
            'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'strike', 's', 'del',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li',
            'a', 'img',
            'blockquote', 'pre', 'code',
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'div', 'span',
            'hr',
            'audio', 'video', 'source', 'iframe',
            // keep style tags for event coloring/custom theme blocks
            'style',
            ...(allowAdvanced ? ['script'] : [])
        ];
        const allowedAttrs = [
            'href', 'src', 'alt', 'title',
            'style', 'class',
            'width', 'height',
            'target', 'rel',
            'controls', 'frameborder', 'allow', 'allowfullscreen',
            'loading', 'decoding', 'fetchpriority',
            'preload', 'muted', 'autoplay',
            // keep common styling hooks always
            'id',
            ...(allowAdvanced ? ['type', 'nonce'] : [])
        ];

        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: allowedTags,
            ALLOWED_ATTR: allowedAttrs,
            // keep data-* attributes for styling hooks used by imported forum blocks
            ALLOW_DATA_ATTR: true,
            KEEP_CONTENT: true
        });
    };
    const isAllowedMediaUrl = (url) => {
        if (!url || typeof url !== 'string') return false;
        const absolute = /^https?:\/\/[^\s]+$/i.test(url);
        const relative = /^\/[^^\s]+$/i.test(url);
        const dataImg = /^data:image\/[-+a-z0-9.]+;base64,[A-Za-z0-9+\/=\s]+$/i.test(url);
        return absolute || relative || dataImg;
    };
    const validateMediaUrlsInHtml = (html) => {
        const srcs = [];
        const regex = /<(?:img|video|audio|source)\b[^>]*?\s(?:src)\s*=\s*"([^"]+)"/gi;
        let m;
        while ((m = regex.exec(html))) {
            srcs.push(m[1]);
        }
        for (const u of srcs) {
            if (!isAllowedMediaUrl(u)) {
                return { ok: false, url: u };
            }
        }
        return { ok: true };
    };
    app.post("/api/events", requireAuth, requireEventManager, upload.single('image'), async (req, res) => {
        try {
            const rawBody = { ...req.body };
            if (rawBody.image && !rawBody.imageUrl) { rawBody.imageUrl = rawBody.image; }
            const data = insertEventSchema.parse(rawBody);
            if (req.file) {
                const result = await uploadStream(req.file.buffer, { folder: 'events' });
                data.imageUrl = result.secure_url;
                data.imagePublicId = result.public_id;
            }
            if (data.description) {
                data.description = sanitizeHTML(data.description, { allowAdvanced: Boolean(data.fullLayout) });
            }
            if (data.descriptionAr) {
                data.descriptionAr = sanitizeHTML(data.descriptionAr, { allowAdvanced: Boolean(data.fullLayout) });
            }
            const baseText = String(data.description || data.title || '');
            const kws = extractKeywords(baseText);
            data.seoKeywords = Array.from(new Set([...(data.seoKeywords || []), ...kws]));
            data.seoTitle = data.seoTitle && data.seoTitle.trim() ? data.seoTitle : generateSeoTitle(data.title, baseText);
            data.seoDescription = data.seoDescription && data.seoDescription.trim() ? data.seoDescription : summarize(baseText);
            data.schemaType = data.schemaType || 'Event';
            const allResult = await storage.getAllEvents().catch(() => ({ items: [] }));
            const all = allResult.items || [];
            const baseUrl = await resolveBaseUrl();
            const baseSlug = data.event_name_slug || data.title || '';
            const unique = ensureUniqueSlug(all, 'event_name_slug', baseSlug);
            const canonical = `${baseUrl}/events/${unique}`;
            const event = await storage.createEvent({ ...data, event_name_slug: unique, canonicalUrl: canonical });
            res.status(201).json(event);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    app.patch("/api/events/:id", requireAuth, requireEventManager, async (req, res) => {
        try {
            const updates = req.body;
            const userOgImage = req.body.ogImage !== undefined ? req.body.ogImage : undefined;
            const userTwitterImage = req.body.twitterImage !== undefined ? req.body.twitterImage : undefined;
            if (updates.image === '') { delete updates.image; } else if (updates.image) { updates.imageUrl = updates.image; }
            if (!updates.ogImage && updates.imageUrl) updates.ogImage = updates.imageUrl;
            if (!updates.twitterImage && (updates.ogImage || updates.imageUrl)) updates.twitterImage = updates.ogImage || updates.imageUrl;
            if (updates.description) {
                updates.description = sanitizeHTML(updates.description, { allowAdvanced: Boolean(updates.fullLayout) });
            }
            if (updates.descriptionAr) {
                updates.descriptionAr = sanitizeHTML(updates.descriptionAr, { allowAdvanced: Boolean(updates.fullLayout) });
            }
            if (updates.title || updates.description || updates.seoTitle || updates.seoDescription || updates.seoKeywords) {
                const title = updates.title || '';
                const content = String(updates.description || title || '');
                const kws = extractKeywords(content);
                updates.seoKeywords = Array.from(new Set([...(updates.seoKeywords || []), ...kws]));
                updates.seoTitle = updates.seoTitle && updates.seoTitle.trim() ? updates.seoTitle : generateSeoTitle(title, content);
                updates.seoDescription = updates.seoDescription && updates.seoDescription.trim() ? updates.seoDescription : summarize(content);
                if (userOgImage !== undefined) updates.ogImage = userOgImage;
                if (userTwitterImage !== undefined) updates.twitterImage = userTwitterImage;
                updates.schemaType = updates.schemaType || 'Event';
            }
            const event = await storage.updateEvent(req.params.id, updates);
            if (!event) {
                return res.status(404).json({ error: "Event not found" });
            }
            res.json(event);
        }
        catch (error) {
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // SEO settings for an event (GET/PUT)
    app.get('/api/events/:id/seo', requireAuth, requireEventManager, async (req, res) => {
        try {
            const e = await storage.getEventById(req.params.id);
            if (!e) return res.status(404).json({ ok: false, error: 'Event not found' });
            res.json({
                ok: true,
                seoTitle: e.seoTitle || '',
                seoDescription: e.seoDescription || '',
                seoKeywords: e.seoKeywords || [],
                canonicalUrl: e.canonicalUrl || '',
                ogImage: e.ogImage || '',
                twitterImage: e.twitterImage || '',
                schemaType: e.schemaType || 'Event',
            });
        } catch (error) {
            res.status(500).json({ ok: false, error: error.message });
        }
    });

    app.put('/api/events/:id/seo', requireAuth, requireEventManager, async (req, res) => {
        try {
            const body = req.body || {};
            const updates = {};
            if (body.seoTitle !== undefined) updates.seoTitle = body.seoTitle;
            if (body.seoDescription !== undefined) updates.seoDescription = body.seoDescription;
            if (body.seoKeywords !== undefined) updates.seoKeywords = body.seoKeywords;
            if (body.canonicalUrl !== undefined) updates.canonicalUrl = body.canonicalUrl;
            if (body.ogImage !== undefined) updates.ogImage = body.ogImage;
            if (body.twitterImage !== undefined) updates.twitterImage = body.twitterImage;
            if (body.schemaType !== undefined) updates.schemaType = body.schemaType;

            const event = await storage.updateEvent(req.params.id, updates);
            if (!event) return res.status(404).json({ ok: false, error: 'Event not found' });

            // Log SEO change
            try {
                logSeoChange({ actor: req.user?.username || 'system', action: 'update_event_seo', id: req.params.id, updates });
            } catch { }

            res.json({ ok: true, event });
        } catch (error) {
            res.status(500).json({ ok: false, error: error.message });
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
                    // Fetch details for better content and image
                    let details = {};
                    try {
                        if (post.url) details = await scrapeEventDetails(post.url);
                    } catch (e) { console.warn('Details scrape failed for', post.url); }

                    const title = details.title || post.title.substring(0, 200);
                    // Use HTML content if available, fallback to title
                    const description = details.content || post.content || post.title;

                    const isTrustedScrapedImage = (u) => {
                        if (!u || typeof u !== 'string') return false;
                        if (u.startsWith('/')) return true;
                        try {
                            const h = new URL(u).hostname.replace(/^www\./, '');
                            return ['catbox.moe','cloudinary.com','res.cloudinary.com','crossfire.wiki','z8games.com','akamaized.net','files.catbox.moe'].some(d => h === d || h.endsWith('.' + d));
                        } catch { return false; }
                    };
                    const eventData = {
                        title: title,
                        titleAr: '',
                        description: description,
                        descriptionAr: '',
                        date: details.date ? new Date(details.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                        type: 'upcoming',
                        imageUrl: isTrustedScrapedImage(details.image) ? details.image : 'https://files.catbox.moe/wof38b.jpeg',
                        ogImage: isTrustedScrapedImage(details.image) ? details.image : 'https://files.catbox.moe/wof38b.jpeg',
                        seoDescription: details.preview || summarize(title),
                    };

                    // Generate SEO image if missing or generic
                    if (!eventData.imageUrl || eventData.imageUrl.includes('wof38b')) {
                        try {
                            const imagesDir = path.resolve('backend-deploy-full/uploads/images');
                            fs.mkdirSync(imagesDir, { recursive: true });
                            const seoImage = await generateSeoImage({ baseDir: imagesDir, slug: title, title: title, keywords: [], type: 'event' });
                            if (seoImage?.url) eventData.imageUrl = seoImage.url;
                        } catch { }
                    }
                    if (!eventData.ogImage && eventData.imageUrl) eventData.ogImage = eventData.imageUrl;

                    const validated = insertEventSchema.parse(eventData);
                    const event = await storage.createEvent(validated);
                    createdEvents.push(event);
                }
                catch (err) {
                    console.warn(`Failed to create event: ${err.message}`);
                }
            }
            res.json({
                message: `✅ Created ${createdEvents.length} events from forum`,
                count: createdEvents.length,
                events: createdEvents
            });
        }
        catch (error) {
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
        }
        catch (error) {
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
                    // Fetch details
                    let details = {};
                    try {
                        if (post.url) details = await scrapeEventDetails(post.url);
                    } catch (e) { console.warn('Details scrape failed for', post.url); }

                    const title = details.title || post.title.substring(0, 200);
                    const description = details.content || post.title;

                    const isTrustedScrapedImage2 = (u) => {
                        if (!u || typeof u !== 'string') return false;
                        if (u.startsWith('/')) return true;
                        try {
                            const h = new URL(u).hostname.replace(/^www\./, '');
                            return ['catbox.moe','cloudinary.com','res.cloudinary.com','crossfire.wiki','z8games.com','akamaized.net','files.catbox.moe'].some(d => h === d || h.endsWith('.' + d));
                        } catch { return false; }
                    };
                    const imgVal2 = isTrustedScrapedImage2(details.image) ? details.image : 'https://files.catbox.moe/wof38b.jpeg';
                    const eventData = {
                        title: title,
                        description: description,
                        date: details.date ? new Date(details.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                        type: 'announcement',
                        imageUrl: imgVal2,
                        ogImage: imgVal2,
                        twitterImage: imgVal2,
                        seoDescription: details.preview || summarize(title),
                    };

                    // Generate SEO image if missing or generic
                    if (!eventData.imageUrl || eventData.imageUrl.includes('wof38b')) {
                        try {
                            const imagesDir = path.resolve('backend-deploy-full/uploads/images');
                            fs.mkdirSync(imagesDir, { recursive: true });
                            const seoImage = await generateSeoImage({ baseDir: imagesDir, slug: title, title: title, keywords: [], type: 'event' });
                            if (seoImage?.url) { eventData.imageUrl = seoImage.url; eventData.ogImage = seoImage.url; }
                        } catch { }
                    }

                    const event = await storage.createEvent(eventData);
                    createdEvents.push(event);
                }
                catch (err) {
                    console.warn(`Failed to create event from post: ${err.message}`);
                    // Continue with next post
                }
            }
            res.json({
                message: `✅ Scraped and created ${createdEvents.length} events from forum`,
                events: createdEvents
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.get("/api/scrape/forum-list", async (req, res) => {
        try {
            const posts = await scrapeForumAnnouncements();
            res.json(posts);
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    // Scrape CrossFire official pages (Admin only)
    app.get("/api/scrape/ranks", requireScraperAuth, async (req, res) => {
        try {
            const ranks = await scrapeRanks();
            res.json(ranks);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.get("/api/scrape/modes", requireScraperAuth, async (req, res) => {
        try {
            const modes = await scrapeModes();
            res.json(modes);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.get("/api/scrape/weapons", requireScraperAuth, async (req, res) => {
        try {
            const weapons = await scrapeWeapons();
            res.json(weapons);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    // Validate content - extract colors, font info, and SEO meta from HTML
    app.post("/api/scrape/validate-content", async (req, res) => {
        try {
            const { html, url } = req.body;
            const cheerioLib = await import('cheerio');
            const colors = [];
            if (html) {
                const $ = cheerioLib.load(html);
                $('[style]').each((_, el) => {
                    const style = ($(el).attr('style') || '');
                    const colorMatch = style.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
                    if (colorMatch) colors.push(colorMatch[1].trim());
                    const bgMatch = style.match(/background(?:-color)?\s*:\s*([^;]+)/i);
                    if (bgMatch) colors.push(bgMatch[1].trim());
                });
                $('font[color]').each((_, el) => {
                    const c = ($(el).attr('color') || '').trim();
                    if (c) colors.push(c);
                });
            }
            const uniqueColors = [...new Set(colors)];
            let seoMeta = {};
            if (url) {
                try {
                    const event = await scrapeEventDetails(url);
                    seoMeta = {
                        seoTitle: event.seoTitle,
                        seoDescription: event.seoDescription,
                        seoKeywords: event.seoKeywords,
                        ogTitle: event.ogTitle,
                        ogDescription: event.ogDescription,
                        image: event.image,
                        colors: event.colors,
                    };
                } catch (e) {
                    seoMeta = { error: e.message };
                }
            }
            res.json({ colors: uniqueColors, seoMeta });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    // Single URL scraper endpoint
    app.post("/api/scrape/single-url", requireAuth, async (req, res) => {
        try {
            const { url } = req.body;
            if (!url || !url.startsWith('http')) {
                return res.status(400).json({ error: "Valid URL required" });
            }
            const result = await scrapePage(url);
            if (!result) {
                return res.status(500).json({ error: "Failed to scrape page" });
            }
            const isWiki = url.includes('fandom.com') || url.includes('wiki');
            const contentLength = (result.content || '').replace(/<[^>]*>/g, '').length;
            const cheerioLib = await import('cheerio');
            const $ = cheerioLib.load(result.content || '');
            const tabSections = $('.tabber, .tabbertab, [data-tab], .wds-tab__content').length;
            res.json({
                title: result.title,
                content: result.content,
                excerpt: result.summary,
                seoDescription: result.summary,
                seoTitle: result.title,
                keywords: [],
                mainImage: result.image,
                image: result.image,
                sourceUrl: url,
                url: url,
                isWiki,
                tabSections,
                contentLength,
                status: 'success',
            });
        } catch (error) {
            console.error('Error in /api/scrape/single-url:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Rebuild all mercenary posts from Fandom Wiki
    app.post("/api/admin/rebuild-mercenary-posts", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const mercenaries = [
                { name: "Wolf", wikiSlug: "Wolf_(CrossFire)" },
                { name: "Vipers", wikiSlug: "Vipers" },
                { name: "Sisterhood", wikiSlug: "Sisterhood" },
                { name: "Black_Mamba", wikiSlug: "Black_Mamba_(CrossFire)" },
                { name: "Desperado", wikiSlug: "Desperado" },
                { name: "Ronin", wikiSlug: "Ronin_(CrossFire)" },
                { name: "Dean", wikiSlug: "Dean" },
                { name: "Saber", wikiSlug: "Saber_(CrossFire)" },
                { name: "Brimstone", wikiSlug: "Brimstone_(CrossFire)" },
                { name: "Arch_Honorary", wikiSlug: "Arch_Honorary" },
            ];
            const allPosts = await storage.getAllPosts();
            const posts = Array.isArray(allPosts) ? allPosts : (allPosts.items || []);
            let deletedCount = 0;
            for (const post of posts) {
                try {
                    await storage.deletePost(post._id || post.id);
                    deletedCount++;
                } catch (e) {}
            }
            let created = 0, failed = 0;
            for (const merc of mercenaries) {
                try {
                    const wikiUrl = `https://crossfire.fandom.com/wiki/${merc.wikiSlug}`;
                    const scraped = await scrapePage(wikiUrl);
                    if (!scraped) { failed++; continue; }
                    await storage.createPost({
                        title: scraped.title || merc.name,
                        content: scraped.content || '',
                        summary: scraped.summary || '',
                        category: "Mercenaries",
                        tags: "mercenary,crossfire",
                        author: "CrossFire Wiki",
                        image: scraped.image || '',
                        sourceUrl: wikiUrl,
                        featured: false,
                        seoTitle: scraped.title || merc.name,
                        seoDescription: scraped.summary || '',
                        seoKeywords: ['mercenary', 'crossfire', merc.name.toLowerCase()],
                    });
                    created++;
                } catch (e) {
                    console.error(`Failed to create post for ${merc.name}:`, e.message);
                    failed++;
                }
            }
            res.json({ deletedCount, created, failed });
        } catch (error) {
            console.error('Error in /api/admin/rebuild-mercenary-posts:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Rebuild all posts with Maps, Characters and Events from CrossFire Fandom Wiki
    app.post("/api/admin/rebuild-wiki-posts", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const FANDOM_API = "https://crossfire.fandom.com/api.php";
            const categories = [
                { name: "Weapons", category: "Weapons" },
                { name: "Characters", category: "Characters" },
                { name: "Events", category: "Events" },
            ];
            const limit = 15;

            // Delete all existing posts
            const allPosts = await storage.getAllPosts();
            const posts = Array.isArray(allPosts) ? allPosts : (allPosts.items || []);
            let deletedCount = 0;
            for (const post of posts) {
                try {
                    await storage.deletePost(post._id || post.id);
                    deletedCount++;
                } catch (e) {}
            }

            let created = 0, failed = 0;

            for (const { name: catName, category: catKey } of categories) {
                try {
                    const listUrl = `${FANDOM_API}?action=query&list=categorymembers&cmtitle=Category:${encodeURIComponent(catKey)}&cmlimit=${limit}&cmtype=page&format=json&origin=*`;
                    const listResp = await fetch(listUrl, { headers: { "User-Agent": "CrossFireWiki-Bot/1.0" } });
                    if (!listResp.ok) { failed++; continue; }
                    const listData = await listResp.json();
                    const pages = (listData?.query?.categorymembers || []).slice(0, limit);

                    for (const page of pages) {
                        try {
                            const pageTitle = page.title;
                            const parseUrl = `${FANDOM_API}?action=parse&page=${encodeURIComponent(pageTitle)}&prop=wikitext|images|displaytitle&format=json&origin=*`;
                            const parseResp = await fetch(parseUrl, { headers: { "User-Agent": "CrossFireWiki-Bot/1.0" } });
                            if (!parseResp.ok) { failed++; continue; }
                            const parseData = await parseResp.json();
                            const wikitext = parseData?.parse?.wikitext?.["*"] || "";
                            const displayTitle = (parseData?.parse?.displaytitle || pageTitle).replace(/<[^>]+>/g, "");
                            const imageFiles = parseData?.parse?.images || [];

                            let imageUrl = "";
                            if (imageFiles.length > 0) {
                                const imgTitle = `File:${imageFiles[0]}`;
                                const imgApiUrl = `${FANDOM_API}?action=query&titles=${encodeURIComponent(imgTitle)}&prop=imageinfo&iiprop=url&format=json&origin=*`;
                                const imgResp = await fetch(imgApiUrl, { headers: { "User-Agent": "CrossFireWiki-Bot/1.0" } });
                                if (imgResp.ok) {
                                    const imgData = await imgResp.json();
                                    const imgPages = imgData?.query?.pages || {};
                                    const firstPage = Object.values(imgPages)[0];
                                    imageUrl = firstPage?.imageinfo?.[0]?.url || "";
                                }
                            }

                            const cleanText = wikitext
                                .replace(/\{\{[^}]+\}\}/g, "")
                                .replace(/\[\[(?:[^|\]]+\|)?([^\]]+)\]\]/g, "$1")
                                .replace(/'''([^']+)'''/g, "$1")
                                .replace(/''([^']+)''/g, "$1")
                                .replace(/==+([^=]+)==+/g, "\n$1\n")
                                .replace(/\n{3,}/g, "\n\n")
                                .trim();
                            const summary = cleanText.substring(0, 200).trim();

                            const postData = {
                                title: displayTitle,
                                content: cleanText.substring(0, 5000),
                                summary,
                                image: imageUrl,
                                category: catName,
                                tags: ["Fandom Wiki", catName, "CrossFire"],
                                author: "CrossFire Fandom Wiki",
                                readingTime: Math.max(1, Math.ceil(cleanText.split(/\s+/).length / 200)),
                                featured: false,
                                sourceUrl: `https://crossfirefps.fandom.com/wiki/${encodeURIComponent(pageTitle)}`,
                                seoTitle: displayTitle,
                                seoDescription: summary,
                                seoKeywords: [catName.toLowerCase(), "crossfire", displayTitle.toLowerCase()],
                            };
                            await storage.createPost(postData);
                            created++;
                            await new Promise(r => setTimeout(r, 400));
                        } catch (e) {
                            console.error(`Failed to create post for ${page.title}:`, e.message);
                            failed++;
                        }
                    }
                } catch (e) {
                    console.error(`Failed to fetch category ${catKey}:`, e.message);
                    failed++;
                }
            }

            res.json({ deletedCount, created, failed });
        } catch (error) {
            console.error('Error in /api/admin/rebuild-wiki-posts:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Rescrape and update existing item content
    app.post("/api/admin/rescrape-item", requireAuth, async (req, res) => {
        try {
            const { type, id, url } = req.body;
            if (!type || !id || !url || !url.startsWith('http')) {
                return res.status(400).json({ error: "type, id, and valid url are required" });
            }
            const scraped = await scrapePage(url);
            if (!scraped) {
                return res.status(500).json({ error: "Failed to scrape URL" });
            }
            const contentLength = (scraped.content || '').replace(/<[^>]*>/g, '').length;
            const updateData = {
                content: scraped.content || '',
                image: scraped.image || '',
            };
            if (type === 'events') {
                updateData.description = scraped.content || '';
                await storage.updateEvent(id, updateData);
            } else if (type === 'news') {
                updateData.htmlContent = scraped.content || '';
                await storage.updateNews(id, updateData);
            } else if (type === 'posts') {
                await storage.updatePost(id, updateData);
            } else {
                return res.status(400).json({ error: "Invalid type. Use events, news, or posts" });
            }
            res.json({
                success: true,
                scraped: {
                    title: scraped.title,
                    image: scraped.image,
                    contentLength,
                }
            });
        } catch (error) {
            console.error('Error in /api/admin/rescrape-item:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Public API routes for CF data (cached scraped data)
    app.get("/api/cf/ranks", async (req, res) => {
        try {
            // For now, scrape on demand. Later can be cached in DB
            const ranks = await scrapeRanks();
            res.json(ranks);
        }
        catch (error) {
            console.error('Error in /api/cf/ranks:', error);
            res.status(500).json({ error: error.message || "Failed to fetch ranks" });
        }
    });
    app.post("/api/admin/scrape-and-create-ranks", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const ranks = await scrapeRanks();
            const created = [];
            for (const r of ranks) {
                const data = insertRankSchema.parse({
                    name: r.name,
                    image: r.image,
                    description: r.description || '',
                    requirements: r.requirements || '',
                });
                const existingList = await storage.getAllRanks?.();
                const exists = Array.isArray(existingList) ? existingList.find((x) => x.name === r.name) : undefined;
                if (!exists) {
                    const createdRank = await storage.createRank(data);
                    created.push(createdRank);
                }
            }
            res.json({ message: `Created ${created.length} ranks`, count: created.length, ranks: created });
        }
        catch (error) {
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
            const created = [];
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
        }
        catch (error) {
            res.status(500).json({ error: error.message || "Failed to reset ranks" });
        }
    });
    app.get("/api/cf/modes", async (req, res) => {
        try {
            const modes = await scrapeModes();
            res.json(modes);
        }
        catch (error) {
            console.error('Error in /api/cf/modes:', error);
            res.status(500).json({ error: error.message || "Failed to fetch modes" });
        }
    });
    app.get("/api/cf/weapons", async (req, res) => {
        try {
            const weapons = await scrapeWeapons();
            res.json(weapons);
        }
        catch (error) {
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
                if (!all.find((x) => x.name === w.name)) {
                    try {
                        const parsed = insertWeaponSchema.parse(w);
                        await storage.createWeapon(parsed);
                        createdWeapons += 1;
                    }
                    catch { }
                }
            }
            // Modes
            let createdModes = 0;
            for (const m of modesData) {
                const all = await storage.getAllModes();
                if (!all.find((x) => x.name === m.name)) {
                    try {
                        const parsed = insertModeSchema.parse(m);
                        await storage.createMode(parsed);
                        createdModes += 1;
                    }
                    catch { }
                }
            }
            // Ranks
            let createdRanks = 0;
            for (const r of ranksData) {
                const all = await storage.getAllRanks();
                if (!all.find((x) => x.name === r.name)) {
                    try {
                        const parsed = insertRankSchema.parse(r);
                        await storage.createRank(parsed);
                        createdRanks += 1;
                    }
                    catch { }
                }
            }
            res.status(201).json({ success: true, createdWeapons, createdModes, createdRanks });
        }
        catch (error) {
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
            posts.forEach((post) => {
                const lastmod = post.updatedAt || post.createdAt;
                const slug = post.post_slug || post.id;
                sitemap += `  <url>
    <loc>${baseUrl}/article/${slug}</loc>
    <lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
            });
            // Add news
            news.forEach((item) => {
                const lastmod = item.updatedAt || item.createdAt;
                const slug = item.news_slug || item.id;
                sitemap += `  <url>
    <loc>${baseUrl}/news/${slug}</loc>
    <lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
            });
            // Add events
            events.forEach((event) => {
                const slug = event.event_name_slug || event.id;
                sitemap += `  <url>
    <loc>${baseUrl}/events/${slug}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
            });
            // Add category pages
            const categories = [...new Set(posts.map((p) => p.category))];
            categories.forEach((category) => {
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
        }
        catch (error) {
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
            const { page, pageSize, q, letter, category, sort, order } = req.query || {};
            if (page || pageSize || q || letter || category || sort || order) {
                const result = await storage.searchWeaponsPaged({ page, pageSize, q, letter, category, sort, order });
                return res.json(result);
            }
            const weapons = await storage.getAllWeapons();
            res.json(weapons);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.get("/api/weapons/search", async (req, res) => {
        try {
            const { page, pageSize, q, letter, category, sort, order } = req.query || {};
            const result = await storage.searchWeaponsPaged({ page, pageSize, q, letter, category, sort, order });
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.get("/api/weapons/batch/by-ids", async (req, res) => {
        try {
            const ids = String(req.query.ids || "").split(",").map(s => s.trim()).filter(Boolean);
            if (!ids.length) return res.json([]);
            const weapons = await Promise.all(ids.map(id => storage.getWeaponById(id).catch(() => null)));
            res.json(weapons.filter(Boolean));
        }
        catch (error) {
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.post("/api/weapons", requireAuth, requireWeaponManager, async (req, res) => {
        try {
            const data = insertWeaponSchema.parse(req.body);
            const weapon = await storage.createWeapon(data);
            res.status(201).json(weapon);
        }
        catch (error) {
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
            const created = [];
            for (const w of weapons) {
                try {
                    const parsed = insertWeaponSchema.parse(w);
                    const createdWeapon = await storage.createWeapon(parsed);
                    created.push(createdWeapon);
                }
                catch (innerErr) {
                    // skip invalid item but continue with others
                    console.error('Skipping weapon due to validation error:', innerErr?.message || innerErr);
                }
            }
            res.status(201).json({ success: true, count: created.length, weapons: created });
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    // Modes API routes
    app.get("/api/modes", async (req, res) => {
        try {
            const modes = await storage.getAllModes();
            res.json(modes);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Helper to categorize modes
    function categorizeMode(name) {
        const n = name.toLowerCase();
        if (n.includes('zombie')) return 'Zombie Mode';
        if (n.includes('ghost')) return 'Ghost Mode';
        if (n.includes('search') || n.includes('destroy') || n.includes('snd')) return 'S&D Mode';
        if (n.includes('deathmatch') || n.includes('tdm')) return 'TDM Mode';
        if (n.includes('elimination')) return 'Elimination';
        if (n.includes('mutation')) return 'Mutation';
        if (n.includes('hero')) return 'Hero Mode';
        return 'Standard';
    }

    // Quality check for images
    async function isValidImage(url) {
        if (!url) return false;
        try {
            const res = await axios.head(url, { timeout: 5000 });
            return res.status === 200 && res.headers['content-type']?.startsWith('image/');
        } catch (e) {
            return false;
        }
    }

    app.post("/api/admin/scrape-and-create-modes", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const modes = await scrapeModes();
            const results = { updated: 0, created: 0, failed: 0 };
            for (const m of modes) {
                if (!m.name) continue;
                
                // Quality Check
                const isGood = await isValidImage(m.image);
                if (!isGood) {
                    console.warn(`Skipping invalid image for mode: ${m.name}`);
                }

                const existingList = await storage.getAllModes();
                const exists = existingList.find((x) => x.name === m.name);
                
                const category = categorizeMode(m.name);
                
                if (!exists) {
                    const data = insertModeSchema.parse({
                        name: m.name,
                        image: isGood ? m.image : "",
                        imageHistory: isGood ? [{ url: m.image }] : [],
                        description: m.description || '',
                        type: m.type || '',
                        category
                    });
                    await storage.createMode(data);
                    results.created++;
                } else {
                    // Archive logic: only add to history if image changed and is valid
                    const updateData = {
                        category,
                        description: m.description || exists.description
                    };
                    
                    if (isGood && m.image !== exists.image) {
                        updateData.image = m.image;
                        updateData.imageHistory = [...(exists.imageHistory || []), { url: m.image }];
                    }
                    
                    await storage.updateMode(exists.id, updateData);
                    results.updated++;
                }
            }
            res.json({ message: "Scraping complete", ...results });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Maps API routes
    app.get("/api/maps", async (req, res) => {
        try {
            const maps = await storage.getAllMaps();
            res.json(maps);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post("/api/admin/scrape-and-create-maps", requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const maps = await scrapeMaps();
            const results = { updated: 0, created: 0, failed: 0 };
            for (const m of maps) {
                if (!m.name) continue;

                const isGood = await isValidImage(m.image);
                const existingList = await storage.getAllMaps();
                const exists = existingList.find((x) => x.name === m.name);

                if (!exists) {
                    const data = insertMapSchema.parse({
                        name: m.name,
                        image: isGood ? m.image : "",
                        imageHistory: isGood ? [{ url: m.image }] : [],
                        description: m.description || '',
                        category: m.category || 'Official'
                    });
                    await storage.createMap(data);
                    results.created++;
                } else {
                    const updateData = {};
                    if (isGood && m.image !== exists.image) {
                        updateData.image = m.image;
                        updateData.imageHistory = [...(exists.imageHistory || []), { url: m.image }];
                    }
                    await storage.updateMap(exists.id, updateData);
                    results.updated++;
                }
            }
            res.json({ message: "Map scraping complete", ...results });
        }
        catch (error) {
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.post("/api/modes", requireAuth, requireWeaponManager, async (req, res) => {
        try {
            const data = insertModeSchema.parse(req.body);
            const mode = await storage.createMode(data);
            res.status(201).json(mode);
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    // Ranks API routes
    app.get("/api/ranks", async (req, res) => {
        try {
            const ranks = await storage.getAllRanks();
            res.json(ranks);
        }
        catch (error) {
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.post("/api/ranks", requireAuth, requireWeaponManager, async (req, res) => {
        try {
            const data = insertRankSchema.parse(req.body);
            const rank = await storage.createRank(data);
            res.status(201).json(rank);
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Mercenaries API routes
    app.get("/api/mercenaries", async (req, res) => {
        try {
            const mercs = await storage.getAllMercenaries();
            res.json(mercs);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post("/api/mercenaries", requireAuth, requireWeaponManager, async (req, res) => {
        try {
            // Basic creation if needed, schema validation would need to be imported or inline
            // For now, assuming direct pass-through as user requested "from website"
            const data = req.body;
            // TODO: Validate with insertMercenarySchema if available, or basic checks
            if (!data.name) return res.status(400).json({ error: "Name is required" });

            const merc = await storage.createMercenary(data);
            res.status(201).json(merc);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    app.patch("/api/mercenaries/:id", requireAuth, requireWeaponManager, async (req, res) => {
        try {
            const updates = req.body;
            await storage.updateMercenary(req.params.id, updates);
            res.json({ success: true });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    app.delete("/api/mercenaries/:id", requireAuth, requireWeaponManager, async (req, res) => {
        try {
            const deleted = await storage.deleteMercenary(req.params.id);
            if (!deleted) {
                return res.status(404).json({ error: "Mercenary not found" });
            }
            res.json({ success: true });
        }
        catch (error) {
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
                    const scrapedEvent = eventData;
                    // Create as Event
                    const eventToCreate = {
                        title: scrapedEvent.title,
                        titleAr: '',
                        description: sanitizeHTML(scrapedEvent.content),
                        descriptionAr: '',
                        date: scrapedEvent.date,
                        type: 'upcoming',
                        imageUrl: scrapedEvent.imageUrl || scrapedEvent.image || '',
                        ogImage: scrapedEvent.image || scrapedEvent.ogImage || scrapedEvent.imageUrl || '',
                        twitterImage: scrapedEvent.image || scrapedEvent.ogImage || scrapedEvent.imageUrl || '',
                        seoTitle: scrapedEvent.seoTitle || scrapedEvent.title || '',
                        seoDescription: scrapedEvent.seoDescription || scrapedEvent.preview || '',
                        seoKeywords: scrapedEvent.seoKeywords || [],
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
                            featured: false,
                            ogImage: scrapedEvent.image || scrapedEvent.ogImage || '',
                            twitterImage: scrapedEvent.image || scrapedEvent.ogImage || '',
                            seoTitle: scrapedEvent.seoTitle || scrapedEvent.title || '',
                            seoDescription: scrapedEvent.seoDescription || scrapedEvent.preview || '',
                            seoKeywords: scrapedEvent.seoKeywords || [],
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
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        // Stats route for admin
        app.get("/api/stats", requireAuth, async (req, res) => {
            try {
                const result = await storage.getAllPosts();
                const posts = result.items || [];
                const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0);
                res.json({
                    totalPosts: result.total || posts.length,
                    totalViews,
                    recentPosts: posts.slice(0, 5).map((post) => ({
                        ...post,
                        date: formatDate(post.createdAt),
                    })),
                });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        // Site settings (Super Admin or Settings Manager)
        app.get("/api/settings/site", requireAuth, requireSettingsManager, async (_req, res) => {
            try {
                if (typeof storage.getSiteSettings !== 'function') {
                    return res.json({});
                }
                const settings = await storage.getSiteSettings();
                res.json(settings);
            }
            catch (error) {
                console.error("Error fetching site settings:", error);
                res.status(500).json({ error: error.message });
            }
        });
        app.put("/api/settings/site", requireAuth, requireSettingsManager, async (req, res) => {
            try {
                const raw = req.body ?? {};
                const toBoolean = (value) => {
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
                    announcementsEnabled: toBoolean(raw.announcementsEnabled),
                    publicBaseUrl: raw.publicBaseUrl ?? "",
                    seoTitle: raw.seoTitle ?? "",
                    seoDescription: raw.seoDescription ?? "",
                    seoKeywords: Array.isArray(raw.seoKeywords) ? raw.seoKeywords : [],
                    seoOgImage: raw.seoOgImage ?? "",
                    robots: raw.robots ?? "index, follow",
                    monetizationVerifiedSellersEnabled: toBoolean(raw.monetizationVerifiedSellersEnabled ?? true),
                    monetizationVerifiedSellerFee: Number.isFinite(Number(raw.monetizationVerifiedSellerFee)) ? Math.max(0, Number(raw.monetizationVerifiedSellerFee)) : 30,
                    monetizationBoostingEnabled: toBoolean(raw.monetizationBoostingEnabled ?? true),
                    monetizationBoostingCommissionPct: Number.isFinite(Number(raw.monetizationBoostingCommissionPct)) ? Math.max(0, Math.min(100, Number(raw.monetizationBoostingCommissionPct))) : 12,
                    monetizationPremiumEnabled: toBoolean(raw.monetizationPremiumEnabled ?? true),
                    monetizationPremiumMonthlyPrice: Number.isFinite(Number(raw.monetizationPremiumMonthlyPrice)) ? Math.max(0, Number(raw.monetizationPremiumMonthlyPrice)) : 2,
                    monetizationAffiliateEnabled: toBoolean(raw.monetizationAffiliateEnabled ?? true),
                    monetizationAffiliateCommissionPct: Number.isFinite(Number(raw.monetizationAffiliateCommissionPct)) ? Math.max(0, Math.min(100, Number(raw.monetizationAffiliateCommissionPct))) : 4,
                    featuredWeapons: Array.isArray(raw.featuredWeapons) ? raw.featuredWeapons.filter(Boolean) : [],
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
                const before = await storage.getSiteSettings().catch(() => ({}));
                const updated = await storage.updateSiteSettings({
                    ...parsed,
                    reviewVerificationVideoUrl: parsed.reviewVerificationVideoUrl.trim(),
                    reviewVerificationPassphrase: parsed.reviewVerificationPassphrase.trim(),
                    reviewVerificationPrompt: parsed.reviewVerificationPrompt.trim(),
                    reviewVerificationTimecode: parsed.reviewVerificationTimecode.trim(),
                    reviewVerificationYouTubeChannelUrl: (parsed.reviewVerificationYouTubeChannelUrl || '').trim(),
                    publicBaseUrl: (parsed.publicBaseUrl || '').trim(),
                    seoTitle: (parsed.seoTitle || '').trim(),
                    seoDescription: (parsed.seoDescription || '').trim(),
                    seoKeywords: Array.isArray(parsed.seoKeywords) ? parsed.seoKeywords.filter(Boolean) : [],
                    seoOgImage: (parsed.seoOgImage || '').trim(),
                    robots: (parsed.robots || 'index, follow').trim(),
                    monetizationVerifiedSellersEnabled: parsed.monetizationVerifiedSellersEnabled,
                    monetizationVerifiedSellerFee: parsed.monetizationVerifiedSellerFee,
                    monetizationBoostingEnabled: parsed.monetizationBoostingEnabled,
                    monetizationBoostingCommissionPct: parsed.monetizationBoostingCommissionPct,
                    monetizationPremiumEnabled: parsed.monetizationPremiumEnabled,
                    monetizationPremiumMonthlyPrice: parsed.monetizationPremiumMonthlyPrice,
                    monetizationAffiliateEnabled: parsed.monetizationAffiliateEnabled,
                    monetizationAffiliateCommissionPct: parsed.monetizationAffiliateCommissionPct,
                });
                try {
                    const diff = {};
                    const keys = ['publicBaseUrl', 'seoTitle', 'seoDescription', 'seoKeywords', 'seoOgImage', 'robots'];
                    for (const k of keys) {
                        const a = (before?.[k] ?? '');
                        const b = (updated?.[k] ?? '');
                        const av = Array.isArray(a) ? a.join(',') : a;
                        const bv = Array.isArray(b) ? b.join(',') : b;
                        if (String(av) !== String(bv)) diff[k] = { from: av, to: bv };
                    }
                    if (Object.keys(diff).length > 0) logSeoChange({ actor: req.user?.username || 'system', action: 'update_site_seo', changes: diff });
                } catch { }
                res.json(updated);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        app.get("/api/public/settings/seo", async (_req, res) => {
            try {
                const s = await storage.getSiteSettings();
                res.json({
                    publicBaseUrl: s.publicBaseUrl || '',
                    seoTitle: s.seoTitle || '',
                    seoDescription: s.seoDescription || '',
                    seoKeywords: Array.isArray(s.seoKeywords) ? s.seoKeywords : [],
                    seoOgImage: s.seoOgImage || '',
                    robots: s.robots || 'index, follow',
                });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        app.get("/api/public/settings/announcements", async (_req, res) => {
            try {
                const settings = await storage.getSiteSettings();
                res.json({ enabled: settings.announcementsEnabled });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        app.get("/api/public/settings/site", async (_req, res) => {
            try {
                const s = await storage.getSiteSettings();
                res.json({
                    featuredWeapons: Array.isArray(s?.featuredWeapons) ? s.featuredWeapons : [],
                });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        const announcementsStore = new Map();

        app.get("/api/announcements/global", async (_req, res) => {
            const a = announcementsStore.get("global") || null;
            res.json(a || { active: false });
        });
        app.post("/api/announcements/global", requireAuth, requireSettingsManager, async (req, res) => {
            const body = req.body || {};
            const contentHtml = body.contentHtml ? sanitizeHTML(String(body.contentHtml)) : "";
            const contentHtmlEn = body.contentHtmlEn ? sanitizeHTML(String(body.contentHtmlEn)) : "";
            const contentHtmlAr = body.contentHtmlAr ? sanitizeHTML(String(body.contentHtmlAr)) : "";
            const normalize = (html) => String(html || "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
            let primary = contentHtml;
            if (!normalize(primary)) {
                if (normalize(contentHtmlEn))
                    primary = contentHtmlEn;
                else if (normalize(contentHtmlAr))
                    primary = contentHtmlAr;
            }
            const item = {
                contentHtml: primary,
                contentHtmlEn,
                contentHtmlAr,
                imageUrl: String(body.imageUrl || ""),
                linkUrl: String(body.linkUrl || ""),
                active: Boolean(body.active ?? true),
                dismissible: body.dismissible === false ? false : true,
                direction: (body.direction === "rtl" || body.direction === "ltr") ? body.direction : "auto",
                updatedAt: new Date().toISOString(),
            };
            announcementsStore.set("global", item);
            res.json(item);
        });
        app.delete("/api/announcements/global/:id", requireAuth, requireSettingsManager, async (req, res) => {
            const { id } = req.params;
            if (id !== "global")
                return res.status(404).json({ error: "Not found" });
            announcementsStore.delete("global");
            res.json({ success: true });
        });
        app.get("/api/admin/announcements/global", requireAuth, requireSettingsManager, async (_req, res) => {
            const a = announcementsStore.get("global");
            const list = a ? [{ id: "global", ...a }] : [];
            res.json(list);
        });
        app.get("/api/announcements/seller/:slug", async (req, res) => {
            const key = `seller:${String(req.params.slug || "").toLowerCase()}`;
            const a = announcementsStore.get(key) || null;
            res.json(a || { active: false });
        });
        app.post("/api/announcements/seller/:slug", requireAuth, requireSettingsManager, async (req, res) => {
            const slug = String(req.params.slug || "").toLowerCase();
            if (!slug)
                return res.status(400).json({ error: "Slug required" });
            const body = req.body || {};
            const contentHtml = body.contentHtml ? sanitizeHTML(String(body.contentHtml)) : "";
            const contentHtmlEn = body.contentHtmlEn ? sanitizeHTML(String(body.contentHtmlEn)) : "";
            const contentHtmlAr = body.contentHtmlAr ? sanitizeHTML(String(body.contentHtmlAr)) : "";
            const normalize = (html) => String(html || "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
            let primary = contentHtml;
            if (!normalize(primary)) {
                if (normalize(contentHtmlEn))
                    primary = contentHtmlEn;
                else if (normalize(contentHtmlAr))
                    primary = contentHtmlAr;
            }
            const item = {
                sellerSlug: slug,
                contentHtml: primary,
                contentHtmlEn,
                contentHtmlAr,
                imageUrl: String(body.imageUrl || ""),
                linkUrl: String(body.linkUrl || ""),
                active: Boolean(body.active ?? true),
                dismissible: body.dismissible === false ? false : true,
                direction: (body.direction === "rtl" || body.direction === "ltr") ? body.direction : "auto",
                updatedAt: new Date().toISOString(),
            };
            announcementsStore.set(`seller:${slug}`, item);
            res.json(item);
        });
        app.delete("/api/announcements/seller/:slug", requireAuth, requireSettingsManager, async (req, res) => {
            const slug = String(req.params.slug || "").toLowerCase();
            const key = `seller:${slug}`;
            if (!announcementsStore.has(key))
                return res.status(404).json({ error: "Not found" });
            announcementsStore.delete(key);
            res.json({ success: true });
        });
        app.get("/api/admin/announcements/seller", requireAuth, requireSettingsManager, async (_req, res) => {
            const list = [];
            for (const [k, v] of announcementsStore.entries()) {
                if (k.startsWith("seller:"))
                    list.push({ id: k, sellerSlug: k.replace("seller:", ""), ...v });
            }
            res.json(list);
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
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        // News routes
        app.get("/api/news", async (req, res) => {
            try {
                const { limit, offset } = req.query;
                const result = await storage.getAllNews({
                    limit: limit ? parseInt(limit) : undefined,
                    offset: offset ? parseInt(offset) : undefined
                });
                res.json({
                    items: result.items,
                    total: result.total
                });
            }
            catch (error) {
                console.error('Error in /api/news:', error);
                res.status(500).json({ error: error.message });
            }
        });
        app.get("/api/news/:id", async (req, res) => {
            try {
                const news = await storage.getNewsById(req.params.id);
                if (!news) {
                    return res.status(404).json({ error: "News not found" });
                }
                res.json(news);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        app.get("/api/news/slug/:slug", async (req, res) => {
            try {
                const news = await storage.getNewsBySlug(req.params.slug);
                if (!news) {
                    return res.status(404).json({ error: "News not found" });
                }
                res.json(news);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        app.post("/api/news", requireAuth, requireNewsManager, upload.single('image'), async (req, res) => {
            try {
                const data = insertNewsSchema.parse(req.body);
                if (req.file) {
                    const result = await uploadStream(req.file.buffer, { folder: 'news' });
                    data.imageUrl = result.secure_url;
                }
                if (data.content) {
                    data.content = sanitizeHTML(data.content);
                }
                if (data.contentAr) {
                    data.contentAr = sanitizeHTML(data.contentAr);
                }
                if (data.imageUrl && !isAllowedMediaUrl(data.imageUrl)) {
                    return res.status(400).json({ error: "Invalid image URL" });
                }
                const check = validateMediaUrlsInHtml((data.htmlContent && String(data.htmlContent)) || String(data.content || ''));
                if (!check.ok) {
                    return res.status(400).json({ error: `Invalid media URL in content: ${check.url}` });
                }
                const parsedDate = parseFlexibleDate(data.dateRange, Date.now());
                data.dateRange = formatEnglishDate(parsedDate);
                const kws = extractKeywords(data.content);
                data.seoKeywords = Array.from(new Set([...(data.seoKeywords || []), ...kws]));
                data.seoTitle = data.seoTitle && data.seoTitle.trim() ? data.seoTitle : generateSeoTitle(data.title, data.content);
                data.seoDescription = data.seoDescription && data.seoDescription.trim() ? data.seoDescription : summarize(data.content);
                data.schemaType = data.schemaType || 'NewsArticle';
                const allResult = await storage.getAllNews().catch(() => ({ items: [] }));
                const all = allResult.items || [];
                const baseUrl = await resolveBaseUrl();
                const baseSlug = data.news_slug || data.title || '';
                const unique = ensureUniqueSlug(all, 'news_slug', baseSlug);
                const canonical = `${baseUrl}/news/${unique}`;
                const news = await storage.createNews({ ...data, news_slug: unique, canonicalUrl: canonical });
                res.status(201).json(news);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        app.patch("/api/news/:id", requireAuth, requireNewsManager, async (req, res) => {
            try {
                const updates = req.body;
                const userOgImage = req.body.ogImage !== undefined ? req.body.ogImage : undefined;
                const userTwitterImage = req.body.twitterImage !== undefined ? req.body.twitterImage : undefined;
                if (updates.image === '') delete updates.image;
                if (updates.content) {
                    updates.content = sanitizeHTML(updates.content);
                }
                if (updates.contentAr) {
                    updates.contentAr = sanitizeHTML(updates.contentAr);
                }
                if (updates.image && !isAllowedMediaUrl(updates.image)) {
                    return res.status(400).json({ error: "Invalid image URL" });
                }
                const check = validateMediaUrlsInHtml((updates.htmlContent && String(updates.htmlContent)) || String(updates.content || ''));
                if (!check.ok) {
                    return res.status(400).json({ error: `Invalid media URL in content: ${check.url}` });
                }
                if (typeof updates.dateRange === 'string' && updates.dateRange.trim()) {
                    const parsedDate = parseFlexibleDate(updates.dateRange, Date.now());
                    updates.dateRange = formatEnglishDate(parsedDate);
                }
                const rebuild = String((req.query.rebuildSeo || '')).toLowerCase() === 'true';
                if (rebuild || !updates.seoTitle || !updates.seoDescription || !updates.seoKeywords) {
                    const title = updates.title;
                    const content = updates.content || updates.htmlContent || '';
                    const kws = extractKeywords(content);
                    updates.seoKeywords = Array.from(new Set([...(updates.seoKeywords || []), ...kws]));
                    updates.seoTitle = updates.seoTitle && updates.seoTitle.trim() ? updates.seoTitle : generateSeoTitle(title, content);
                    updates.seoDescription = updates.seoDescription && updates.seoDescription.trim() ? updates.seoDescription : summarize(content);
                    if (userOgImage !== undefined) updates.ogImage = userOgImage;
                    if (userTwitterImage !== undefined) updates.twitterImage = userTwitterImage;
                    updates.schemaType = updates.schemaType || 'NewsArticle';
                }
                const news = await storage.updateNews(req.params.id, updates);
                if (!news) {
                    return res.status(404).json({ error: "News item not found" });
                }
                res.json(news);
            }
            catch (error) {
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
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // SEO settings for a news item (GET/PUT)
        app.get('/api/news/:id/seo', requireAuth, requireNewsManager, async (req, res) => {
            try {
                const n = await storage.getNewsById(req.params.id);
                if (!n) return res.status(404).json({ ok: false, error: 'News item not found' });
                res.json({
                    ok: true,
                    seoTitle: n.seoTitle || '',
                    seoDescription: n.seoDescription || '',
                    seoKeywords: n.seoKeywords || [],
                    canonicalUrl: n.canonicalUrl || '',
                    ogImage: n.ogImage || '',
                    twitterImage: n.twitterImage || '',
                    schemaType: n.schemaType || 'NewsArticle',
                });
            } catch (error) {
                res.status(500).json({ ok: false, error: error.message });
            }
        });

        app.put('/api/news/:id/seo', requireAuth, requireNewsManager, async (req, res) => {
            try {
                const body = req.body || {};
                const len = (s) => String(s || '').trim().length;
                if (body.seoTitle && (len(body.seoTitle) < 30 || len(body.seoTitle) > 70)) {
                    return res.status(400).json({ ok: false, error: 'SEO title should be 30–70 characters', field: 'seoTitle' });
                }
                if (body.seoDescription && (len(body.seoDescription) < 80 || len(body.seoDescription) > 200)) {
                    return res.status(400).json({ ok: false, error: 'Meta description should be 80–200 characters', field: 'seoDescription' });
                }
                const kwList = Array.isArray(body.seoKeywords) ? body.seoKeywords : String(body.seoKeywords || '').split(',').map(s => s.trim()).filter(Boolean);
                if (kwList.length > 20) {
                    return res.status(400).json({ ok: false, error: 'Too many keywords (max 20)', field: 'seoKeywords' });
                }
                const urlFields = ['ogImage', 'twitterImage'];
                for (const f of urlFields) {
                    const v = body[f];
                    if (v && !isAllowedMediaUrl(v)) {
                        return res.status(400).json({ ok: false, error: `Invalid URL for ${f}`, field: f });
                    }
                }
                const updates = {
                    seoTitle: body.seoTitle,
                    seoDescription: body.seoDescription,
                    seoKeywords: kwList,
                    canonicalUrl: body.canonicalUrl,
                    ogImage: body.ogImage,
                    twitterImage: body.twitterImage,
                    schemaType: body.schemaType || 'NewsArticle',
                };
                const updated = await storage.updateNews(req.params.id, updates);
                if (!updated) return res.status(404).json({ ok: false, error: 'News item not found' });
                logSeoChange({ action: 'update_news_seo', id: req.params.id, updates });
                res.json({ ok: true, updates });
            } catch (error) {
                res.status(500).json({ ok: false, error: error.message });
            }
        });

        // Admin: Merge & Optimize News — preview changes
        app.get("/api/admin/news/merge/preview", requireAuth, requireNewsManager, async (_req, res) => {
            try {
                const baseUrl = (process.env.PUBLIC_BASE_URL || 'https://crossfire.wiki').replace(/\/$/, '');
                const result = await storage.getAllNews();
                const news = result.items || [];
                const changes = [];
                for (const n of news) {
                    const updates = {};
                    const canonical = `${baseUrl}/news/${n.news_slug || slugifySafe(n.title)}`;
                    if (!n.canonicalUrl || n.canonicalUrl !== canonical) {
                        updates.canonicalUrl = canonical;
                    }
                    const content = String(n.htmlContent || n.content || '');
                    let nextContent = content;
                    const hrefRegex = /(href=\")((?:https?:\/\/)?(?:www\.)?crossfire\.wiki)?\/?(news|article|events)\/([A-Za-z0-9_-]+)(\")/gi;
                    nextContent = nextContent.replace(hrefRegex, (_m, p1, _host, kind, ident, p5) => {
                        let slug = ident;
                        if (kind === 'news') slug = (n.news_slug || slugifySafe(n.title));
                        return `${p1}${baseUrl}/${kind}/${slug}${p5}`;
                    });
                    // Ensure <img> alt text
                    nextContent = nextContent.replace(/<img(?![^>]*\salt=)[^>]*>/gi, (tag) => {
                        const alt = (n.seoTitle || n.title || '').replace(/"/g, '');
                        const withAlt = tag.replace(/<img/i, `<img alt=\"${alt}\"`);
                        return withAlt;
                    });
                    if (nextContent !== content) {
                        updates.htmlContent = nextContent;
                    }
                    const kws = extractKeywords(n.content || n.htmlContent || '');
                    const seoTitle = n.seoTitle && n.seoTitle.trim() ? n.seoTitle : generateSeoTitle(n.title, n.content || n.htmlContent || '');
                    const seoDescription = n.seoDescription && n.seoDescription.trim() ? n.seoDescription : summarize(n.content || n.htmlContent || '');
                    const seoKeywords = Array.from(new Set([...(n.seoKeywords || []), ...kws]));
                    const itemChanges = {};
                    if (seoTitle !== n.seoTitle) itemChanges.seoTitle = { from: n.seoTitle || '', to: seoTitle };
                    if (seoDescription !== n.seoDescription) itemChanges.seoDescription = { from: n.seoDescription || '', to: seoDescription };
                    if (JSON.stringify(seoKeywords) !== JSON.stringify(n.seoKeywords || [])) itemChanges.seoKeywords = { from: n.seoKeywords || [], to: seoKeywords };
                    if (updates.canonicalUrl) itemChanges.canonicalUrl = { from: n.canonicalUrl || '', to: updates.canonicalUrl };
                    if (updates.htmlContent) itemChanges.htmlContent = { preview: true };
                    let imageChange = null;
                    try {
                        const imagesDir = path.resolve('backend-deploy-full/uploads/images');
                        fs.mkdirSync(imagesDir, { recursive: true });
                        const seoImage = await generateSeoImage({ baseDir: imagesDir, slug: n.title, title: seoTitle || n.title, keywords: seoKeywords });
                        if (seoImage?.url && seoImage.url !== n.ogImage) {
                            itemChanges.ogImage = { from: n.ogImage || '', to: seoImage.url };
                        }
                    } catch { }
                    if (Object.keys(itemChanges).length > 0) {
                        changes.push({ id: n.id, title: n.title, news_slug: n.news_slug || '', changes: itemChanges });
                    }
                }
                res.json({ count: changes.length, changes });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Admin: Merge & Optimize News — apply changes
        app.post("/api/admin/news/merge", requireAuth, requireNewsManager, async (req, res) => {
            const apply = String(req.body?.apply || 'true').toLowerCase() !== 'false';
            try {
                const baseUrl = (process.env.PUBLIC_BASE_URL || 'https://crossfire.wiki').replace(/\/$/, '');
                const result = await storage.getAllNews();
                const news = result.items || [];
                const changelog = [];
                for (const n of news) {
                    const updates = {};
                    const canonical = `${baseUrl}/news/${n.news_slug || slugifySafe(n.title)}`;
                    if (!n.canonicalUrl || n.canonicalUrl !== canonical) {
                        updates.canonicalUrl = canonical;
                    }
                    const content = String(n.htmlContent || n.content || '');
                    let nextContent = content;
                    const hrefRegex = /(href=\")((?:https?:\/\/)?(?:www\.)?crossfire\.wiki)?\/?(news|article|events)\/([A-Za-z0-9_-]+)(\")/gi;
                    nextContent = nextContent.replace(hrefRegex, (_m, p1, _host, kind, ident, p5) => {
                        let slug = ident;
                        if (kind === 'news') slug = (n.news_slug || slugifySafe(n.title));
                        return `${p1}${baseUrl}/${kind}/${slug}${p5}`;
                    });
                    nextContent = nextContent.replace(/<img(?![^>]*\salt=)[^>]*>/gi, (tag) => {
                        const alt = (n.seoTitle || n.title || '').replace(/"/g, '');
                        const withAlt = tag.replace(/<img/i, `<img alt=\"${alt}\"`);
                        return withAlt;
                    });
                    if (nextContent !== content) {
                        updates.htmlContent = nextContent;
                    }
                    const kws = extractKeywords(n.content || n.htmlContent || '');
                    updates.seoKeywords = Array.from(new Set([...(n.seoKeywords || []), ...kws]));
                    updates.seoTitle = n.seoTitle && n.seoTitle.trim() ? n.seoTitle : generateSeoTitle(n.title, n.content || n.htmlContent || '');
                    updates.seoDescription = n.seoDescription && n.seoDescription.trim() ? n.seoDescription : summarize(n.content || n.htmlContent || '');
                    try {
                        const imagesDir = path.resolve('backend-deploy-full/uploads/images');
                        fs.mkdirSync(imagesDir, { recursive: true });
                        const seoImage = await generateSeoImage({ baseDir: imagesDir, slug: n.title, title: updates.seoTitle || n.title, keywords: updates.seoKeywords });
                        if (!n.ogImage) updates.ogImage = seoImage.url;
                        if (!n.twitterImage) updates.twitterImage = seoImage.url;
                    } catch { }
                    updates.schemaType = n.schemaType || 'NewsArticle';
                    if (Object.keys(updates).length > 0) {
                        changelog.push({ id: n.id, title: n.title, updates });
                        if (apply) {
                            await storage.updateNews(n.id, updates);
                        }
                    }
                }
                res.json({ success: true, applied: apply, updated: apply ? changelog.length : 0, changelog });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        // Mercenaries routes
        app.get("/api/mercenaries", async (req, res) => {
            try {
                const mercenaries = await storage.getAllMercenaries();
                res.json(mercenaries);
            }
            catch (error) {
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
                    voiceLines: Array.isArray(voiceLines) ? voiceLines.filter((url) => url.trim() !== "") : []
                });
                res.status(201).json(merc);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        app.delete("/api/mercenaries/:id", async (req, res) => {
            try {
                const ok = await storage.deleteMercenary(req.params.id);
                if (!ok)
                    return res.status(404).json({ error: 'Mercenary not found' });
                res.json({ success: true });
            }
            catch (err) {
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
                    voiceLines: Array.isArray(voiceLines) ? voiceLines.filter((url) => url.trim() !== "") : current.voiceLines || []
                };
                // Update mercenary in storage
                await storage.updateMercenary(id, updated);
                res.json(updated);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        app.post("/api/mercenaries/remove-duplicates", async (req, res) => {
            try {
                const removed = await storage.removeDuplicateMercenaries();
                res.json({ success: true, duplicatesRemoved: removed });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        // Chat Admin Routes - Placeholder endpoints
        app.get("/api/admin/chat/users", requireAuth, requireSuperAdmin, async (req, res) => {
            try {
                res.json([]);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        app.post("/api/admin/chat/registration", requireAuth, requireSuperAdmin, async (req, res) => {
            try {
                const { enabled } = req.body;
                res.json({ enabled, message: enabled ? "Chat registration opened" : "Chat registration closed" });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        app.post("/api/admin/chat/users/:id/verify", requireAuth, requireSuperAdmin, async (req, res) => {
            try {
                const { id } = req.params;
                res.json({ id, verified: true });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        app.delete("/api/admin/chat/users/:id", requireAuth, requireSuperAdmin, async (req, res) => {
            try {
                const { id } = req.params;
                res.json({ success: true, message: "User removed" });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        // Ticket routes
        // FAQ routes - file-based storage
        const FAQ_FILE = new URL('./data/faq-data.json', import.meta.url).pathname;
        const getDefaultFaqData = () => [];

        const readFaqData = () => {
            try {
                if (fs.existsSync(FAQ_FILE)) {
                    return JSON.parse(fs.readFileSync(FAQ_FILE, 'utf8'));
                }
            } catch (e) { /* ignore */ }
            return getDefaultFaqData();
        };

        const writeFaqData = (data) => {
            try {
                const dir = path.dirname(FAQ_FILE);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(FAQ_FILE, JSON.stringify(data, null, 2), 'utf8');
            } catch (e) {
                console.error('Error writing FAQ data:', e);
                throw e;
            }
        };

        app.get("/api/faq-categories", async (req, res) => {
            try {
                const data = readFaqData();
                res.json(data);
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
        });

        app.put("/api/faq-categories", requireAuth, async (req, res) => {
            try {
                const data = req.body;
                if (!Array.isArray(data)) {
                    return res.status(400).json({ error: "Expected an array of FAQ categories" });
                }
                writeFaqData(data);
                res.json({ success: true, count: data.length });
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
        });

        app.get("/api/tickets", requireAuth, async (req, res) => {
            try {
                const user = req.user;
                const tickets = await storage.getAllTickets();
                const formattedTickets = tickets.map((ticket) => {
                    const formatted = {
                        ...ticket,
                        createdAt: formatDate(ticket.createdAt),
                        updatedAt: formatDate(ticket.updatedAt),
                    };
                    if (!user.roles || !user.roles.includes('super_admin')) {
                        delete formatted.userEmail;
                    }
                    return formatted;
                });
                res.json(formattedTickets);
            }
            catch (error) {
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
            }
            catch (error) {
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
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        app.post("/api/tickets", upload.fields([{ name: "image", maxCount: 1 }, { name: "video", maxCount: 1 }]), async (req, res) => {
            try {
                const body = req.body;
                let mediaUrl = body.mediaUrl;
                let mediaType = body.mediaType;

                const imageFile = req.files?.image?.[0];
                const videoFile = req.files?.video?.[0];
                const file = videoFile || imageFile;

                if (file) {
                    try {
                        const result = await uploadStream(file.buffer, { 
                            folder: 'ticket_attachments', 
                            resource_type: videoFile ? 'video' : 'image' 
                        });
                        mediaUrl = result.secure_url;
                        mediaType = result.resource_type;
                    } catch (e) {
                        logUpload({ type: 'cloudinary_attachment', entity: 'ticket', filename: file.originalname, size: file.size, mimetype: file.mimetype, error: e?.message || String(e) });
                        return res.status(502).json({ error: "Attachment upload failed", code: "cloudinary_failed" });
                    }
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
            }
            catch (error) {
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
            }
            catch (error) {
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
            }
            catch (error) {
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
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        app.post("/api/tickets/:id/replies", upload.single("attachment"), async (req, res) => {
            try {
                const { id } = req.params;
                const { authorName, content, isAdmin } = req.body;
                let mediaUrl = undefined;
                let mediaPublicId = undefined;
                let mediaType = undefined;
                if (req.file) {
                    try {
                        const result = await uploadStream(req.file.buffer, { folder: 'ticket_attachments' });
                        mediaUrl = result.secure_url;
                        mediaPublicId = result.public_id;
                        mediaType = result.resource_type;
                    } catch (e) {
                        logUpload({ type: 'cloudinary_attachment', entity: 'ticket_reply', filename: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype, error: e?.message || String(e) });
                        return res.status(502).json({ error: "Attachment upload failed", code: "cloudinary_failed" });
                    }
                }
                const replyData = {
                    ticketId: id,
                    authorName,
                    content,
                    isAdmin: (typeof isAdmin === 'boolean')
                        ? isAdmin
                        : String(isAdmin || '').toLowerCase() === 'true',
                    mediaUrl,
                    mediaPublicId,
                    mediaType,
                };
                const data = insertTicketReplySchema.parse(replyData);
                const reply = await storage.createTicketReply(data);
                const replyObj = reply.toObject ? reply.toObject() : reply;
                const formattedReply = {
                    ...replyObj,
                    id: String(replyObj._id || replyObj.id),
                    createdAt: formatDate(replyObj.createdAt),
                };
                res.status(201).json(formattedReply);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        // Admin management routes (restricted to super admins only)
        app.get("/api/admins", requireAuth, requireSuperAdmin, async (req, res) => {
            try {
                const admins = await storage.getAllAdmins();
                const sanitizedAdmins = admins.map(({ password, ...admin }) => admin);
                res.json(sanitizedAdmins);
            }
            catch (error) {
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
                let finalRoles = [];
                if (Array.isArray(rolesFromBody) && rolesFromBody.length > 0) {
                    finalRoles = rolesFromBody;
                }
                else if (role) {
                    finalRoles = [role];
                }
                else {
                    finalRoles = ["admin"];
                }
                // If permissions object provided, map those permissions to roles as well.
                if (permissions && typeof permissions === 'object') {
                    const permToRole = {
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
                            if (!finalRoles.includes(permToRole[perm]))
                                finalRoles.push(permToRole[perm]);
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
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        app.patch("/api/admins/:id", requireAuth, requireSuperAdmin, async (req, res) => {
            try {
                const updates = {};
                if (req.body.username !== undefined)
                    updates.username = req.body.username;
                if (req.body.password !== undefined) {
                    updates.password = await hashPassword(req.body.password);
                }
                // Accept role string ("admin" | "super_admin"), roles array and permissions object
                const baseRoles = [];
                if (typeof req.body.role === 'string' && req.body.role.trim()) {
                    baseRoles.push(req.body.role.trim());
                }
                if (Array.isArray(req.body.roles) && req.body.roles.length > 0) {
                    const rolesArr = req.body.roles;
                    if (baseRoles.length && !rolesArr.includes(baseRoles[0])) {
                        rolesArr.unshift(baseRoles[0]);
                    }
                    updates.roles = rolesArr;
                }
                else if (req.body.permissions && typeof req.body.permissions === 'object') {
                    const permissions = req.body.permissions;
                    const permToRole = {
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
                    const rolesFromPerms = [...baseRoles];
                    for (const [perm, enabled] of Object.entries(permissions)) {
                        if (enabled && permToRole[perm]) {
                            const role = permToRole[perm];
                            if (!rolesFromPerms.includes(role))
                                rolesFromPerms.push(role);
                        }
                    }
                    if (rolesFromPerms.length > 0) {
                        updates.roles = rolesFromPerms;
                    }
                }
                else if (baseRoles.length > 0) {
                    // Only explicit role was provided
                    updates.roles = baseRoles;
                }
                const admin = await storage.updateAdmin(req.params.id, updates);
                if (!admin) {
                    return res.status(404).json({ error: "Admin not found" });
                }
                const { password: _, ...sanitizedAdmin } = admin;
                res.json(sanitizedAdmin);
            }
            catch (error) {
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
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        // Admin permissions routes (restricted to super admins only)
        app.get("/api/admin-permissions", requireAuth, requireSuperAdmin, async (req, res) => {
            try {
                const permissions = await storage.getAllAdminPermissions();
                res.json(permissions);
            }
            catch (error) {
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
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        // Admin: Bulk SEO Editor routes
        app.get("/api/admin/seo/bulk", requireAuth, requireSettingsManager, async (req, res) => {
            try {
                const [news, posts, events, sellers] = await Promise.all([
                    storage.getAllNews(),
                    storage.getAllPosts(),
                    storage.getAllEvents(),
                    storage.getAllSellers()
                ]);

                const allContent = [
                    ...news.map(n => ({ ...n, type: 'news', displayTitle: n.title })),
                    ...posts.map(p => ({ ...p, type: 'post', displayTitle: p.title })),
                    ...events.map(e => ({ ...e, type: 'event', displayTitle: e.title })),
                    ...sellers.map(s => ({ ...s, type: 'seller', displayTitle: s.name }))
                ];

                res.json(allContent);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        app.post("/api/admin/seo/bulk", requireAuth, requireSettingsManager, async (req, res) => {
            try {
                const { items } = req.body;
                if (!Array.isArray(items)) {
                    return res.status(400).json({ error: "Items array is required" });
                }

                const results = [];
                for (const item of items) {
                    const { id, type, ...updates } = item;
                    // Validate URL fields
                    const urlFields = ['ogImage', 'twitterImage', 'canonicalUrl'];
                    for (const f of urlFields) {
                        if (updates[f] && !isAllowedMediaUrl(updates[f])) {
                            // Skip invalid URLs but don't fail entire batch, just warn/skip field? 
                            // For bulk, maybe stricter or just sanitization?
                            // Let's just allow it for now but log/clean if needed.
                        }
                    }

                    let updated;
                    if (type === 'news') {
                        updated = await storage.updateNews(id, updates);
                    } else if (type === 'post') {
                        updated = await storage.updatePost(id, updates);
                    } else if (type === 'event') {
                        updated = await storage.updateEvent(id, updates);
                    } else if (type === 'seller') {
                        updated = await storage.updateSeller(id, updates);
                    }

                    if (updated) {
                        results.push({ id, status: 'success' });
                        logSeoChange({ action: `update_${type}_seo`, id, updates });
                    } else {
                        results.push({ id, status: 'failed', error: 'Not found' });
                    }
                }

                res.json({ success: true, results });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Seller Admin Routes
        app.post("/api/sellers", requireAuth, requireSellerManager, async (req, res) => {
            try {
                const data = insertSellerSchema.parse(req.body);
                const seller = await storage.createSeller(data);
                res.status(201).json(seller);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        app.patch("/api/sellers/:id", requireAuth, requireSellerManager, async (req, res) => {
            try {
                const seller = await storage.updateSeller(req.params.id, req.body);
                if (!seller) return res.status(404).json({ error: "Seller not found" });
                res.json(seller);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        app.delete("/api/sellers/:id", requireAuth, requireSellerManager, async (req, res) => {
            try {
                const success = await storage.deleteSeller(req.params.id);
                if (!success) return res.status(404).json({ error: "Seller not found" });
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });



        app.post("/api/admin/migrate-seller-images-to-cloudinary", requireAuth, requireSellerManager, async (req, res) => {
            try {
                const sellers = await storage.getAllSellers();
                const results = { migrated: 0, failed: 0, skipped: 0, sellers: [] };
                for (const seller of sellers) {
                    const images = Array.isArray(seller.images) ? seller.images : [];
                    let changed = false;
                    const newImages = [];
                    for (const imgUrl of images) {
                        if (!imgUrl) { newImages.push(imgUrl); continue; }
                        const isCloudinary = imgUrl.includes('res.cloudinary.com') || imgUrl.includes('cloudinary.com');
                        if (isCloudinary) {
                            results.skipped++;
                            newImages.push(imgUrl);
                            continue;
                        }
                        try {
                            let buffer;
                            if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
                                const response = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 15000 });
                                buffer = Buffer.from(response.data);
                            } else {
                                const filePath = path.resolve('backend-deploy-full', imgUrl.replace(/^\//, ''));
                                if (!fs.existsSync(filePath)) { newImages.push(imgUrl); results.failed++; continue; }
                                buffer = await fs.promises.readFile(filePath);
                            }
                            const result = await uploadStream(buffer, { folder: 'sellers' });
                            newImages.push(result.secure_url);
                            results.migrated++;
                            changed = true;
                        } catch (err) {
                            console.error(`Failed to migrate image ${imgUrl} for seller ${seller.id}: ${err.message}`);
                            newImages.push(imgUrl);
                            results.failed++;
                        }
                    }
                    if (changed) {
                        await storage.updateSeller(seller.id, { images: newImages });
                        results.sellers.push({ id: seller.id, name: seller.name });
                    }
                }
                res.json({ success: true, ...results });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        app.delete("/api/admin/bulk-delete", requireAuth, requireSettingsManager, async (req, res) => {
            try {
                const { items } = req.body; // Array of { id, type }
                if (!Array.isArray(items)) return res.status(400).json({ error: "Items array required" });

                let deletedCount = 0;
                const errors = [];

                for (const item of items) {
                    try {
                        if (item.type === 'post') {
                            await storage.deletePost(item.id);
                            deletedCount++;
                        } else if (item.type === 'event') {
                            await storage.deleteEvent(item.id);
                            deletedCount++;
                        } else if (item.type === 'news') {
                            await storage.deleteNews(item.id);
                            deletedCount++;
                        }
                    } catch (e) {
                        errors.push({ id: item.id, error: e.message });
                    }
                }

                res.json({ success: true, deletedCount, errors });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Newsletter subscriber routes (restricted to super admins only)
        app.get("/api/newsletter-subscribers", requireAuth, requireSuperAdmin, async (req, res) => {
            try {
                const subscribers = await storage.getAllNewsletterSubscribers();
                res.json(subscribers);
            }
            catch (error) {
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
            }
            catch (error) {
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
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        // Image upload route with rate limiting
        app.post("/api/upload-image", uploadLimiter, upload.array('images', 10), async (req, res) => {
            try {
                const token = String(req.headers['x-csrf-token'] || '');
                const authHeader = req.headers.authorization;
                let isAuthenticated = false;

                if (token && token === CSRF_TOKEN) {
                    isAuthenticated = true;
                } else if (authHeader && authHeader.startsWith("Bearer ")) {
                    const authToken = authHeader.substring(7);
                    const payload = verifyToken(authToken);
                    if (payload) isAuthenticated = true;
                }

                if (!isAuthenticated) {
                    return res.status(403).json({ ok: false, error: 'Authentication or CSRF validation failed', code: 'auth_failed' });
                }

                if (!req.files || req.files.length === 0) {
                    return res.status(400).json({ ok: false, error: "No image files provided", code: 'no_file' });
                }

                const results = [];
                const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
                const MAX_SIZE = 15 * 1024 * 1024; // 15MB

                for (const file of req.files) {
                    if (!allowed.includes(file.mimetype)) {
                        results.push({ ok: false, filename: file.originalname, error: "Unsupported image type" });
                        continue;
                    }

                    if (file.size > MAX_SIZE) {
                        results.push({ ok: false, filename: file.originalname, error: "Image too large" });
                        continue;
                    }

                    try {
                        const scan = await scanBufferForViruses(file.buffer);
                        if (!scan.ok) {
                            results.push({ ok: false, filename: file.originalname, error: scan.error || 'Virus detected' });
                            continue;
                        }

                        const baseName = sanitizeFilename(file.originalname) || `img-${crypto.randomUUID()}`;
                        const cloudinaryResult = await cloudinarySignedUpload(file.buffer, baseName, file.mimetype, { folder: 'uploads' });

                        results.push({
                            ok: true,
                            url: cloudinaryResult.secure_url,
                            fullUrl: cloudinaryResult.secure_url,
                            filename: cloudinaryResult.public_id,
                            size: file.size,
                            mimetype: file.mimetype
                        });

                        logUpload({ type: 'image', filename: cloudinaryResult.public_id, size: file.size, mimetype: file.mimetype, url: cloudinaryResult.secure_url });
                    } catch (err) {
                        results.push({ ok: false, filename: file.originalname, error: err.message });
                    }
                }

                res.json({ ok: true, results });
            }
            catch (error) {
                logUpload({ type: 'image', error: error?.message || String(error) });
                res.status(500).json({ ok: false, error: error.message || 'Upload failed', code: 'server_error' });
            }
        });
        // Audio upload route with rate limiting
        app.post("/api/upload-audio", uploadLimiter, requireAuth, upload.single('audio'), async (req, res) => {
            try {
                const token = String(req.headers['x-csrf-token'] || '');
                if (!token || token !== CSRF_TOKEN) {
                    return res.status(403).json({ error: 'CSRF validation failed' });
                }
                if (!req.file) {
                    return res.status(400).json({ error: "No audio file provided" });
                }
                const allowed = ["audio/mpeg", "audio/ogg", "audio/wav", "audio/webm"];
                if (!allowed.includes(req.file.mimetype)) {
                    return res.status(400).json({ ok: false, error: "Unsupported audio type", code: 'unsupported_type' });
                }
                const MAX_SIZE = 50 * 1024 * 1024; // 50MB
                if (req.file.size > MAX_SIZE) {
                    return res.status(413).json({ ok: false, error: "Audio too large", code: 'file_too_large', limit: MAX_SIZE });
                }
                const scan = await scanBufferForViruses(req.file.buffer);
                if (!scan.ok) {
                    return res.status(400).json({ ok: false, error: scan.error || 'Virus scan failed', code: 'virus_detected' });
                }
                const customName = String(req.body?.filename || req.query?.filename || '').trim();
                const baseName = sanitizeFilename(customName) || `audio-${crypto.randomUUID()}`;
                const ext = mimeToExt(req.file.mimetype) || 'mp3';
                const { url, fullUrl, filename } = await saveLocalMedia({ buffer: req.file.buffer, filename: `${baseName}.${ext}`, kind: 'audio' });
                logUpload({ type: 'audio', filename, size: req.file.size, mimetype: req.file.mimetype, url, fullUrl });
                res.json({ ok: true, type: 'audio', url, fullUrl, filename, size: req.file.size });
            }
            catch (error) {
                logUpload({ type: 'audio', error: error?.message || String(error) });
                res.status(500).json({ ok: false, error: error.message || 'Failed to upload audio', code: 'server_error' });
            }
        });

        // Video upload route
        app.post("/api/upload-video", uploadLimiter, requireAuth, upload.single('video'), async (req, res) => {
            try {
                const token = String(req.headers['x-csrf-token'] || '');
                if (!token || token !== CSRF_TOKEN) {
                    return res.status(403).json({ ok: false, error: 'CSRF validation failed', code: 'csrf_failed' });
                }
                if (!req.file) {
                    return res.status(400).json({ ok: false, error: "No video file provided", code: 'no_file' });
                }
                const allowed = ["video/mp4"];
                if (!allowed.includes(req.file.mimetype)) {
                    return res.status(400).json({ ok: false, error: "Unsupported video type", code: 'unsupported_type' });
                }
                const MAX_SIZE = 10 * 1024 * 1024; // 10MB
                if (req.file.size > MAX_SIZE) {
                    return res.status(413).json({ ok: false, error: "Video too large", code: 'file_too_large', limit: MAX_SIZE });
                }
                const scan = await scanBufferForViruses(req.file.buffer);
                if (!scan.ok) {
                    return res.status(400).json({ ok: false, error: scan.error || 'Virus scan failed', code: 'virus_detected' });
                }
                const folder = 'videos';
                const sha = crypto.createHash('sha1').update(req.file.buffer).digest('hex').slice(0, 24);
                const publicId = sha;
                const started = Date.now();
                try {
                    const json = await cloudinarySignedUpload(req.file.buffer, req.file.originalname, req.file.mimetype, { folder, public_id: publicId });
                    const duration = Date.now() - started;
                    const secureUrl = json.secure_url;
                    const domainUrl = await buildDomainUrl(secureUrl, req);
                    const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dkpdidm89';
                    let thumbnail_secure_url = '';
                    let thumbnail_domain_url = '';
                    try {
                        const pub = String(json.public_id || '').trim();
                        if (pub) {
                            thumbnail_secure_url = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/so_0/${pub}.jpg`;
                            thumbnail_domain_url = await buildDomainUrl(thumbnail_secure_url, req);
                        }
                    } catch { }
                    logUpload({ type: 'video', filename: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype, secure_url: secureUrl, domain_url: domainUrl, duration });
                    recordUpload(true, duration);
                    return res.json({ ok: true, secure_url: secureUrl, domain_url: domainUrl, public_id: json.public_id, format: json.format, resource_type: 'video', thumbnail_secure_url, thumbnail_domain_url, original_filename: req.file.originalname });
                } catch (err) {
                    const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dkpdidm89';
                    const ext = 'mp4';
                    const LOCAL_CLOUD_DIR = path.resolve('backend-deploy-full/uploads/cloudinary_fallback');
                    const parts = ['video', 'upload', folder, `${publicId}.${ext}`];
                    ensureDir(path.join(LOCAL_CLOUD_DIR, ...parts.slice(0, -1)));
                    await fs.promises.writeFile(path.join(LOCAL_CLOUD_DIR, ...parts), req.file.buffer);
                    const secureUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${parts.join('/')}`;
                    const domainUrl = `${(process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '')}/media/cloudinary/${CLOUDINARY_CLOUD_NAME}/${parts.join('/')}`;
                    const duration = Date.now() - started;
                    logUpload({ type: 'video', filename: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype, secure_url: secureUrl, domain_url: domainUrl, duration, fallback: true });
                    recordUpload(true, duration);
                    return res.json({ ok: true, secure_url: secureUrl, domain_url: domainUrl, public_id: `${folder}/${publicId}`, format: ext, resource_type: 'video', bytes: req.file.size, created_at: new Date().toISOString(), original_filename: req.file.originalname });
                }
            } catch (error) {
                logUpload({ type: 'video', error: error?.message || String(error) });
                res.status(500).json({ ok: false, error: error.message || 'Failed to upload video', code: 'server_error' });
            }
        });

        // Cloudinary direct upload (unsigned) — generic endpoint
        async function buildDomainUrl(secureUrl, req) {
            try {
                const u = new URL(String(secureUrl));
                const base = (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
                if (!/res\.cloudinary\.com$/i.test(u.hostname)) return String(secureUrl);
                const parts = u.pathname.split('/').filter(Boolean);
                const isImage = parts.length >= 3 && parts[1] === 'image' && parts[2] === 'upload';
                const last = parts[parts.length - 1] || '';
                const domainUrl = isImage && /\.[A-Za-z0-9]+$/.test(last)
                    ? `${base}/image/${last}`
                    : `${base}/media/${u.pathname.replace(/^\//, '')}`;
                const ctrl = new AbortController();
                const id = setTimeout(() => ctrl.abort(), 1200);
                try {
                    const head = await fetch(domainUrl, { method: 'HEAD', signal: ctrl.signal });
                    clearTimeout(id);
                    if (head.ok) return domainUrl;
                    return String(secureUrl);
                } catch {
                    clearTimeout(id);
                    return String(secureUrl);
                }
            } catch {
                return String(secureUrl);
            }
        }
        // Signed Cloudinary upload with retries and domain URL mapping
        async function cloudinarySignedUpload(buffer, filename, mimetype, opts = {}) {
            const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dkpdidm89';
            const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
            const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';
            const resourceType = 'auto';
            const DRY_RUN = String(process.env.CLOUDINARY_DRY_RUN || '').toLowerCase() === 'true';
            if (DRY_RUN) {
                const format = mimeToExt(mimetype) || 'webp';
                const publicIdBase = String((opts.public_id || filename) || '').replace(/\.[A-Za-z0-9]+$/i, '');
                const kind = mimetype && mimetype.startsWith('image/') ? 'image' : mimetype && mimetype.startsWith('video/') ? 'video' : mimetype && mimetype.startsWith('audio/') ? 'audio' : 'auto';
                return {
                    secure_url: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${kind}/upload/v123/${publicIdBase}.${format}`,
                    public_id: publicIdBase,
                    format,
                    resource_type: kind,
                    bytes: (buffer && buffer.length) || 0,
                    created_at: new Date().toISOString(),
                };
            }
            if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
                throw new Error('Cloudinary API credentials missing');
            }
            const ts = Math.floor(Date.now() / 1000);
            const params = {
                timestamp: ts,
                folder: String(opts.folder || '').trim(),
                public_id: String(opts.public_id || '').trim(),
                overwrite: 'true',
                invalidate: 'true',
            };
            // Build string to sign (exclude empty values)
            const nonEmpty = Object.entries(params).filter(([, v]) => v && String(v).length > 0);
            const toSign = nonEmpty
                .sort(([a], [b]) => (a > b ? 1 : a < b ? -1 : 0))
                .map(([k, v]) => `${k}=${v}`)
                .join('&');
            const signature = crypto.createHash('sha1').update(`${toSign}${CLOUDINARY_API_SECRET}`).digest('hex');
            const fd = new FormData();
            fd.append('file', buffer, { filename, contentType: mimetype });
            fd.append('timestamp', String(ts));
            if (params.folder) fd.append('folder', params.folder);
            if (params.public_id) fd.append('public_id', params.public_id);
            fd.append('overwrite', 'true');
            fd.append('invalidate', 'true');
            try {
                const originalName = sanitizeFilename(filename);
                if (originalName) fd.append('context', `original_filename=${originalName}`);
            } catch { }
            fd.append('signature', signature);
            fd.append('api_key', CLOUDINARY_API_KEY);
            const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
            // Retry logic (with 10-second timeout per attempt)
            let lastErr = null;
            const attempts = 2;
            for (let i = 0; i < attempts; i++) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000);
                    let upstream;
                    try {
                        upstream = await fetch(endpoint, { method: 'POST', body: fd, signal: controller.signal });
                    } finally {
                        clearTimeout(timeoutId);
                    }
                    if (!upstream.ok) {
                        const text = await upstream.text().catch(() => '');
                        throw new Error(`Cloudinary ${upstream.status}: ${text}`);
                    }
                    const json = await upstream.json();
                    return json;
                } catch (e) {
                    lastErr = e;
                    if (i < attempts - 1) {
                        await new Promise(r => setTimeout(r, 1000));
                    }
                }
            }
            throw lastErr || new Error('Cloudinary upload failed');
        }
        // Method guard for uploads (allow POST and OPTIONS only)
        app.all('/images/upload', (req, res, next) => {
            if (req.method === 'OPTIONS') return res.sendStatus(204);
            if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed', allowed: ['POST'] });
            next();
        });
        // Explicit handlers to avoid static middleware swallowing requests
        app.get('/images/upload', (_req, res) => res.status(405).json({ ok: false, error: 'Method not allowed', allowed: ['POST'] }));
        app.put('/images/upload', (_req, res) => res.status(405).json({ ok: false, error: 'Method not allowed', allowed: ['POST'] }));
        app.patch('/images/upload', (_req, res) => res.status(405).json({ ok: false, error: 'Method not allowed', allowed: ['POST'] }));
        app.delete('/images/upload', (_req, res) => res.status(405).json({ ok: false, error: 'Method not allowed', allowed: ['POST'] }));
        app.post('/images/upload', uploadLimiter, upload.single('file'), async (req, res) => {
            try {
                const token = String(req.headers['x-csrf-token'] || req.headers['X-CSRF-Token'] || '');
                if (!token || token !== CSRF_TOKEN) {
                    return res.status(403).json({ ok: false, error: 'CSRF validation failed', code: 'csrf_failed' });
                }
                if (!req.file) return res.status(400).json({ ok: false, error: 'No file provided' });
                const allowed = [
                    'image/jpeg',
                    'image/png',
                    'image/gif',
                    'image/webp',
                    'video/mp4',
                    'application/pdf'
                ];
                if (!allowed.includes(req.file.mimetype)) {
                    return res.status(415).json({ ok: false, error: `Unsupported type: ${req.file.mimetype}`, code: 'unsupported_type' });
                }
                const kind = req.file.mimetype.startsWith('image/') ? 'image' : req.file.mimetype.startsWith('video/') ? 'video' : req.file.mimetype === 'application/pdf' ? 'raw' : 'unknown';
                const sizeLimits = { image: 10 * 1024 * 1024, video: 10 * 1024 * 1024, raw: 10 * 1024 * 1024 };
                if (kind === 'unknown') {
                    return res.status(415).json({ ok: false, error: 'Unsupported type', code: 'unsupported_type' });
                }
                if (req.file.size > sizeLimits[kind]) {
                    return res.status(413).json({ ok: false, error: 'File too large', code: 'file_too_large', limit: sizeLimits[kind] });
                }
                const folder = String(req.query.folder || req.body?.folder || '').trim();
                const sha = crypto.createHash('sha1').update(req.file.buffer).digest('hex').slice(0, 24);
                const publicId = sha;
                const started = Date.now();
                try {
                    const json = await cloudinarySignedUpload(req.file.buffer, req.file.originalname, req.file.mimetype, { folder, public_id: publicId });
                    const duration = Date.now() - started;
                    const secureUrl = json.secure_url;
                    const domainUrl = await buildDomainUrl(secureUrl, req);
                    const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dkpdidm89';
                    let thumbnail_secure_url = '';
                    let thumbnail_domain_url = '';
                    try {
                        const pub = String(json.public_id || '').trim();
                        const kind2 = String(json.resource_type || 'auto');
                        if (pub && kind2 === 'video') {
                            thumbnail_secure_url = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/so_0/${pub}.jpg`;
                            thumbnail_domain_url = await buildDomainUrl(thumbnail_secure_url, req);
                        }
                    } catch { }
                    logUpload({ type: json.resource_type || 'auto', filename: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype, secure_url: secureUrl, domain_url: domainUrl, duration });
                    recordUpload(true, duration);
                    return res.json({ ok: true, secure_url: secureUrl, domain_url: domainUrl, public_id: json.public_id, format: json.format, resource_type: json.resource_type || 'auto', bytes: json.bytes, created_at: json.created_at, thumbnail_secure_url, thumbnail_domain_url, original_filename: req.file.originalname });
                } catch (error) {
                    // Fallback to local server
                    const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dkpdidm89';
                    const ext = mimeToExt(req.file.mimetype) || (kind === 'raw' ? 'pdf' : 'bin');
                    const resource = kind === 'image' ? 'image' : kind === 'video' ? 'video' : 'raw';
                    const localPathParts = [resource, 'upload'];
                    if (folder) localPathParts.push(folder);
                    const relativeFile = `${publicId}.${ext}`;
                    localPathParts.push(relativeFile);
                    // Save with cloud name prefix so /media/cloudinary/<cloud>/... proxy can find it
                    const LOCAL_CLOUD_DIR = path.resolve('backend-deploy-full/uploads/cloudinary_fallback');
                    const withCloudParts = [CLOUDINARY_CLOUD_NAME, ...localPathParts];
                    ensureDir(path.join(LOCAL_CLOUD_DIR, ...withCloudParts.slice(0, -1)));
                    await fs.promises.writeFile(path.join(LOCAL_CLOUD_DIR, ...withCloudParts), req.file.buffer);
                    // Use a relative URL so it works in any environment (dev, prod, Replit proxy)
                    const relativeUrl = `/media/cloudinary/${CLOUDINARY_CLOUD_NAME}/${localPathParts.join('/')}`;
                    const domainUrl = `${(process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '')}${relativeUrl}`;
                    const duration = Date.now() - started;
                    logUpload({ type: resource, filename: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype, url: relativeUrl, domain_url: domainUrl, duration, fallback: true });
                    recordUpload(true, duration);
                    return res.json({ ok: true, url: relativeUrl, secure_url: relativeUrl, domain_url: domainUrl, public_id: folder ? `${folder}/${publicId}` : publicId, format: ext, resource_type: resource, bytes: req.file.size, created_at: new Date().toISOString(), original_filename: req.file.originalname, fallback: true });
                }
            } catch (error) {
                logUpload({ type: 'cloudinary', error: error?.message || String(error) });
                recordUpload(false);
                res.status(500).json({ ok: false, error: error?.message || 'Upload failed', code: 'server_error' });
            }
        });

        // Convenience endpoints for specific media kinds (use same handler)
        app.post('/videos/upload', uploadLimiter, upload.single('file'), async (req, res) => {
            req.file && (req.file.mimetype = req.file.mimetype || 'video/mp4');
            req.query.folder = req.query.folder || 'videos';
            return app._router.handle({ ...req, url: '/images/upload', method: 'POST' }, res, () => { });
        });
        app.post('/audio/upload', uploadLimiter, upload.single('file'), async (req, res) => {
            req.file && (req.file.mimetype = req.file.mimetype || 'audio/mpeg');
            req.query.folder = req.query.folder || 'audio';
            return app._router.handle({ ...req, url: '/images/upload', method: 'POST' }, res, () => { });
        });

        // CDN proxy to serve Cloudinary assets under site domain
        app.get('/cdn/fetch', async (req, res) => {
            try {
                const url = String(req.query.url || '');
                if (!url) return res.status(400).json({ ok: false, error: "Missing 'url' query parameter" });
                const u = new URL(url);
                if (!/res\.cloudinary\.com$/i.test(u.hostname)) {
                    return res.status(400).json({ ok: false, error: 'Only Cloudinary resources allowed' });
                }
                const upstream = await fetch(url);
                if (!upstream.ok) return res.status(502).json({ ok: false, error: `Upstream failed: ${upstream.status}` });
                const ct = upstream.headers.get('content-type');
                if (ct) res.setHeader('Content-Type', ct);
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                upstream.body.pipe(res);
            } catch (error) {
                res.status(500).json({ ok: false, error: error?.message || 'Proxy failed' });
            }
        });

        // Upload stats (super admin)
        app.get('/api/admin/upload-stats', requireAuth, requireSuperAdmin, async (_req, res) => {
            try {
                const sorted = uploadStats.durations.slice().sort((a, b) => a - b);
                const p95 = sorted.length ? sorted[Math.floor(sorted.length * 0.95) - 1] || sorted[sorted.length - 1] : 0;
                const p99 = sorted.length ? sorted[Math.floor(sorted.length * 0.99) - 1] || sorted[sorted.length - 1] : 0;
                const avg = sorted.length ? Math.round(sorted.reduce((s, x) => s + x, 0) / sorted.length) : 0;
                res.json({
                    ok: true,
                    total: uploadStats.total,
                    success: uploadStats.success,
                    failed: uploadStats.failed,
                    durations_last_1000: uploadStats.durations.length,
                    avg_ms: avg,
                    p95_ms: p95,
                    p99_ms: p99,
                });
            } catch (error) {
                res.status(500).json({ ok: false, error: error?.message || 'Failed to get stats' });
            }
        });

        // Pretty path proxy: /media/cloudinary/<cloud>/<resource>/<...>
        app.all('/media/cloudinary/*', async (req, res) => {
            try {
                const rest = String(req.params[0] || '').replace(/^\/+/, '');
                if (!rest || !/^dkpdidm89\//.test(rest)) {
                    return res.status(400).json({ ok: false, error: 'Invalid Cloudinary path' });
                }
                const method = (req.method || 'GET').toUpperCase();
                const ext = path.extname(rest).toLowerCase().replace(/^\./, '');
                const typeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', mp4: 'video/mp4', pdf: 'application/pdf' };
                // Check local storage FIRST — serve instantly without hitting Cloudinary
                const LOCAL_CLOUD_DIR = path.resolve('backend-deploy-full/uploads/cloudinary_fallback');
                const localPath = path.join(LOCAL_CLOUD_DIR, ...rest.split('/'));
                if (fs.existsSync(localPath)) {
                    const ct = typeMap[ext] || 'application/octet-stream';
                    res.setHeader('Content-Type', ct);
                    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                    if (method === 'HEAD') return res.sendStatus(200);
                    return fs.createReadStream(localPath).pipe(res);
                }
                // Not found locally — try fetching from Cloudinary with timeout
                const url = `https://res.cloudinary.com/${rest}`;
                let upstream = null;
                { const _ctrl = new AbortController(); const _t = setTimeout(() => _ctrl.abort(), 8000); try { upstream = await fetch(url, { method: method === 'HEAD' ? 'HEAD' : 'GET', signal: _ctrl.signal }); } catch { upstream = null; } finally { clearTimeout(_t); } }
                if (upstream && upstream.ok) {
                    const ct = upstream.headers.get('content-type') || typeMap[ext] || 'application/octet-stream';
                    res.setHeader('Content-Type', ct);
                    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                    if (method === 'HEAD') return res.sendStatus(200);
                    return upstream.body.pipe(res);
                }
                return res.status(404).json({ ok: false, error: 'Image not found locally or on Cloudinary' });
            } catch (error) {
                res.status(500).json({ ok: false, error: error?.message || 'Proxy failed' });
            }
        });

        app.get('/media/*', async (req, res) => {
            try {
                const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dkpdidm89';
                let rest = String(req.params[0] || '').replace(/^\/+/, '');
                if (!rest) return res.status(400).json({ ok: false, error: 'Missing path' });
                if (!/^([a-z0-9_-]+)\//i.test(rest)) {
                    rest = `${CLOUDINARY_CLOUD_NAME}/${rest}`;
                }
                const url = `https://res.cloudinary.com/${rest}`;
                const u = new URL(url);
                if (!/res\.cloudinary\.com$/i.test(u.hostname)) {
                    return res.status(400).json({ ok: false, error: 'Only Cloudinary resources allowed' });
                }
                const upstream = await fetch(url);
                if (!upstream.ok) return res.status(502).json({ ok: false, error: `Upstream failed: ${upstream.status}` });
                const ct = upstream.headers.get('content-type');
                if (ct) res.setHeader('Content-Type', ct);
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                upstream.body.pipe(res);
            } catch (error) {
                res.status(500).json({ ok: false, error: error?.message || 'Proxy failed' });
            }
        });

        // Pretty path for images: /image/<public_id>.<ext>
        app.all('/image/:filename', async (req, res) => {
            try {
                const name = String(req.params.filename || '').replace(/[^A-Za-z0-9._-]+/g, '');
                if (!name) return res.status(400).json({ ok: false, error: 'Invalid image name' });
                const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dkpdidm89';
                const url = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${name}`;
                const u = new URL(url);
                if (!/res\.cloudinary\.com$/i.test(u.hostname)) {
                    return res.status(400).json({ ok: false, error: 'Only Cloudinary resources allowed' });
                }
                const method = (req.method || 'GET').toUpperCase();
                let upstream = null; { const _ctrl = new AbortController(); const _t = setTimeout(() => _ctrl.abort(), 8000); try { upstream = await fetch(url, { method: method === 'HEAD' ? 'HEAD' : 'GET', signal: _ctrl.signal }); } catch { upstream = null; } finally { clearTimeout(_t); } }
                if (upstream && upstream.ok) {
                    const ct = upstream.headers.get('content-type');
                    if (ct) res.setHeader('Content-Type', ct);
                    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                    if (method === 'HEAD') return res.sendStatus(200);
                    return upstream.body.pipe(res);
                }
                const LOCAL_CLOUD_DIR = path.resolve('backend-deploy-full/uploads/cloudinary_fallback');
                const localPath = path.join(LOCAL_CLOUD_DIR, 'image', 'upload', name);
                if (!fs.existsSync(localPath)) {
                    return res.status(502).json({ ok: false, error: `Upstream failed and no local fallback` });
                }
                const ext = path.extname(localPath).toLowerCase().replace(/^\./, '');
                const typeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
                const ct = typeMap[ext] || 'application/octet-stream';
                res.setHeader('Content-Type', ct);
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                if (method === 'HEAD') return res.sendStatus(200);
                fs.createReadStream(localPath).pipe(res);
            } catch (error) {
                res.status(500).json({ ok: false, error: error?.message || 'Proxy failed' });
            }
        });

        app.get('/api/admin/media', requireAuth, async (req, res) => {
            try {
                let raw = '';
                try { raw = await fs.promises.readFile(UPLOAD_LOG_FILE, 'utf8'); } catch { }
                const lines = raw.split('\n').filter(Boolean);
                const items = [];
                for (const line of lines.slice(-1000)) {
                    try {
                        const e = JSON.parse(line);
                        const secure = String(e.secure_url || e.url || '');
                        const domain = String(e.domain_url || '');
                        const type = String(e.type || e.resource_type || 'auto');
                        const size = Number(e.size || e.bytes || 0) || 0;
                        const created = String(e.ts || e.created_at || new Date().toISOString());
                        let public_id = '';
                        try {
                            if (secure) {
                                const u = new URL(secure);
                                const parts = u.pathname.split('/').filter(Boolean);
                                public_id = parts.slice(3).join('/');
                            }
                        } catch { }
                        const mapped = domain || await buildDomainUrl(secure, req);
                        items.push({ public_id, secure_url: secure, domain_url: mapped, type, size, created_at: created });
                    } catch { }
                }
                const q = String(req.query.q || '').toLowerCase();
                const t = String(req.query.type || '').toLowerCase();
                const sort = String(req.query.sort || 'desc').toLowerCase();
                let out = items;
                if (q) out = out.filter(i => (i.public_id || '').toLowerCase().includes(q) || (i.secure_url || '').toLowerCase().includes(q));
                if (t) out = out.filter(i => (i.type || '').toLowerCase().includes(t));
                out.sort((a, b) => {
                    const ta = Date.parse(a.created_at || '');
                    const tb = Date.parse(b.created_at || '');
                    return sort === 'asc' ? (ta - tb) : (tb - ta);
                });
                res.set('Cache-Control', 'no-store');
                res.json({ items: out });
            } catch (error) {
                res.status(500).json({ ok: false, error: error?.message || 'failed' });
            }
        });

        // Event media upload (image/video)
        app.post('/api/events/:id/upload-media', uploadLimiter, requireAuth, requireEventManager, upload.single('file'), async (req, res) => {
            try {
                const token = String(req.headers['x-csrf-token'] || '');
                if (!token || token !== CSRF_TOKEN) {
                    return res.status(403).json({ ok: false, error: 'CSRF validation failed', code: 'csrf_failed' });
                }
                if (!req.file) {
                    return res.status(400).json({ ok: false, error: "No file provided", code: 'no_file' });
                }
                const allowed = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf'];
                if (!allowed.includes(req.file.mimetype)) {
                    return res.status(415).json({ ok: false, error: `Unsupported type: ${req.file.mimetype}`, code: 'unsupported_type' });
                }
                const limits = { image: 10 * 1024 * 1024, video: 10 * 1024 * 1024, raw: 10 * 1024 * 1024 };
                const kind = req.file.mimetype.startsWith('image/') ? 'image' : req.file.mimetype === 'application/pdf' ? 'raw' : 'video';
                if (req.file.size > limits[kind]) {
                    return res.status(413).json({ ok: false, error: 'File too large', code: 'file_too_large', limit: limits[kind] });
                }
                const scan = await scanBufferForViruses(req.file.buffer);
                if (!scan.ok) return res.status(400).json({ ok: false, error: scan.error || 'Virus scan failed', code: 'virus_detected' });
                const folder = `events/${req.params.id}`;
                const sha = crypto.createHash('sha1').update(req.file.buffer).digest('hex').slice(0, 24);
                const publicId = sha;
                const started = Date.now();
                try {
                    const json = await cloudinarySignedUpload(req.file.buffer, req.file.originalname, req.file.mimetype, { folder, public_id: publicId });
                    const duration = Date.now() - started;
                    const secureUrl = json.secure_url;
                    const domainUrl = await buildDomainUrl(secureUrl, req);
                    logUpload({ type: kind, entity: 'event', id: req.params.id, filename: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype, secure_url: secureUrl, domain_url: domainUrl, duration });
                    recordUpload(true, duration);
                    return res.json({ ok: true, secure_url: secureUrl, domain_url: domainUrl, public_id: json.public_id, format: json.format, resource_type: json.resource_type || kind, original_filename: req.file.originalname });
                } catch (err) {
                    const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dkpdidm89';
                    const ext = mimeToExt(req.file.mimetype) || (kind === 'raw' ? 'pdf' : 'bin');
                    const resource = kind === 'image' ? 'image' : kind === 'video' ? 'video' : 'raw';
                    const LOCAL_CLOUD_DIR = path.resolve('backend-deploy-full/uploads/cloudinary_fallback');
                    const parts = [resource, 'upload', folder, `${publicId}.${ext}`].filter(Boolean);
                    ensureDir(path.join(LOCAL_CLOUD_DIR, ...parts.slice(0, -1)));
                    await fs.promises.writeFile(path.join(LOCAL_CLOUD_DIR, ...parts), req.file.buffer);
                    const secureUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${parts.join('/')}`;
                    const domainUrl = `${(process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '')}/media/cloudinary/${CLOUDINARY_CLOUD_NAME}/${parts.join('/')}`;
                    const duration = Date.now() - started;
                    logUpload({ type: resource, entity: 'event', id: req.params.id, filename: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype, secure_url: secureUrl, domain_url: domainUrl, duration, fallback: true });
                    recordUpload(true, duration);
                    return res.json({ ok: true, secure_url: secureUrl, domain_url: domainUrl, public_id: `${folder}/${publicId}`, format: ext, resource_type: resource, bytes: req.file.size, created_at: new Date().toISOString(), original_filename: req.file.originalname });
                }
            } catch (error) {
                logUpload({ type: 'event_media', error: error?.message || String(error) });
                res.status(500).json({ ok: false, error: error.message || 'Failed to upload event media', code: 'server_error' });
            }
        });

        // Cloudinary upload for Events (signed)
        app.post('/api/events/:id/upload-cloudinary', uploadLimiter, requireAuth, requireEventManager, upload.single('file'), async (req, res) => {
            try {
                const token = String(req.headers['x-csrf-token'] || req.headers['X-CSRF-Token'] || '');
                if (!token || token !== CSRF_TOKEN) {
                    return res.status(403).json({ ok: false, error: 'CSRF validation failed', code: 'csrf_failed' });
                }
                if (!req.file) return res.status(400).json({ ok: false, error: 'No file provided', code: 'no_file' });
                const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/ogg', 'video/mpeg'];
                if (!allowed.includes(req.file.mimetype)) {
                    return res.status(415).json({ ok: false, error: `Unsupported type: ${req.file.mimetype}`, code: 'unsupported_type' });
                }
                const folder = `events/${req.params.id}`;
                const publicIdBase = sanitizeFilename(String(req.body?.public_id || req.file.originalname || ''));
                const publicId = publicIdBase.replace(/\.[a-z0-9]+$/i, '');
                const started = Date.now();
                const json = await cloudinarySignedUpload(req.file.buffer, req.file.originalname, req.file.mimetype, { folder, public_id: publicId });
                const duration = Date.now() - started;
                const secureUrl = json.secure_url;
                const domainUrl = await buildDomainUrl(secureUrl, req);
                logUpload({ type: json.resource_type || 'auto', entity: 'event', id: req.params.id, filename: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype, secure_url: secureUrl, domain_url: domainUrl, duration });
                recordUpload(true, duration);
                if (String(req.query.updateImage || '').toLowerCase() === 'true') {
                    await storage.updateEvent(req.params.id, { image: domainUrl });
                }
                res.json({ ok: true, secure_url: secureUrl, domain_url: domainUrl, public_id: json.public_id, format: json.format, resource_type: json.resource_type || 'auto' });
            } catch (error) {
                logUpload({ type: 'cloudinary_event', error: error?.message || String(error) });
                recordUpload(false);
                res.status(500).json({ ok: false, error: error?.message || 'Upload failed', code: 'server_error' });
            }
        });

        // Cloudinary upload for News (signed)
        app.post('/api/news/:id/upload-cloudinary', uploadLimiter, requireAuth, requireNewsManager, upload.single('file'), async (req, res) => {
            try {
                const token = String(req.headers['x-csrf-token'] || req.headers['X-CSRF-Token'] || '');
                if (!token || token !== CSRF_TOKEN) {
                    return res.status(403).json({ ok: false, error: 'CSRF validation failed', code: 'csrf_failed' });
                }
                if (!req.file) return res.status(400).json({ ok: false, error: 'No file provided', code: 'no_file' });
                const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
                if (!allowed.includes(req.file.mimetype)) {
                    return res.status(415).json({ ok: false, error: `Unsupported type: ${req.file.mimetype}`, code: 'unsupported_type' });
                }
                const MAX_IMAGE_BYTES = Number(process.env.MAX_IMAGE_BYTES || 10 * 1024 * 1024);
                if (req.file.size > MAX_IMAGE_BYTES) {
                    return res.status(413).json({ ok: false, error: `File too large. Max ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)}MB`, code: 'too_large' });
                }
                if (req.file.mimetype.startsWith('image/')) {
                    const magicOk = checkMagicBytes(req.file.buffer, req.file.mimetype);
                    if (!magicOk) {
                        return res.status(422).json({ ok: false, error: 'Invalid image data', code: 'invalid_image' });
                    }
                    const decodable = await isImageDecodable(req.file.buffer);
                    if (!decodable) {
                        return res.status(422).json({ ok: false, error: 'Corrupted image', code: 'decode_failed' });
                    }
                }
                const scan = await scanBufferForViruses(req.file.buffer);
                if (!scan.ok) {
                    logUpload({ type: 'virus_scan', entity: 'news', id: req.params.id, filename: req.file.originalname, size: req.file.size, error: scan.error || 'scan_failed' });
                    return res.status(422).json({ ok: false, error: 'Malware scan failed', code: 'malware_scan_failed' });
                }
                const folder = `news/${req.params.id}`;
                const sha = crypto.createHash('sha1').update(req.file.buffer).digest('hex').slice(0, 24);
                const publicId = sha;
                const started = Date.now();
                try {
                    const json = await cloudinarySignedUpload(req.file.buffer, req.file.originalname, req.file.mimetype, { folder, public_id: publicId });
                    const duration = Date.now() - started;
                    const secureUrl = json.secure_url;
                    const domainUrl = await buildDomainUrl(secureUrl, req);
                    logUpload({ type: json.resource_type || 'image', entity: 'news', id: req.params.id, filename: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype, secure_url: secureUrl, domain_url: domainUrl, duration });
                    recordUpload(true, duration);
                    if (String(req.query.updateImage || '').toLowerCase() === 'true') {
                        await storage.updateNews(req.params.id, { image: domainUrl });
                    }
                    return res.json({ ok: true, secure_url: secureUrl, domain_url: domainUrl, public_id: json.public_id, format: json.format, resource_type: json.resource_type || 'image', original_filename: req.file.originalname });
                } catch (err) {
                    const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dkpdidm89';
                    const ext = mimeToExt(req.file.mimetype) || 'bin';
                    const resource = req.file.mimetype === 'application/pdf' ? 'raw' : 'image';
                    const LOCAL_CLOUD_DIR = path.resolve('backend-deploy-full/uploads/cloudinary_fallback');
                    const parts = [resource, 'upload', folder, `${publicId}.${ext}`];
                    ensureDir(path.join(LOCAL_CLOUD_DIR, ...parts.slice(0, -1)));
                    await fs.promises.writeFile(path.join(LOCAL_CLOUD_DIR, ...parts), req.file.buffer);
                    const secureUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${parts.join('/')}`;
                    const domainUrl = `${(process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '')}/media/cloudinary/${CLOUDINARY_CLOUD_NAME}/${parts.join('/')}`;
                    const duration = Date.now() - started;
                    logUpload({ type: resource, entity: 'news', id: req.params.id, filename: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype, secure_url: secureUrl, domain_url: domainUrl, duration, fallback: true });
                    recordUpload(true, duration);
                    if (String(req.query.updateImage || '').toLowerCase() === 'true') {
                        await storage.updateNews(req.params.id, { image: domainUrl });
                    }
                    return res.json({ ok: true, secure_url: secureUrl, domain_url: domainUrl, public_id: `${folder}/${publicId}`, format: ext, resource_type: resource, bytes: req.file.size, created_at: new Date().toISOString(), original_filename: req.file.originalname });
                }
            } catch (error) {
                logUpload({ type: 'cloudinary_news', error: error?.message || String(error) });
                recordUpload(false);
                res.status(500).json({ ok: false, error: error?.message || 'Upload failed', code: 'server_error' });
            }
        });

        // Cloudinary upload for Posts (signed)
        app.post('/api/posts/:id/upload-cloudinary', uploadLimiter, requireAuth, requirePostManager, upload.single('file'), async (req, res) => {
            try {
                const token = String(req.headers['x-csrf-token'] || req.headers['X-CSRF-Token'] || '');
                if (!token || token !== CSRF_TOKEN) {
                    return res.status(403).json({ ok: false, error: 'CSRF validation failed', code: 'csrf_failed' });
                }
                if (!req.file) return res.status(400).json({ ok: false, error: 'No file provided', code: 'no_file' });
                const allowed = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf'];
                if (!allowed.includes(req.file.mimetype)) {
                    return res.status(415).json({ ok: false, error: `Unsupported type: ${req.file.mimetype}`, code: 'unsupported_type' });
                }
                const folder = `posts/${req.params.id}`;
                const sha = crypto.createHash('sha1').update(req.file.buffer).digest('hex').slice(0, 24);
                const publicId = sha;
                const started = Date.now();
                try {
                    const json = await cloudinarySignedUpload(req.file.buffer, req.file.originalname, req.file.mimetype, { folder, public_id: publicId });
                    const duration = Date.now() - started;
                    const secureUrl = json.secure_url;
                    const domainUrl = await buildDomainUrl(secureUrl, req);
                    logUpload({ type: json.resource_type || 'auto', entity: 'post', id: req.params.id, filename: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype, secure_url: secureUrl, domain_url: domainUrl, duration });
                    recordUpload(true, duration);
                    return res.json({ ok: true, secure_url: secureUrl, domain_url: domainUrl, public_id: json.public_id, format: json.format, resource_type: json.resource_type || 'auto', original_filename: req.file.originalname });
                } catch (err) {
                    const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dkpdidm89';
                    const ext = mimeToExt(req.file.mimetype) || 'bin';
                    const resource = req.file.mimetype === 'application/pdf' ? 'raw' : (req.file.mimetype.startsWith('image/') ? 'image' : 'video');
                    const LOCAL_CLOUD_DIR = path.resolve('backend-deploy-full/uploads/cloudinary_fallback');
                    const parts = [resource, 'upload', folder, `${publicId}.${ext}`];
                    ensureDir(path.join(LOCAL_CLOUD_DIR, ...parts.slice(0, -1)));
                    await fs.promises.writeFile(path.join(LOCAL_CLOUD_DIR, ...parts), req.file.buffer);
                    const secureUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${parts.join('/')}`;
                    const domainUrl = `${(process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '')}/media/cloudinary/${CLOUDINARY_CLOUD_NAME}/${parts.join('/')}`;
                    const duration = Date.now() - started;
                    logUpload({ type: resource, entity: 'post', id: req.params.id, filename: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype, secure_url: secureUrl, domain_url: domainUrl, duration, fallback: true });
                    recordUpload(true, duration);
                    return res.json({ ok: true, secure_url: secureUrl, domain_url: domainUrl, public_id: `${folder}/${publicId}`, format: ext, resource_type: resource, bytes: req.file.size, created_at: new Date().toISOString(), original_filename: req.file.originalname });
                }
            } catch (error) {
                logUpload({ type: 'cloudinary_post', error: error?.message || String(error) });
                recordUpload(false);
                res.status(500).json({ ok: false, error: error?.message || 'Upload failed', code: 'server_error' });
            }
        });

        // Post attachment upload (image/video)
        app.post('/api/posts/:id/upload-attachment', uploadLimiter, requireAuth, requirePostManager, upload.single('file'), async (req, res) => {
            try {
                const token = String(req.headers['x-csrf-token'] || '');
                if (!token || token !== CSRF_TOKEN) {
                    return res.status(403).json({ ok: false, error: 'CSRF validation failed', code: 'csrf_failed' });
                }
                if (!req.file) {
                    return res.status(400).json({ ok: false, error: "No file provided", code: 'no_file' });
                }
                const allowed = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf'];
                if (!allowed.includes(req.file.mimetype)) {
                    return res.status(415).json({ ok: false, error: `Unsupported type: ${req.file.mimetype}`, code: 'unsupported_type' });
                }
                const limits = { image: 10 * 1024 * 1024, video: 10 * 1024 * 1024, raw: 10 * 1024 * 1024 };
                const kind = req.file.mimetype.startsWith('image/') ? 'image' : req.file.mimetype === 'application/pdf' ? 'raw' : 'video';
                if (req.file.size > limits[kind]) {
                    return res.status(413).json({ ok: false, error: 'File too large', code: 'file_too_large', limit: limits[kind] });
                }
                const scan = await scanBufferForViruses(req.file.buffer);
                if (!scan.ok) return res.status(400).json({ ok: false, error: scan.error || 'Virus scan failed', code: 'virus_detected' });
                const folder = `posts/${req.params.id}`;
                const sha = crypto.createHash('sha1').update(req.file.buffer).digest('hex').slice(0, 24);
                const publicId = sha;
                const started = Date.now();
                try {
                    const json = await cloudinarySignedUpload(req.file.buffer, req.file.originalname, req.file.mimetype, { folder, public_id: publicId });
                    const duration = Date.now() - started;
                    const secureUrl = json.secure_url;
                    const domainUrl = await buildDomainUrl(secureUrl, req);
                    logUpload({ type: kind, entity: 'post', id: req.params.id, filename: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype, secure_url: secureUrl, domain_url: domainUrl, duration });
                    recordUpload(true, duration);
                    return res.json({ ok: true, secure_url: secureUrl, domain_url: domainUrl, public_id: json.public_id, format: json.format, resource_type: json.resource_type || kind, original_filename: req.file.originalname });
                } catch (err) {
                    const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dkpdidm89';
                    const ext = mimeToExt(req.file.mimetype) || (kind === 'raw' ? 'pdf' : 'bin');
                    const resource = kind === 'image' ? 'image' : kind === 'video' ? 'video' : 'raw';
                    const LOCAL_CLOUD_DIR = path.resolve('backend-deploy-full/uploads/cloudinary_fallback');
                    const parts = [resource, 'upload', folder, `${publicId}.${ext}`];
                    ensureDir(path.join(LOCAL_CLOUD_DIR, ...parts.slice(0, -1)));
                    await fs.promises.writeFile(path.join(LOCAL_CLOUD_DIR, ...parts), req.file.buffer);
                    const secureUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${parts.join('/')}`;
                    const domainUrl = `${(process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '')}/media/cloudinary/${CLOUDINARY_CLOUD_NAME}/${parts.join('/')}`;
                    const duration = Date.now() - started;
                    logUpload({ type: resource, entity: 'post', id: req.params.id, filename: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype, secure_url: secureUrl, domain_url: domainUrl, duration, fallback: true });
                    recordUpload(true, duration);
                    return res.json({ ok: true, secure_url: secureUrl, domain_url: domainUrl, public_id: `${folder}/${publicId}`, format: ext, resource_type: resource, bytes: req.file.size, created_at: new Date().toISOString(), original_filename: req.file.originalname });
                }
            } catch (error) {
                logUpload({ type: 'post_attachment', error: error?.message || String(error) });
                res.status(500).json({ ok: false, error: error.message || 'Failed to upload post attachment', code: 'server_error' });
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
                let createdWeapons = [];
                let createdModes = [];
                let createdRanks = [];
                const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|jfif|webp)$/i.test(f));
                for (const fileName of imageFiles) {
                    const filePath = path.join(assetsPath, fileName);
                    const buffer = await fs.promises.readFile(filePath);
                    let imageUrl = '';
                    try {
                        imageUrl = await uploadToCatbox(buffer, fileName, 'image/jpeg', { retries: 3, timeoutMs: 12000 });
                    } catch (e) {
                        console.error('Failed to upload', fileName, e?.message || e);
                        logUpload({ type: 'catbox_seed', filename: fileName, size: buffer.length, error: e?.message || String(e) });
                        continue;
                    }
                    // Heuristic: categorize by filename
                    const lower = fileName.toLowerCase();
                    if (lower.includes('weap') || lower.includes('weapon') || lower.includes('feature-weap') || lower.includes('image_')) {
                        try {
                            const created = await storage.createWeapon({ name: path.parse(fileName).name, image: imageUrl, category: '', description: '' });
                            createdWeapons.push(created);
                        }
                        catch (err) {
                            console.error('Failed to create weapon for', fileName, err);
                        }
                    }
                    else if (lower.includes('coop') || lower.includes('mode') || lower.includes('feature-coop')) {
                        try {
                            const created = await storage.createMode({ name: path.parse(fileName).name, image: imageUrl, description: '', type: '' });
                            createdModes.push(created);
                        }
                        catch (err) {
                            console.error('Failed to create mode for', fileName, err);
                        }
                    }
                    else if (lower.includes('comp') || lower.includes('rank') || lower.includes('feature-comp')) {
                        try {
                            const created = await storage.createRank({ name: path.parse(fileName).name, image: imageUrl, description: '', requirements: '' });
                            createdRanks.push(created);
                        }
                        catch (err) {
                            console.error('Failed to create rank for', fileName, err);
                        }
                    }
                    else {
                        // default to weapon
                        try {
                            const created = await storage.createWeapon({ name: path.parse(fileName).name, image: imageUrl, category: '', description: '' });
                            createdWeapons.push(created);
                        }
                        catch (err) {
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
                            if (!/\.(jpg|jpeg|png|gif|jfif|webp)$/i.test(fileName))
                                continue;
                            const filePath = path.join(subDir, fileName);
                            const buffer = await fs.promises.readFile(filePath);
                            let imageUrl = '';
                            try {
                                imageUrl = await uploadToCatbox(buffer, fileName, 'image/jpeg', { retries: 3, timeoutMs: 12000 });
                            } catch (e) {
                                console.error('Failed to upload', fileName, e?.message || e);
                                logUpload({ type: 'catbox_seed', filename: fileName, size: buffer.length, error: e?.message || String(e) });
                                continue;
                            }
                            try {
                                if (subfolder === 'modes') {
                                    const created = await storage.createMode({ name: path.parse(fileName).name, image: imageUrl, description: '', type: '' });
                                    createdModes.push(created);
                                }
                                else if (subfolder === 'ranks') {
                                    const created = await storage.createRank({ name: path.parse(fileName).name, image: imageUrl, description: '', requirements: '' });
                                    createdRanks.push(created);
                                }
                                else if (subfolder === 'weapons') {
                                    const created = await storage.createWeapon({ name: path.parse(fileName).name, image: imageUrl, category: '', description: '' });
                                    createdWeapons.push(created);
                                }
                            }
                            catch (err) {
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
                        if (!/\.(jpg|jpeg|png|gif|jfif|webp)$/i.test(fileName))
                            continue;
                        const filePath = path.join(crossfireDir, fileName);
                        const buffer = await fs.promises.readFile(filePath);
                        let imageUrl = '';
                        try {
                            imageUrl = await uploadToCatbox(buffer, fileName, 'image/jpeg', { retries: 3, timeoutMs: 12000 });
                        } catch (e) {
                            console.error('Failed to upload', fileName, e?.message || e);
                            logUpload({ type: 'catbox_seed', filename: fileName, size: buffer.length, error: e?.message || String(e) });
                            continue;
                        }
                        try {
                            const created = await storage.createWeapon({ name: path.parse(fileName).name, image: imageUrl, category: '', description: '' });
                            createdWeapons.push(created);
                        }
                        catch (err) {
                            console.error('Failed to create weapon for', fileName, err);
                        }
                    }
                }
                res.json({ success: true, weapons: createdWeapons.length, modes: createdModes.length, ranks: createdRanks.length });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        // Seller routes
        app.get("/api/sellers", async (req, res) => {
            try {
                const sellers = await storage.getAllSellers();
                res.json(sellers);
            }
            catch (error) {
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
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        app.get("/api/sellers/slug/:slug", async (req, res) => {
            try {
                const slug = String(req.params.slug || "").trim().toLowerCase();
                let seller;
                if (storage && typeof storage.getSellerBySlug === "function") {
                    seller = await storage.getSellerBySlug(slug);
                }
                else {
                    const all = await storage.getAllSellers();
                    seller = all.find((s) => String(s.seller_name_slug || "").toLowerCase() === slug);
                }
                if (!seller) {
                    return res.status(404).json({ error: "Seller not found" });
                }
                res.json(seller);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        app.post("/api/sellers", requireAuth, requireSellerManager, async (req, res) => {
            try {
                const data = insertSellerSchema.parse(req.body);
                const seller = await storage.createSeller(data);
                res.json(seller);
            }
            catch (error) {
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
            }
            catch (error) {
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
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        // Seller Review routes
        app.get("/api/sellers/:id/reviews", async (req, res) => {
            try {
                const reviews = await storage.getSellerReviews(req.params.id);
                res.json(reviews);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        // Limit reviews to 1 per IP per seller per hour to reduce spam
        const reviewLimiter = rateLimit({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 1,
            // Generate a key per IP + seller id. Use a safe accessor and cast to any to avoid TS mismatches.
            // Use req.ip to correctly handle IPv6 and forwarded headers.
            keyGenerator: (req) => {
                const ip = req.ip || 'unknown';
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
                const reviewPayload = { ...rest };
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
            }
            catch (error) {
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
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        // Tutorial routes
        app.get("/api/tutorials", async (req, res) => {
            try {
                const { limit, offset } = req.query;
                const category = String(req.query.category || '').trim();
                const result = await storage.getAllTutorials({
                    limit: limit ? parseInt(limit) : undefined,
                    offset: offset ? parseInt(offset) : undefined
                });

                let items = result.items;
                if (category) {
                    items = items.filter((t) => String(t?.category || 'tutorial') === category);
                }
                items = items.slice().sort((a, b) => {
                    const oa = (typeof a?.order === 'number' ? a.order : 9999);
                    const ob = (typeof b?.order === 'number' ? b.order : 9999);
                    if (oa !== ob) return oa - ob;
                    const da = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const db = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return db - da;
                });

                res.json({
                    items,
                    total: result.total
                });
            }
            catch (error) {
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
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        app.get("/api/tutorials/slug/:slug", async (req, res) => {
            try {
                const tutorial = await storage.getTutorialBySlug(req.params.slug);
                if (!tutorial) {
                    return res.status(404).json({ error: "Tutorial not found" });
                }
                res.json(tutorial);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        app.post("/api/tutorials", requireAuth, requireTutorialManager, async (req, res) => {
            try {
                const data = insertTutorialSchema.parse(req.body);
                const tutorial = await storage.createTutorial(data);
                res.status(201).json(tutorial);
            }
            catch (error) {
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
            }
            catch (error) {
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
            }
            catch (error) {
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
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
const SEO_LOG_FILE = path.join(LOG_DIR, 'seo-changes.jsonl');
    const logSeoChange = (entry) => { try { fs.appendFileSync(SEO_LOG_FILE, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n'); } catch { } };
    const UPLOAD_LOG_FILE = path.join(LOG_DIR, 'upload-events.jsonl');
    const logUpload = (entry) => { try { fs.appendFileSync(UPLOAD_LOG_FILE, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n'); } catch { } };
    const uploadStats = { total: 0, success: 0, failed: 0, durations: [] };
    function recordUpload(ok, durationMs) {
        uploadStats.total++;
        if (ok) uploadStats.success++; else uploadStats.failed++;
        if (typeof durationMs === 'number' && isFinite(durationMs)) uploadStats.durations.push(durationMs);
        if (uploadStats.durations.length > 1000) uploadStats.durations.splice(0, uploadStats.durations.length - 1000);
    }

    function sanitizeFilename(name) {
        const n = String(name || '').trim();
        if (!n) return '';
        return n.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
    }

    function mimeToExt(mime) {
        const map = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'video/mp4': 'mp4',
            'video/webm': 'webm',
            'video/ogg': 'ogv',
            'audio/mpeg': 'mp3',
            'audio/ogg': 'ogg',
            'audio/wav': 'wav',
            'audio/webm': 'weba',
            'application/pdf': 'pdf',
        };
        return map[mime] || '';
    }

    async function uploadToCatbox(buffer, filename, mimetype, opts = {}) {
        const retries = Number(opts.retries || 3);
        const timeoutMs = Number(opts.timeoutMs || 10000);
        const MAX_BYTES = Number(process.env.MAX_CATBOX_BYTES || 20 * 1024 * 1024);
        if (buffer.length > MAX_BYTES) {
            const err = `File too large for Catbox. Max ${Math.round(MAX_BYTES / 1024 / 1024)}MB`;
            logUpload({ type: 'catbox', filename, size: buffer.length, mimetype, error: err });
            throw new Error(err);
        }
        let lastErr = null;
        for (let attempt = 1; attempt <= retries; attempt++) {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), timeoutMs);
            try {
                const formData = new FormData();
                formData.append('reqtype', 'fileupload');
                formData.append('fileToUpload', buffer, { filename, contentType: mimetype || 'application/octet-stream' });
                const started = Date.now();
                const resp = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: formData, signal: ctrl.signal });
                clearTimeout(timer);
                const txt = await resp.text().catch(() => '');
                const duration = Date.now() - started;
                if (!resp.ok) {
                    lastErr = new Error(`Catbox HTTP ${resp.status}`);
                    logUpload({ type: 'catbox', filename, size: buffer.length, mimetype, attempt, duration, error: lastErr.message, response: txt.slice(0, 200) });
                    continue;
                }
                const url = String(txt || '').trim();
                const ok = /^https?:\/\/.+/.test(url);
                logUpload({ type: 'catbox', filename, size: buffer.length, mimetype, attempt, duration, url, ok });
                if (!ok) {
                    lastErr = new Error('Invalid Catbox response');
                    continue;
                }
                return url;
            } catch (e) {
                clearTimeout(timer);
                lastErr = e;
                logUpload({ type: 'catbox', filename, size: buffer.length, mimetype, attempt, error: e?.message || String(e) });
            }
            await new Promise(r => setTimeout(r, Math.min(2000 * attempt, 6000)));
        }
        throw lastErr || new Error('Catbox upload failed');
    }
    function checkMagicBytes(buf, mime) {
        if (!buf || !Buffer.isBuffer(buf)) return false;
        if (mime === 'image/jpeg') return buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
        if (mime === 'image/png') return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
        if (mime === 'image/gif') return buf.slice(0, 3).toString('ascii') === 'GIF';
        if (mime === 'image/webp') return buf.slice(8, 12).toString('ascii') === 'WEBP';
        return true;
    }
    async function isImageDecodable(buf) {
        try {
            const meta = await sharp(buf, { animated: true }).metadata();
            return !!meta && (meta.width || 0) > 0;
        } catch {
            return false;
        }
    }

    async function scanBufferForViruses(buffer) {
        try {
            const enabled = String(process.env.ENABLE_VIRUS_SCAN || '').toLowerCase() === 'true';
            const sha = crypto.createHash('sha256').update(buffer).digest('hex');
            if (!enabled) return { ok: true, sha256: sha, status: 'skipped' };
            // Placeholder: integrate with ClamAV or external scanner when available
            // For now, treat all as clean when enabled but no scanner configured
            return { ok: true, sha256: sha, status: 'clean' };
        } catch (e) {
            return { ok: false, error: e?.message || 'scan_failed' };
        }
    }

    async function saveLocalMedia({ buffer, filename, kind }) {
        const destPath = path.join(IMAGES_DIR, filename);
        ensureDir(path.dirname(destPath));
        await fs.promises.writeFile(destPath, buffer);
        // For images, generate a webp optimized variant if not already webp
        try {
            if (kind === 'photo' && !/\.webp$/i.test(filename)) {
                const base = filename.replace(/\.[A-Za-z0-9]+$/i, '');
                await optimizeToWebP(destPath, base, pickKindFromContext('', ''));
            }
        } catch { }
        const baseUrl = (process.env.PUBLIC_BASE_URL || 'https://crossfire.wiki').replace(/\/$/, '');
        const url = `/images/${filename}`;
        const fullUrl = `${baseUrl}${url}`;
        return { url, fullUrl, filename };
    }

    app.post('/api/admin/images/process', requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const dryRun = String(req.query.dryRun || '').toLowerCase() === 'true';
            const items = [];
            const [postsRes, newsRes, eventsRes] = await Promise.all([
                storage.getAllPosts().catch(() => ({ items: [] })),
                storage.getAllNews().catch(() => ({ items: [] })),
                storage.getAllEvents().catch(() => ({ items: [] })),
            ]);
            const posts = postsRes.items || [];
            const news = newsRes.items || [];
            const events = eventsRes.items || [];
            const processImage = async (srcUrl, ctx) => {
                if (!srcUrl || !isAllowedMediaUrl(srcUrl)) return null;
                const localRel = srcUrl.replace(/^https?:\/\/[^/]+/, '');
                const filePath = localRel.startsWith('/images/') ? path.join(IMAGES_DIR, localRel.replace('/images/', '')) : null;
                if (!filePath || !fs.existsSync(filePath)) return null;
                const ext = path.extname(filePath).toLowerCase();
                const base = path.basename(filePath, ext);
                const backup = path.join(BACKUP_DIR, `${base}_original${ext}`);
                if (!dryRun) {
                    try { fs.copyFileSync(filePath, backup); } catch { }
                }
                const destBase = buildSeoFilename({ title: ctx.title, category: ctx.category, date: ctx.date, feature: ctx.feature });
                const kind = pickKindFromContext(ctx.title, ctx.category);
                const outputs = dryRun ? [] : await optimizeToWebP(filePath, destBase, kind);
                const mainUrl = `/images/${destBase}.webp`;
                logChange({ action: 'optimize', from: srcUrl, to: mainUrl, ctx });
                return { mainUrl, outputs };
            };

            const processMediaFile = async (srcUrl, ctx) => {
                if (!srcUrl || !isAllowedMediaUrl(srcUrl)) return null;
                const localRel = srcUrl.replace(/^https?:\/\/[^/]+/, '');
                const filePath = localRel.startsWith('/images/') ? path.join(IMAGES_DIR, localRel.replace('/images/', '')) : null;
                if (!filePath || !fs.existsSync(filePath)) return null;
                const ext = path.extname(filePath).toLowerCase();
                const destBase = buildSeoFilename({ title: ctx.title, category: ctx.category, date: ctx.date, feature: ctx.feature });
                const newPath = path.join(IMAGES_DIR, `${destBase}${ext}`);
                const base = path.basename(filePath);
                const backup = path.join(BACKUP_DIR, `${base.replace(ext, '')}_original${ext}`);
                if (!dryRun) {
                    try { fs.copyFileSync(filePath, backup); } catch { }
                    try { fs.renameSync(filePath, newPath); } catch { }
                }
                const newUrl = `/images/${destBase}${ext}`;
                logChange({ action: 'rename', from: srcUrl, to: newUrl, ctx });
                return { newUrl };
            };

            const updateHtmlMedia = (html, transformImg, transformSrc) => {
                let s = String(html || '');
                s = s.replace(/<img\b([^>]*?)src="([^"]+)"([^>]*)>/gi, (m, pre, src, post) => {
                    const t = transformImg(src);
                    const addAttrs = ' loading="lazy" decoding="async"';
                    if (!t) return `<img${pre}src="${src}"${post}${addAttrs}>`;
                    return `<img${pre}src="${t}"${post}${addAttrs}>`;
                });
                s = s.replace(/<video\b([^>]*?)src="([^"]+)"([^>]*)>/gi, (m, pre, src, post) => {
                    const t = transformSrc(src);
                    const addAttrs = ' preload="none"';
                    if (!t) return `<video${pre}src="${src}"${post}${addAttrs}>`;
                    return `<video${pre}src="${t}"${post}${addAttrs}>`;
                });
                s = s.replace(/<audio\b([^>]*?)src="([^"]+)"([^>]*)>/gi, (m, pre, src, post) => {
                    const t = transformSrc(src);
                    const addAttrs = ' preload="none"';
                    if (!t) return `<audio${pre}src="${src}"${post}${addAttrs}>`;
                    return `<audio${pre}src="${t}"${post}${addAttrs}>`;
                });
                s = s.replace(/<source\b([^>]*?)src="([^"]+)"([^>]*)>/gi, (m, pre, src, post) => {
                    const t = transformSrc(src);
                    if (!t) return `<source${pre}src="${src}"${post}>`;
                    return `<source${pre}src="${t}"${post}>`;
                });
                return s;
            };

            let processed = 0;

            for (const p of posts) {
                const ctx = { title: p.title, category: p.category, date: p.createdAt, feature: 'article' };
                const updImg = await processImage(p.image, ctx);
                const newImage = updImg?.mainUrl || p.image;
                const newContent = updateHtmlMedia(p.content,
                    (src) => (isAllowedMediaUrl(src) ? (updImg?.mainUrl || src) : src),
                    (src) => {
                        const m = processMediaFile(src, { title: p.title, category: p.category, date: p.createdAt, feature: 'article' });
                        return m ? (m.then(v => v?.newUrl).catch(() => src)) : src;
                    }
                );
                if (!dryRun) await storage.updatePost(p.id, { image: newImage, content: newContent });
                items.push({ type: 'post', id: p.id, from: p.image, to: newImage });
                processed++;
            }

            for (const n of news) {
                const ctx = { title: n.title, category: n.category, date: n.createdAt, feature: 'news' };
                const updImg = await processImage(n.image, ctx);
                const newImage = updImg?.mainUrl || n.image;
                const rawHtml = (n.htmlContent && n.htmlContent.trim().length > 0 ? n.htmlContent : n.content) || '';
                const newHtml = updateHtmlMedia(rawHtml,
                    (src) => (isAllowedMediaUrl(src) ? (updImg?.mainUrl || src) : src),
                    (src) => {
                        const m = processMediaFile(src, { title: n.title, category: n.category, date: n.createdAt, feature: 'news' });
                        return m ? (m.then(v => v?.newUrl).catch(() => src)) : src;
                    }
                );
                if (!dryRun) await storage.updateNews(n.id, { image: newImage, htmlContent: newHtml });
                items.push({ type: 'news', id: n.id, from: n.image, to: newImage });
                processed++;
            }

            for (const e of events) {
                const ctx = { title: e.title, category: e.type || 'events', date: e.date, feature: 'event' };
                const updImg = await processImage(e.image, ctx);
                const newImage = updImg?.mainUrl || e.image;
                if (!dryRun) await storage.updateEvent(e.id, { image: newImage });
                items.push({ type: 'event', id: e.id, from: e.image, to: newImage });
                processed++;
            }

            res.json({ success: true, processed, items, dryRun });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Image sitemap
    app.get('/images-sitemap.xml', async (_req, res) => {
        try {
            const base = (process.env.PUBLIC_BASE_URL || 'https://crossfire.wiki').replace(/\/$/, '');
            const [posts, news, events] = await Promise.all([
                storage.getAllPosts().catch(() => []),
                storage.getAllNews().catch(() => []),
                storage.getAllEvents().catch(() => []),
            ]);
            const urls = [];
            const pushImage = (pageUrl, imageUrl, title, caption) => {
                urls.push({ pageUrl, imageUrl, title, caption });
            };
            for (const p of posts) {
                const pageUrl = `${base}/article/${p.post_slug || p.id}`;
                if (p.image) pushImage(pageUrl, `${base}${p.image.startsWith('/') ? '' : '/'}${p.image}`, p.title, p.summary || p.title);
            }
            for (const n of news) {
                const pageUrl = `${base}/news/${n.id}`;
                if (n.image) pushImage(pageUrl, `${base}${n.image.startsWith('/') ? '' : '/'}${n.image}`, n.title, n.category || n.title);
            }
            for (const e of events) {
                const pageUrl = `${base}/events/${e.event_name_slug || e.id}`;
                if (e.image) pushImage(pageUrl, `${base}${e.image.startsWith('/') ? '' : '/'}${e.image}`, e.title, e.type || 'event');
            }
            const body = ['<?xml version="1.0" encoding="UTF-8"?>',
                '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
                ...urls.map(u => [
                    '  <url>',
                    `    <loc>${u.pageUrl}</loc>`,
                    '    <image:image>',
                    `      <image:loc>${u.imageUrl}</image:loc>`,
                    `      <image:title>${String(u.title || '').replace(/&/g, '&amp;')}</image:title>`,
                    `      <image:caption>${String(u.caption || '').replace(/&/g, '&amp;')}</image:caption>`,
                    '    </image:image>',
                    '  </url>'
                ].join('\n')),
                '</urlset>'].join('\n');
            res.type('application/xml').send(body);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    const AnalyticsTutorialSchema = new mongoose.Schema({
        tutorialId: { type: String, index: true },
        visitorHash: { type: String, index: true },
        event: { type: String },
        durationMs: { type: Number, default: 0 },
        country: { type: String, default: 'unknown' },
        device: { type: String, default: 'unknown' },
        browser: { type: String, default: 'unknown' },
        createdAt: { type: Date, default: Date.now, index: true },
    }, { collection: 'analytics_tutorials' });
    const AnalyticsSellerSchema = new mongoose.Schema({
        sellerSlug: { type: String, index: true },
        visitorHash: { type: String, index: true },
        event: { type: String },
        timeSpentMs: { type: Number, default: 0 },
        country: { type: String, default: 'unknown' },
        device: { type: String, default: 'unknown' },
        browser: { type: String, default: 'unknown' },
        createdAt: { type: Date, default: Date.now, index: true },
    }, { collection: 'analytics_sellers' });
    const AnalyticsAnnouncementSchema = new mongoose.Schema({
        announcementId: { type: String, index: true },
        visitorHash: { type: String, index: true },
        event: { type: String },
        country: { type: String, default: 'unknown' },
        device: { type: String, default: 'unknown' },
        browser: { type: String, default: 'unknown' },
        createdAt: { type: Date, default: Date.now, index: true },
    }, { collection: 'analytics_announcements' });
    const AnalyticsTutorialModel = mongoose.models.AnalyticsTutorialModel || mongoose.model('AnalyticsTutorialModel', AnalyticsTutorialSchema);
    const AnalyticsSellerModel = mongoose.models.AnalyticsSellerModel || mongoose.model('AnalyticsSellerModel', AnalyticsSellerSchema);
    const AnalyticsAnnouncementModel = mongoose.models.AnalyticsAnnouncementModel || mongoose.model('AnalyticsAnnouncementModel', AnalyticsAnnouncementSchema);

    function hashVisitor(req) {
        const ip = String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
        const ua = String(req.headers['user-agent'] || '');
        const sid = String(req.headers['x-analytics-session'] || req.headers['X-Analytics-Session'] || '');
        return crypto.createHash('sha256').update(`${ip}|${ua}|${sid}`).digest('hex');
    }
    function parseDevice(req) {
        const ua = String(req.headers['user-agent'] || '').toLowerCase();
        const mobile = /mobile|android|iphone|ipad/.test(ua) ? 'mobile' : 'desktop';
        const browser = /chrome\//.test(ua) ? 'chrome' : /firefox\//.test(ua) ? 'firefox' : /safari\//.test(ua) ? 'safari' : /edg\//.test(ua) ? 'edge' : 'unknown';
        const country = String(req.headers['x-geo-country'] || req.headers['X-Geo-Country'] || '').toUpperCase() || 'unknown';
        return { device: mobile, browser, country };
    }

    app.post('/api/analytics/tutorials/:id/event', apiLimiter, async (req, res) => {
        try {
            const visitorHash = hashVisitor(req);
            const { device, browser, country } = parseDevice(req);
            const event = String(req.body?.event || 'view');
            const durationMs = Number(req.body?.durationMs || 0) || 0;
            const doc = await AnalyticsTutorialModel.create({ tutorialId: req.params.id, visitorHash, event, durationMs, country, device, browser });
            res.json({ ok: true, id: String(doc._id) });
        } catch (error) {
            res.status(500).json({ ok: false, error: error?.message || 'failed' });
        }
    });
    app.post('/api/analytics/sellers/:slug/event', apiLimiter, async (req, res) => {
        try {
            const visitorHash = hashVisitor(req);
            const { device, browser, country } = parseDevice(req);
            const event = String(req.body?.event || 'view');
            const timeSpentMs = Number(req.body?.timeSpentMs || 0) || 0;
            const doc = await AnalyticsSellerModel.create({ sellerSlug: req.params.slug, visitorHash, event, timeSpentMs, country, device, browser });
            res.json({ ok: true, id: String(doc._id) });
        } catch (error) {
            res.status(500).json({ ok: false, error: error?.message || 'failed' });
        }
    });
    app.post('/api/analytics/announcements/:id/event', apiLimiter, async (req, res) => {
        try {
            const visitorHash = hashVisitor(req);
            const { device, browser, country } = parseDevice(req);
            const event = String(req.body?.event || 'learn_more_click');
            const doc = await AnalyticsAnnouncementModel.create({ announcementId: req.params.id, visitorHash, event, country, device, browser });
            res.json({ ok: true, id: String(doc._id) });
        } catch (error) {
            res.status(500).json({ ok: false, error: error?.message || 'failed' });
        }
    });

    function parseRange(req) {
        const now = new Date();
        const to = new Date(String(req.query.to || now));
        const fromQ = String(req.query.from || '');
        const period = String(req.query.period || '').toLowerCase();
        let from = fromQ ? new Date(fromQ) : new Date(to.getTime() - 30 * 24 * 3600 * 1000);
        if (period === 'daily') from = new Date(to.getTime() - 1 * 24 * 3600 * 1000);
        if (period === 'weekly') from = new Date(to.getTime() - 7 * 24 * 3600 * 1000);
        if (period === 'monthly') from = new Date(to.getTime() - 30 * 24 * 3600 * 1000);
        return { from, to };
    }
    function toCsv(rows) {
        if (!rows || rows.length === 0) return 'key,value\n';
        const keys = Object.keys(rows[0]);
        const head = keys.join(',');
        const body = rows.map(r => keys.map(k => String(r[k] ?? '')).join(',')).join('\n');
        return `${head}\n${body}`;
    }

    app.get('/api/admin/analytics/tutorials', requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const { from, to } = parseRange(req);
            const id = String(req.query.id || '');
            const match = { createdAt: { $gte: from, $lte: to } };
            if (id) Object.assign(match, { tutorialId: id });
            const group = await AnalyticsTutorialModel.aggregate([
                { $match: match },
                { $group: { _id: '$tutorialId', total: { $sum: 1 }, unique: { $addToSet: '$visitorHash' }, avgDuration: { $avg: '$durationMs' } } },
                { $project: { tutorialId: '$_id', total: 1, uniqueCount: { $size: '$unique' }, avgDuration: 1, _id: 0 } }
            ]);
            const geo = await AnalyticsTutorialModel.aggregate([
                { $match: match },
                { $group: { _id: '$country', count: { $sum: 1 } } },
                { $project: { country: '$_id', count: 1, _id: 0 } },
                { $sort: { count: -1 } }
            ]);
            const devices = await AnalyticsTutorialModel.aggregate([
                { $match: match },
                { $group: { _id: { device: '$device', browser: '$browser' }, count: { $sum: 1 } } },
                { $project: { device: '$_id.device', browser: '$_id.browser', count: 1, _id: 0 } }
            ]);
            const result = { ok: true, group, geo, devices };
            if (String(req.query.format || '').toLowerCase() === 'csv') {
                res.type('text/csv').send(toCsv(group));
            } else {
                res.json(result);
            }
        } catch (error) {
            res.status(500).json({ ok: false, error: error?.message || 'failed' });
        }
    });
    app.get('/api/admin/analytics/sellers', requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const { from, to } = parseRange(req);
            const slug = String(req.query.slug || '');
            const match = { createdAt: { $gte: from, $lte: to } };
            if (slug) Object.assign(match, { sellerSlug: slug });
            const group = await AnalyticsSellerModel.aggregate([
                { $match: match },
                { $group: { _id: '$sellerSlug', views: { $sum: { $cond: [{ $eq: ['$event', 'view'] }, 1, 0] } }, clicks: { $sum: { $cond: [{ $eq: ['$event', 'click'] }, 1, 0] } }, avgTimeSpent: { $avg: '$timeSpentMs' }, unique: { $addToSet: '$visitorHash' } } },
                { $project: { sellerSlug: '$_id', views: 1, clicks: 1, ctr: { $cond: [{ $gt: ['$views', 0] }, { $divide: ['$clicks', '$views'] }, 0] }, avgTimeSpent: 1, uniqueCount: { $size: '$unique' }, _id: 0 } }
            ]);
            const result = { ok: true, group };
            if (String(req.query.format || '').toLowerCase() === 'csv') {
                res.type('text/csv').send(toCsv(group));
            } else {
                res.json(result);
            }
        } catch (error) {
            res.status(500).json({ ok: false, error: error?.message || 'failed' });
        }
    });
    app.get('/api/admin/analytics/announcements', requireAuth, requireSuperAdmin, async (req, res) => {
        try {
            const { from, to } = parseRange(req);
            const id = String(req.query.id || '');
            const match = { createdAt: { $gte: from, $lte: to } };
            if (id) Object.assign(match, { announcementId: id });
            const group = await AnalyticsAnnouncementModel.aggregate([
                { $match: match },
                { $group: { _id: '$announcementId', clicks: { $sum: { $cond: [{ $eq: ['$event', 'learn_more_click'] }, 1, 0] } }, conversions: { $sum: { $cond: [{ $eq: ['$event', 'conversion'] }, 1, 0] } }, unique: { $addToSet: '$visitorHash' } } },
                { $project: { announcementId: '$_id', clicks: 1, conversions: 1, conversionRate: { $cond: [{ $gt: ['$clicks', 0] }, { $divide: ['$conversions', '$clicks'] }, 0] }, uniqueCount: { $size: '$unique' }, _id: 0 } }
            ]);
            const result = { ok: true, group };
            if (String(req.query.format || '').toLowerCase() === 'csv') {
                res.type('text/csv').send(toCsv(group));
            } else {
                res.json(result);
            }
        } catch (error) {
            res.status(500).json({ ok: false, error: error?.message || 'failed' });
        }
    });

    app.get('/debug/upload', async (_req, res) => {
        const html = [
            '<!DOCTYPE html>',
            '<meta charset="utf-8"/>',
            '<title>Upload Debug</title>',
            '<style>body{font-family:system-ui,Arial;padding:20px}input,button{margin:8px 0}</style>',
            '<h1>Cloudinary Upload Debug</h1>',
            '<input type="file" id="file" accept="image/*,video/*,audio/*"/>',
            '<input type="text" id="publicId" placeholder="public_id (optional)"/>',
            '<button id="btn">Upload</button>',
            '<pre id="out"></pre>',
            '<script>',
            'const out=document.getElementById("out");',
            'async function getToken(){ const r=await fetch("/api/security/csrf-token"); const j=await r.json(); return j.csrfToken; }',
            'document.getElementById("btn").onclick=async()=>{ try { const file=document.getElementById("file").files[0]; if(!file){ out.textContent="Select a file"; return; } const token=await getToken(); const fd=new FormData(); fd.append("file", file, file.name); const pid=document.getElementById("publicId").value.trim(); if(pid) fd.append("public_id", pid); const r=await fetch("/images/upload", { method:"POST", body:fd, headers:{"X-CSRF-Token": token} }); const t=await r.text(); out.textContent = `Status: ${r.status}\n` + t; } catch(e){ out.textContent=String(e && e.message || e); } }',
            '</script>'
        ].join('\n');
        res.type('html').send(html);
    });

    const httpServer = createServer(app);
    // Automated Update Mechanism (Demonstration)
    // Run scraping every 24 hours
    setInterval(async () => {
        try {
            console.log("Running scheduled scraping update...");
            // Since we don't have a request object, we call the functions directly
            const modes = await scrapeModes();
            for (const m of modes) {
                if (!m.name) continue;
                const isGood = await isValidImage(m.image);
                const existingList = await storage.getAllModes();
                const exists = existingList.find((x) => x.name === m.name);
                if (exists) {
                    const updateData = {};
                    if (isGood && m.image !== exists.image) {
                        updateData.image = m.image;
                        updateData.imageHistory = [...(exists.imageHistory || []), { url: m.image }];
                        await storage.updateMode(exists.id, updateData);
                    }
                }
            }
            console.log("Scheduled update complete.");
        } catch (e) {
            console.error("Scheduled update failed:", e.message);
        }
    }, 1000 * 60 * 60 * 24); // 24 hours

    return httpServer;
}
