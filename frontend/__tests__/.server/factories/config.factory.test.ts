import { describe, expect, it, vi } from 'vitest';

import { ConfigFactoryImpl } from '~/.server/factories/config.factory';
import { getClientEnv, getEnv } from '~/utils/env-utils.server';

vi.mock('~/utils/env-utils.server', () => ({
  getClientEnv: vi.fn(),
  getEnv: vi.fn(),
}));

describe('ConfigFactoryImpl', () => {
  it('should create a client config', () => {
    const configFactory = new ConfigFactoryImpl();
    const clientConfig = configFactory.createClientConfig();

    expect(clientConfig).not.toBeNull();
    expect(getClientEnv).toHaveBeenCalledTimes(1);
  });

  it('should create a server config', () => {
    const configFactory = new ConfigFactoryImpl();
    const serverConfig = configFactory.createServerConfig();

    expect(serverConfig).not.toBeNull();
    expect(getEnv).toHaveBeenCalledTimes(1);
  });
});