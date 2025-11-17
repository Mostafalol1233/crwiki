import { connectMongoDB } from './mongodb';

export async function initializeDatabase() {
  try {
    await connectMongoDB();
    console.log('✅ Database connection initialized');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}