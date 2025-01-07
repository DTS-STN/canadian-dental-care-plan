import type { interfaces } from 'inversify';
import { ContainerModule } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import { AddressValidationHealthCheck, ApplicantHealthCheck, RedisHealthCheck } from '~/.server/health';

function sessionTypeIs(sessionType: ServerConfig['SESSION_STORAGE_TYPE']) {
  return ({ parentContext }: interfaces.Request) => {
    const serverConfig = parentContext.container.get(TYPES.configs.ServerConfig);
    return serverConfig.SESSION_STORAGE_TYPE === sessionType;
  };
}

/**
 * Container module for health components.
 */
export const healthContainerModule = new ContainerModule((bind) => {
  bind(TYPES.health.HealthCheck).to(AddressValidationHealthCheck);
  bind(TYPES.health.HealthCheck).to(ApplicantHealthCheck);
  bind(TYPES.health.HealthCheck).to(RedisHealthCheck).when(sessionTypeIs('redis'));
});
