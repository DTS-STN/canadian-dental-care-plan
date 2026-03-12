import { describe, expect, it, vi } from 'vitest';

import { isValidCoverageCopayTierCode } from '~/.server/utils/coverage.utils';

vi.mock('~/.server/utils/env.utils', () => ({
  getEnv: vi.fn(() => ({
    COVERAGE_TIER_CODE_TIER_1: 'TIER_1',
    COVERAGE_TIER_CODE_TIER_2: 'TIER_2',
    COVERAGE_TIER_CODE_TIER_3: 'TIER_3',
  })),
}));

describe('isValidCoverageCopayTierCode', () => {
  it.each([['TIER_1'], ['TIER_2'], ['TIER_3']])(
    //
    'should return true for tier code "%s"',
    (tierCode) => {
      // Act & Assert
      expect(isValidCoverageCopayTierCode(tierCode)).toBe(true);
    },
  );

  it.each([['INVALID_CODE'], [''], ['TIER_4']])(
    //
    'should return false for invalid tier code "%s"',
    (invalidCode) => {
      // Act & Assert
      expect(isValidCoverageCopayTierCode(invalidCode)).toBe(false);
    },
  );
});
