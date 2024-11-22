import { describe, expect, it, vi } from 'vitest';

import { ConfigFactoryImpl } from '~/.server/factories';
import { getClientEnv, getEnv } from '~/.server/utils/env.utils';

vi.mock('~/.server/utils/env.utils', () => ({
  getClientEnv: vi.fn(),
  getEnv: vi.fn(),
}));

describe('ConfigFactoryImpl', () => {
  it('should create a client config', () => {
    const configFactory = new ConfigFactoryImpl();
    const clientConfig = configFactory.createClientConfig();

    expect(clientConfig).not.toBeNull();
    expect(getClientEnv).toHaveBeenCalledOnce();
  });

  it('should create a server config', () => {
    const configFactory = new ConfigFactoryImpl();
    const serverConfig = configFactory.createServerConfig();

    expect(serverConfig).not.toBeNull();
    expect(getEnv).toHaveBeenCalledOnce();
  });
});
