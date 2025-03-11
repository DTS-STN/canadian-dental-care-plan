import { Container } from 'inversify';

import type { AppContainerProvider } from '~/.server/app-container.provider';
import { DefaultAppContainerProvider } from '~/.server/app-container.provider';
import {
  authContainerModule,
  configsContainerModule,
  factoriesContainerModule,
  healthContainerModule,
  mappersContainerModule,
  repositoriesContainerModule,
  routesContainerModule,
  servicesContainerModule,
  webContainerModule,
} from '~/.server/container-modules';
import { getLogger } from '~/.server/utils/logging.utils';

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

let appContainerInstance: Container | undefined;
let appContainerProviderInstance: AppContainerProvider | undefined;

/**
 * Return the IoC app container singleton.
 *
 * @returns the IoC app container singleton
 */
async function getAppContainer(): Promise<Container> {
  return (appContainerInstance ??= await createContainer());
}

/**
 * Returns the ContainerConfigProvider singleton instance.
 *
 * @returns The ContainerConfigProvider singleton instance.
 */
export async function getAppContainerProvider(): Promise<AppContainerProvider> {
  return (appContainerProviderInstance ??= new DefaultAppContainerProvider(await getAppContainer()));
}

/**
 * Create a new IoC container.
 *
 * @returns the new IoC container
 */
async function createContainer(): Promise<Container> {
  const log = getLogger('container/createContainer');

  const container = new Container({ defaultScope: 'Singleton' });
  log.info('Creating IoC container: [%j]', container);

  // load container modules
  await container.load(authContainerModule, configsContainerModule, factoriesContainerModule, healthContainerModule, mappersContainerModule, repositoriesContainerModule, routesContainerModule, servicesContainerModule, webContainerModule);

  log.info('IoC container created; id: [%j]', container);

  return container;
}
