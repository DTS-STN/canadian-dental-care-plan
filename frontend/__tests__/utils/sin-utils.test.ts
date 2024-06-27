import { describe, expect, it } from 'vitest';

import { formatSin, isValidSin } from '~/utils/sin-utils';

describe('isValidSin', () => {
  it.each([['130692544'], ['178302576'], ['549831204'], ['130 692 544'], ['178 302 576'], ['549 831 204'], ['130-692-544'], ['178-302-576'], ['549-831-204']])('should return true for valid SIN "%s"', (sin) => {
    expect(isValidSin(sin)).toEqual(true);
  });

  it.each([['000000000'], ['451987368'], ['736194850'], ['000 000 000'], ['451 987 368'], ['736 194 850'], ['000-000-000'], ['451-987-368'], ['736-194-850']])('should return false for invalid SIN "%s"', (sin) => {
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
