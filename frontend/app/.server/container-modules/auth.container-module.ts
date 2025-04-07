import { ContainerModule } from 'inversify';

import { DefaultBearerTokenResolver, DefaultTokenRolesExtractor } from '~/.server/auth';
import { TYPES } from '~/.server/constants';

/**
 * Defines the container module for authentication bindings.
 */
export function createAuthContainerModule(): ContainerModule {
  return new ContainerModule((options) => {
    options.bind(TYPES.auth.BearerTokenResolver).to(DefaultBearerTokenResolver);
    options.bind(TYPES.auth.HealthTokenRolesExtractor).toDynamicValue((context) => {
      const { HEALTH_AUTH_TOKEN_AUDIENCE, HEALTH_AUTH_TOKEN_ISSUER, HEALTH_AUTH_JWKS_URI } = context.get(TYPES.configs.ServerConfig);
      return new DefaultTokenRolesExtractor(HEALTH_AUTH_TOKEN_AUDIENCE, HEALTH_AUTH_TOKEN_ISSUER, HEALTH_AUTH_JWKS_URI);
    });
  });
}
