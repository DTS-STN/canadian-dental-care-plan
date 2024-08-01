import { afterEach, describe, expect, it, vi } from 'vitest';

import { getClientEnv } from '~/utils/env-utils.client';

describe('getClientEnv', () => {
  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
  });

  it('should return the public environment variables from the window object when called from a client-side browser', () => {
    const env = { I18NEXT_DEBUG: false };
    vi.stubGlobal('window', { env });
    expect(getClientEnv()).toEqual(env);
  });
});
