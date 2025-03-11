import { ContainerModule } from 'inversify';
import type { ContainerModuleLoadOptions } from 'inversify';

import { TYPES } from '~/.server/constants';

/**
 * Container module for configurations.
 */
export const configsContainerModule = new ContainerModule((options: ContainerModuleLoadOptions) => {
  options.bind(TYPES.configs.ClientConfig).toDynamicValue((context) => context.get(TYPES.domain.services.ConfigFactory).createClientConfig());
  options.bind(TYPES.configs.ServerConfig).toDynamicValue((context) => context.get(TYPES.domain.services.ConfigFactory).createServerConfig());
});
