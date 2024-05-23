import { describe, expect, it } from 'vitest';

import { formatSubmissionApplicationCode, isValidApplicationCode } from '~/utils/application-code-utils';

describe('~/utils/application-code-utils.ts', () => {
  describe('isValidApplicationCode()', () => {
    it('should return true for a valid application code (6 digits)', () => {
      expect(isValidApplicationCode('123456')).toEqual(true);
    });

    it('should return true for a valid client number (11 digits)', () => {
      expect(isValidApplicationCode('12345678901')).toEqual(true);
    });

    it('should return true for a valid confirmation number (13 digits)', () => {
      expect(isValidApplicationCode('1234567890123')).toEqual(true);
    });

    it('should return false for any string that is not 6|11|13 digits in length', () => {
      expect(isValidApplicationCode('123')).toEqual(false);
    });

    it('should return false for inputs that are of valid length and invalid charatcers', () => {
      expect(isValidApplicationCode('123ABC')).toEqual(false);
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
});
