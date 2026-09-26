import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import scanRoutes from './routes/scanRoutes.js';
import authRoutes from './routes/authRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// ==========================================
// 1. Helmet Security HTTP Headers
// ==========================================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: [
          "'self'",
          process.env.CLIENT_URL || 'http://localhost:5173',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:8000',
        ],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    frameguard: { action: 'deny' },
  })
);

// ==========================================
// 2. Strict CORS Configuration
// ==========================================
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps or curl/testing)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked: Origin '${origin}' not allowed.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
    maxAge: 86400,
  })
);

// ==========================================
// 3. Request Payload Limits
// ==========================================
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// ==========================================
// 4. Rate Limiting Configuration
// ==========================================
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: true,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP address. Please wait 15 minutes before retrying.',
    });
  },
});
app.use('/api', globalLimiter);

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: true,
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
    });
  },
});

export const scanLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30, // 30 scans per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: true,
      code: 'SCAN_RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded for message analysis. Please wait a moment before scanning again.',
    });
  },
});

export const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: true,
      code: 'FEEDBACK_RATE_LIMIT_EXCEEDED',
      message: 'Too many feedback submissions. Please wait before submitting more feedback.',
    });
  },
});

// ==========================================
// 5. Health Check & API Routes
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'scamshield-server',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/scans', scanLimiter, scanRoutes);
app.use('/api/messages', scanLimiter, scanRoutes);
app.use('/api/feedback', feedbackLimiter, feedbackRoutes);
app.use('/api/admin', adminRoutes);

// ==========================================
// 6. Centralized Error Handling & 404
// ==========================================
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
