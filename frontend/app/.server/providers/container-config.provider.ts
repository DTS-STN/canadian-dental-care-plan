import { Container, injectable } from 'inversify';

import type { ClientConfig , ServerConfig } from '~/.server/configs';
import { SERVICE_IDENTIFIER } from '~/.server/constants/service-identifier.contant';

export interface ContainerConfigProvider {
  getClientConfig(): ClientConfig;
  getServerConfig(): ServerConfig;
}

@injectable()
export class ContainerConfigProviderImpl implements ContainerConfigProvider {
  constructor(private readonly container: Container) {}

  public getClientConfig(): ClientConfig {
    return this.container.get<ClientConfig>(SERVICE_IDENTIFIER.CLIENT_CONFIG);
  }

  public getServerConfig(): ServerConfig {
    return this.container.get<ServerConfig>(SERVICE_IDENTIFIER.SERVER_CONFIG);
  }
}
