import mongoose from 'mongoose';

/**
 * Escapes special regex characters in user input to prevent ReDoS (Regular Expression Denial of Service)
 * and syntax injection into MongoDB regular expressions.
 */
export function escapeRegex(text = '') {
  if (typeof text !== 'string') return '';
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validates whether a given string is a valid 24-character hexadecimal MongoDB ObjectId.
 */
export function isValidObjectId(id) {
  return typeof id === 'string' && mongoose.isValidObjectId(id);
}

/**
 * Sanitizes input strings by trimming whitespace and stripping dangerous control characters.
 */
export function sanitizeText(text = '', maxLength = 5000) {
  if (typeof text !== 'string') return '';
  // Strip null bytes and control chars except newlines and tabs
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates email structure using RFC 5322 compliant regex pattern.
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  if (email.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email);
}
