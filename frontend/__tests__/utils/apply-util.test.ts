import { describe, expect, it } from 'vitest';

import { isValidSin } from '~/utils/apply-utils';

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
