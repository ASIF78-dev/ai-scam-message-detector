import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';
import { signToken } from '../src/utils/jwt.js';

describe('Backend API Security, CORS, Helmet, and Input Validation Suite', () => {
  let server;
  let baseUrl;

  before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // ==========================================
  // 1. Helmet Security HTTP Headers Tests
  // ==========================================
  describe('Helmet Security Headers', () => {
    it('should set essential security headers on responses', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.equal(res.status, 200);

      // X-Content-Type-Options
      assert.equal(res.headers.get('x-content-type-options'), 'nosniff');

      // X-Frame-Options
      assert.equal(res.headers.get('x-frame-options'), 'DENY');

      // Content-Security-Policy
      const csp = res.headers.get('content-security-policy');
      assert.ok(csp, 'CSP header should be present');
      assert.ok(csp.includes("default-src 'self'"), 'CSP should restrict default-src to self');
      assert.ok(csp.includes("frame-ancestors 'none'"), 'CSP should deny framing');

      // Strict-Transport-Security (HSTS)
      assert.ok(res.headers.get('strict-transport-security'), 'HSTS header should be present');

      // Referrer-Policy
      assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    });
  });

  // ==========================================
  // 2. CORS Configuration Tests
  // ==========================================
  describe('CORS Configuration', () => {
    it('should allow requests from whitelisted origins', async () => {
      const res = await fetch(`${baseUrl}/api/health`, {
        headers: {
          Origin: 'http://localhost:5173',
        },
      });
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:5173');
      assert.equal(res.headers.get('access-control-allow-credentials'), 'true');
    });

    it('should block requests from unauthorized origins', async () => {
      const res = await fetch(`${baseUrl}/api/health`, {
        headers: {
          Origin: 'http://malicious-phishing-host.xyz',
        },
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.error, true);
      assert.equal(data.code, 'CORS_FORBIDDEN');
    });

    it('should respond to preflight OPTIONS requests with allowed methods', async () => {
      const res = await fetch(`${baseUrl}/api/scans/analyze`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:5173',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization',
        },
      });
      assert.equal(res.status, 204);
      assert.ok(res.headers.get('access-control-allow-methods').includes('POST'));
    });
  });

  // ==========================================
  // 3. Input Validation Tests
  // ==========================================
  describe('Input Validation & Sanitization Middleware', () => {
    it('should reject scan analysis when message is omitted', async () => {
      const res = await fetch(`${baseUrl}/api/scans/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, true);
      assert.equal(data.code, 'VALIDATION_ERROR');
      assert.ok(data.message.includes('A message string is required'));
    });

    it('should reject scan analysis when message is empty or whitespace', async () => {
      const res = await fetch(`${baseUrl}/api/scans/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '     \n\t  ' }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, true);
      assert.equal(data.code, 'VALIDATION_ERROR');
      assert.ok(data.message.includes('Message cannot be empty'));
    });

    it('should reject scan analysis when message exceeds 5,000 characters', async () => {
      const hugeMessage = 'a'.repeat(5001);
      const res = await fetch(`${baseUrl}/api/scans/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: hugeMessage }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, true);
      assert.equal(data.code, 'PAYLOAD_TOO_LARGE');
    });

    it('should reject registration when email format is invalid', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane Doe',
          email: 'not-an-email',
          password: 'securePassword123',
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, true);
      assert.equal(data.code, 'VALIDATION_ERROR');
      assert.ok(data.message.includes('valid email'));
    });

    it('should reject registration when password is under 6 characters', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane Doe',
          email: 'valid@example.com',
          password: '123',
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, true);
      assert.equal(data.code, 'VALIDATION_ERROR');
      assert.ok(data.message.includes('at least 6 characters'));
    });

    it('should reject feedback submission with invalid scanId format', async () => {
      const res = await fetch(`${baseUrl}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: 'not-a-valid-hex-objectid',
          isCorrect: true,
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, true);
      assert.equal(data.code, 'VALIDATION_ERROR');
      assert.ok(data.message.includes('valid 24-character scanId'));
    });

    it('should reject feedback submission when isCorrect is not a boolean', async () => {
      const res = await fetch(`${baseUrl}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: '507f1f77bcf86cd799439011',
          isCorrect: 'yes',
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, true);
      assert.equal(data.code, 'VALIDATION_ERROR');
      assert.ok(data.message.includes('boolean'));
    });
  });

  // ==========================================
  // 4. Admin Authentication & Authorization Tests
  // ==========================================
  describe('Admin Authentication & Authorization Guards', () => {
    it('should block unauthenticated access to admin routes with 401', async () => {
      const res = await fetch(`${baseUrl}/api/admin/analytics`);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.error, true);
      assert.equal(data.code, 'UNAUTHORIZED');
    });

    it('should reject requests with invalid/tampered JWT tokens with 401', async () => {
      const res = await fetch(`${baseUrl}/api/admin/analytics`, {
        headers: {
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.signature',
        },
      });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.error, true);
      assert.equal(data.code, 'INVALID_TOKEN');
    });
  });

  // ==========================================
  // 5. Login Rate Limiting
  // ==========================================
  describe('Login Rate Limiting', () => {
    it('should return 429 after too many failed login attempts', async () => {
      const payload = {
        email: 'rate-limit-login@example.com',
        password: 'wrong-password',
      };

      let lastRes;
      for (let i = 0; i < 6; i += 1) {
        lastRes = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      assert.equal(lastRes.status, 429);
      const data = await lastRes.json();
      assert.equal(data.error, true);
      assert.equal(data.code, 'LOGIN_RATE_LIMIT_EXCEEDED');
      assert.ok(data.message.toLowerCase().includes('too many login'));
    });
  });

  // ==========================================
  // 6. API Error Handling & 404 Tests
  // ==========================================
  describe('API Error Handling & 404 Fallback', () => {
    it('should return standardized JSON 404 on undefined routes', async () => {
      const res = await fetch(`${baseUrl}/api/undefined-threat-route`);
      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.error, true);
      assert.equal(data.code, 'ROUTE_NOT_FOUND');
      assert.ok(data.message.includes('Cannot GET /api/undefined-threat-route'));
    });
  });
});
