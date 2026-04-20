import { describe, expect, it } from 'vitest';

import { formatSin, isValidSin, sanitizeSin, sinInputPatternFormat } from '~/utils/sin-utils';

describe('isValidSin', () => {
  it.each([['900000001'], ['900 000 001'], ['900-000-001'], ['800000002'], ['800 000 002'], ['800-000-002']])('should return true for valid SIN "%s"', (sin) => {
    expect(isValidSin(sin)).toEqual(true);
  });

  it.each([['000000042'], ['000 000 042'], ['000-000-042'], ['800000003'], ['800 000 003'], ['800-000-003']])('should return false for invalid SIN "%s"', (sin) => {
    expect(isValidSin(sin)).toEqual(false);
  });

  it('should return false for an invalid SIN of incorrect length', () => {
    expect(isValidSin('123456')).toEqual(false);
  });

  it('should return false for an invalid SIN of incorrect form', () => {
    expect(isValidSin('123abc&^+')).toEqual(false);
  });

  it('should return false when passed an empty string', () => {
    expect(isValidSin('')).toEqual(false);
  });
});

describe('formatSin', () => {
  it('should format a SIN using the default separator', () => {
    expect(formatSin('800000002')).toEqual('800 000 002');
  });

  it('should format a SIN using the a supplied separator', () => {
    expect(formatSin('800000002', '-')).toEqual('800-000-002');
  });

  it('should throw an error for invalid SIN', () => {
    expect(() => formatSin('123456789')).toThrowError();
  });
});

describe('sinInputPatternFormat', () => {
  it('should have correct format', () => {
    expect(sinInputPatternFormat).toBe('### ### ###');
  });
});

describe('sanitizeSin', () => {
  it.each([
    ['123456789', '123456789'],
    ['123 456 789', '123456789'],
    ['123-456-789', '123456789'],
  ])('should sanitize "%s" to "%s"', (input, expected) => {
    expect(sanitizeSin(input)).toEqual(expected);
  });

  it.each([['abc'], [''], ['123-45-6789'], ['000 000 000']])('should return the original string "%s" if it does not match SIN format', (input) => {
    expect(sanitizeSin(input)).toEqual(input);
  });
});
