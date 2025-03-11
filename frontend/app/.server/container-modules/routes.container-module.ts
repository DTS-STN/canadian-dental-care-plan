import { ContainerModule } from 'inversify';
import type { ContainerModuleLoadOptions } from 'inversify';

import { TYPES } from '~/.server/constants';
import { DefaultSecurityHandler } from '~/.server/routes/security';

/**
 * Container module for routes.
 */
export const routesContainerModule = new ContainerModule((options: ContainerModuleLoadOptions) => {
  options.bind(TYPES.routes.security.SecurityHandler).to(DefaultSecurityHandler);
});
