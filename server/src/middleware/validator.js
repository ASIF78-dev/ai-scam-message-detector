import { isValidEmail, isValidObjectId, sanitizeText } from '../utils/security.js';

/**
 * Validates message analysis payload.
 * Enforces string type, presence, and max length to prevent Denial of Service.
 */
export function validateScanInput(req, res, next) {
  const { message } = req.body;

  if (message === undefined || message === null || typeof message !== 'string') {
    return res.status(400).json({
      error: true,
      code: 'VALIDATION_ERROR',
      message: 'A message string is required for scanning.',
    });
  }

  const cleaned = sanitizeText(message, 5000);

  if (cleaned.length === 0) {
    return res.status(400).json({
      error: true,
      code: 'VALIDATION_ERROR',
      message: 'Message cannot be empty or contain only whitespace.',
    });
  }

  if (message.length > 5000) {
    return res.status(400).json({
      error: true,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Message exceeds maximum permitted length of 5,000 characters.',
    });
  }

  req.body.message = cleaned;
  next();
}

/**
 * Validates user registration payload.
 */
export function validateRegisterInput(req, res, next) {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({
      error: true,
      code: 'VALIDATION_ERROR',
      message: 'Name is required.',
    });
  }

  const trimmedName = name.trim();
  if (trimmedName.length < 2 || trimmedName.length > 60) {
    return res.status(400).json({
      error: true,
      code: 'VALIDATION_ERROR',
      message: 'Name must be between 2 and 60 characters long.',
    });
  }

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({
      error: true,
      code: 'VALIDATION_ERROR',
      message: 'A valid email address is required.',
    });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      error: true,
      code: 'VALIDATION_ERROR',
      message: 'Password must be at least 6 characters long.',
    });
  }

  if (password.length > 128) {
    return res.status(400).json({
      error: true,
      code: 'VALIDATION_ERROR',
      message: 'Password cannot exceed 128 characters.',
    });
  }

  req.body.name = trimmedName;
  req.body.email = email.toLowerCase().trim();
  next();
}

/**
 * Validates login payload.
 */
export function validateLoginInput(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: true,
      code: 'VALIDATION_ERROR',
      message: 'Both email and password are required.',
    });
  }

  if (typeof email !== 'string' || !isValidEmail(email)) {
    return res.status(400).json({
      error: true,
      code: 'VALIDATION_ERROR',
      message: 'A valid email address is required.',
    });
  }

  req.body.email = email.toLowerCase().trim();
  next();
}

/**
 * Validates model feedback payload.
 */
export function validateFeedbackInput(req, res, next) {
  const { scanId, isCorrect, userCorrection, comment } = req.body;

  if (!scanId || !isValidObjectId(scanId)) {
    return res.status(400).json({
      error: true,
      code: 'VALIDATION_ERROR',
      message: 'A valid 24-character scanId is required.',
    });
  }

  if (typeof isCorrect !== 'boolean') {
    return res.status(400).json({
      error: true,
      code: 'VALIDATION_ERROR',
      message: 'isCorrect must be a boolean (true or false).',
    });
  }

  if (userCorrection && !['scam', 'suspicious', 'normal', 'safe'].includes(userCorrection.toLowerCase())) {
    return res.status(400).json({
      error: true,
      code: 'VALIDATION_ERROR',
      message: 'userCorrection must be one of: scam, suspicious, normal, safe.',
    });
  }

  if (comment && (typeof comment !== 'string' || comment.length > 1000)) {
    return res.status(400).json({
      error: true,
      code: 'VALIDATION_ERROR',
      message: 'Comment must be a string under 1,000 characters.',
    });
  }

  next();
}

/**
 * Validates user role update parameters.
 */
export function validateRoleUpdateInput(req, res, next) {
  const { id } = req.params;
  const { role } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({
      error: true,
      code: 'VALIDATION_ERROR',
      message: 'Invalid user ID format.',
    });
  }

  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({
      error: true,
      code: 'VALIDATION_ERROR',
      message: 'Role must be either "user" or "admin".',
    });
  }

  next();
}
