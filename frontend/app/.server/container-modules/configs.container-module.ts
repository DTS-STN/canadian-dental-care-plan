import { ContainerModule } from 'inversify';

import { TYPES } from '~/.server/constants';

/**
 * Container module for configurations.
 */
export const configsContainerModule = new ContainerModule((bind) => {
  bind(TYPES.CLIENT_CONFIG).toDynamicValue((context) => context.container.get(TYPES.CONFIG_FACTORY).createClientConfig());
  bind(TYPES.SERVER_CONFIG).toDynamicValue((context) => context.container.get(TYPES.CONFIG_FACTORY).createServerConfig());
});
