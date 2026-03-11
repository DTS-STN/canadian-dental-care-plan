import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getAgeCategoryFromAge, getAgeCategoryFromDateString, getAgeCategoryReferenceDate, getEligibilityStatus, isChildEligible } from '~/.server/routes/helpers/base-application-route-helpers';

vi.mock('~/.server/utils/env.utils', () => ({
  getEnv: vi.fn(() => ({
    ELIGIBILITY_STATUS_CODE_ELIGIBLE: 'ELIGIBLE',
  })),
}));

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
  describe('isChildEligible', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime('2026-03-04T12:00:00.000Z');
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns true for children in intake context', () => {
      expect(isChildEligible('2012-03-04', 'intake')).toBe(true);
    });

    it('returns true for youth in intake context', () => {
      expect(isChildEligible('2009-03-04', 'intake')).toBe(true);
    });

    it('returns false for adults in intake context', () => {
      expect(isChildEligible('2008-03-04', 'intake')).toBe(false);
    });

    it('returns false for seniors in intake context', () => {
      expect(isChildEligible('1960-03-04', 'intake')).toBe(false);
    });

    it('returns true for children in renewal context', () => {
      expect(isChildEligible('2012-03-04', 'renewal')).toBe(true);
    });

    it('returns true for youth in renewal context', () => {
      expect(isChildEligible('2009-03-04', 'renewal')).toBe(true);
    });

    it('returns false for adults in renewal context', () => {
      expect(isChildEligible('2008-03-04', 'renewal')).toBe(false);
    });

    it('returns false for seniors in renewal context', () => {
      expect(isChildEligible('1960-03-04', 'renewal')).toBe(false);
    });
  });

  describe('getEligibilityStatus', () => {
    it('returns "eligible" when applicant has no private dental insurance and t4DentalIndicator is false', () => {
      const result = getEligibilityStatus({
        hasPrivateDentalInsurance: false,
        t4DentalIndicator: false,
      });
      expect(result).toBe('eligible');
    });

    it('returns "eligible" when applicant has no private dental insurance and t4DentalIndicator is undefined', () => {
      const result = getEligibilityStatus({
        hasPrivateDentalInsurance: false,
        t4DentalIndicator: undefined,
      });
      expect(result).toBe('eligible');
    });

    it('returns "eligible-proof" when applicant has no private dental insurance but t4DentalIndicator is true', () => {
      const result = getEligibilityStatus({
        hasPrivateDentalInsurance: false,
        t4DentalIndicator: true,
      });
      expect(result).toBe('eligible-proof');
    });

    it('returns "ineligible" when applicant has private dental insurance and t4DentalIndicator is false', () => {
      const result = getEligibilityStatus({
        hasPrivateDentalInsurance: true,
        t4DentalIndicator: false,
      });
      expect(result).toBe('ineligible');
    });

    it('returns "ineligible" when applicant has private dental insurance and t4DentalIndicator is true', () => {
      const result = getEligibilityStatus({
        hasPrivateDentalInsurance: true,
        t4DentalIndicator: true,
      });
      expect(result).toBe('ineligible');
    });

    it('returns "ineligible" when applicant has private dental insurance and t4DentalIndicator is undefined', () => {
      const result = getEligibilityStatus({
        hasPrivateDentalInsurance: true,
        t4DentalIndicator: undefined,
      });
      expect(result).toBe('ineligible');
    });
  });
});
