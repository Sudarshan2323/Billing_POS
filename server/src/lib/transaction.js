import mongoose from 'mongoose';
import { logger } from './logger.js';

/**
 * Executes a callback inside a MongoDB transaction with snapshot read concern
 * and majority write concern on MongoDB Atlas replica set.
 */
export async function withTxn(callback) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(
      async () => {
        result = await callback(session);
      },
      {
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
      }
    );
    return result;
  } catch (error) {
    logger.error({ error }, 'Transaction aborted');
    throw error;
  } finally {
    await session.endSession();
  }
}
