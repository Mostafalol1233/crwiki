import type { VercelRequest, VercelResponse } from "@vercel/node";

const CORS = new Map([
  ["Access-Control-Allow-Origin", "*"],
  ["Access-Control-Allow-Methods", "POST, OPTIONS"],
  ["Access-Control-Allow-Headers", "Content-Type, Authorization"],
]);

function makeToken(payload: object): string {
  return Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 86_400_000 * 7 })).toString("base64");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return res.status(204).setHeaders(CORS).end();
  if (req.method !== "POST") return res.status(405).setHeaders(CORS).json({ error: "POST only" });

  try {
    const { username, password } = req.body || {};
    if (!password) return res.status(400).setHeaders(CORS).json({ error: "Password required" });

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || "";
    const SUPABASE_URL   = process.env.SUPABASE_URL   || process.env.VITE_SUPABASE_URL   || "";
    const SERVICE_KEY    = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || "";

    // ── Super-admin: password-only ────────────────────────────────────────────
    if (!username) {
      if (ADMIN_PASSWORD && password === ADMIN_PASSWORD) {
        const token = makeToken({ role: "super_admin", username: "super_admin", permissions: {} });
        return res.status(200).setHeaders(CORS).json({
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
              const token = makeToken({ id: row.id, role: row.role, username: row.username, permissions: row.permissions || {} });
              return res.status(200).setHeaders(CORS).json({
                token,
                admin: { roles: [row.role], role: row.role, username: row.username, permissions: row.permissions || {} },
              });
            }
          }
        }
      }
      return res.status(401).setHeaders(CORS).json({ error: "Invalid password" });
    }

    // ── Regular admin: username + bcrypt password ─────────────────────────────
    if (!SUPABASE_URL || !SERVICE_KEY)
      return res.status(500).setHeaders(CORS).json({ error: "Server misconfigured" });

    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/admin_users?username=eq.${encodeURIComponent(username)}&limit=1`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }, signal: AbortSignal.timeout(8000) }
    );
    if (!r.ok) return res.status(401).setHeaders(CORS).json({ error: "Invalid credentials" });
    const rows: any[] = await r.json();
    if (!rows.length) return res.status(401).setHeaders(CORS).json({ error: "Invalid credentials" });

    const row = rows[0];
    const bcrypt = await import("bcryptjs");
    if (!await bcrypt.compare(password, row.password_hash || ""))
      return res.status(401).setHeaders(CORS).json({ error: "Invalid credentials" });

    const token = makeToken({ id: row.id, role: row.role, username: row.username, permissions: row.permissions || {} });
    return res.status(200).setHeaders(CORS).json({
      token,
      admin: { roles: [row.role], role: row.role, username: row.username, permissions: row.permissions || {} },
    });
  } catch (err: any) {
    return res.status(500).setHeaders(CORS).json({ error: err.message || "Login failed" });
  }
}
