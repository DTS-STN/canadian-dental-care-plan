import { ContainerModule } from 'inversify';

import { TYPES } from '~/.server/constants';
import { DefaultSecurityHandler } from '~/.server/routes/security';

/**
 * Defines the container module for route bindings.
 */
export function createRoutesContainerModule(): ContainerModule {
  return new ContainerModule((options) => {
    options.bind(TYPES.SecurityHandler).to(DefaultSecurityHandler);
  });
}
