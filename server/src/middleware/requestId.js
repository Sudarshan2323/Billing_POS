import { nanoid } from 'nanoid';

export function requestIdMiddleware(req, res, next) {
  const incomingId = req.headers['x-request-id'];
  const id = typeof incomingId === 'string' && incomingId ? incomingId : nanoid(10);
  req.id = id;
  res.setHeader('x-request-id', id);
  next();
}
