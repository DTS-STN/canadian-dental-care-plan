import { inject, injectable } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { CountryEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories';
import countryJsonDataSource from '~/.server/resources/power-platform/country.json';

export interface CountryRepository {
  /**
   * Fetch all country entities.
   * @returns All country entities.
   */
  findAll(): ReadonlyArray<CountryEntity>;

  /**
   * Fetch a country entity by its id.
   * @param id The id of the country entity.
   * @returns The country entity or null if not found.
   */
  findById(id: string): CountryEntity | null;
}

@injectable()
export class CountryRepositoryImpl implements CountryRepository {
  private readonly log: Logger;

  constructor(@inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory) {
    this.log = logFactory.createLogger('CountryRepositoryImpl');
  }

  findAll(): ReadonlyArray<CountryEntity> {
    this.log.debug('Fetching all countries');
    const countryEntities = countryJsonDataSource.value;

    if (countryEntities.length === 0) {
      this.log.warn('No countries found');
      return [];
    }

    this.log.trace('Returning countries: [%j]', countryEntities);
    return countryEntities;
  }

  findById(id: string): CountryEntity | null {
    this.log.debug('Fetching country with id: [%s]', id);

    const countryEntities = countryJsonDataSource.value;
    const countryEntity = countryEntities.find(({ esdc_countryid }) => esdc_countryid === id);

    if (!countryEntity) {
      this.log.warn('Country not found; id: [%s]', id);
      return null;
    }

    return countryEntity;
  }
}
