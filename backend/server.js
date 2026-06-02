// Express backend for uploads and CDN proxy (Cloudinary unsigned uploads)
// Provides: health, upload, proxy, error handling, optional DB connect

import express from "express";
import cors from "cors";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();

// Body parsing (acts like body-parser)
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// CORS
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
app.use(
  cors({
    origin: (origin, cb) => cb(null, true),
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

// Basic rate limit for upload endpoints
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
});
app.use("/images/upload", limiter);
app.use("/cdn/fetch", limiter);

// Optional DB connection (supports both legacy MONGO_URL and MONGODB_URI)
const MONGO_URL = process.env.MONGODB_URI || process.env.MONGO_URL || "";
if (MONGO_URL) {
  mongoose
    .connect(MONGO_URL)
    .then(() => console.log("[DB] Connected"))
    .catch((e) => console.error("[DB] Connection error:", e.message));
}

// Health
app.get("/health", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// Multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

// Allowed MIME types
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
]);

import sharp from "sharp";

// Upload to Cloudinary (unsigned)
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "dkpdidm89";
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || "crossfire";
const CLOUDINARY_RESOURCE_TYPE = process.env.CLOUDINARY_RESOURCE_TYPE || "auto";
const PRESERVE_ORIGINAL_UPLOADS = String(process.env.PRESERVE_ORIGINAL_UPLOADS || "true").toLowerCase() !== "false";

app.post("/images/upload", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: "No file provided" });
    let { buffer, mimetype, originalname } = req.file;
    if (!ALLOWED_MIME.has(mimetype)) {
      return res.status(415).json({ ok: false, error: `Unsupported file type: ${mimetype}` });
    }

    // Preserve original event/admin/frontend-uploaded images by default.
    // Set PRESERVE_ORIGINAL_UPLOADS=false only if you explicitly want server-side recompression.
    if (!PRESERVE_ORIGINAL_UPLOADS && mimetype.startsWith("image/")) {
      try {
        buffer = await sharp(buffer)
          .resize({ width: 1920, height: 1080, fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80, mozjpeg: true })
          .toBuffer();
        mimetype = "image/jpeg";
        originalname = originalname.replace(/\.[^/.]+$/, "") + ".jpg";
      } catch (e) {
        console.warn("Image optimization failed, falling back to original", e);
      }
    }

    const fd = new FormData();
    fd.append("file", buffer, { filename: originalname, contentType: mimetype, knownLength: buffer.length });
    fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${CLOUDINARY_RESOURCE_TYPE}/upload`;
    const resp = await fetch(endpoint, { method: "POST", body: fd });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return res.status(502).json({ ok: false, error: `Cloudinary upload failed: ${resp.status} ${text}` });
    }
    const json = await resp.json();

    const secureUrl = json.secure_url;
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const domainUrl = `${baseUrl}/cdn/fetch?url=${encodeURIComponent(secureUrl)}`;

    res.json({ ok: true, secure_url: secureUrl, domain_url: domainUrl, public_id: json.public_id, format: json.format, resource_type: json.resource_type || CLOUDINARY_RESOURCE_TYPE });
  } catch (err) {
    next(err);
  }
});

// CDN proxy for domain-local paths
app.get("/cdn/fetch", async (req, res, next) => {
  try {
    const url = String(req.query.url || "");
    if (!url) return res.status(400).json({ ok: false, error: "Missing 'url' query" });
    const u = new URL(url);
    if (!/res\.cloudinary\.com$/i.test(u.hostname)) {
      return res.status(400).json({ ok: false, error: "Only Cloudinary URLs are allowed" });
    }
    const upstream = await fetch(url);
    if (!upstream.ok) return res.status(502).json({ ok: false, error: `Upstream failed: ${upstream.status}` });
    const ct = upstream.headers.get("content-type");
    if (ct) res.setHeader("Content-Type", ct);
    upstream.body.pipe(res);
  } catch (err) {
    next(err);
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ ok: false, error: "Not Found", path: req.originalUrl });
});

// Error handler
app.use((err, _req, res, _next) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("[Error]", msg);
  res.status(500).json({ ok: false, error: msg });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
