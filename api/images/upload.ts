import type { VercelRequest, VercelResponse } from "@vercel/node";
import multer from "multer";
import { randomUUID } from "crypto";
import { verifyAdminRequest } from "../../server/adminAuth.js";
import { verifyCompetitionAttemptToken } from "../../server/competitionAccess.js";

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

async function uploadBuffer(buffer: Buffer, originalName: string, mimetype: string, folder = "uploads"): Promise<{ secure_url: string }> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) throw new Error("Supabase Storage is not configured");
  const bucket = "media";
  const extension = originalName.match(/\.[a-zA-Z0-9]+$/)?.[0].toLowerCase() || "";
  const baseName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80) || "upload";
  const objectPath = `${folder.replace(/^\/+|\/+$/g, "")}/${Date.now()}-${randomUUID()}-${baseName}${extension}`;
  const objectUrl = `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/${encodeURIComponent(bucket)}/${objectPath.split("/").map(encodeURIComponent).join("/")}`;
  const response = await fetch(objectUrl, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": mimetype,
      "x-upsert": "false",
      "cache-control": "31536000",
    },
    body: new Uint8Array(buffer) as unknown as BodyInit,
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Supabase Storage upload failed (${response.status})${detail ? `: ${detail.slice(0, 180)}` : ""}`);
  }
  return { secure_url: `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/${encodeURIComponent(bucket)}/${objectPath.split("/").map(encodeURIComponent).join("/")}` };
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
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "Supabase Storage is not configured" });
  }

  try {
    await runUpload(req, res);
    const file = (req as any).file as { buffer?: Buffer; originalname?: string; mimetype?: string } | undefined;
    if (!file?.buffer || !file.originalname || !file.mimetype) {
      return res.status(400).json({ error: "No supported image file provided" });
    }

    const body = ((req as any).body || {}) as Record<string, unknown>;
    const attemptId = typeof body.attemptId === "string" ? body.attemptId : "";
    const attemptToken = typeof body.attemptToken === "string" ? body.attemptToken : "";
    const proofType = typeof body.proofType === "string" ? body.proofType : "other";
    const signedAttempt = attemptId && verifyCompetitionAttemptToken(attemptId, attemptToken);
    if (!isAdmin && !participantUserId && !ownerPreview && !signedAttempt) return res.status(401).json({ error: "Sign in or a valid competition session is required" });
    if (!isAdmin || ownerPreview) {
      if (!attemptId || !["youtube_subscription", "discord_membership", "game_subscription", "purchase_receipt", "other"].includes(proofType)) return res.status(400).json({ error: "A valid attempt and proof type are required" });
      const storedProofType = ["youtube_subscription", "discord_membership", "game_subscription"].includes(proofType) ? "subscription" : proofType;
      const proofNote = storedProofType === "subscription" && proofType !== "subscription" ? `Requested proof type: ${proofType}` : null;
      if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return res.status(500).json({ error: "Proof storage is not configured" });
      const attemptQuery = new URLSearchParams({ select: "id,status", id: `eq.${attemptId}`, status: "in.(submitted,reviewed)", limit: "1" });
      if (!ownerPreview && participantUserId) attemptQuery.set("user_id", `eq.${participantUserId}`);
      const attemptResponse = await fetch(`${SUPABASE_URL}/rest/v1/competition_attempts?${attemptQuery.toString()}`, { headers: serviceHeaders(), signal: AbortSignal.timeout(9000) });
      const attempts = attemptResponse.ok ? await attemptResponse.json() : [];
      if (!Array.isArray(attempts) || !attempts[0]) return res.status(400).json({ error: "Submit the quiz before uploading proof" });
      const result = await uploadBuffer(file.buffer, file.originalname, file.mimetype, `competition-proofs/${attemptId}/${storedProofType}`);
      const proofResponse = await fetch(`${SUPABASE_URL}/rest/v1/competition_proofs`, { method: "POST", headers: serviceHeaders(), body: JSON.stringify({ attempt_id: attemptId, proof_type: storedProofType, file_url: result.secure_url, file_name: file.originalname.slice(0, 180), file_size: file.buffer.length, mime_type: file.mimetype, status: "pending", reviewer_note: proofNote }), signal: AbortSignal.timeout(9000) });
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
