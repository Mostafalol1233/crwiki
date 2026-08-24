import type { VercelRequest, VercelResponse } from "@vercel/node";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { verifyAdminRequest } from "../../server/adminAuth.js";

export const config = {
  api: { bodyParser: false },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || "";
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

type UploadMiddleware = (
  req: unknown,
  res: unknown,
  next: (error?: unknown) => void,
) => void;

const uploadMiddleware = upload as unknown as UploadMiddleware;

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

function runUpload(req: VercelRequest, res: VercelResponse): Promise<void> {
  return new Promise((resolve, reject) => {
    uploadMiddleware(req, res, (error?: unknown) => {
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

async function authenticatedUserId(req: VercelRequest): Promise<string | null> {
  const value = req.headers.authorization;
  const token = typeof value === "string" ? value.replace(/^Bearer\s+/i, "").trim() : "";
  if (!token || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(9000) });
    if (!response.ok) return null;
    const user = await response.json();
    return typeof user?.id === "string" ? user.id : null;
  } catch {
    return null;
  }
}

function serviceHeaders() {
  return { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" };
}

function uploadBuffer(buffer: Buffer, originalName: string, mimetype: string, folder = "crossfire-wiki/media"): Promise<{ secure_url: string }> {
  const baseName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80) || "upload";
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
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
  const isAdmin = verifyAdminRequest(req.headers as Record<string, unknown>);
  const directPreviewTest = process.env.VERCEL_ENV === "preview"
    && (Array.isArray(req.query.competition_test) ? req.query.competition_test[0] : req.query.competition_test) === "1";
  const ownerPreview = Boolean((isAdmin?.role === "super_admin" && process.env.VERCEL_ENV !== "production") || directPreviewTest);
  const participantUserId = isAdmin && !ownerPreview ? null : await authenticatedUserId(req);
  if (!isAdmin && !participantUserId && !ownerPreview) return res.status(401).json({ error: "Sign in is required" });
  if (!configureCloudinary()) {
    return res.status(500).json({ error: "Cloudinary is not configured" });
  }

  try {
    await runUpload(req, res);
    const file = (req as any).file as { buffer?: Buffer; originalname?: string; mimetype?: string } | undefined;
    if (!file?.buffer || !file.originalname || !file.mimetype) {
      return res.status(400).json({ error: "No supported image file provided" });
    }

    const body = ((req as any).body || {}) as Record<string, unknown>;
    const attemptId = typeof body.attemptId === "string" ? body.attemptId : "";
    const proofType = typeof body.proofType === "string" ? body.proofType : "other";
    if (!isAdmin || ownerPreview) {
      if (!attemptId || !["subscription", "purchase_receipt", "other"].includes(proofType)) return res.status(400).json({ error: "A valid attempt and proof type are required" });
      if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return res.status(500).json({ error: "Proof storage is not configured" });
      const attemptQuery = new URLSearchParams({ select: "id,status", id: `eq.${attemptId}`, status: "in.(submitted,reviewed)", limit: "1" });
      if (!ownerPreview) attemptQuery.set("user_id", `eq.${participantUserId}`);
      const attemptResponse = await fetch(`${SUPABASE_URL}/rest/v1/competition_attempts?${attemptQuery.toString()}`, { headers: serviceHeaders(), signal: AbortSignal.timeout(9000) });
      const attempts = attemptResponse.ok ? await attemptResponse.json() : [];
      if (!Array.isArray(attempts) || !attempts[0]) return res.status(400).json({ error: "Submit the quiz before uploading proof" });
      const result = await uploadBuffer(file.buffer, file.originalname, file.mimetype, "crossfire-wiki/competition-proofs");
      const proofResponse = await fetch(`${SUPABASE_URL}/rest/v1/competition_proofs`, { method: "POST", headers: serviceHeaders(), body: JSON.stringify({ attempt_id: attemptId, proof_type: proofType, file_url: result.secure_url, file_name: file.originalname.slice(0, 180), file_size: file.buffer.length, mime_type: file.mimetype, status: "pending" }), signal: AbortSignal.timeout(9000) });
      if (!proofResponse.ok) return res.status(502).json({ error: "Proof was uploaded but could not be registered" });
      const rows = await proofResponse.json();
      return res.status(200).json({ proof_id: Array.isArray(rows) ? rows[0]?.id : null, secure_url: result.secure_url, status: "pending" });
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
