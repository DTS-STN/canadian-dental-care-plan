import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { PreferredCommunicationMethodEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories';
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
export class PreferredCommunicationMethodRepositoryImpl implements PreferredCommunicationMethodRepository {
  private readonly log: Logger;

  constructor(@inject(TYPES.LOG_FACTORY) logFactory: LogFactory) {
    this.log = logFactory.createLogger('PreferredCommunicationMethodRepositoryImpl');
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
