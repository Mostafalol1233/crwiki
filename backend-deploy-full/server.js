// Node.js server to accept direct uploads and forward to Cloudinary
// Uses unsigned upload preset so no secrets are required

import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";
import cors from "cors";

const app = express();

// Allow cross-domain calls (configure as needed)
app.use(cors({
  origin: (origin, cb) => cb(null, true),
  methods: ["POST", "GET", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Multer memory storage and basic limits
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// Allowed MIME types (images, videos, audio)
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

// Upload endpoint: /images/upload
app.post("/images/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: "No file provided (expected field name 'file')" });
    }

    const { buffer, mimetype, originalname } = req.file;
    if (!ALLOWED_MIME.has(mimetype)) {
      return res.status(415).json({ ok: false, error: `Unsupported file type: ${mimetype}` });
    }

    // Cloudinary config for unsigned upload
    const cloudName = "dkpdidm89";
    const uploadPreset = "crossfire";
    const resourceType = "auto"; // supports image, video, raw/audio

    // Prepare multipart form-data
    const fd = new FormData();
    fd.append("file", buffer, { filename: originalname, contentType: mimetype, knownLength: buffer.length });
    fd.append("upload_preset", uploadPreset);

    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
    const resp = await fetch(endpoint, { method: "POST", body: fd });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return res.status(502).json({ ok: false, error: `Cloudinary upload failed: ${resp.status} ${text}` });
    }
    const json = await resp.json();

    const secureUrl = json.secure_url;
    const publicId = json.public_id;
    const format = json.format;
    const rtype = json.resource_type || resourceType;

    // Build a domain-local URL that serves the uploaded file under your domain
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const domainUrl = `${baseUrl}/cdn/fetch?url=${encodeURIComponent(secureUrl)}`;

    return res.json({
      ok: true,
      secure_url: secureUrl,
      domain_url: domainUrl,
      public_id: publicId,
      resource_type: rtype,
      format,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

// Simple proxy to serve files under your domain while they live on Cloudinary
app.get("/cdn/fetch", async (req, res) => {
  try {
    const url = String(req.query.url || "");
    if (!url) return res.status(400).json({ ok: false, error: "Missing 'url' query parameter" });
    const u = new URL(url);
    if (!/res\.cloudinary\.com$/i.test(u.hostname)) {
      return res.status(400).json({ ok: false, error: "Only Cloudinary resources are allowed" });
    }
    const upstream = await fetch(url);
    if (!upstream.ok) {
      return res.status(502).json({ ok: false, error: `Upstream fetch failed: ${upstream.status}` });
    }
    // Pass-through content type and length
    const ct = upstream.headers.get("content-type");
    if (ct) res.setHeader("Content-Type", ct);
    const cl = upstream.headers.get("content-length");
    if (cl) res.setHeader("Content-Length", cl);
    // Stream the response to client
    upstream.body.pipe(res);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Cloudinary upload server listening on port ${PORT}`);
});

process.on("unhandledRejection", (e) => {
  console.error("Unhandled rejection:", e);
});

