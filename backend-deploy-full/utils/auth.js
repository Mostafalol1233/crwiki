import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "SuperAdmin#2024$SecurePass!9x";
export async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}
export async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}
export function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
}
export async function verifyAdminPassword(password) {
    return password === ADMIN_PASSWORD;
}
export function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    console.log('[AUTH] Authorization header:', authHeader ? 'present' : 'missing');
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log('[AUTH] No Bearer token found');
        return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.substring(7);
    console.log('[AUTH] Token extracted, length:', token.length);
    const payload = verifyToken(token);
    console.log('[AUTH] Token verification result:', payload ? 'valid' : 'invalid');
    if (!payload) {
        return res.status(401).json({ error: "Invalid token" });
    }
    req.user = payload;
    next();
}
export function requireSettingsManager(req, res, next) {
    const user = req.user;
    if (!user)
        return res.status(403).json({ error: "Forbidden: Settings Manager access required" });
    const hasRole = user.roles && Array.isArray(user.roles) && user.roles.includes('settings_manager');
    const hasPerm = hasPermission(user, ['settings:manage']);
    if (!hasRole && !hasPerm) {
        return res.status(403).json({ error: "Forbidden: Settings Manager access required" });
    }
    next();
}
export function requireSuperAdmin(req, res, next) {
    const user = req.user;
    if (!user || !user.roles || !user.roles.includes('super_admin')) {
        return res.status(403).json({ error: "Forbidden: Super Admin access required" });
    }
    next();
}
function hasPermission(user, perm) {
    if (!user)
        return false;
    if (user.roles && Array.isArray(user.roles) && user.roles.includes('super_admin'))
        return true;
    const perms = user.permissions || {};
    if (Array.isArray(perm)) {
        return perm.some(p => Boolean(perms[p]));
    }
    return Boolean(perms[perm]);
}
export function requireAdminOrTicketManager(req, res, next) {
    const user = req.user;
    if (!user)
        return res.status(403).json({ error: "Forbidden: Admin access required" });
    const allowedRoles = ['super_admin', 'admin', 'ticket_manager'];
    const hasRole = user.roles && Array.isArray(user.roles) && allowedRoles.some(role => user.roles.includes(role));
    const hasPerm = hasPermission(user, 'tickets:manage');
    if (!hasRole && !hasPerm) {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
    }
    next();
}
export function requireEventManager(req, res, next) {
    const user = req.user;
    if (!user)
        return res.status(403).json({ error: "Forbidden: Event Manager access required" });
    const hasRole = user.roles && Array.isArray(user.roles) && user.roles.includes('event_manager');
    const hasPerm = hasPermission(user, ['events:add']);
    if (!hasRole && !hasPerm) {
        return res.status(403).json({ error: "Forbidden: Event Manager access required" });
    }
    next();
}
export function requireEventScraper(req, res, next) {
    const user = req.user;
    if (!user)
        return res.status(403).json({ error: "Forbidden: Event Scraper access required" });
    const hasRole = user.roles && Array.isArray(user.roles) && user.roles.includes('event_scraper');
    const hasPerm = hasPermission(user, ['events:scrape']);
    if (!hasRole && !hasPerm) {
        return res.status(403).json({ error: "Forbidden: Event Scraper access required" });
    }
    next();
}
export function requireNewsManager(req, res, next) {
    const user = req.user;
    if (!user)
        return res.status(403).json({ error: "Forbidden: News Manager access required" });
    const hasRole = user.roles && Array.isArray(user.roles) && user.roles.includes('news_manager');
    const hasPerm = hasPermission(user, ['news:add']);
    if (!hasRole && !hasPerm) {
        return res.status(403).json({ error: "Forbidden: News Manager access required" });
    }
    next();
}
export function requireNewsScraper(req, res, next) {
    const user = req.user;
    if (!user)
        return res.status(403).json({ error: "Forbidden: News Scraper access required" });
    const hasRole = user.roles && Array.isArray(user.roles) && user.roles.includes('news_scraper');
    const hasPerm = hasPermission(user, ['news:scrape']);
    if (!hasRole && !hasPerm) {
        return res.status(403).json({ error: "Forbidden: News Scraper access required" });
    }
    next();
}
export function requireSellerManager(req, res, next) {
    const user = req.user;
    if (!user)
        return res.status(403).json({ error: "Forbidden: Seller Manager access required" });
    const hasRole = user.roles && Array.isArray(user.roles) && user.roles.includes('seller_manager');
    const hasPerm = hasPermission(user, ['sellers:manage']);
    if (!hasRole && !hasPerm) {
        return res.status(403).json({ error: "Forbidden: Seller Manager access required" });
    }
    next();
}
export function requireTutorialManager(req, res, next) {
    const user = req.user;
    if (!user)
        return res.status(403).json({ error: "Forbidden: Tutorial Manager access required" });
    const hasRole = user.roles && Array.isArray(user.roles) && user.roles.includes('tutorial_manager');
    const hasPerm = hasPermission(user, ['tutorials:manage']);
    if (!hasRole && !hasPerm) {
        return res.status(403).json({ error: "Forbidden: Tutorial Manager access required" });
    }
    next();
}
export function requireWeaponManager(req, res, next) {
    const user = req.user;
    if (!user)
        return res.status(403).json({ error: "Forbidden: Weapon Manager access required" });
    const hasRole = user.roles && Array.isArray(user.roles) && (['weapon_manager', 'super_admin'].some((r) => user.roles.includes(r)));
    const hasPerm = hasPermission(user, ['weapons:manage']);
    if (!hasRole && !hasPerm) {
        return res.status(403).json({ error: "Forbidden: Weapon Manager access required" });
    }
    next();
}
export function requirePostManager(req, res, next) {
    const user = req.user;
    if (!user)
        return res.status(403).json({ error: "Forbidden: Post Manager access required" });
    const hasRole = user.roles && Array.isArray(user.roles) && (['post_manager', 'super_admin'].some((r) => user.roles.includes(r)));
    const hasPerm = hasPermission(user, ['posts:manage']);
    if (!hasRole && !hasPerm) {
        return res.status(403).json({ error: "Forbidden: Post Manager access required" });
    }
    next();
}
// Scraper API Key middleware - allows API key or JWT token
export function requireScraperAuth(req, res, next) {
    const apiKey = req.headers['x-scraper-api-key'] || req.headers['x-api-key'];
    const expectedKey = process.env.SCRAPER_API_KEY;
    // Check if API key provided and matches
    if (apiKey && expectedKey && apiKey === expectedKey) {
        // Set user as super_admin if API key is valid
        req.user = { id: 'scraper-api', roles: ['super_admin'] };
        return next();
    }
    // Fall back to JWT token auth
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: Provide API key via X-Scraper-API-Key header or Bearer token" });
    }
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
    req.user = payload;
    next();
}
