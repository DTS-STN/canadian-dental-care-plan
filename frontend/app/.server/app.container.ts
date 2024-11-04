import type { interfaces } from 'inversify';
import { Container } from 'inversify';
import { makeLoggerMiddleware, textSerializer } from 'inversify-logger-middleware';

import type { AppContainerProvider } from '~/.server/app-container.provider';
import { AppContainerProviderImpl } from '~/.server/app-container.provider';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import { configsContainerModule, factoriesContainerModule, mappersContainerModule, repositoriesContainerModule, servicesContainerModule, webValidatorsContainerModule } from '~/.server/container-modules';
import { getLogger } from '~/utils/logging.server';

/**
 * This module bootstraps the application by creating an Inversion of Control (IoC) container.
 * It uses InversifyJS as the IoC container and initializes it with various modules that
 * provide bindings for different components of the application.
 *
 * The container is a singleton, meaning only one instance of it is created and shared
 * throughout the application. This ensures that all parts of the application have access
 * to the same instances of dependencies.
 *
 * The container is also configured with a logger middleware that logs information about
 * dependency resolution. This can be useful for debugging and understanding how the
 * application is wired together.
 */

let appContainerInstance: interfaces.Container | undefined;
let appContainerProviderInstance: AppContainerProvider | undefined;

/**
 * Return the IoC app container singleton.
 *
 * @returns the IoC app container singleton
 */
function getAppContainer(): interfaces.Container {
  return (appContainerInstance ??= createContainer());
}

/**
 * Returns the ContainerConfigProvider singleton instance.
 *
 * @returns The ContainerConfigProvider singleton instance.
 */
export function getAppContainerProvider(): AppContainerProvider {
  return (appContainerProviderInstance ??= new AppContainerProviderImpl(getAppContainer()));
}

/**
 * Create a new IoC container.
 *
 * @returns the new IoC container
 */
function createContainer(): interfaces.Container {
  const log = getLogger('container/createContainer');

  const container = new Container({ defaultScope: 'Singleton' });
  log.info('Creating IoC container; id: [%s], options: [%j]', container.id, container.options);

  // load container modules
  container.load(configsContainerModule, factoriesContainerModule, mappersContainerModule, repositoriesContainerModule, servicesContainerModule, webValidatorsContainerModule);

  // configure container logger middleware
  const serverConfig = container.get(SERVICE_IDENTIFIER.SERVER_CONFIG);

  if (serverConfig.NODE_ENV === 'development') {
    container.applyMiddleware(createLoggerMidddlware());
  }

  log.info('IoC container created; id: [%s]', container.id);

  return container;
}

/**
 * Create a logger middleware for the IoC container.
 *
 * @returns the logger middleware
 */
function createLoggerMidddlware(): interfaces.Middleware {
  const loggerMiddlewareLog = getLogger('container/LoggerMiddleware');
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
      // NOTE: The "find" method in AppContainerProvider will return null if that error is thrown. This might be intentional.
      if (out.exception && out.exception instanceof Error && out.exception.message.startsWith('No matching bindings found for serviceIdentifier')) {
        loggerMiddlewareLog.warn(out.exception.message);
        return;
      }

      if (out.exception) {
        loggerMiddlewareLog.error(out.exception);
        return;
      }

      loggerMiddlewareLog.debug(textSerializer(out));
    },
  );
}
