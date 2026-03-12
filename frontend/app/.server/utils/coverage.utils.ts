import { getEnv } from '~/.server/utils/env.utils';

/**
 * Returns `true` if the provided code is a valid coverage copay tier code (Tier 1, 2, or 3), otherwise `false`.
 * A valid code must be a string and match one of the predefined tier codes from the environment configuration.
 */
export function isValidCoverageCopayTierCode(code: string): boolean {
  const { COVERAGE_TIER_CODE_TIER_1, COVERAGE_TIER_CODE_TIER_2, COVERAGE_TIER_CODE_TIER_3 } = getEnv();
  return [COVERAGE_TIER_CODE_TIER_1, COVERAGE_TIER_CODE_TIER_2, COVERAGE_TIER_CODE_TIER_3].includes(code);
}
