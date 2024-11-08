import type { interfaces } from 'inversify';

import type { ServiceIdentifier } from '~/.server/constants';
import { TYPES } from '~/.server/constants';
import type { Logger } from '~/.server/factories';

/**
 * AppContainerProvider interface provides methods for accessing services within an Inversify IoC container.
 */
export interface AppContainerProvider {
  /**
   * Tries to locate a service in the container without throwing an error if not found.
   * @param serviceIdentifier - The service identifier for the requested service.
   * @returns The service instance if found; otherwise, `undefined`.
   */
  find<T>(serviceIdentifier: ServiceIdentifier<T>): T | undefined;

  /**
   * Retrieves a service from the container. Throws an error if the service is not found.
   * @param serviceIdentifier - The service identifier for the requested service.
   * @returns The instance of the requested service.
   */
  get<T>(serviceIdentifier: ServiceIdentifier<T>): T;
}

export class AppContainerProviderImpl implements AppContainerProvider {
  private readonly log: Logger;

  constructor(private readonly container: interfaces.Container) {
    const logFactory = container.get(TYPES.LOG_FACTORY);
    this.log = logFactory.createLogger('AppContainerProviderImpl');
  }

  find<T>(serviceIdentifier: ServiceIdentifier<T>): T | undefined {
    this.log.trace('Finding service for service identifier: %s', serviceIdentifier);
    try {
      return this.container.get(serviceIdentifier);
    } catch (error) {
      this.log.trace('Service not found for service identifier: %s; returning undefined. Error: %o', serviceIdentifier, error);
      return undefined;
    }
  }

  get<T>(serviceIdentifier: ServiceIdentifier<T>): T {
    this.log.trace('Get service for service identifier: %s', serviceIdentifier);
    return this.container.get(serviceIdentifier);
  }
}
