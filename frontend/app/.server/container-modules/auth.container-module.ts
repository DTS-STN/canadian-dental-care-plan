import { ContainerModule } from 'inversify';

import { DefaultBearerTokenResolver } from '~/.server/auth';
import { TYPES } from '~/.server/constants';

/**
 * Container module for auth components.
 */
export const authContainerModule = new ContainerModule((bind) => {
  bind(TYPES.auth.BearerTokenResolver).to(DefaultBearerTokenResolver);
});
