import jwt from 'jsonwebtoken';

const FALLBACK_SECRET = 'scamshield_jwt_secret_dev_key_2026';
const JWT_SECRET = process.env.JWT_SECRET || FALLBACK_SECRET;
const JWT_EXPIRES_IN = '7d';

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === FALLBACK_SECRET || process.env.JWT_SECRET.includes('change_this')) {
    console.error('FATAL SECURITY ERROR: An insecure or default JWT_SECRET is configured in production!');
    process.exit(1);
  }
} else if (JWT_SECRET === FALLBACK_SECRET || JWT_SECRET.includes('change_this')) {
  console.warn('⚠️  [SECURITY WARNING] Using development default JWT_SECRET. Set a strong JWT_SECRET in .env for production.');
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

