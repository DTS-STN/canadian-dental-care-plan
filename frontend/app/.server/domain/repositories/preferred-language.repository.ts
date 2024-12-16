import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { PreferredLanguageEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories';
import preferredLanguageJsonDataSource from '~/.server/resources/power-platform/preferred-language.json';

export interface PreferredLanguageRepository {
  /**
   * Fetch all preferred language entities.
   * @returns All preferred languages entities.
   */
  listAllPreferredLanguages(): PreferredLanguageEntity[];

  /**
   * Fetch a preferred language entity by its id.
   * @param id The id of the preferred language entity.
   * @returns The preferred language entity or null if not found.
   */
  findPreferredLanguageById(id: string): PreferredLanguageEntity | null;
}

@injectable()
export class DefaultPreferredLanguageRepository implements PreferredLanguageRepository {
  private readonly log: Logger;

  constructor(@inject(TYPES.factories.LogFactory) logFactory: LogFactory) {
    this.log = logFactory.createLogger('DefaultPreferredLanguageRepository');
  }

  listAllPreferredLanguages(): PreferredLanguageEntity[] {
    this.log.debug('Fetching all preferred languages');
    const preferredLanguageEntities = preferredLanguageJsonDataSource.value.at(0)?.OptionSet.Options;

    if (!preferredLanguageEntities) {
      this.log.warn('No preferred languages found');
      return [];
    }

    this.log.trace('Returning preferred languages: [%j]', preferredLanguageEntities);
    return preferredLanguageEntities;
  }

  findPreferredLanguageById(id: string): PreferredLanguageEntity | null {
    this.log.debug('Fetching preferred language with id: [%s]', id);

    const preferredLanguageEntities = preferredLanguageJsonDataSource.value.at(0)?.OptionSet.Options;
    const preferredLanguageEntity = preferredLanguageEntities?.find(({ Value }) => Value.toString() === id);

    if (!preferredLanguageEntity) {
      this.log.warn('Preferred language not found; id: [%s]', id);
      return null;
    }

    return preferredLanguageEntity;
  }
}
