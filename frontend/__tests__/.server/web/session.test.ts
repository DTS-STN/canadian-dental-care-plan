import type { Request } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { MockProxy } from 'vitest-mock-extended';

import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';
import { ExpressSession, NoopSession } from '~/.server/web/session';
import type { SessionKey } from '~/.server/web/session';

describe('Session', () => {
  describe('ExpressSession', () => {
    let mockLogger: MockProxy<Logger>;
    let mockRequestSession: Request['session'];

    beforeEach(() => {
      mockLogger = mock<Logger>();

      vi.mocked(createLogger).mockReturnValue(mockLogger);
      mockRequestSession = {
        cookie: mock<Request['session']['cookie']>(),
        destroy: vi.fn(),
        id: 'mockSessionId',
        regenerate: vi.fn(),
        reload: vi.fn(),
        resetMaxAge: vi.fn(),
        save: vi.fn(),
        touch: vi.fn(),
      };
    });

    it('should initialize correctly', () => {
      const session = new ExpressSession(mockRequestSession);
      expect(session.id).toBe('mockSessionId');
    });

    describe('has', () => {
      it('should return true if key exists', () => {
        mockRequestSession.key = 'value';
        const session = new ExpressSession(mockRequestSession);
        expect(session.has('key' as SessionKey)).toBe(true);
      });

      it('should return false if key does not exist', () => {
        const session = new ExpressSession(mockRequestSession);
        expect(session.has('key' as SessionKey)).toBe(false);
      });

      it('should return false if key is reserved', () => {
        const session = new ExpressSession(mockRequestSession);
        expect(session.has('id' as SessionKey)).toBe(false);
      });

      it('should sanitize the key', () => {
        mockRequestSession['_sanitized_key___$__'] = 'value';
        const session = new ExpressSession(mockRequestSession);
        expect(session.has(' sanitized key!@#$%^' as SessionKey)).toBe(true);
      });
    });

    describe('find', () => {
      it('should return the value if key exists', () => {
        mockRequestSession.key = 'value';
        const session = new ExpressSession(mockRequestSession);
        expect(session.find('key' as SessionKey).unwrap()).toBe('value');
      });

      it('should return undefined if key does not exist', () => {
        const session = new ExpressSession(mockRequestSession);
        expect(session.find('key' as SessionKey).isNone()).toBe(true);
      });

      it('should sanitize the key', () => {
        mockRequestSession['_sanitized_key___$__'] = 'value';
        const session = new ExpressSession(mockRequestSession);
        expect(session.find(' sanitized key!@#$%^' as SessionKey).unwrap()).toBe('value');
      });
    });

    describe('get', () => {
      it('should return the value if key exists', () => {
        mockRequestSession.key = 'value';
        const session = new ExpressSession(mockRequestSession);
        expect(session.get('key' as SessionKey)).toBe('value');
      });

      it('should throw an error if key does not exist', () => {
        const session = new ExpressSession(mockRequestSession);
        expect(() => session.get('key' as SessionKey)).toThrowError("Key 'key' not found in session [mockSessionId]");
      });

      it('should sanitize the key', () => {
        mockRequestSession['_sanitized_key___$__'] = 'value';
        const session = new ExpressSession(mockRequestSession);
        expect(session.get(' sanitized key!@#$%^' as SessionKey)).toBe('value');
      });
    });

    describe('set', () => {
      it('should set the value and call save', () => {
        const session = new ExpressSession(mockRequestSession);
        session.set('key' as SessionKey, 'value');
        expect(mockRequestSession.key).toBe('value');
      });

      it('should sanitize the key', () => {
        const session = new ExpressSession(mockRequestSession);
        session.set(' sanitized key!@#$%^' as SessionKey, 'value');
        expect(mockRequestSession['_sanitized_key___$__']).toBe('value');
      });
    });

    describe('unset', () => {
      it('should unset the value and call save', () => {
        mockRequestSession.key = 'value';
        const session = new ExpressSession(mockRequestSession);
        expect(session.unset('key' as SessionKey)).toBe(true);
        expect(mockRequestSession.key).toBeUndefined();
      });

      it('should return false if key does not exist', () => {
        const session = new ExpressSession(mockRequestSession);
        expect(session.unset('key' as SessionKey)).toBe(false);
        expect(mockRequestSession.save).not.toHaveBeenCalled();
      });

      it('should sanitize the key', () => {
        mockRequestSession._sanitized_key___$__ = 'value';
        const session = new ExpressSession(mockRequestSession);
        expect(session.unset(' sanitized key!@#$%^' as SessionKey)).toBe(true);
        expect(mockRequestSession['_sanitized_key___$__']).toBeUndefined();
      });
    });

    describe('destroy', () => {
      it('should destroy the session and call save', () => {
        const session = new ExpressSession(mockRequestSession);
        session.destroy();
        expect(mockRequestSession.destroy).toHaveBeenCalledOnce();
      });
    });

    describe('sanitizeKey', () => {
      it('should sanitize the key', () => {
        const session = new ExpressSession(mockRequestSession);
        const sanitizedKey = session['sanitizeKey'](' sanitized key!@#$%^');
        expect(sanitizedKey).toBe('_sanitized_key___$__');
      });

      it('should throw an error if key is empty', () => {
        const session = new ExpressSession(mockRequestSession);
        expect(() => session['sanitizeKey'](' ')).toThrowError('Session key cannot be empty');
      });

      it('should prepend an underscore if the key starts with a number', () => {
        const session = new ExpressSession(mockRequestSession);
        const sanitizedKey = session['sanitizeKey']('123key');
        expect(sanitizedKey).toBe('_123key');
      });
    });

    describe('assertNotReservedKey', () => {
      it('should not throw an error if the key is not reserved', () => {
        const session = new ExpressSession(mockRequestSession);
        expect(() => session['assertNotReservedKey']('test-key')).not.toThrowError();
      });

      it.each(ExpressSession.SESSION_RESERVED_KEYS)('should throw an error if the key [%s] is reserved', (key) => {
        const session = new ExpressSession(mockRequestSession);
        expect(() => session['assertNotReservedKey'](key)).toThrowError(`Session key '${key}' is reserved`);
      });
    });
  });

  describe('NoopSession', () => {
    let session: NoopSession;

    beforeEach(() => {
      session = new NoopSession();
    });

    it('should throw error on id access', () => {
      expect(() => session.id).toThrowError('No session available in stateless context');
    });

    it('should always return false for has', () => {
      expect(session.has('anyKey' as SessionKey)).toBe(false);
    });

    it('should always return undefined for find', () => {
      expect(session.find('anyKey' as SessionKey).isNone()).toBe(true);
    });

    it('should throw error on get', () => {
      expect(() => session.get('anyKey' as SessionKey)).toThrowError('No session available in stateless context');
    });

    it('should throw error on set', () => {
      expect(() => session.set('anyKey' as SessionKey, 'anyValue')).toThrowError('No session available in stateless context');
    });

    it('should always return false for unset', () => {
      expect(session.unset('anyKey' as SessionKey)).toBe(false);
    });

    it('should not throw error on destroy', () => {
      expect(() => session.destroy()).not.toThrowError();
    });
  });
});
