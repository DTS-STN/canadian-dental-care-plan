import { ContainerModule } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants';

/**
 * Container module for configurations.
 */
export const configsContainerModule = new ContainerModule((bind) => {
  bind(SERVICE_IDENTIFIER.CLIENT_CONFIG).toDynamicValue((context) => context.container.get(SERVICE_IDENTIFIER.CONFIG_FACTORY).createClientConfig());
  bind(SERVICE_IDENTIFIER.SERVER_CONFIG).toDynamicValue((context) => context.container.get(SERVICE_IDENTIFIER.CONFIG_FACTORY).createServerConfig());
});
