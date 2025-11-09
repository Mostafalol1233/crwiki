import { MongoDBStorage } from './mongodb-storage';
import type { IStorage, NewsItem, Mercenary } from './mongodb-storage';

export type { IStorage, NewsItem, Mercenary } from './mongodb-storage';
export { MongoDBStorage };

// Try to initialize MongoDB-backed storage, but fall back to in-memory storage
// if the connection fails. Top-level await is used so callers importing
// `storage` will get a ready-to-use instance.
import { MemoryStorage } from './memory-storage';

let _storage: IStorage;

try {
  const mongo = new MongoDBStorage();
  // attempt to initialize; if it throws we'll catch below
  await mongo.initialize();
  console.log('Using MongoDBStorage');
  _storage = mongo as unknown as IStorage;
} catch (err) {
  console.error('MongoDB initialize failed, falling back to MemoryStorage:', err);
  const mem = new MemoryStorage();
  _storage = mem;
}

export const storage: IStorage = _storage;
