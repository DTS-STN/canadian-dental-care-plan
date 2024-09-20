import { ContainerModule } from 'inversify';

import type { ClientConfig, ServerConfig } from '~/.server/configs';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { ConfigFactory } from '~/.server/factories';

/**
 * Container module for configurations.
 */
export const configsContainerModule = new ContainerModule((bind) => {
  bind<ClientConfig>(SERVICE_IDENTIFIER.CLIENT_CONFIG).toDynamicValue((context) => context.container.get<ConfigFactory>(SERVICE_IDENTIFIER.CONFIG_FACTORY).createClientConfig());
  bind<ServerConfig>(SERVICE_IDENTIFIER.SERVER_CONFIG).toDynamicValue((context) => context.container.get<ConfigFactory>(SERVICE_IDENTIFIER.CONFIG_FACTORY).createServerConfig());
});
