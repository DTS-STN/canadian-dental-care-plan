import type { interfaces } from 'inversify';
import { ContainerModule } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import { RedisHealthCheck } from '~/.server/health';

/**
 * Container module for health components.
 */
export const healthContainerModule = new ContainerModule((bind) => {
  // TODO add default bindings for non-conditional health checks
});

/**
 * Function to apply additional conditional bindings after module configuration.
 */
export function configureHealthModule(container: interfaces.Container) {
  const serverConfig = container.get<ServerConfig>(TYPES.configs.ServerConfig);
  if (serverConfig.SESSION_STORAGE_TYPE === 'redis') {
    container.bind(TYPES.health.HealthCheck).to(RedisHealthCheck);
  }
}
