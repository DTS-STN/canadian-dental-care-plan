import { describe, expect, it } from 'vitest';

import { findMimeType, getMimeType, isValidExtension } from '~/utils/file.utils';

describe('file.utils', () => {
  describe('findMimeType', () => {
    it('should return Some with MIME type for valid extension', () => {
      const result = findMimeType('.pdf');
      expect(result.isSome()).toBe(true);
      expect(result.unwrap()).toBe('application/pdf');
    });

    it('should return Some with MIME type for .json extension', () => {
      const result = findMimeType('.json');
      expect(result.isSome()).toBe(true);
      expect(result.unwrap()).toBe('application/json');
    });

    it('should return None for extension without leading dot', () => {
      const result = findMimeType('pdf');
      expect(result.isNone()).toBe(true);
    });

    it('should return None for unknown extension', () => {
      const result = findMimeType('.asdf');
      expect(result.isNone()).toBe(true);
    });

    it('should return None for empty string', () => {
      const result = findMimeType('');
      expect(result.isNone()).toBe(true);
    });
  });

  describe('getMimeType', () => {
    it('should return MIME type for valid extension', () => {
      expect(getMimeType('.pdf')).toBe('application/pdf');
    });

    it('should return MIME type for .json extension', () => {
      expect(getMimeType('.json')).toBe('application/json');
    });

    it('should throw error for extension without leading dot', () => {
      expect(() => getMimeType('pdf')).toThrow('MIME type not found for extension: pdf');
    });

    it('should throw error for unknown extension', () => {
      expect(() => getMimeType('.asdf')).toThrow('MIME type not found for extension: .asdf');
    });
  });

  describe('isValidExtension', () => {
    it('should return true for valid extension', () => {
      expect(isValidExtension('.pdf')).toBe(true);
    });

    it('should return true for .json extension', () => {
      expect(isValidExtension('.json')).toBe(true);
    });

    it('should return false for extension without leading dot', () => {
      expect(isValidExtension('pdf')).toBe(false);
    });

    it('should return false for unknown extension', () => {
      expect(isValidExtension('.asdf')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidExtension('')).toBe(false);
    });
  });
});
