import { inject, injectable } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants/service-identifier.contant';
import type { PreferredLanguageEntity } from '~/.server/domain/entities/preferred-language.entity';
import type { LogFactory, Logger } from '~/.server/factories/log.factory';
import preferredLanguageJsonDataSource from '~/.server/resources/power-platform/preferred-language.json';

export interface PreferredLanguageRepository {
  /**
   * Fetch all preferred language entities.
   * @returns All preferred languages entities.
   */
  getAllPreferredLanguages(): PreferredLanguageEntity[];

  /**
   * Fetch a preferred language entity by its id.
   * @param id The id of the preferred language entity.
   * @returns The preferred language entity. If the preferred language is not found, return null.
   */
  getPreferredLanguageById(id: string): PreferredLanguageEntity | null;
}

@injectable()
export class PreferredLanguageRepositoryImpl implements PreferredLanguageRepository {
  private readonly log: Logger;

  constructor(@inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory) {
    this.log = logFactory.createLogger('PreferredLanguageRepositoryImpl');
  }

  getAllPreferredLanguages(): PreferredLanguageEntity[] {
    this.log.debug('Fetching all preferred languages');
    const preferredLanguageEntities = preferredLanguageJsonDataSource.value.at(0)?.OptionSet.Options;

    if (!preferredLanguageEntities) {
      this.log.warn('No preferred languages found');
      return [];
    }

    this.log.trace('Returning preferred languages: [%j]', preferredLanguageEntities);
    return preferredLanguageEntities;
  }

  getPreferredLanguageById(id: string): PreferredLanguageEntity | null {
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
