import { ContainerModule } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import { ConfigFactoryImpl } from '~/.server/factories/config.factory';
import type { ConfigFactory } from '~/.server/factories/config.factory';
import type { LogFactory } from '~/.server/factories/log.factory';
import { LogFactoryImpl } from '~/.server/factories/log.factory';

/**
 * Container module for factories.
 */
export const factoriesContainerModule = new ContainerModule((bind) => {
  bind<ConfigFactory>(SERVICE_IDENTIFIER.CONFIG_FACTORY).to(ConfigFactoryImpl);
  bind<LogFactory>(SERVICE_IDENTIFIER.LOG_FACTORY).to(LogFactoryImpl);
});
