import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export function errorHandler(err, req, res, _next) {
  const reqId = req.id || 'unknown';

  if (err instanceof AppError) {
    logger.warn({ reqId, code: err.code, status: err.statusCode, message: err.message }, 'Application error');
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  if (err instanceof ZodError) {
    logger.warn({ reqId, issues: err.issues }, 'Validation error');
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: err.issues,
      },
    });
  }

  logger.error({ reqId, err }, 'Unhandled server error');
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred',
    },
  });
}
