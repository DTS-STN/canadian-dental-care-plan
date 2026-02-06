import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatClientNumber, formatSubmissionApplicationCode, isValidCodeOrNumber } from '~/utils/application-code-utils';

describe('~/utils/application-code-utils.ts', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('isValidCodeOrNumber()', () => {
    it.each([['123456'], ['123 456'], ['12345678901'], ['123 456 789 01'], ['1234567890123'], ['123 456 789 0123']])('should return true for a valid application code (6, 11 and 13 digits) with %s', (value) => {
      expect(isValidCodeOrNumber(value)).toEqual(true);
    });

    it.each([['12345'], ['123 45'], ['1234567'], ['123 456 7'], ['1234567890'], ['123 456 789 0'], ['123456789012'], ['123 456 789 012'], ['12345678901234'], ['123 456 789 01234']])(
      'should return false for any string that is not 6|11|13 digits in length',
      (value) => {
        expect(isValidCodeOrNumber(value)).toEqual(false);
      },
    );

    it('should return false for inputs that are of valid length and invalid charatcers', () => {
      expect(isValidCodeOrNumber('123ABC')).toEqual(false);
    });
  });

  describe('formatSubmissionApplicationCode()', () => {
    it('should format application code', () => {
      expect(formatSubmissionApplicationCode('1234567891011')).toEqual('123 456 789 1011');
    });

    it('should format application code with whitespace', () => {
      expect(formatSubmissionApplicationCode('123  456   7891011')).toEqual('123 456 789 1011');
    });

    it('should return the input if the application code is all digits but not length 13', () => {
      expect(formatSubmissionApplicationCode('123')).toEqual('123');
    });

    it('should return the input if the application code is invalid', () => {
      expect(formatSubmissionApplicationCode('123 abc')).toEqual('123 abc');
    });
  });

  describe('formatClientNumber()', () => {
    it('should format 11-digit client number', () => {
      expect(formatClientNumber('12345678901')).toEqual('123 4567 8901');
    });

    it('should format 11-digit client number with existing whitespace', () => {
      expect(formatClientNumber('123 456 789 01')).toEqual('123 4567 8901');
    });

    it('should format 11-digit client number with irregular whitespace', () => {
      expect(formatClientNumber('123  456   78901')).toEqual('123 4567 8901');
    });

    it('should return the input for 13-digit numbers (confirmation numbers)', () => {
      expect(formatClientNumber('1234567890123')).toEqual('1234567890123');
      expect(formatClientNumber('123 456 789 0123')).toEqual('123 456 789 0123');
    });

    it('should return the input for 6-digit numbers (application codes)', () => {
      expect(formatClientNumber('123456')).toEqual('123456');
      expect(formatClientNumber('123 456')).toEqual('123 456');
    });

    it('should return the input for numbers with invalid length', () => {
      expect(formatClientNumber('12345')).toEqual('12345');
      expect(formatClientNumber('1234567')).toEqual('1234567');
      expect(formatClientNumber('123456789012')).toEqual('123456789012');
      expect(formatClientNumber('12345678901234')).toEqual('12345678901234');
    });

    it('should return the input for non-digit characters', () => {
      expect(formatClientNumber('123abc')).toEqual('123abc');
      expect(formatClientNumber('123 456 789 ab')).toEqual('123 456 789 ab');
    });

    it('should handle empty string', () => {
      expect(formatClientNumber('')).toEqual('');
    });

    it('should handle partial client numbers', () => {
      expect(formatClientNumber('123')).toEqual('123');
      expect(formatClientNumber('1234')).toEqual('1234');
      expect(formatClientNumber('12345')).toEqual('12345');
      expect(formatClientNumber('123456')).toEqual('123456');
      expect(formatClientNumber('1234567')).toEqual('1234567');
      expect(formatClientNumber('12345678')).toEqual('12345678');
      expect(formatClientNumber('123456789')).toEqual('123456789');
      expect(formatClientNumber('1234567890')).toEqual('1234567890');
    });

    it('should preserve formatting for already properly formatted client numbers', () => {
      expect(formatClientNumber('123 4567 8901')).toEqual('123 4567 8901');
    });
  });
});
