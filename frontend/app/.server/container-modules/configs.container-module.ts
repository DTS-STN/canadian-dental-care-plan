import { ContainerModule } from 'inversify';

import { TYPES } from '~/.server/constants';

/**
 * Container module for configurations.
 */
export const configsContainerModule = new ContainerModule((bind) => {
  bind(TYPES.configs.ClientConfig).toDynamicValue((context) => context.container.get(TYPES.domain.services.ConfigFactory).createClientConfig());
  bind(TYPES.configs.ServerConfig).toDynamicValue((context) => context.container.get(TYPES.domain.services.ConfigFactory).createServerConfig());
});
