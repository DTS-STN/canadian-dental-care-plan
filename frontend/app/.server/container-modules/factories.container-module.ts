import { ContainerModule } from 'inversify';

import { TYPES } from '~/.server/constants';
import { ConfigFactoryImpl, LogFactoryImpl } from '~/.server/factories';

/**
 * Container module for factories.
 */
export const factoriesContainerModule = new ContainerModule((bind) => {
  bind(TYPES.ConfigFactory).to(ConfigFactoryImpl);
  bind(TYPES.LogFactory).to(LogFactoryImpl);
});
