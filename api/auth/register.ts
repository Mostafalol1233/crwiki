import type { VercelRequest, VercelResponse } from "@vercel/node";

const CORS = new Map([
  ["Access-Control-Allow-Origin", "*"],
  ["Access-Control-Allow-Methods", "POST, OPTIONS"],
  ["Access-Control-Allow-Headers", "Content-Type, Authorization"],
]);

function addCorsHeaders(res: VercelResponse) {
  for (const [key, value] of CORS) {
    res.setHeader(key, value);
  }
  return res;
}


export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return addCorsHeaders(res).status(204).end();
  if (req.method !== "POST") return addCorsHeaders(res).status(405).json({ error: "Method not allowed" });

  try {
    const { email, password, username, phone, avatar } = req.body || {};
    if (!email || !password || !username)
      return addCorsHeaders(res).status(400).json({ error: "Email, password and username are required" });

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
        user_metadata: { username, phone: phone || "", avatar: avatar || "" },
      }),
    });

    const createData = await createRes.json() as any;
    if (!createRes.ok) {
      const msg = createData?.msg || createData?.message || createData?.error_description || "Registration failed";
      return addCorsHeaders(res).status(createRes.status === 422 ? 409 : 400).json({ error: msg });
    }

    return addCorsHeaders(res).status(200).json({ success: true, user: { id: createData.id, email: createData.email } });
  } catch (err: any) {
    return addCorsHeaders(res).status(500).json({ error: err.message || "Registration failed" });
  }
}
