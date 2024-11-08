import { ContainerModule } from 'inversify';

import { TYPES } from '~/.server/constants';
import { ConfigFactoryImpl, LogFactoryImpl } from '~/.server/factories';

/**
 * Container module for factories.
 */
export const factoriesContainerModule = new ContainerModule((bind) => {
  bind(TYPES.domain.services.ConfigFactory).to(ConfigFactoryImpl);
  bind(TYPES.factories.LogFactory).to(LogFactoryImpl);
});
