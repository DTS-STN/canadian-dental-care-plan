import { injectable } from 'inversify';

import type { PreferredCommunicationMethodEntity } from '~/.server/domain/entities';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';
import preferredCommunicationMethodJsonDataSource from '~/.server/resources/power-platform/preferred-communication-method.json';

export interface PreferredCommunicationMethodRepository {
  /**
   * Fetch all preferred communication method entities.
   * @returns All preferred communication method entities.
   */
  listAllPreferredCommunicationMethods(): PreferredCommunicationMethodEntity[];

  /**
   * Fetch a preferred communication method entity by its id.
   * @param id The id of the preferred communication method entity.
   * @returns The preferred communication method entity or null if not found.
   */
  findPreferredCommunicationMethodById(id: string): PreferredCommunicationMethodEntity | null;
}

@injectable()
export class DefaultPreferredCommunicationMethodRepository implements PreferredCommunicationMethodRepository {
  private readonly log: Logger;

  constructor() {
    this.log = createLogger('DefaultPreferredCommunicationMethodRepository');
  }

  listAllPreferredCommunicationMethods(): PreferredCommunicationMethodEntity[] {
    throw new Error('Preferred communication method service is not yet implemented');
    //TODO: Implement findPreferredCommunicationMethodById service
  }

  findPreferredCommunicationMethodById(id: string): PreferredCommunicationMethodEntity | null {
    throw new Error('Preferred communication method service is not yet implemented');
    //TODO: Implement findPreferredCommunicationMethodById service
  }
}

@injectable()
export class MockPreferredCommunicationMethodRepository implements PreferredCommunicationMethodRepository {
  private readonly log: Logger;

  constructor() {
    this.log = createLogger('MockPreferredCommunicationMethodRepository');
  }

  listAllPreferredCommunicationMethods(): PreferredCommunicationMethodEntity[] {
    this.log.debug('Fetching all preferred communication methods');
    const preferredCommunicationMethodEntities = preferredCommunicationMethodJsonDataSource.value.at(0)?.OptionSet.Options;

    if (!preferredCommunicationMethodEntities) {
      this.log.warn('No preferred communication methods found');
      return [];
    }

    this.log.trace('Returning preferred communication methods: [%j]', preferredCommunicationMethodEntities);
    return preferredCommunicationMethodEntities;
  }

  findPreferredCommunicationMethodById(id: string): PreferredCommunicationMethodEntity | null {
    this.log.debug('Fetching preferred communication method with id: [%s]', id);

    const preferredCommunicationMethodEntities = preferredCommunicationMethodJsonDataSource.value.at(0)?.OptionSet.Options;
    const preferredCommunicationMethodEntity = preferredCommunicationMethodEntities?.find(({ Value }) => Value.toString() === id);

    if (!preferredCommunicationMethodEntity) {
      this.log.warn('Preferred communication method not found; id: [%s]', id);
      return null;
    }

    return preferredCommunicationMethodEntity;
  }
}
