/**
 * 404 handler for undefined API routes.
 */
export function notFoundHandler(req, res) {
  return res.status(404).json({
    error: true,
    code: 'ROUTE_NOT_FOUND',
    message: `Resource not found: Cannot ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Centralized API Error Handling Middleware.
 * Catches all runtime exceptions, Mongoose cast/validation errors, and JWT errors.
 * Guarantees a consistent JSON error schema and prevents stack trace leakage in production.
 */
export function globalErrorHandler(err, req, res, next) {
  // Check if headers have already been sent
  if (res.headersSent) {
    return next(err);
  }

  const isDev = process.env.NODE_ENV !== 'production';

  // Log error internally
  if (isDev) {
    console.error('API Exception [DEV]:', err);
  } else {
    console.error(`API Exception [PROD]: ${err.name} - ${err.message}`);
  }

  // 1. Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: true,
      code: 'INVALID_IDENTIFIER',
      message: `Invalid format for resource parameter '${err.path}'.`,
    });
  }

  // 2. Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    return res.status(400).json({
      error: true,
      code: 'DATABASE_VALIDATION_ERROR',
      message: messages.join(', ') || 'Validation failed on model schema.',
    });
  }

  // 3. JWT Verification or Expiration Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: true,
      code: 'INVALID_TOKEN',
      message: 'Malformed or tampered authorization token.',
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: true,
      code: 'TOKEN_EXPIRED',
      message: 'Authorization token has expired. Please sign in again.',
    });
  }

  // 4. CORS Rejected Origin
  if (err.message && err.message.startsWith('CORS blocked')) {
    return res.status(403).json({
      error: true,
      code: 'CORS_FORBIDDEN',
      message: err.message,
    });
  }

  // 5. Explicit HTTP Status on Error
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'An unexpected internal server error occurred.';

  return res.status(statusCode).json({
    error: true,
    code: err.code || 'INTERNAL_SERVER_ERROR',
    message,
    ...(isDev && { stack: err.stack }),
  });
}
