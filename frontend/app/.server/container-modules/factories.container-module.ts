import { ContainerModule } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import { ConfigFactoryImpl, LogFactoryImpl } from '~/.server/factories';

/**
 * Container module for factories.
 */
export const factoriesContainerModule = new ContainerModule((bind) => {
  bind(SERVICE_IDENTIFIER.CONFIG_FACTORY).to(ConfigFactoryImpl);
  bind(SERVICE_IDENTIFIER.LOG_FACTORY).to(LogFactoryImpl);
});
