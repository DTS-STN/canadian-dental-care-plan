import { ContainerModule } from 'inversify';

import { getEnv } from '../utils/env.utils';

import { TYPES } from '~/.server/constants';
import { getClientEnv } from '~/utils/env-utils';

/**
 * Defines the container module for configuration bindings.
 */
export function createConfigsContainerModule(): ContainerModule {
  return new ContainerModule((options) => {
    options.bind(TYPES.ClientConfig).toDynamicValue(() => getClientEnv());
    options.bind(TYPES.ServerConfig).toDynamicValue(() => getEnv());
  });
}
