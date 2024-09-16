import { inject, injectable } from 'inversify';

import type { ClientConfig } from '~/.server/configs/client.config';
import type { ServerConfig } from '~/.server/configs/server.config';
import { SERVICE_IDENTIFIER } from '~/.server/constants/service-identifier.contant';

export interface ContainerConfigProvider {
  clientConfig: ClientConfig;
  serverConfig: ServerConfig;
}

@injectable()
export class ContainerConfigProviderImpl implements ContainerConfigProvider {
  constructor(
    @inject(SERVICE_IDENTIFIER.CLIENT_CONFIG)
    public readonly clientConfig: ClientConfig,

    @inject(SERVICE_IDENTIFIER.SERVER_CONFIG)
    public readonly serverConfig: ServerConfig,
  ) {}
}
