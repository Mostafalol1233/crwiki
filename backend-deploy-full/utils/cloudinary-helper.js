import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import path from 'path';
import crypto from 'crypto';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dkpdidm89',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const uploadStream = (buffer, options, retries = 3) => {
  return new Promise((resolve, reject) => {
    const attempt = (remaining) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          ...options,
          timeout: 60000, // 60s timeout
        },
        (error, result) => {
          if (result) {
            resolve(result);
          } else {
            if (remaining > 0) {
              console.log(`Retrying upload, attempts remaining: ${remaining}`);
              setTimeout(() => attempt(remaining - 1), 1000); // 1s delay
            } else {
              reject(error);
            }
          }
        }
      );
      streamifier.createReadStream(buffer).pipe(stream);
    };
    attempt(retries);
  });
};

export const deleteAsset = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error("Error deleting asset from Cloudinary:", error);
        throw error;
    }
};

function slugify(input) {
  if (!input) return '';
  return input
    .toString()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function downloadAndUploadImage(url, folder = 'scraped') {
  if (!url || !url.startsWith('http')) return { url: '', publicId: '' };
  
  // If it's already a domain URL or Cloudinary URL, don't re-upload unless it's external
  const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dkpdidm89';
  const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || 'https://crossfire.wiki').replace(/\/$/, '');
  
  if (url.includes(CLOUDINARY_CLOUD_NAME) || url.startsWith(PUBLIC_BASE_URL)) {
    return { url, publicId: '' }; // Already ours
  }

  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
    const buffer = Buffer.from(response.data);
    const filename = path.basename(new URL(url).pathname) || 'image.jpg';
    
    const result = await uploadStream(buffer, {
      folder: `crossfire-wiki/${folder}`,
      public_id: slugify(path.parse(filename).name) + '-' + Date.now(),
      overwrite: true,
      invalidate: true
    });
    
    const u = new URL(result.secure_url);
    const domainUrl = `${PUBLIC_BASE_URL}/media/cloudinary/${CLOUDINARY_CLOUD_NAME}/${u.pathname.replace(/^\//, '')}`;
    
    return { url: domainUrl, publicId: result.public_id };
  } catch (error) {
    console.error(`Error downloading/uploading image from ${url}:`, error.message);
    return { url: url, publicId: '' }; // Fallback to original URL
  }
}
