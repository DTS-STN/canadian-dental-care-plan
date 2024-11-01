import { ContainerModule } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import { ContainerConfigProviderImpl, ContainerServiceProviderImpl, ContainerWebValidatorProviderImpl } from '~/.server/providers';

/**
 * Container module for container providers.
 */
export const containerProvidersContainerModule = new ContainerModule((bind) => {
  bind(SERVICE_IDENTIFIER.CONTAINER_CONFIG_PROVIDER).to(ContainerConfigProviderImpl);
  bind(SERVICE_IDENTIFIER.CONTAINER_SERVICE_PROVIDER).to(ContainerServiceProviderImpl);
  bind(SERVICE_IDENTIFIER.CONTAINER_WEB_VALIDATOR_PROVIDER).to(ContainerWebValidatorProviderImpl);
});
