import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from './logger.js';

let isConnected = false;

export async function connectDB() {
  if (isConnected) return mongoose;

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 20,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 2000, // fast timeout
    });
    isConnected = true;
    return conn;
  } catch (error) {
    isConnected = false;
    throw error;
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}
