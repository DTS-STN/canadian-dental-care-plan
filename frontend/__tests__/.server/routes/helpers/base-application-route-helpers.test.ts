import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ClientApplicationRenewalEligibleDto } from '~/.server/domain/dtos';
import { getAgeCategoryFromAge, getAgeCategoryFromDateString, getAgeCategoryReferenceDate, getEligibilityStatus, isChildClientNumberValid, isChildOrYouth } from '~/.server/routes/helpers/base-application-route-helpers';

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
  describe('isChildOrYouth', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime('2026-03-04T12:00:00.000Z');
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns true for children in intake context', () => {
      expect(isChildOrYouth('2012-03-04', 'intake')).toBe(true);
    });

    it('returns true for youth in intake context', () => {
      expect(isChildOrYouth('2009-03-04', 'intake')).toBe(true);
    });

    it('returns false for adults in intake context', () => {
      expect(isChildOrYouth('2008-03-04', 'intake')).toBe(false);
    });

    it('returns false for seniors in intake context', () => {
      expect(isChildOrYouth('1960-03-04', 'intake')).toBe(false);
    });

    it('returns true for children in renewal context', () => {
      expect(isChildOrYouth('2012-03-04', 'renewal')).toBe(true);
    });

    it('returns true for youth in renewal context', () => {
      expect(isChildOrYouth('2009-03-04', 'renewal')).toBe(true);
    });

    it('returns false for adults in renewal context', () => {
      expect(isChildOrYouth('2008-03-04', 'renewal')).toBe(false);
    });

    it('returns false for seniors in renewal context', () => {
      expect(isChildOrYouth('1960-03-04', 'renewal')).toBe(false);
    });
  });

  describe('getEligibilityStatus', () => {
    it('returns "eligible" when applicant has no private dental insurance and privateDentalInsurance is false', () => {
      const result = getEligibilityStatus({
        hasPrivateDentalInsurance: false,
        privateDentalInsurance: false,
      });
      expect(result).toBe('eligible');
    });

    it('returns "eligible" when applicant has no private dental insurance and privateDentalInsurance is undefined', () => {
      const result = getEligibilityStatus({
        hasPrivateDentalInsurance: false,
        privateDentalInsurance: undefined,
      });
      expect(result).toBe('eligible');
    });

    it('returns "eligible-proof" when applicant has no private dental insurance but privateDentalInsurance is true', () => {
      const result = getEligibilityStatus({
        hasPrivateDentalInsurance: false,
        privateDentalInsurance: true,
      });
      expect(result).toBe('eligible-proof');
    });

    it('returns "ineligible" when applicant has private dental insurance and privateDentalInsurance is false', () => {
      const result = getEligibilityStatus({
        hasPrivateDentalInsurance: true,
        privateDentalInsurance: false,
      });
      expect(result).toBe('ineligible');
    });

    it('returns "ineligible" when applicant has private dental insurance and privateDentalInsurance is true', () => {
      const result = getEligibilityStatus({
        hasPrivateDentalInsurance: true,
        privateDentalInsurance: true,
      });
      expect(result).toBe('ineligible');
    });

    it('returns "ineligible" when applicant has private dental insurance and privateDentalInsurance is undefined', () => {
      const result = getEligibilityStatus({
        hasPrivateDentalInsurance: true,
        privateDentalInsurance: undefined,
      });
      expect(result).toBe('ineligible');
    });
  });
});

describe('isChildClientNumberValid', () => {
  const mockClientApplication = {
    applicantInformation: {
      clientNumber: 'APPLICANT-001',
    },
    eligibleClientNumbers: ['CHILD-001', 'CHILD-002', 'OTHER-001'],
    children: [{ information: { clientNumber: 'CHILD-001' } }, { information: { clientNumber: 'CHILD-002' } }, { information: { clientNumber: 'CHILD-003' } }],
  } as unknown as ClientApplicationRenewalEligibleDto;

  describe('intake context', () => {
    it('always returns true for intake context regardless of other parameters', () => {
      expect(isChildClientNumberValid('intake', mockClientApplication, 'ANY-NUMBER')).toBe(true);
      expect(isChildClientNumberValid('intake', mockClientApplication, undefined)).toBe(true);
      expect(isChildClientNumberValid('intake', undefined, 'ANY-NUMBER')).toBe(true);
      expect(isChildClientNumberValid('intake', undefined, undefined)).toBe(true);
    });
  });

  describe('renewal context', () => {
    it('returns true when clientApplication is undefined (partial form completion)', () => {
      expect(isChildClientNumberValid('renewal', undefined, 'CHILD-001')).toBe(true);
    });

    it('returns true when clientNumber is undefined (partial form completion)', () => {
      expect(isChildClientNumberValid('renewal', mockClientApplication, undefined)).toBe(true);
    });

    it('returns true when clientNumber is in eligibleClientNumbers (excluding applicant)', () => {
      expect(isChildClientNumberValid('renewal', mockClientApplication, 'OTHER-001')).toBe(true);
    });

    it('returns true when clientNumber is in children client numbers', () => {
      expect(isChildClientNumberValid('renewal', mockClientApplication, 'CHILD-003')).toBe(true);
    });

    it('returns false when clientNumber is not in eligibleClientNumbers or children client numbers', () => {
      expect(isChildClientNumberValid('renewal', mockClientApplication, 'INVALID-001')).toBe(false);
    });

    it('returns false when clientNumber matches applicant client number (filtered out from eligibleClientNumbers)', () => {
      // The applicant's own client number is filtered out from eligibleClientNumbers
      expect(isChildClientNumberValid('renewal', mockClientApplication, 'APPLICANT-001')).toBe(false);
    });

    it('returns false when clientNumber exists in both sets but is applicant number', () => {
      const mockAppWithOverlap = {
        applicantInformation: {
          clientNumber: 'DUPLICATE-001',
        },
        eligibleClientNumbers: ['DUPLICATE-001', 'CHILD-001'],
        children: [{ information: { clientNumber: 'DUPLICATE-001' } }, { information: { clientNumber: 'CHILD-002' } }],
      } as unknown as ClientApplicationRenewalEligibleDto;

      // Even though DUPLICATE-001 appears in both sets, it should be filtered out from eligibleClientNumbers
      // because it equals applicantInformation.clientNumber, and it's not valid as a child client number
      expect(isChildClientNumberValid('renewal', mockAppWithOverlap, 'DUPLICATE-001')).toBe(false);
    });

    it('handles empty eligibleClientNumbers array', () => {
      const mockAppEmptyEligible = {
        ...mockClientApplication,
        eligibleClientNumbers: [],
      };

      expect(isChildClientNumberValid('renewal', mockAppEmptyEligible, 'CHILD-001')).toBe(true);
      expect(isChildClientNumberValid('renewal', mockAppEmptyEligible, 'OTHER-001')).toBe(false);
    });

    it('handles empty children array', () => {
      const mockAppEmptyChildren = {
        ...mockClientApplication,
        children: [],
      };

      expect(isChildClientNumberValid('renewal', mockAppEmptyChildren, 'OTHER-001')).toBe(true);
      expect(isChildClientNumberValid('renewal', mockAppEmptyChildren, 'CHILD-001')).toBe(true);
    });

    it('handles both empty arrays', () => {
      const mockAppEmptyBoth = {
        applicantInformation: {
          clientNumber: 'APPLICANT-001',
        },
        eligibleClientNumbers: [],
        children: [],
      } as unknown as ClientApplicationRenewalEligibleDto;

      expect(isChildClientNumberValid('renewal', mockAppEmptyBoth, 'ANY-NUMBER')).toBe(false);
    });

    it('handles duplicate values across sets', () => {
      const mockAppWithDuplicates = {
        applicantInformation: {
          clientNumber: 'APPLICANT-001',
        },
        eligibleClientNumbers: ['CHILD-001', 'CHILD-002', 'CHILD-002'], // Duplicate in eligible
        children: [
          { information: { clientNumber: 'CHILD-001' } },
          { information: { clientNumber: 'CHILD-002' } },
          { information: { clientNumber: 'CHILD-002' } }, // Duplicate in children
        ],
      } as unknown as ClientApplicationRenewalEligibleDto;

      // Should still work correctly with duplicates (Set will handle uniqueness)
      expect(isChildClientNumberValid('renewal', mockAppWithDuplicates, 'CHILD-001')).toBe(true);
      expect(isChildClientNumberValid('renewal', mockAppWithDuplicates, 'CHILD-002')).toBe(true);
    });

    it('handles client numbers with special characters', () => {
      const mockAppWithSpecialChars = {
        applicantInformation: {
          clientNumber: 'APP-123',
        },
        eligibleClientNumbers: ['CHILD@123', 'CHILD#456'],
        children: [{ information: { clientNumber: 'CHILD$789' } }],
      } as unknown as ClientApplicationRenewalEligibleDto;

      expect(isChildClientNumberValid('renewal', mockAppWithSpecialChars, 'CHILD@123')).toBe(true);
      expect(isChildClientNumberValid('renewal', mockAppWithSpecialChars, 'CHILD#456')).toBe(true);
      expect(isChildClientNumberValid('renewal', mockAppWithSpecialChars, 'CHILD$789')).toBe(true);
      expect(isChildClientNumberValid('renewal', mockAppWithSpecialChars, 'CHILD%000')).toBe(false);
    });

    it('performs exact string matching (case-sensitive)', () => {
      const mockAppCaseSensitive = {
        applicantInformation: {
          clientNumber: 'APP-001',
        },
        eligibleClientNumbers: ['CHILD-001', 'child-002'],
        children: [{ information: { clientNumber: 'Child-003' } }],
      } as unknown as ClientApplicationRenewalEligibleDto;

      expect(isChildClientNumberValid('renewal', mockAppCaseSensitive, 'CHILD-001')).toBe(true);
      expect(isChildClientNumberValid('renewal', mockAppCaseSensitive, 'child-002')).toBe(true);
      expect(isChildClientNumberValid('renewal', mockAppCaseSensitive, 'Child-003')).toBe(true);
      expect(isChildClientNumberValid('renewal', mockAppCaseSensitive, 'child-001')).toBe(false);
      expect(isChildClientNumberValid('renewal', mockAppCaseSensitive, 'CHILD-002')).toBe(false);
    });
  });
});
