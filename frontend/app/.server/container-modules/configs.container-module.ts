import { ContainerModule } from 'inversify';

import { TYPES } from '~/.server/constants';

/**
 * Container module for configurations.
 */
export const configsContainerModule = new ContainerModule((bind) => {
  bind(TYPES.ClientConfig).toDynamicValue((context) => context.container.get(TYPES.ConfigFactory).createClientConfig());
  bind(TYPES.ServerConfig).toDynamicValue((context) => context.container.get(TYPES.ConfigFactory).createServerConfig());
});
