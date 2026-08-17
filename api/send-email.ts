import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { to, subject, html, recipientType } = req.body as {
    to: string | string[];
    subject: string;
    html: string;
    recipientType?: string;
  };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Email service not configured" });
  }

  const recipients = Array.isArray(to) ? to : [to];
  if (!recipients.length || !subject || !html) {
    return res.status(400).json({ error: "Missing required fields: to, subject, html" });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "CrossFire Wiki <noreply@crossfire.wiki>",
        to: recipients,
        subject,
        html,
      }),
    });

    const data = await response.json() as Record<string, unknown>;
    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || "Failed to send" });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
