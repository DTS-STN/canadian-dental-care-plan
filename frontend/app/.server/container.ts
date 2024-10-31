import { error } from 'console';
import type { interfaces } from 'inversify';
import { Container } from 'inversify';
import { makeLoggerMiddleware, textSerializer } from 'inversify-logger-middleware';

import type { ServerConfig } from '~/.server/configs';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import { configsContainerModule, containerProvidersContainerModule, factoriesContainerModule, mappersContainerModule, repositoriesContainerModule, servicesContainerModule, webValidatorsContainerModule } from '~/.server/container-modules';
import type { ContainerConfigProvider, ContainerServiceProvider, ContainerWebValidatorProvider } from '~/.server/providers';
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

let containerInstance: interfaces.Container | undefined;
let containerConfigProviderInstance: ContainerConfigProvider | undefined;
let containerServiceProviderInstance: ContainerServiceProvider | undefined;
let containerWebValidatorProviderInstance: ContainerWebValidatorProvider | undefined;

/**
 * Return the IoC container singleton.
 *
 * @returns the IoC container singleton
 */
function getContainer(): interfaces.Container {
  return (containerInstance ??= createContainer());
}

/**
 * Returns the ContainerConfigProvider singleton instance.
 *
 * @returns The ContainerConfigProvider singleton instance.
 */
export function getContainerConfigProvider(): ContainerConfigProvider {
  return (containerConfigProviderInstance ??= getContainer().get<ContainerConfigProvider>(SERVICE_IDENTIFIER.CONTAINER_CONFIG_PROVIDER));
}

/**
 * Returns the ContainerServiceProvider singleton instance.
 *
 * @returns The ContainerServiceProvider singleton instance.
 */
export function getContainerServiceProvider(): ContainerServiceProvider {
  return (containerServiceProviderInstance ??= getContainer().get<ContainerServiceProvider>(SERVICE_IDENTIFIER.CONTAINER_SERVICE_PROVIDER));
}

/**
 * Returns the ContainerWebValidatorProvider singleton instance.
 *
 * @returns The ContainerWebValidatorProvider singleton instance.
 */
export function getContainerWebValidatorProvider(): ContainerWebValidatorProvider {
  return (containerWebValidatorProviderInstance ??= getContainer().get<ContainerWebValidatorProvider>(SERVICE_IDENTIFIER.CONTAINER_WEB_VALIDATOR_PROVIDER));
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
  const serverConfig = container.get<ServerConfig>(SERVICE_IDENTIFIER.SERVER_CONFIG);

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
