import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ClientConfig } from '~/.server/configs/client.config';
import type { ServerConfig } from '~/.server/configs/server.config';
import { ContainerConfigProviderImpl } from '~/.server/providers/container-config.provider';

describe('ContainerConfigProviderImpl', () => {
  it('should inject client config', () => {
    const mockClientConfig = mock<ClientConfig>();
    const containerConfigProvider = new ContainerConfigProviderImpl(mockClientConfig, mock<ServerConfig>());

    expect(containerConfigProvider.clientConfig).toBe(mockClientConfig);
  });

  it('should inject server config', () => {
    const mockServerConfig = mock<ServerConfig>();
    const containerConfigProvider = new ContainerConfigProviderImpl(mock<ClientConfig>(), mockServerConfig);

    expect(containerConfigProvider.serverConfig).toBe(mockServerConfig);
  });
});
