import type { interfaces } from 'inversify';
import { ContainerModule } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import { AddressValidationHealthCheck, ApplicantHealthCheck, ApplicationStatusHealthCheck, HCaptchaHealthCheck, LetterHealthCheck, NotificationHealthCheck, RedisHealthCheck } from '~/.server/health';

function featureEnabled(feature: ServerConfig['ENABLED_FEATURES'][number]) {
  return ({ parentContext }: interfaces.Request) => {
    const serverConfig = parentContext.container.get(TYPES.configs.ServerConfig);
    return serverConfig.ENABLED_FEATURES.includes(feature);
  };
}

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
  bind(TYPES.health.HealthCheck).to(ApplicationStatusHealthCheck);
  bind(TYPES.health.HealthCheck).to(HCaptchaHealthCheck).when(featureEnabled('hcaptcha'));
  bind(TYPES.health.HealthCheck).to(LetterHealthCheck);
  bind(TYPES.health.HealthCheck).to(NotificationHealthCheck);
  bind(TYPES.health.HealthCheck).to(RedisHealthCheck).when(sessionTypeIs('redis'));
});
