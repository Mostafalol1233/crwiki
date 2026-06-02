import { MongoDBStorage } from './mongodb-storage.js';
import { MemoryStorage } from './memory-storage.js';

let _storage;

async function initializeStorage() {
    if (_storage) {
        return;
    }
    try {
        const mongo = new MongoDBStorage();
        await mongo.initialize();
        console.log('Using MongoDBStorage');
        _storage = mongo;
    } catch (err) {
        console.error('MongoDB initialize failed, falling back to MemoryStorage:', err);
        const mem = new MemoryStorage();
        _storage = mem;
    }
}

const storage = new Proxy({}, {
    get: function(target, prop) {
        if (!_storage) {
            throw new Error('Storage not initialized. Call initializeStorage() first.');
        }
        return _storage[prop];
    }
});

if (process.env.VERCEL) {
    (async () => {
        await initializeStorage();
        try {
            await storage.getAllPosts();
            console.log('MongoDB connection warmed up for Vercel');
        } catch (err) {
            console.error('Failed to warm up MongoDB connection:', err);
        }
    })();
}

export { MongoDBStorage, initializeStorage, storage };
