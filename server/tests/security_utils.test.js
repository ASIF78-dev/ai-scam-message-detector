import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeRegex,
  isValidObjectId,
  sanitizeText,
  isValidEmail,
} from '../src/utils/security.js';

describe('Security Utilities & Input Sanitization Suite', () => {
  describe('escapeRegex', () => {
    it('should escape regular expression metacharacters that cause ReDoS', () => {
      const malicious = '.*+?^${}()|[]\\';
      const escaped = escapeRegex(malicious);
      assert.equal(escaped, '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
    });

    it('should safely compile escaped regex without throwing SyntaxError', () => {
      const brokenUserQuery = 'hello (world [test';
      const safe = escapeRegex(brokenUserQuery);
      assert.doesNotThrow(() => {
        const re = new RegExp(safe, 'i');
        assert.ok(re.test('Hello (World [Test'));
      });
    });

    it('should return empty string when input is non-string', () => {
      assert.equal(escapeRegex(null), '');
      assert.equal(escapeRegex(undefined), '');
      assert.equal(escapeRegex(123), '');
    });
  });

  describe('isValidObjectId', () => {
    it('should return true for valid 24-char hex ObjectIds', () => {
      assert.equal(isValidObjectId('507f1f77bcf86cd799439011'), true);
      assert.equal(isValidObjectId('65f32a90e38d39e14a82194b'), true);
    });

    it('should return false for invalid hex length or invalid chars', () => {
      assert.equal(isValidObjectId('invalid-id'), false);
      assert.equal(isValidObjectId('12345'), false);
      assert.equal(isValidObjectId('507f1f77bcf86cd79943901z'), false); // 'z' not hex
      assert.equal(isValidObjectId(null), false);
      assert.equal(isValidObjectId(undefined), false);
    });
  });

  describe('sanitizeText', () => {
    it('should trim surrounding whitespace', () => {
      assert.equal(sanitizeText('   hello world   '), 'hello world');
    });

    it('should strip null bytes and invisible control characters', () => {
      const withControlChars = 'scam\x00message\x07alert\x1B';
      assert.equal(sanitizeText(withControlChars), 'scammessagealert');
    });

    it('should truncate strings exceeding maxLength', () => {
      const longText = 'a'.repeat(6000);
      assert.equal(sanitizeText(longText, 5000).length, 5000);
    });
  });

  describe('isValidEmail', () => {
    it('should validate standard and modern email addresses', () => {
      assert.equal(isValidEmail('admin@scamshield.ai'), true);
      assert.equal(isValidEmail('user.name+tag@sub.domain.org'), true);
    });

    it('should reject invalid email patterns', () => {
      assert.equal(isValidEmail('plainaddress'), false);
      assert.equal(isValidEmail('@missingusername.com'), false);
      assert.equal(isValidEmail('missingatsign.com'), false);
      assert.equal(isValidEmail('user@.com'), false);
      assert.equal(isValidEmail(''), false);
      assert.equal(isValidEmail(null), false);
    });
  });
});
