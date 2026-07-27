// Node.js server to accept direct uploads and forward to Cloudinary
// Uses unsigned upload preset so no secrets are required

import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { REGIONS, WEAPONS, FORUM_POSTS, buildComparisonRows, getRegionBySlug } from "./shared/crossfire-regions.js";
import { scrapeGlobalRegions } from "./scripts/scrape-global-regions.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "dist", "client");
const indexPath = path.join(distPath, "index.html");
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SERVICE_ROLE || process.env.service_role || process.env.SUPABASE_SERVICE_KEY || "";

async function readSupabaseRows(table, select, orderBy = "") {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;

  const query = new URLSearchParams();
  query.set("select", select);
  if (orderBy) query.set("order", orderBy);

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query.toString()}`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) return null;
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

// Allow cross-domain calls (configure as needed)
app.use(cors({
  origin: (origin, cb) => cb(null, true),
  methods: ["POST", "GET", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.static(distPath, { index: false }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/", (_req, res) => {
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  return res.type("html").send(`<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>CrossFire Global Wiki</title>
      <style>body{font-family:Inter,Arial,sans-serif;background:#05070d;color:#f8fafc;padding:2rem;line-height:1.6;}a{color:#f59e0b;text-decoration:none;}code{background:#111827;padding:0.2rem 0.4rem;border-radius:4px;}</style>
    </head>
    <body>
      <h1>CrossFire Global Wiki is live</h1>
      <p>The app shell is now being served directly from the Express server.</p>
      <ul>
        <li><a href="/api/regions">Regions API</a></li>
        <li><a href="/api/compare/ak47-beast">Comparison API</a></li>
        <li><a href="/api/global-scrape">Global scrape API</a></li>
        <li><a href="/global-wiki">Global wiki page</a></li>
      </ul>
      <p>Build the client bundle with <code>npm run build:client</code> for the full React UI.</p>
    </body>
  </html>`);
});

app.get("/api/regions", (_req, res) => {
  res.json({ regions: REGIONS, count: REGIONS.length, supportedSlugs: REGIONS.map((region) => region.slug) });
});

app.get("/api/regions/:slug", (req, res) => {
  const region = getRegionBySlug(req.params.slug);
  if (!region) {
    return res.status(404).json({ ok: false, error: "Region not found" });
  }

  const coverage = WEAPONS.map((weapon) => ({
    slug: weapon.slug,
    name: weapon.name,
    category: weapon.category,
    description: weapon.description,
    region: weapon.regions?.[region.slug] || null,
  })).filter((item) => item.region);

  return res.json({ region, coverage, count: coverage.length });
});

app.get("/api/weapons", async (_req, res) => {
  const dbRows = await readSupabaseRows("weapons", "id,name,category,description,stats,image_url,created_at", "name");
  if (dbRows && dbRows.length) {
    const mapped = dbRows.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category || "Uncategorized",
      description: row.description || "",
      stats: row.stats || {},
      image_url: row.image_url || "",
      created_at: row.created_at || null,
    }));
    return res.json({ weapons: mapped });
  }

  res.json({ weapons: WEAPONS });
});

app.get("/api/forum-posts", async (_req, res) => {
  const dbRows = await readSupabaseRows("posts", "id,title,post_slug,summary,content,category,author,tags,created_at", "created_at.desc");
  if (dbRows && dbRows.length) {
    const mapped = dbRows.map((row) => ({
      id: row.id,
      slug: row.post_slug || row.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      title: row.title,
      author: row.author || "CrossFire Wiki",
      region: row.category === "global-wiki" ? "global" : "community",
      tags: row.tags || [],
      excerpt: row.summary || row.content || "",
      date: row.created_at || null,
      link: row.canonical_url || "/global-wiki",
    }));
    return res.json({ posts: mapped });
  }

  res.json({ posts: FORUM_POSTS });
});

app.get("/api/compare/:slug", (req, res) => {
  const rows = buildComparisonRows(req.params.slug || "ak47-beast");
  res.json({ slug: req.params.slug || "ak47-beast", rows });
});

app.get("/api/global-scrape", async (_req, res) => {
  try {
    const items = await scrapeGlobalRegions();
    res.json({ ok: true, items });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
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

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/images/") || req.path.startsWith("/cdn/")) {
    return next();
  }

  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  const title = req.path === "/" ? "CrossFire Global Wiki" : req.path.replace(/^\//, "").replace(/\//g, " · ");
  return res.type("html").send(`<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title}</title>
      <style>body{font-family:Inter,Arial,sans-serif;background:#05070d;color:#f8fafc;padding:2rem;line-height:1.6;}a{color:#f59e0b;text-decoration:none;}code{background:#111827;padding:0.2rem 0.4rem;border-radius:4px;}</style>
    </head>
    <body>
      <h1>${title}</h1>
      <p>The CrossFire wiki content route is live. Use the API endpoints below to browse the expanded data.</p>
      <ul>
        <li><a href="/api/regions">Regions API</a></li>
        <li><a href="/api/weapons">Weapons API</a></li>
        <li><a href="/api/forum-posts">Forum posts API</a></li>
        <li><a href="/api/compare/ak47-beast">Comparison API</a></li>
      </ul>
    </body>
  </html>`);
});

// Start server
const configuredPort = process.env.SERVER_PORT || process.env.PORT;
const PORT = configuredPort && configuredPort !== '5173' ? configuredPort : 8080;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`CrossFire wiki API server listening on port ${PORT}`);
});

process.on("unhandledRejection", (e) => {
  console.error("Unhandled rejection:", e);
});

