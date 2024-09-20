import { ContainerModule } from 'inversify';

import type { ClientConfig } from '~/.server/configs/client.config';
import type { ServerConfig } from '~/.server/configs/server.config';
import { SERVICE_IDENTIFIER } from '~/.server/constants/service-identifier.contant';
import type { ConfigFactory } from '~/.server/factories/config.factory';

/**
 * Container module for configurations.
 */
export const configsContainerModule = new ContainerModule((bind) => {
  bind<ClientConfig>(SERVICE_IDENTIFIER.CLIENT_CONFIG).toDynamicValue((context) => context.container.get<ConfigFactory>(SERVICE_IDENTIFIER.CONFIG_FACTORY).createClientConfig());
  bind<ServerConfig>(SERVICE_IDENTIFIER.SERVER_CONFIG).toDynamicValue((context) => context.container.get<ConfigFactory>(SERVICE_IDENTIFIER.CONFIG_FACTORY).createServerConfig());
});
