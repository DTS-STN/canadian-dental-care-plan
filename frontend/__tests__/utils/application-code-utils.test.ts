import { describe, expect, it } from 'vitest';

import { isValidApplicationCode } from '~/utils/application-code-utils';

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
});
