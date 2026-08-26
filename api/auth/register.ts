import type { VercelRequest, VercelResponse } from "@vercel/node";

const CORS = new Map([
  ["Access-Control-Allow-Origin", "*"],
  ["Access-Control-Allow-Methods", "POST, OPTIONS"],
  ["Access-Control-Allow-Headers", "Content-Type, Authorization"],
]);

const registrationAttempts = new Map<string, { count: number; startedAt: number }>();
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT = 5;

function addCorsHeaders(res: VercelResponse) {
  for (const [key, value] of CORS) {
    res.setHeader(key, value);
  }
  return res;
}

function rateKey(req: VercelRequest) {
  const forwarded = req.headers["x-forwarded-for"];
  return String(Array.isArray(forwarded) ? forwarded[0] : forwarded || req.socket?.remoteAddress || "unknown").split(",")[0].trim().slice(0, 100);
}

function isRateLimited(key: string) {
  const now = Date.now();
  const current = registrationAttempts.get(key);
  if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
    registrationAttempts.set(key, { count: 1, startedAt: now });
    return false;
  }
  if (current.count >= RATE_LIMIT) return true;
  current.count += 1;
  return false;
}

function validEmail(value: unknown) {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  const at = email.indexOf("@");
  const dot = email.lastIndexOf(".");
  return email.length <= 320 && !email.includes(" ") && at > 0 && dot > at + 1 && dot < email.length - 1 ? email : "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return addCorsHeaders(res).status(204).end();
  if (req.method !== "POST") return addCorsHeaders(res).status(405).json({ error: "Method not allowed" });

  const key = rateKey(req);
  if (isRateLimited(key)) {
    res.setHeader("Retry-After", "3600");
    return addCorsHeaders(res).status(429).json({ error: "Too many registration attempts. Try again later." });
  }

  try {
    const { email: rawEmail, password, username: rawUsername, avatar } = req.body || {};
    const email = validEmail(rawEmail);
    const username = typeof rawUsername === "string" ? rawUsername.trim().split(" ").filter(Boolean).join(" ") : "";
    if (!email || typeof password !== "string" || password.length < 8 || password.length > 128 || username.length < 3 || username.length > 40)
      return addCorsHeaders(res).status(400).json({ error: "Enter a valid email, username, and password of 8 to 128 characters" });

    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY)
      return addCorsHeaders(res).status(500).json({ error: "Server misconfigured" });

    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SERVICE_KEY,
        "Authorization": `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { username, avatar: typeof avatar === "string" ? avatar.slice(0, 500) : "" },
      }),
    });

    const createData = await createRes.json() as any;
    if (!createRes.ok) {
      return addCorsHeaders(res).status(createRes.status === 422 ? 409 : 400).json({ error: "Registration could not be completed" });
    }

    return addCorsHeaders(res).status(200).json({ success: true, user: { id: createData.id, email: createData.email } });
  } catch (err: any) {
    return addCorsHeaders(res).status(500).json({ error: err.message || "Registration failed" });
  }
}
