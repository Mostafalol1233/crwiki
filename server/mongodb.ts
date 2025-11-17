import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { parse } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '..', '.env');
const envLocalPath = join(__dirname, '..', '.env.local');

try {
  const envFile = readFileSync(envPath, 'utf8');
  const envVars = parse(envFile);
  for (const key in envVars) {
    if (!process.env[key]) {
      process.env[key] = envVars[key];
    }
  }
} catch (err) {
  // .env file might not exist, that's ok
}

try {
  const envLocalFile = readFileSync(envLocalPath, 'utf8');
  const envLocalVars = parse(envLocalFile);
  for (const key in envLocalVars) {
    if (!process.env[key]) {
      process.env[key] = envLocalVars[key];
    }
  }
} catch (err) {
  // .env.local file might not exist, that's ok
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

type Cached = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = global as unknown as { mongoose?: Cached };

let cached: Cached = globalWithMongoose.mongoose || { conn: null, promise: null };
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
    };

    cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((mongoose) => {
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
