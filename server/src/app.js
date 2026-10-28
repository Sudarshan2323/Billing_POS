import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { isDbConnected } from './lib/db.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { NotFoundError } from './lib/errors.js';

// Route imports
import { authRouter } from './modules/auth/auth.routes.js';
import { productsRouter } from './modules/products/products.routes.js';
import { partiesRouter } from './modules/parties/parties.routes.js';
import { invoicesRouter } from './modules/invoices/invoices.routes.js';
import { reportsRouter } from './modules/reports/reports.routes.js';
import { aiRouter } from './modules/ai/ai.routes.js';

export function createApp() {
  const app = express();

  // Security
  app.use(helmet());
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'x-request-id'],
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(mongoSanitize());
  app.use(requestIdMiddleware);

  app.use(
    pinoHttp({
      logger,
      genReqId: req => req.id || 'req',
      autoLogging: {
        ignore: req => req.url === '/health' || req.url === '/ready',
      },
    })
  );

  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please slow down.',
      },
    },
  });
  app.use(limiter);

  // System Health Endpoints
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/ready', (_req, res) => {
    const connected = isDbConnected();
    if (!connected) {
      return res.status(503).json({
        status: 'not_ready',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }
    res.status(200).json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/v1/health', (_req, res) => {
    res.status(200).json({
      data: {
        status: 'ok',
        version: 'v1',
        time: new Date().toISOString(),
      },
    });
  });

  // API Modules
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/products', authMiddleware, productsRouter);
  app.use('/api/v1/parties', authMiddleware, partiesRouter);
  app.use('/api/v1/invoices', authMiddleware, invoicesRouter);
  app.use('/api/v1/reports', authMiddleware, reportsRouter);
  app.use('/api/v1/ai', aiRouter);

  // 404 Handler
  app.use((req, _res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
}
