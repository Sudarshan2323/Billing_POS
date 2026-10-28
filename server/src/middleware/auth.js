import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError, ForbiddenError } from '../lib/errors.js';

export function authMiddleware(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If running in development without auth header, provide a default shop context
    if (env.NODE_ENV === 'development') {
      req.ctx = {
        userId: '65f000000000000000000001',
        businessId: '65f000000000000000000002',
        role: 'owner',
      };
      return next();
    }
    return next(new UnauthorizedError('Missing or invalid authorization token'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.ctx = {
      userId: decoded.userId,
      businessId: decoded.businessId,
      role: decoded.role,
    };
    next();
  } catch (_err) {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.ctx || !roles.includes(req.ctx.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }
    next();
  };
}
