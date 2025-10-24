import { afterEach, describe, expect, it, vi } from 'vitest';

import { DefaultApplicationYearRepository } from '~/.server/domain/repositories';

describe('DefaultApplicationYearRepository', () => {
  afterEach(() => {
    vi.resetAllMocks();
    vi.clearAllMocks();
  });

  describe('getIntakeApplicationYear', () => {
    it('should return intake application year entity', () => {
      const repository = new DefaultApplicationYearRepository();

      const result = repository.getIntakeApplicationYear('2024-11-13');
      expect(result).toEqual({
        BenefitApplicationYear: {
          BenefitApplicationYearIdentification: {
            IdentificationID: '9bb21bc9-028c-ef11-8a69-000d3a0a1a29',
          },
          BenefitApplicationYearTaxYear: {
            YearDate: '2024',
          },
          DependentEligibilityEndDate: {
            date: '2025-06-01',
          },
        },
      });
    });
  });

  describe('getRenewalApplicationYear', () => {
    it('should return renewal application year entity', () => {
      const repository = new DefaultApplicationYearRepository();

      const result = repository.getIntakeApplicationYear('2024-11-13');
      expect(result).toEqual({
        BenefitApplicationYear: {
          BenefitApplicationYearIdentification: {
            IdentificationID: '9bb21bc9-028c-ef11-8a69-000d3a0a1a29',
          },
          BenefitApplicationYearTaxYear: {
            YearDate: '2024',
          },
          DependentEligibilityEndDate: {
            date: '2025-06-01',
          },
        },
      });
    });
  });
});
