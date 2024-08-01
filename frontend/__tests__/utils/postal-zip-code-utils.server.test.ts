import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatPostalCode, isValidPostalCode } from '~/utils/postal-zip-code-utils.server';

vi.mock('~/utils/env-utils.server', () => ({
  getEnv: vi.fn().mockReturnValue({
    CANADA_COUNTRY_ID: 'CA',
    USA_COUNTRY_ID: 'US',
  }),
}));

describe('~/utils/postal-zip-code-utils.server.ts', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isValidPostalCode()', () => {
    // Canadian Postal Codes
    it('should return true for Canadian postal code without space', () => {
      expect(isValidPostalCode('CA', 'H0H0H0')).toEqual(true);
    });

    it('should return true Canadian postal code with space', () => {
      expect(isValidPostalCode('CA', 'H0H 0H0')).toEqual(true);
    });

    it('should return false for Canadian postal code with too many spaces', () => {
      expect(isValidPostalCode('CA', 'H0H  0H0')).toEqual(false);
    });

    it('should return false for Canadian postal code of invalid format', () => {
      expect(isValidPostalCode('CA', 'H0H0')).toEqual(false);
    });

    // American Zip Code
    it('should return true for American zip code without space', () => {
      expect(isValidPostalCode('US', '12345')).toEqual(true);
    });

    it('should return true for American zip code with 9 digits', () => {
      expect(isValidPostalCode('US', '123456789')).toEqual(true);
    });

    it('should return true for American zip code with 9 digits and hyphen', () => {
      expect(isValidPostalCode('US', '12345-6789')).toEqual(true);
    });

    it('should return false for American zip code of invalid format', () => {
      expect(isValidPostalCode('US', '123')).toEqual(false);
    });

    it('should return true for country codes that are not Canadian or American codes', () => {
      expect(isValidPostalCode('XYZ', 'ABC 123')).toEqual(true);
    });
  });

  describe('formatPostalCode()', () => {
    it('should format Canadian postal code without space in middle', () => {
      expect(formatPostalCode('CA', 'H0H0H0')).toEqual('H0H 0H0');
    });

    it('should format Canadian postal code with space in middle', () => {
      expect(formatPostalCode('CA', 'H0H 0H0')).toEqual('H0H 0H0');
    });

    it('should return the input if country code is American and the zip code is valid', () => {
      expect(formatPostalCode('US', '12345')).toEqual('12345');
    });

    it('should return the input if country code is American and the zip code is valid', () => {
      expect(formatPostalCode('US', '123456789')).toEqual('12345-6789');
    });

    it('should return the input if country code is American and the zip code is valid', () => {
      expect(formatPostalCode('US', '12345-6789')).toEqual('12345-6789');
    });

    it('should throw an error if the country code is Canadian and the format is invalid', () => {
      expect(() => formatPostalCode('CA', 'H0H  0H0')).toThrowError();
    });

    it('should throw an error if the country code is American and the format is invalid', () => {
      expect(() => formatPostalCode('US', '123')).toThrowError();
    });
  });
});
