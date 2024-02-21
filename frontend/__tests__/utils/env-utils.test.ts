import { afterEach, describe, expect, it, vi } from 'vitest';

import { getClientEnv } from '~/utils/env-utils';
import { getPublicEnv } from '~/utils/env.server';

vi.mock('~/utils/env.server', () => ({
  getPublicEnv: vi.fn(),
}));

describe('getClientEnv', () => {
  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
  });

  it('should return the public environment variables from the window object when called from a client-side browser', () => {
    const env = { LANG_QUERY_PARAM: 'lang' };

    vi.stubGlobal('document', new Document());
    vi.stubGlobal('window', { env });

    expect(getClientEnv()).toEqual(env);
  });

  it('should return the public environment variables from process.env when called from a server-side component', () => {
    const env = { I18NEXT_DEBUG: false };

    vi.stubGlobal('document', undefined);
    vi.mocked(getPublicEnv, { partial: true }).mockReturnValue(env);

    expect(getClientEnv()).toEqual(env);
  });
});
