import { describe, expect, it, vi } from 'vitest';

import { DefaultConfigFactory } from '~/.server/configs/config.factory';
import { getClientEnv, getEnv } from '~/.server/utils/env.utils';

vi.mock('~/.server/utils/env.utils', () => ({
  getClientEnv: vi.fn(),
  getEnv: vi.fn(),
}));

describe('DefaultConfigFactory', () => {
  it('should create a client config', () => {
    const configFactory = new DefaultConfigFactory();
    const clientConfig = configFactory.createClientConfig();

    expect(clientConfig).not.toBeNull();
    expect(getClientEnv).toHaveBeenCalledOnce();
  });

  it('should create a server config', () => {
    const configFactory = new DefaultConfigFactory();
    const serverConfig = configFactory.createServerConfig();

    expect(serverConfig).not.toBeNull();
    expect(getEnv).toHaveBeenCalledOnce();
  });
});
