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
   * Retrieves all instances of a service from the container without throwing an error if the service is not found.
   * @param serviceIdentifier - The service identifier for the requested service.
   * @returns An array of instances of the requested service.
   */
  findAll<T>(serviceIdentifier: ServiceIdentifier<T>): T[];

  /**
   * Retrieves a service from the container. Throws an error if the service is not found.
   * @param serviceIdentifier - The service identifier for the requested service.
   * @returns The instance of the requested service.
   */
  get<T>(serviceIdentifier: ServiceIdentifier<T>): T;

  /**
   * Retrieves all instances of a service from the container. Throws an error if the service is not found.
   * @param serviceIdentifier - The service identifier for the requested service.
   * @returns An array of instances of the requested service.
   */
  getAll<T>(serviceIdentifier: ServiceIdentifier<T>): T[];
}

export class DefaultAppContainerProvider implements AppContainerProvider {
  private readonly log: Logger;

  constructor(private readonly container: interfaces.Container) {
    const logFactory = container.get(TYPES.factories.LogFactory);
    this.log = logFactory.createLogger('DefaultAppContainerProvider');
  }

  find<T>(serviceIdentifier: ServiceIdentifier<T>): T | undefined {
    this.log.trace('Finding service for service identifier: %s', serviceIdentifier);
    return this.container.tryGet(serviceIdentifier);
  }

  findAll<T>(serviceIdentifier: ServiceIdentifier<T>): T[] {
    this.log.trace('Finding service for service identifier: %s', serviceIdentifier);
    return this.container.tryGetAll(serviceIdentifier, { enforceBindingConstraints: true });
  }

  get<T>(serviceIdentifier: ServiceIdentifier<T>): T {
    this.log.trace('Get service for service identifier: %s', serviceIdentifier);
    return this.container.get(serviceIdentifier);
  }

  getAll<T>(serviceIdentifier: ServiceIdentifier<T>): T[] {
    this.log.trace('Getting all services for service identifier: %s', serviceIdentifier);
    return this.container.getAll(serviceIdentifier, { enforceBindingConstraints: true });
  }
}
