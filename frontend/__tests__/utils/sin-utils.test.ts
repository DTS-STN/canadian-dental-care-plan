import { describe, expect, it } from 'vitest';

import { formatSin, isValidSin } from '~/utils/sin-utils';

describe('isValidSin', () => {
  it('should return true for a valid SIN', () => {
    expect(isValidSin('046454286')).toEqual(true);
  });

  it('should return false for an invalid SIN of correct length and form', () => {
    expect(isValidSin('555555555')).toEqual(false);
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
    expect(formatSin('123456789')).toEqual('123 456 789');
  });

  it('should format a SIN using the a supplied separator', () => {
    expect(formatSin('123456789', '-')).toEqual('123-456-789');
  });
});
