import { ContainerModule } from 'inversify';
import type { BindingConstraints } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import {
  AddressValidationHealthCheck,
  ApplicantHealthCheck,
  ApplicationStatusHealthCheck,
  ClientFriendlyStatusHealthCheck,
  CountryHealthCheck,
  GovernmentInsurancePlanHealthCheck,
  HCaptchaHealthCheck,
  LetterHealthCheck,
  LetterTypeHealthCheck,
  NotificationHealthCheck,
  ProvinceTerritoryStateHealthCheck,
  RedisHealthCheck,
} from '~/.server/health';

function featureEnabled(serverConfig: Pick<ServerConfig, 'ENABLED_FEATURES'>, feature: ServerConfig['ENABLED_FEATURES'][number]) {
  return (metadata: BindingConstraints) => {
    return serverConfig.ENABLED_FEATURES.includes(feature);
  };
}

function sessionTypeIs(serverConfig: Pick<ServerConfig, 'SESSION_STORAGE_TYPE'>, sessionType: ServerConfig['SESSION_STORAGE_TYPE']) {
  return (metadata: BindingConstraints) => {
    return serverConfig.SESSION_STORAGE_TYPE === sessionType;
  };
}

/**
 * Defines the container module for health bindings.
 */
export function createHealthContainerModule(serverConfig: Pick<ServerConfig, 'ENABLED_FEATURES' | 'SESSION_STORAGE_TYPE'>): ContainerModule {
  return new ContainerModule((options) => {
    options.bind(TYPES.health.HealthCheck).to(AddressValidationHealthCheck);
    options.bind(TYPES.health.HealthCheck).to(ApplicantHealthCheck);
    options.bind(TYPES.health.HealthCheck).to(ApplicationStatusHealthCheck);
    options.bind(TYPES.health.HealthCheck).to(CountryHealthCheck);
    options.bind(TYPES.health.HealthCheck).to(ClientFriendlyStatusHealthCheck);
    options.bind(TYPES.health.HealthCheck).to(ProvinceTerritoryStateHealthCheck);
    options.bind(TYPES.health.HealthCheck).to(LetterTypeHealthCheck);
    options.bind(TYPES.health.HealthCheck).to(GovernmentInsurancePlanHealthCheck);
    options.bind(TYPES.health.HealthCheck).to(HCaptchaHealthCheck).when(featureEnabled(serverConfig, 'hcaptcha'));
    options.bind(TYPES.health.HealthCheck).to(LetterHealthCheck);
    options.bind(TYPES.health.HealthCheck).to(NotificationHealthCheck);
    options.bind(TYPES.health.HealthCheck).to(RedisHealthCheck).when(sessionTypeIs(serverConfig, 'redis'));
  });
}
