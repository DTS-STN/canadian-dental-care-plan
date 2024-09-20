import { error } from 'console';
import { Container } from 'inversify';
import { makeLoggerMiddleware, textSerializer } from 'inversify-logger-middleware';

import type { ServerConfig } from '~/.server/configs';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import { configsContainerModule } from '~/.server/container-modules/configs.container-module';
import { factoriesContainerModule } from '~/.server/container-modules/factories.container-module';
import { mappersContainerModule } from '~/.server/container-modules/mappers.container-module';
import { repositoriesContainerModule } from '~/.server/container-modules/repositories.container-module';
import { servicesContainerModule } from '~/.server/container-modules/services.container-module';
import type { Logger } from '~/.server/factories/log.factory';
import { getLogger } from '~/utils/logging.server';

export function initContainer() {
  const log = getLogger('container.init');

  const container = new Container({ defaultScope: 'Singleton' });
  log.info('Initializing IoC container; id: [%s], options: [%j]', container.id, container.options);

  // load container modules
  container.load(factoriesContainerModule, configsContainerModule, repositoriesContainerModule, mappersContainerModule, servicesContainerModule);

  // configure container logger middleware
  const serverConfig = container.get<ServerConfig>(SERVICE_IDENTIFIER.SERVER_CONFIG);

  if (serverConfig.NODE_ENV === 'development') {
    container.applyMiddleware(createLoggerMidddlware(log));
  }

  log.info('IoC container initialized; id: [%s]', container.id);

  return container;
}

function createLoggerMidddlware(log: Logger) {
  return makeLoggerMiddleware(
    {
      request: {
        bindings: { activated: true, implementationType: true, scope: true, serviceIdentifier: true, type: true },
        serviceIdentifier: true,
        target: { metadata: true, name: true, serviceIdentifier: true },
      },
      time: true,
    },
    (out) => {
      if (out.error) {
        log.error(error);
        return;
      }

      log.trace(textSerializer(out));
    },
  );
}
