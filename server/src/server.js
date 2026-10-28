import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { connectDB, disconnectDB } from './lib/db.js';

async function bootstrap() {
  try {
    // Attempt DB connection gracefully
    logger.info('Checking MongoDB connection...');
    try {
      await connectDB();
      logger.info('Connected to MongoDB Atlas');
    } catch (_dbErr) {
      logger.info('MongoDB connection unavailable. Running backend in standalone offline mode.');
    }

    const app = createApp();
    const server = app.listen(env.PORT, () => {
      logger.info(`BillBook Server listening on http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
    });

    server.on('error', err => {
      if (err.code === 'EADDRINUSE') {
        logger.warn(`Port ${env.PORT} is already in use by another instance.`);
      } else {
        logger.error({ err }, 'HTTP server error');
      }
    });

    const shutdown = async signal => {
      logger.info(`Received ${signal}. Shutting down server gracefully...`);
      server.close(async () => {
        await disconnectDB();
        logger.info('Clean shutdown complete');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 5000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    logger.fatal({ error }, 'Fatal error starting server');
  }
}

void bootstrap();
