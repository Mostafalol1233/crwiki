import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import mongoose from 'mongoose';
import { initializeStorage, storage } from '../storage.js';
import { uploadStream } from '../services/cloudinary.js';
import fs from 'fs/promises';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crossfire-wiki';

async function migrate() {
    await initializeStorage();
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const siteSettings = await storage.getSiteSettings();
    if (siteSettings.seoOgImageUrl && !siteSettings.seoOgImageUrl.startsWith('http')) {
        try {
            const filePath = path.resolve('backend-deploy-full', siteSettings.seoOgImageUrl);
            const fileBuffer = await fs.readFile(filePath);
            const result = await uploadStream(fileBuffer, { folder: 'site' });
            await storage.updateSiteSettings({ seoOgImageUrl: result.secure_url });
            console.log(`Migrated site settings OG image to ${result.secure_url}`);
        } catch (error) {
            console.error(`Failed to migrate site settings OG image: ${error.message}`);
        }
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
}

migrate().catch(console.error);
