import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ModeModel, MapModel } from '../shared/mongodb-schema.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/crossfire_wiki";

async function uploadToDatabase() {
  console.log('Connecting to database...');
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully.');

    const filePath = path.join(process.cwd(), 'cf_maps_data.json');
    if (!fs.existsSync(filePath)) {
      console.error('scraped_data.json not found! Run scrape-and-save.js first.');
      return;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const items = data.items || [];
    
    console.log(`Processing ${items.length} items...`);
    for (const item of items) {
      if (item.type === 'mode') {
        const exists = await ModeModel.findOne({ name: item.name });
        if (!exists) {
          await ModeModel.create({
            name: item.name,
            image: item.image_url || "",
            description: item.description || "",
            category: item.category || "Standard",
            imageHistory: item.image_url ? [{ url: item.image_url }] : []
          });
          console.log(`Created mode: ${item.name}`);
        }
      } else if (item.type === 'map') {
        const exists = await MapModel.findOne({ name: item.name });
        if (!exists) {
          await MapModel.create({
            name: item.name,
            image: item.image_url || "",
            description: item.description || "",
            mode: item.parent_mode || "",
            category: item.category || "Official",
            imageHistory: item.image_url ? [{ url: item.image_url }] : []
          });
          console.log(`Created map: ${item.name}`);
        }
      }
    }

    console.log('\nAll data uploaded to database successfully!');
  } catch (error) {
    console.error('Error during upload:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

uploadToDatabase();
