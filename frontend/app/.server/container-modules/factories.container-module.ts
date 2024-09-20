import { ContainerModule } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import { ConfigFactoryImpl , LogFactoryImpl } from '~/.server/factories';
import type { ConfigFactory , LogFactory } from '~/.server/factories';

/**
 * Container module for factories.
 */
export const factoriesContainerModule = new ContainerModule((bind) => {
  bind<ConfigFactory>(SERVICE_IDENTIFIER.CONFIG_FACTORY).to(ConfigFactoryImpl);
  bind<LogFactory>(SERVICE_IDENTIFIER.LOG_FACTORY).to(LogFactoryImpl);
});
