import type { interfaces } from 'inversify';

import type { ClientConfig, ServerConfig } from '~/.server/configs';
import { SERVICE_IDENTIFIER } from '~/.server/constants';

export interface ContainerConfigProvider {
  getClientConfig(): ClientConfig;
  getServerConfig(): ServerConfig;
}

export class ContainerConfigProviderImpl implements ContainerConfigProvider {
  constructor(private readonly container: interfaces.Container) {}

  public getClientConfig(): ClientConfig {
    return this.container.get<ClientConfig>(SERVICE_IDENTIFIER.CLIENT_CONFIG);
  }

  public getServerConfig(): ServerConfig {
    return this.container.get<ServerConfig>(SERVICE_IDENTIFIER.SERVER_CONFIG);
  }
}
