import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAdminRequest } from "../server/adminAuth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const admin = verifyAdminRequest(req.headers as Record<string, unknown>);
  if (!admin) return res.status(401).json({ error: "Unauthorized" });
  if (admin.role !== "super_admin" && !admin.permissions?.["email:send"] && !admin.permissions?.["announcements:send"]) {
    return res.status(403).json({ error: "Missing email sending permission" });
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

  const recipients = (Array.isArray(to) ? to : [to])
    .filter((value): value is string => typeof value === "string")
    .map(value => value.trim().toLowerCase());
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!recipients.length || recipients.length > 500 || recipients.some(value => !emailPattern.test(value))) {
    return res.status(400).json({ error: "Provide between 1 and 500 valid recipients" });
  }
  if (recipientType && recipientType !== "subscribers" && recipientType !== "custom") {
    return res.status(400).json({ error: "Invalid recipient type" });
  }
  if (typeof subject !== "string" || !subject.trim() || subject.length > 160) {
    return res.status(400).json({ error: "Subject is required and must be at most 160 characters" });
  }
  if (typeof html !== "string" || !html.trim() || html.length > 200_000 || /<script\b|javascript:/i.test(html)) {
    return res.status(400).json({ error: "Email HTML is invalid or too large" });
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
        subject: subject.trim(),
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
