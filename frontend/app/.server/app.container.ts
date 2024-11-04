import { error } from 'console';
import type { interfaces } from 'inversify';
import { Container } from 'inversify';
import { makeLoggerMiddleware, textSerializer } from 'inversify-logger-middleware';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import { configsContainerModule, containerProvidersContainerModule, factoriesContainerModule, mappersContainerModule, repositoriesContainerModule, servicesContainerModule, webValidatorsContainerModule } from '~/.server/container-modules';
import type { AppContainerProvider, ContainerServiceProvider } from '~/.server/providers';
import { AppContainerProviderImpl } from '~/.server/providers';
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
let containerServiceProviderInstance: ContainerServiceProvider | undefined;

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
 * Returns the ContainerServiceProvider singleton instance.
 *
 * @returns The ContainerServiceProvider singleton instance.
 */
export function getContainerServiceProvider(): ContainerServiceProvider {
  return (containerServiceProviderInstance ??= getAppContainer().get(SERVICE_IDENTIFIER.CONTAINER_SERVICE_PROVIDER));
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
  container.load(configsContainerModule, containerProvidersContainerModule, factoriesContainerModule, mappersContainerModule, repositoriesContainerModule, servicesContainerModule, webValidatorsContainerModule);

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
      if (out.error) {
        loggerMiddlewareLog.error(error);
        return;
      }

      loggerMiddlewareLog.trace(textSerializer(out));
    },
  );
}
