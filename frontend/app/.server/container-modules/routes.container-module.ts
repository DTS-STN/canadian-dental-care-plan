import { ContainerModule } from 'inversify';

import { DefaultSecurityHandler } from '../routes/security';
import { TYPES } from '~/.server/constants';

/**
 * Container module for routes.
 */
export const routesContainerModule = new ContainerModule((bind) => {
  bind(TYPES.routes.security.SecurityHandler).to(DefaultSecurityHandler);
});
