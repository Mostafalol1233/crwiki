import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { parse } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPathCandidates = [
    join(__dirname, '.env'),
    join(__dirname, '.env.local'),
];

for (const candidate of envPathCandidates) {
    try {
        const content = readFileSync(candidate, 'utf8');
        const parsed = parse(content);
        for (const key in parsed) {
            if (!process.env[key]) {
                process.env[key] = parsed[key];
            }
        }
    } catch { }
}

const MONGODB_URI = process.env.MONGODB_URI;
const globalWithMongoose = global;
let cached = globalWithMongoose.mongoose || { conn: null, promise: null };

if (!globalWithMongoose.mongoose) {
    globalWithMongoose.mongoose = cached;
}

export async function connectMongoDB() {
    if (cached.conn) {
        console.log('📡 Using cached MongoDB connection');
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: true,
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            console.log('✅ New MongoDB connection established');
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
        return cached.conn;
    } catch (e) {
        cached.promise = null;
        throw e;
    }
}

export async function disconnectMongoDB() {
    if (cached.conn) {
        await mongoose.disconnect();
        cached.conn = null;
        cached.promise = null;
        console.log('❌ MongoDB disconnected');
    }
}

// Handle connection errors
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    cached.promise = null;
    cached.conn = null;
});
