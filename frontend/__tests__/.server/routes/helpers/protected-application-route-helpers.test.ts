import { describe, expect, it } from 'vitest';

import { shouldSkipMaritalStatus } from '~/.server/routes/helpers/protected-application-route-helpers';

describe('protected-application-route-helpers', () => {
  describe('shouldSkipMaritalStatus', () => {
    it('returns false when client application is undefined', () => {
      const state = {
        context: 'renewal',
        clientApplication: undefined,
      } as const;

      expect(shouldSkipMaritalStatus(state)).toBe(false);
    });

    it('returns false when input model is full', () => {
      const state = {
        context: 'renewal',
        clientApplication: {
          inputModel: 'full',
        },
      } as const;

      expect(shouldSkipMaritalStatus(state)).toBe(false);
    });

    it('returns true when input model is simplified', () => {
      const state = {
        context: 'renewal',
        clientApplication: {
          inputModel: 'simplified',
        },
      } as const;

      expect(shouldSkipMaritalStatus(state)).toBe(true);
    });
  });
});
