import { ContainerModule } from 'inversify';
import type { ContainerModuleLoadOptions } from 'inversify';

import { DefaultBearerTokenResolver, DefaultTokenRolesExtractor } from '~/.server/auth';
import { TYPES } from '~/.server/constants';

/**
 * Container module for auth components.
 */
export const authContainerModule = new ContainerModule((options: ContainerModuleLoadOptions) => {
  options.bind(TYPES.auth.BearerTokenResolver).to(DefaultBearerTokenResolver);
  options.bind(TYPES.auth.HealthTokenRolesExtractor).toDynamicValue((context) => {
    const logFactory = context.get(TYPES.factories.LogFactory);
    const { HEALTH_AUTH_TOKEN_AUDIENCE, HEALTH_AUTH_TOKEN_ISSUER, HEALTH_AUTH_JWKS_URI } = context.get(TYPES.configs.ServerConfig);
    return new DefaultTokenRolesExtractor(logFactory, HEALTH_AUTH_TOKEN_AUDIENCE, HEALTH_AUTH_TOKEN_ISSUER, HEALTH_AUTH_JWKS_URI);
  });
});
