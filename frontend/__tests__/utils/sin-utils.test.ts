import { describe, expect, it } from 'vitest';

import { formatSin, isValidSin } from '~/utils/sin-utils';

describe('isValidSin', () => {
  it.each([['000000042'], ['000 000 042'], ['000-000-042'], ['800000002'], ['800 000 002'], ['800-000-002']])('should return true for valid SIN "%s"', (sin) => {
    expect(isValidSin(sin)).toEqual(true);
  });

  it.each([['000000000'], ['000 000 000'], ['000-000-000'], ['800000003'], ['800 000 003'], ['800-000-003']])('should return false for invalid SIN "%s"', (sin) => {
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
