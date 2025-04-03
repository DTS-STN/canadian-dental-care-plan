import { ContainerModule } from 'inversify';

import { TYPES } from '~/.server/constants';

/**
 * Defines the container module for configuration bindings.
 */
export function createConfigsContainerModule(): ContainerModule {
  return new ContainerModule((options) => {
    options.bind(TYPES.configs.ClientConfig).toDynamicValue((context) => {
      return context.get(TYPES.domain.services.ConfigFactory).createClientConfig();
    });
    options.bind(TYPES.configs.ServerConfig).toDynamicValue((context) => {
      return context.get(TYPES.domain.services.ConfigFactory).createServerConfig();
    });
  });
}
