export class AppError extends Error {
  constructor(code, statusCode, message, details) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details) {
    super('NOT_FOUND', 404, message, details);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details) {
    super('BAD_REQUEST', 400, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details) {
    super('UNAUTHORIZED', 401, message, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details) {
    super('FORBIDDEN', 403, message, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', details) {
    super('CONFLICT', 409, message, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details) {
    super('VALIDATION_ERROR', 422, message, details);
  }
}
