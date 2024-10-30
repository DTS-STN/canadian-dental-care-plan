import { inject, injectable } from 'inversify';

import type { ClientConfig, ServerConfig } from '~/.server/configs';
import { SERVICE_IDENTIFIER } from '~/.server/constants';

export interface ContainerConfigProvider {
  getClientConfig(): ClientConfig;
  getServerConfig(): ServerConfig;
}

@injectable()
export class ContainerConfigProviderImpl implements ContainerConfigProvider {
  constructor(
    @inject(SERVICE_IDENTIFIER.CLIENT_CONFIG) public readonly clientConfig: ClientConfig,
    @inject(SERVICE_IDENTIFIER.SERVER_CONFIG) public readonly serverConfig: ServerConfig,
  ) {}

  public getClientConfig(): ClientConfig {
    return this.clientConfig;
  }

  public getServerConfig(): ServerConfig {
    return this.serverConfig;
  }
}
