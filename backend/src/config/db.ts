import mongoose from 'mongoose';
import { config } from './env.js';

let isConnected = false;

export async function connectDatabase(): Promise<boolean> {
  if (!config.MONGODB_URI) {
    console.warn('[CampusPulse DB] MONGODB_URI is not provided in environment. Running with in-memory storage fallback for local evaluation.');
    return false;
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('[CampusPulse DB] Successfully connected to MongoDB Atlas');
    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[CampusPulse DB] Connection failure: ${message}. Running with memory fallback.`);
    isConnected = false;
    return false;
  }
}

export function isDbConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export async function disconnectDatabase(): Promise<void> {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[CampusPulse DB] Disconnected gracefully');
  }
}

// Graceful process shutdown handlers
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});
