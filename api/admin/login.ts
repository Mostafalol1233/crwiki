import type { VercelRequest, VercelResponse } from "@vercel/node";

import { makeAdminToken } from "../../server/adminAuth.js";

const ALLOWED_ORIGINS = [
  "https://crossfire.wiki",
  "https://www.crossfire.wiki",
  "http://localhost:5000",
  "http://localhost:3000",
  ...(process.env.CORS_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean),
];

function resolveOrigin(req: VercelRequest): string {
  const origin = Array.isArray(req.headers.origin) ? req.headers.origin[0] : req.headers.origin;
  if (typeof origin === "string" && ALLOWED_ORIGINS.includes(origin)) return origin;
  return "https://crossfire.wiki";
}

function addCorsHeaders(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", resolveOrigin(req));
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

const failedAttempts = new Map<string, { count: number; firstAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function clientKey(req: VercelRequest) {
  const forwarded = req.headers["x-forwarded-for"];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return String(value || req.socket?.remoteAddress || "unknown").split(",")[0].trim().slice(0, 100);
}

function isRateLimited(key: string) {
  const current = failedAttempts.get(key);
  if (!current || Date.now() - current.firstAt >= WINDOW_MS) {
    failedAttempts.delete(key);
    return false;
  }
  return current.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string) {
  const now = Date.now();
  const current = failedAttempts.get(key);
  if (!current || now - current.firstAt >= WINDOW_MS) failedAttempts.set(key, { count: 1, firstAt: now });
  else current.count += 1;
}

function clearFailures(key: string) {
  failedAttempts.delete(key);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return addCorsHeaders(req, res).status(204).end();
  if (req.method !== "POST") return addCorsHeaders(req, res).status(405).json({ error: "POST only" });
  const rateKey = clientKey(req);
  if (isRateLimited(rateKey)) return addCorsHeaders(req, res).status(429).json({ error: "Too many login attempts. Try again later." });

  try {
    const { username, password } = req.body || {};
    if (!password) return addCorsHeaders(req, res).status(400).json({ error: "Password required" });

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
    const SUPABASE_URL   = process.env.SUPABASE_URL   || process.env.VITE_SUPABASE_URL   || "";
    const SERVICE_KEY    = process.env.SUPABASE_SERVICE_KEY || "";

    // ── Super-admin: password-only ────────────────────────────────────────────
    if (!username) {
      if (ADMIN_PASSWORD && password === ADMIN_PASSWORD) {
        const token = makeAdminToken({ role: "super_admin", username: "super_admin", permissions: {} });
        clearFailures(rateKey);
        return addCorsHeaders(req, res).status(200).json({
          token,
          admin: { roles: ["super_admin"], role: "super_admin", username: "super_admin", permissions: {} },
        });
      }
      // Check admin_users table for super_admin rows (bcrypt)
      if (SUPABASE_URL && SERVICE_KEY) {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/admin_users?role=eq.super_admin&limit=10`, {
          headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
          signal: AbortSignal.timeout(8000),
        });
        if (r.ok) {
          const rows: any[] = await r.json();
          const bcrypt = await import("bcryptjs");
          for (const row of rows) {
            if (await bcrypt.compare(password, row.password_hash || "")) {
              const token = makeAdminToken({ id: row.id, role: row.role, username: row.username, permissions: row.permissions || {} });
              clearFailures(rateKey);
              return addCorsHeaders(req, res).status(200).json({
                token,
                admin: { roles: [row.role], role: row.role, username: row.username, permissions: row.permissions || {} },
              });
            }
          }
        }
      }
      recordFailure(rateKey);
      return addCorsHeaders(req, res).status(401).json({ error: "Invalid password" });
    }

    // ── Regular admin: username + bcrypt password ─────────────────────────────
    if (!SUPABASE_URL || !SERVICE_KEY)
      return addCorsHeaders(req, res).status(500).json({ error: "Server misconfigured" });

    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/admin_users?username=eq.${encodeURIComponent(username)}&limit=1`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }, signal: AbortSignal.timeout(8000) }
    );
    if (!r.ok) return addCorsHeaders(req, res).status(401).json({ error: "Invalid credentials" });
    const rows: any[] = await r.json();
    if (!rows.length) return addCorsHeaders(req, res).status(401).json({ error: "Invalid credentials" });

    const row = rows[0];
    const bcrypt = await import("bcryptjs");
    if (!await bcrypt.compare(password, row.password_hash || "")) {
      recordFailure(rateKey);
      return addCorsHeaders(req, res).status(401).json({ error: "Invalid credentials" });
    }

    clearFailures(rateKey);
    const token = makeAdminToken({ id: row.id, role: row.role, username: row.username, permissions: row.permissions || {} });
    return addCorsHeaders(req, res).status(200).json({
      token,
      admin: { roles: [row.role], role: row.role, username: row.username, permissions: row.permissions || {} },
    });
  } catch (err: any) {
    return addCorsHeaders(req, res).status(500).json({ error: err.message || "Login failed" });
  }
}
