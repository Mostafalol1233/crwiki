/**
 * Database connection initialization module
 * This module handles the async database connection setup
 */

import { connectMongoDB } from './mongodb.js';

export async function initializeDatabase() {
  try {
    console.log('Initializing database connection...');
    const connection = await connectMongoDB();
    console.log('Database connected successfully');
    return connection;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}
