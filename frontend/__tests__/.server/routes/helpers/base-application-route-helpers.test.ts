import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getAgeCategoryFromAge, getAgeCategoryFromDateString, getAgeCategoryReferenceDate } from '~/.server/routes/helpers/base-application-route-helpers';

describe('base-application-route-helpers', () => {
  describe('getAgeCategoryFromAge', () => {
    it('returns children for ages from 0 to 15', () => {
      expect(getAgeCategoryFromAge(0)).toBe('children');
      expect(getAgeCategoryFromAge(15)).toBe('children');
    });

    it('returns youth for ages from 16 to 17', () => {
      expect(getAgeCategoryFromAge(16)).toBe('youth');
      expect(getAgeCategoryFromAge(17)).toBe('youth');
    });

    it('returns adults for ages from 18 to 64', () => {
      expect(getAgeCategoryFromAge(18)).toBe('adults');
      expect(getAgeCategoryFromAge(64)).toBe('adults');
    });

    it('returns seniors for age 65 and over', () => {
      expect(getAgeCategoryFromAge(65)).toBe('seniors');
      expect(getAgeCategoryFromAge(90)).toBe('seniors');
    });

    it('throws for a negative age', () => {
      expect(() => getAgeCategoryFromAge(-1)).toThrowError('Invalid age [-1]');
    });
  });

  describe('getAgeCategoryFromDateString', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime('2026-03-04T12:00:00.000Z');
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('maps date of birth to category using an explicit reference date', () => {
      expect(getAgeCategoryFromDateString('2008-03-04', '2026-03-04')).toBe('adults');
      expect(getAgeCategoryFromDateString('2009-03-04', '2026-03-04')).toBe('youth');
      expect(getAgeCategoryFromDateString('1960-03-04', '2026-03-04')).toBe('seniors');
      expect(getAgeCategoryFromDateString('2012-03-04', '2026-03-04')).toBe('children');
    });

    it('uses current date when reference date is omitted', () => {
      expect(getAgeCategoryFromDateString('2008-03-04')).toBe('adults');
      expect(getAgeCategoryFromDateString('2009-03-04')).toBe('youth');
    });
  });

  describe('getAgeCategoryReferenceDate', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns today for intake context', () => {
      vi.setSystemTime('2026-03-04T10:00:00.000Z');

      expect(getAgeCategoryReferenceDate('intake')).toBe('2026-03-04');
    });

    it('returns current year coverage end date for renewal in Jan-Jun', () => {
      vi.setSystemTime('2026-03-04T10:00:00.000Z');

      expect(getAgeCategoryReferenceDate('renewal')).toBe('2026-06-30');
    });

    it('returns next year coverage end date for renewal in Jul-Dec', () => {
      vi.setSystemTime('2026-08-01T10:00:00.000Z');

      expect(getAgeCategoryReferenceDate('renewal')).toBe('2027-06-30');
    });
  });
});
