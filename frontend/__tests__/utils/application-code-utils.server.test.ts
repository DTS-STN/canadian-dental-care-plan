import { afterEach, describe, expect, it, vi } from 'vitest';

import { getContextualAlertType } from '~/utils/application-code-utils.server';

vi.mock('~/utils/env.server', () => ({
  getEnv: vi.fn().mockReturnValue({
    CLIENT_STATUS_SUCCESS_ID: '000',
    INVALID_CLIENT_FRIENDLY_STATUS: '111',
  }),
}));

describe('~/utils/application-code-utils.server.ts', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('getContextualAlertType', () => {
    it.each([
      ['000', 'danger', 'success'],
      ['111', 'warning', 'danger'],
      ['222', undefined, 'info'],
      [null, 'danger', 'danger'],
    ])('getContextualAlertType(%j,%j) should return "%s"', (statusId, nullStatusMapping, expected) => {
      expect(getContextualAlertType(statusId, nullStatusMapping)).toEqual(expected);
    });
  });
});
