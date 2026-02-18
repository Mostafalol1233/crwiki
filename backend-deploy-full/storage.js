import { MongoDBStorage } from './mongodb-storage.js';
export { MongoDBStorage };
import { MemoryStorage } from './memory-storage.js';
let _storage;
try {
    const mongo = new MongoDBStorage();
    await mongo.initialize();
    console.log('Using MongoDBStorage');
    _storage = mongo;
}
catch (err) {
    console.error('MongoDB initialize failed, falling back to MemoryStorage:', err);
    const mem = new MemoryStorage();
    _storage = mem;
}
export const storage = _storage;
if (process.env.VERCEL) {
    try {
        await storage.getAllPosts();
        console.log('MongoDB connection warmed up for Vercel');
    }
    catch (err) {
        console.error('Failed to warm up MongoDB connection:', err);
    }
}
