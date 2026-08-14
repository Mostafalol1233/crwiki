import type { VercelRequest, VercelResponse } from "@vercel/node";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { verifyAdminRequest } from "../../server/adminAuth.js";

export const config = {
  api: { bodyParser: false },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, callback) => {
    callback(null, ALLOWED_MIME.has(file.mimetype));
  },
}).single("file");

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

function runUpload(req: VercelRequest, res: VercelResponse): Promise<void> {
  return new Promise((resolve, reject) => {
    upload(req as any, res as any, (error: any) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
  const apiKey = process.env.CLOUDINARY_API_KEY || "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
  if (!cloudName || !apiKey || !apiSecret) return false;

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return true;
}

function uploadBuffer(buffer: Buffer, originalName: string, mimetype: string): Promise<{ secure_url: string }> {
  const baseName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80) || "upload";
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "crossfire-wiki/media",
        public_id: `${baseName}-${Date.now()}`,
        resource_type: mimetype === "image/gif" ? "image" : "auto",
        overwrite: false,
        use_filename: false,
      },
      (error, result) => {
        if (error || !result?.secure_url) reject(error || new Error("Cloudinary returned no URL"));
        else resolve({ secure_url: result.secure_url });
      },
    );
    stream.end(buffer);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!verifyAdminRequest(req.headers as Record<string, unknown>)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!configureCloudinary()) {
    return res.status(500).json({ error: "Cloudinary is not configured" });
  }

  try {
    await runUpload(req, res);
    const file = (req as any).file as { buffer?: Buffer; originalname?: string; mimetype?: string } | undefined;
    if (!file?.buffer || !file.originalname || !file.mimetype) {
      return res.status(400).json({ error: "No supported image file provided" });
    }

    const result = await uploadBuffer(file.buffer, file.originalname, file.mimetype);
    return res.status(200).json({ secure_url: result.secure_url, domain_url: result.secure_url });
  } catch (error: any) {
    const message = error?.code === "LIMIT_FILE_SIZE"
      ? "Image must be 10 MB or smaller"
      : error?.message || "Upload failed";
    return res.status(400).json({ error: message });
  }
}
