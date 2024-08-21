import { afterEach, describe, expect, it, vi } from 'vitest';

import { getClientEnv } from '~/utils/env-utils';

describe('getClientEnv', () => {
  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('should return the public environment variables from the window object when called from a client-side browser', () => {
    const env = { I18NEXT_DEBUG: true };

    vi.stubGlobal('document', new Document());
    vi.stubGlobal('window', { env });

    expect(getClientEnv()).toMatchObject(env);
  });

  it('should return the public environment variables from process.env when called from a server-side component', () => {
    vi.stubGlobal('document', undefined);
    vi.stubEnv('I18NEXT_DEBUG', 'true');

    expect(getClientEnv()).toMatchObject({ I18NEXT_DEBUG: true });
  });
});
