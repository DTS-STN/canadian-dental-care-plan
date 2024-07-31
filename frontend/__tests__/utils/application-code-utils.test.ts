import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatSubmissionApplicationCode, isValidCodeOrNumber } from '~/utils/application-code-utils';

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

    it;
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
