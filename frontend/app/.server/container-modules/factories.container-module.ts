import { ContainerModule } from 'inversify';

import { TYPES } from '~/.server/constants';
import { ConfigFactoryImpl, LogFactoryImpl } from '~/.server/factories';

/**
 * Container module for factories.
 */
export const factoriesContainerModule = new ContainerModule((bind) => {
  bind(TYPES.CONFIG_FACTORY).to(ConfigFactoryImpl);
  bind(TYPES.LOG_FACTORY).to(LogFactoryImpl);
});
