import { ContainerModule } from 'inversify';

import { TYPES } from '~/.server/constants';
import { DefaultSecurityHandler } from '~/.server/routes/security';

/**
 * Container module for routes.
 */
export const routesContainerModule = new ContainerModule((bind) => {
  bind(TYPES.routes.security.SecurityHandler).to(DefaultSecurityHandler);
});
