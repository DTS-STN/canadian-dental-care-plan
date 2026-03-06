import { describe, expect, it } from 'vitest';

import { shouldSkipMaritalStatus } from '~/.server/routes/helpers/protected-application-route-helpers';

describe('protected-application-route-helpers', () => {
  describe('shouldSkipMaritalStatus', () => {
    it('returns false when input model is not simplified', () => {
      const state = {
        context: 'intake',
        clientApplication: {
          hasCopayTierCoverage: true,
        },
      } as const;

      expect(shouldSkipMaritalStatus(state)).toBe(false);
    });

    it('returns false when client application is undefined', () => {
      const state = {
        context: 'renewal',
        clientApplication: undefined,
      } as const;

      expect(shouldSkipMaritalStatus(state)).toBe(false);
    });

    it('returns false when copay tier earning record is false', () => {
      const state = {
        context: 'renewal',
        clientApplication: {
          hasCopayTierCoverage: false,
        },
      } as const;

      expect(shouldSkipMaritalStatus(state)).toBe(false);
    });

    it('returns true when input model is simplified and copay tier earning record is true', () => {
      const state = {
        context: 'renewal',
        clientApplication: {
          hasCopayTierCoverage: true,
        },
      } as const;

      expect(shouldSkipMaritalStatus(state)).toBe(true);
    });
  });
});
