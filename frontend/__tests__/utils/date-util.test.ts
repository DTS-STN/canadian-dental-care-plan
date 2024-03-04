import { describe, expect, it } from 'vitest';

import { isValidDateOfBirth } from '~/utils/date-utils';

describe('isValidDateOfBirth', () => {
  it('should return true for a valid date', () => {
    expect(isValidDateOfBirth({ month: 0, day: 1, year: 2024 })).toEqual(true);
  });

  it('should return true for a valid leap year', () => {
    expect(isValidDateOfBirth({ month: 1, day: 29, year: 2024 })).toEqual(true);
  });

  it('should return false for an out of range month', () => {
    expect(isValidDateOfBirth({ month: 12, day: 1, year: 2024 })).toEqual(false);
  });

  it('should return false for an out of range day', () => {
    expect(isValidDateOfBirth({ month: 12, day: 32, year: 2024 })).toEqual(false);
  });

  it('should return false for an out of range year', () => {
    expect(isValidDateOfBirth({ month: 12, day: 32, year: 1899 })).toEqual(false);
  });

  it('should return false for an invalid leap year', () => {
    expect(isValidDateOfBirth({ month: 1, day: 29, year: 2023 })).toEqual(false);
  });
});
