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

function sessionTypeIs(sessionType: ServerConfig['SESSION_STORAGE_TYPE']) {
  return ({ parentContext }: interfaces.Request) => {
    const serverConfig = parentContext.container.get(TYPES.configs.ServerConfig);
    return serverConfig.SESSION_STORAGE_TYPE === sessionType;
  };
}

/**
 * Function to apply additional conditional bindings after module configuration.
 */
export function configureHealthModule(container: interfaces.Container) {
  container.bind(TYPES.health.HealthCheck).to(RedisHealthCheck).when(sessionTypeIs('redis'));
}
