import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "SuperAdmin#2024$SecurePass!9x";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  return password === ADMIN_PASSWORD;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
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

  (req as any).user = payload;
  next();
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user || !user.roles || !user.roles.includes('super_admin')) {
    return res.status(403).json({ error: "Forbidden: Super Admin access required" });
  }

  next();
}

export function requireAdminOrTicketManager(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user || !user.roles || !['super_admin', 'admin', 'ticket_manager'].some(role => user.roles.includes(role))) {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }

  next();
}

export function requireEventManager(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user || !user.roles || !user.roles.includes('event_manager')) {
    return res.status(403).json({ error: "Forbidden: Event Manager access required" });
  }

  next();
}

export function requireEventScraper(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user || !user.roles || !user.roles.includes('event_scraper')) {
    return res.status(403).json({ error: "Forbidden: Event Scraper access required" });
  }

  next();
}

export function requireNewsManager(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user || !user.roles || !user.roles.includes('news_manager')) {
    return res.status(403).json({ error: "Forbidden: News Manager access required" });
  }

  next();
}

export function requireNewsScraper(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user || !user.roles || !user.roles.includes('news_scraper')) {
    return res.status(403).json({ error: "Forbidden: News Scraper access required" });
  }

  next();
}

export function requireSellerManager(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user || !user.roles || !user.roles.includes('seller_manager')) {
    return res.status(403).json({ error: "Forbidden: Seller Manager access required" });
  }

  next();
}

export function requireTutorialManager(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user || !user.roles || !user.roles.includes('tutorial_manager')) {
    return res.status(403).json({ error: "Forbidden: Tutorial Manager access required" });
  }

  next();
}

export function requireWeaponManager(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user || !user.roles || !(['weapon_manager', 'super_admin'].some((r) => user.roles.includes(r)))) {
    return res.status(403).json({ error: "Forbidden: Weapon Manager access required" });
  }

  next();
}

export function requirePostManager(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user || !user.roles || !(['post_manager', 'super_admin'].some((r) => user.roles.includes(r)))) {
    return res.status(403).json({ error: "Forbidden: Post Manager access required" });
  }

  next();
}
