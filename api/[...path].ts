import type { VercelRequest, VercelResponse } from "@vercel/node";
import emailHandler from "../server/emailHandler.js";
import imageUploadHandler from "../server/imageUploadHandler.js";

export const config = {
  api: { bodyParser: false },
};

function requestPath(req: VercelRequest): string {
  const path = req.query.path;
  if (Array.isArray(path)) return `/${path.join("/")}`;
  if (typeof path === "string") return `/${path}`;
  return new URL(req.url || "/", "http://localhost").pathname;
}

async function ensureJsonBody(req: VercelRequest): Promise<void> {
  if (req.body && typeof req.body === "object") return;
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8");
  req.body = raw ? JSON.parse(raw) : {};
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  switch (requestPath(req)) {
    case "/send-email":
      await ensureJsonBody(req);
      return emailHandler(req, res);
    case "/images/upload":
      return imageUploadHandler(req, res);
    default:
      return res.status(404).json({ error: "API route not found" });
  }
}
