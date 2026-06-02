/**
 * Standalone script to migrate local seller images to Cloudinary.
 * Reads local fallback files, uploads them to Cloudinary, and updates MongoDB.
 *
 * Usage:
 *   node backend-deploy-full/scripts/migrate-seller-images.mjs
 *
 * Requires: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, MONGODB_URI
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import FormData from 'form-data';
import fetch from 'node-fetch';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dkpdidm89';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || '';
const BASE_URL = (process.env.PUBLIC_BASE_URL || 'https://crossfire.wiki').replace(/\/$/, '');
const LOCAL_CLOUD_DIR = path.resolve(ROOT, 'uploads/cloudinary_fallback');

if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error('ERROR: CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are required.');
    process.exit(1);
}
if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI is required.');
    process.exit(1);
}

const mimeMap = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png', webp: 'image/webp', gif: 'image/gif'
};

async function uploadToCloudinary(buffer, filename, mimetype) {
    const ts = Math.floor(Date.now() / 1000);
    const params = {
        timestamp: ts,
        folder: 'sellers',
        overwrite: 'true',
        invalidate: 'true',
    };
    const nonEmpty = Object.entries(params).filter(([, v]) => v && String(v).length > 0);
    const toSign = nonEmpty
        .sort(([a], [b]) => (a > b ? 1 : a < b ? -1 : 0))
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
    const signature = crypto.createHash('sha1').update(`${toSign}${CLOUDINARY_API_SECRET}`).digest('hex');

    const fd = new FormData();
    fd.append('file', buffer, { filename, contentType: mimetype });
    fd.append('timestamp', String(ts));
    fd.append('folder', 'sellers');
    fd.append('overwrite', 'true');
    fd.append('invalidate', 'true');
    fd.append('signature', signature);
    fd.append('api_key', CLOUDINARY_API_KEY);

    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 30000);
    try {
        const res = await fetch(endpoint, { method: 'POST', body: fd, signal: ctrl.signal });
        clearTimeout(timeout);
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`Cloudinary ${res.status}: ${text}`);
        }
        return await res.json();
    } finally {
        clearTimeout(timeout);
    }
}

function makeProxyUrl(secureUrl) {
    try {
        const u = new URL(secureUrl);
        const parts = u.pathname.split('/').filter(Boolean);
        const last = parts[parts.length - 1] || '';
        const isImg = parts.length >= 3 && parts[1] === 'image' && parts[2] === 'upload';
        return isImg && /\.[A-Za-z0-9]+$/.test(last) ? `${BASE_URL}/image/${last}` : secureUrl;
    } catch {
        return secureUrl;
    }
}

function findLocalFile(imgUrl) {
    if (imgUrl.includes('/media/cloudinary/')) {
        const after = imgUrl.split('/media/cloudinary/')[1] || '';
        const p = path.join(LOCAL_CLOUD_DIR, ...after.split('/'));
        return fs.existsSync(p) ? p : null;
    }
    if (imgUrl.includes('res.cloudinary.com')) {
        const cloudPath = imgUrl.replace(/^https?:\/\/res\.cloudinary\.com\//, '');
        const p = path.join(LOCAL_CLOUD_DIR, ...cloudPath.split('/'));
        return fs.existsSync(p) ? p : null;
    }
    return null;
}

async function main() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected.');

    const SellerSchema = new mongoose.Schema({}, { strict: false });
    const Seller = mongoose.models.Seller || mongoose.model('Seller', SellerSchema, 'sellers');

    const sellers = await Seller.find({}).lean();
    console.log(`Found ${sellers.length} sellers.`);

    let migrated = 0, failed = 0, skipped = 0;

    for (const seller of sellers) {
        const images = Array.isArray(seller.images) ? seller.images : [];
        if (!images.length) continue;

        let changed = false;
        const newImages = [];

        for (const imgUrl of images) {
            if (!imgUrl) { newImages.push(imgUrl); continue; }

            const localFile = findLocalFile(imgUrl);
            const isCloudinary = imgUrl.includes('res.cloudinary.com');

            if (!localFile && isCloudinary) {
                // Already on real Cloudinary — just ensure it's stored as proxy URL
                const proxyUrl = makeProxyUrl(imgUrl);
                newImages.push(proxyUrl);
                if (proxyUrl !== imgUrl) changed = true;
                skipped++;
                console.log(`  SKIP (real cloudinary): ${imgUrl}`);
                continue;
            }

            if (!localFile && !isCloudinary && (imgUrl.startsWith('/') || imgUrl.startsWith('http'))) {
                console.log(`  SKIP (no local file found): ${imgUrl}`);
                newImages.push(imgUrl);
                failed++;
                continue;
            }

            try {
                const buffer = await fs.promises.readFile(localFile);
                const filename = path.basename(localFile);
                const ext = path.extname(filename).slice(1).toLowerCase() || 'jpg';
                const mimeType = mimeMap[ext] || 'image/jpeg';

                console.log(`  Uploading ${filename} (${Math.round(buffer.length / 1024)}KB) to Cloudinary...`);
                const result = await uploadToCloudinary(buffer, filename, mimeType);
                const proxyUrl = makeProxyUrl(result.secure_url);

                console.log(`    → ${proxyUrl}`);
                newImages.push(proxyUrl);
                migrated++;
                changed = true;
            } catch (err) {
                console.error(`  FAILED to upload ${imgUrl}: ${err.message}`);
                newImages.push(imgUrl);
                failed++;
            }
        }

        if (changed) {
            await Seller.updateOne({ _id: seller._id }, { $set: { images: newImages } });
            console.log(`Updated seller: ${seller.name || seller._id}`);
        }
    }

    await mongoose.disconnect();
    console.log(`\nDone! Migrated: ${migrated}, Skipped: ${skipped}, Failed: ${failed}`);
    if (failed > 0) process.exit(1);
}

main().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
});
