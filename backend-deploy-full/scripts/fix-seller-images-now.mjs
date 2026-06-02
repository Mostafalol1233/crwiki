/**
 * Full seller image repair:
 * 1. Uploads every local fallback image to real Cloudinary (public)
 * 2. Matches uploaded files to sellers by name heuristics
 * 3. Updates MongoDB with correct proxy URLs
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CLOUD_NAME  = process.env.CLOUDINARY_CLOUD_NAME  || 'dkpdidm89';
const API_KEY     = process.env.CLOUDINARY_API_KEY      || '';
const API_SECRET  = process.env.CLOUDINARY_API_SECRET   || '';
const MONGODB_URI = process.env.MONGODB_URI             || '';
const BASE_URL    = (process.env.PUBLIC_BASE_URL || 'https://crossfire.wiki').replace(/\/$/, '');
const LOCAL_DIR   = path.resolve('backend-deploy-full/uploads/cloudinary_fallback');

if (!API_KEY || !API_SECRET) { console.error('❌ Missing Cloudinary credentials'); process.exit(1); }
if (!MONGODB_URI)             { console.error('❌ Missing MONGODB_URI');              process.exit(1); }

// ─── helpers ─────────────────────────────────────────────────────────────────

async function fetchTimeout(url, opts = {}, ms = 60000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ctrl.signal }); }
  finally { clearTimeout(t); }
}

async function uploadToCloudinary(buffer, filename, folder = 'sellers') {
  const ext      = path.extname(filename).toLowerCase().replace('.', '') || 'jpg';
  const baseName = path.basename(filename, path.extname(filename))
                       .replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 60);
  const public_id = baseName;   // keep descriptive name
  const timestamp = Math.floor(Date.now() / 1000);
  const toSign    = `folder=${folder}&public_id=${public_id}&timestamp=${timestamp}${API_SECRET}`;
  const signature = crypto.createHash('sha1').update(toSign).digest('hex');

  const form = new FormData();
  form.append('file',       new Blob([buffer]), filename);
  form.append('folder',     folder);
  form.append('public_id',  public_id);
  form.append('timestamp',  String(timestamp));
  form.append('api_key',    API_KEY);
  form.append('signature',  signature);

  const res = await fetchTimeout(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form }, 90000
  );
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Cloudinary ${res.status}: ${txt}`);
  }
  return res.json(); // { public_id, format, secure_url, ... }
}

function makeProxyUrl(publicId, format) {
  return `${BASE_URL}/image/${publicId}.${format}`;
}

// Collect all image files under cloudinary_fallback (de-duplicate by basename)
function collectLocalFiles() {
  const seen = new Map(); // basename → full path
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(entry.name)) continue;
      const key = entry.name.toLowerCase();
      if (!seen.has(key)) seen.set(key, full); // prefer first found
    }
  }
  walk(LOCAL_DIR);
  return seen; // Map<filename, fullPath>
}

// Score how well a local filename matches a seller name (0-100)
function matchScore(filename, sellerName) {
  const f = filename.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s = sellerName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (f.includes(s) || s.includes(f)) return 100;
  // Check word overlap
  const fWords = f.match(/[a-z0-9]+/g) || [];
  const sWords = s.match(/[a-z0-9]+/g) || [];
  const overlap = fWords.filter(w => w.length > 2 && sWords.some(sw => sw.includes(w) || w.includes(sw)));
  if (overlap.length > 0) return 50;
  return 0;
}

// ─── MongoDB ─────────────────────────────────────────────────────────────────

async function connectMongo() {
  const { MongoClient } = await import('mongodb');
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  await client.connect();
  const db = client.db();
  console.log('✅ MongoDB connected:', db.databaseName);
  return db.collection('sellers');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const sellersCol = await connectMongo();
  const sellers    = await sellersCol.find({}).toArray();
  console.log(`\n🔍 ${sellers.length} sellers in DB`);

  // ── Step 1: Upload all local files to Cloudinary ──────────────────────────
  console.log('\n☁️  Uploading local files to Cloudinary…\n');
  const localFiles = collectLocalFiles();
  console.log(`Found ${localFiles.size} unique local files to upload`);

  const uploaded = new Map(); // filename → { proxyUrl, publicId, format }

  for (const [filename, filePath] of localFiles.entries()) {
    process.stdout.write(`  Uploading ${filename}… `);
    try {
      const buffer = fs.readFileSync(filePath);
      const json   = await uploadToCloudinary(buffer, filename, 'sellers');
      const proxy  = makeProxyUrl(json.public_id, json.format);
      uploaded.set(filename, { proxyUrl: proxy, publicId: json.public_id, format: json.format, fileSize: buffer.length });
      console.log(`✅ ${proxy}`);
    } catch (e) {
      console.log(`❌ ${e.message}`);
    }
  }

  console.log(`\n✅ Uploaded ${uploaded.size}/${localFiles.size} files\n`);

  // ── Step 2: Match sellers to uploaded files ───────────────────────────────
  console.log('🔗 Matching sellers to uploaded images…\n');

  // Group uploaded files by seller match
  const sellerMatches = new Map(); // sellerId → [proxyUrl, ...]

  for (const seller of sellers) {
    const id   = String(seller._id);
    const name = seller.name || '';
    const matches = [];

    for (const [filename, info] of uploaded.entries()) {
      const score = matchScore(filename, name);
      if (score > 0) matches.push({ filename, score, proxyUrl: info.proxyUrl });
    }

    matches.sort((a, b) => b.score - a.score);

    if (matches.length > 0) {
      console.log(`👤 ${name}: matched [${matches.map(m => m.filename).join(', ')}]`);
      sellerMatches.set(id, matches.map(m => m.proxyUrl));
    } else {
      console.log(`👤 ${name}: no match found by name`);
    }
  }

  // Assign remaining unmatched files to sellers with too few images
  const usedUrls = new Set([...sellerMatches.values()].flat());
  const remaining = [...uploaded.values()]
    .map(v => v.proxyUrl)
    .filter(u => !usedUrls.has(u));
  
  if (remaining.length > 0) {
    console.log(`\n📎 Remaining unmatched files (${remaining.length}):`);
    remaining.forEach(u => console.log(`   ${u}`));
  }

  // ── Step 3: Update MongoDB ─────────────────────────────────────────────────
  console.log('\n💾 Updating MongoDB…\n');
  let updatedCount = 0;

  for (const seller of sellers) {
    const id   = String(seller._id);
    const name = seller.name || String(id);
    const matchedUrls = sellerMatches.get(id) || [];

    if (matchedUrls.length === 0) {
      console.log(`⏭️  ${name}: no matched images, keeping existing`);
      continue;
    }

    // Keep matched images; if seller had 2 images and we only matched 1, keep position
    const currentImages = seller.images || seller.imageUrls || [];
    const newImages = [...matchedUrls];
    
    // If we have fewer matches than original images, keep extra originals (they may have been ok)
    // but since they're all broken, just use what we have
    
    const updateFields = {};
    if (seller.images !== undefined || currentImages.length > 0) {
      updateFields.images = newImages;
    }
    if (seller.imageUrls !== undefined) {
      updateFields.imageUrls = newImages;
    }
    if (Object.keys(updateFields).length === 0) {
      updateFields.images = newImages;
    }

    await sellersCol.updateOne({ _id: seller._id }, { $set: updateFields });
    console.log(`✅ ${name}: set images = [${newImages.join(', ')}]`);
    updatedCount++;
  }

  console.log(`\n✅ Done! Updated ${updatedCount}/${sellers.length} sellers`);
  console.log('\n📋 All uploaded URLs for reference:');
  for (const [fn, info] of uploaded.entries()) {
    console.log(`   ${fn} → ${info.proxyUrl}`);
  }

  process.exit(0);
}

main().catch(e => { console.error('💥 Fatal:', e); process.exit(1); });
