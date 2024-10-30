import { ContainerModule } from 'inversify';

import type { ContainerConfigProvider, ContainerServiceProvider, ContainerWebValidatorProvider } from '../providers';
import { ContainerConfigProviderImpl, ContainerServiceProviderImpl, ContainerWebValidatorProviderImpl } from '../providers';
import { SERVICE_IDENTIFIER } from '~/.server/constants';

/**
 * Container module for container providers.
 */
export const containerProvidersContainerModule = new ContainerModule((bind) => {
  bind<ContainerConfigProvider>(SERVICE_IDENTIFIER.CONTAINER_CONFIG_PROVIDER).to(ContainerConfigProviderImpl);
  bind<ContainerServiceProvider>(SERVICE_IDENTIFIER.CONTAINER_SERVICE_PROVIDER).to(ContainerServiceProviderImpl);
  bind<ContainerWebValidatorProvider>(SERVICE_IDENTIFIER.CONTAINER_WEB_VALIDATOR_PROVIDER).to(ContainerWebValidatorProviderImpl);
});
