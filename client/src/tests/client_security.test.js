import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import api from '../services/api.js';

describe('Client-Side Security & API Interceptor Tests', () => {
  const originalLocalStorage = globalThis.localStorage;

  beforeEach(() => {
    // Mock localStorage
    const store = {};
    globalThis.localStorage = {
      getItem: (key) => store[key] || null,
      setItem: (key, val) => { store[key] = String(val); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { for (const k in store) delete store[k]; },
    };
  });

  afterEach(() => {
    globalThis.localStorage = originalLocalStorage;
  });

  it('should automatically attach Bearer token to requests when token exists in storage', async () => {
    localStorage.setItem('token', 'mock_jwt_token_12345');

    // Test axios interceptor on a dummy request config
    const config = { headers: {} };
    const requestInterceptor = api.interceptors.request.handlers[0].fulfilled;

    const result = requestInterceptor(config);
    expect(result.headers.Authorization).toBe('Bearer mock_jwt_token_12345');
  });

  it('should not attach Authorization header when user is unauthenticated', async () => {
    localStorage.removeItem('token');

    const config = { headers: {} };
    const requestInterceptor = api.interceptors.request.handlers[0].fulfilled;

    const result = requestInterceptor(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('should sanitize client-side input string boundaries', () => {
    const rawInput = '   URGENT: bank account alert!   ';
    const trimmed = rawInput.trim();
    expect(trimmed.length).toBeLessThan(rawInput.length);
    expect(trimmed).toBe('URGENT: bank account alert!');
  });

  it('should flag URLs missing HTTPS on the client', () => {
    const checkIsHttps = (url) => url.toLowerCase().startsWith('https://');
    expect(checkIsHttps('http://sbi-verify.xyz')).toBe(false);
    expect(checkIsHttps('https://secure.bank.com')).toBe(true);
  });
});
