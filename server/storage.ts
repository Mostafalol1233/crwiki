
import { MongoDBStorage } from './mongodb-storage';
import type { IStorage, NewsItem, Mercenary } from './mongodb-storage';

export type { IStorage, NewsItem, Mercenary } from './mongodb-storage';
export { MongoDBStorage };

import { MemoryStorage } from './memory-storage';

let _storage: IStorage;

try {
  const mongo = new MongoDBStorage();
  await mongo.initialize();
  console.log('Using MongoDBStorage');
  _storage = mongo as unknown as IStorage;
} catch (err) {
  console.error('MongoDB initialize failed, falling back to MemoryStorage:', err);
  const mem = new MemoryStorage();
  _storage = mem;
}

export const storage: IStorage = _storage;

if (process.env.VERCEL) {
  try {
    await storage.getAllPosts();
    console.log('MongoDB connection warmed up for Vercel');
  } catch (err) {
    console.error('Failed to warm up MongoDB connection:', err);
  }
}
