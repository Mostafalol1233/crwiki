import type { VercelRequest, VercelResponse } from "@vercel/node";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return res.status(204).setHeaders(CORS).end();
  if (req.method !== "POST") return res.status(405).setHeaders(CORS).json({ error: "Method not allowed" });

  try {
    const { email, password, username, phone, avatar } = req.body || {};
    if (!email || !password || !username)
      return res.status(400).setHeaders(CORS).json({ error: "Email, password and username are required" });

    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY)
      return res.status(500).setHeaders(CORS).json({ error: "Server misconfigured" });

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
        user_metadata: { username, phone: phone || "", avatar: avatar || "" },
      }),
    });

    const createData = await createRes.json() as any;
    if (!createRes.ok) {
      const msg = createData?.msg || createData?.message || createData?.error_description || "Registration failed";
      return res.status(createRes.status === 422 ? 409 : 400).setHeaders(CORS).json({ error: msg });
    }

    return res.status(200).setHeaders(CORS).json({ success: true, user: { id: createData.id, email: createData.email } });
  } catch (err: any) {
    return res.status(500).setHeaders(CORS).json({ error: err.message || "Registration failed" });
  }
}
