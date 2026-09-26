import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: true,
        code: 'UNAUTHORIZED',
        message: 'Authentication required. No authorization token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        error: true,
        code: 'ACCOUNT_NOT_FOUND',
        message: 'User account not found or has been removed.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      error: true,
      code: 'INVALID_TOKEN',
      message: 'Invalid or expired authentication token.',
    });
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (user) {
        req.user = user;
      }
    }
  } catch (err) {
    // If token is invalid, continue as unauthenticated guest
    req.user = null;
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: true,
      code: 'FORBIDDEN',
      message: 'Access denied. Administrator privileges required.',
    });
  }
  next();
}

