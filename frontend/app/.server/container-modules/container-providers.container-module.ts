import { ContainerModule } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import { ContainerConfigProviderImpl, ContainerServiceProviderImpl } from '~/.server/providers';

/**
 * Container module for container providers.
 */
export const containerProvidersContainerModule = new ContainerModule((bind) => {
  bind(SERVICE_IDENTIFIER.CONTAINER_CONFIG_PROVIDER).to(ContainerConfigProviderImpl);
  bind(SERVICE_IDENTIFIER.CONTAINER_SERVICE_PROVIDER).to(ContainerServiceProviderImpl);
});
