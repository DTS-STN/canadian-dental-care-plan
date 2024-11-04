import { ContainerModule } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import { ContainerServiceProviderImpl } from '~/.server/providers';

/**
 * Container module for container providers.
 */
export const containerProvidersContainerModule = new ContainerModule((bind) => {
  bind(SERVICE_IDENTIFIER.CONTAINER_SERVICE_PROVIDER).to(ContainerServiceProviderImpl);
});
