import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { CountryEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories';
import countryJsonDataSource from '~/.server/resources/power-platform/country.json';

export interface CountryRepository {
  /**
   * Fetch all country entities.
   * @returns All country entities.
   */
  listAllCountries(): ReadonlyArray<CountryEntity>;

  /**
   * Fetch a country entity by its id.
   * @param id The id of the country entity.
   * @returns The country entity or null if not found.
   */
  findCountryById(id: string): CountryEntity | null;
}

@injectable()
export class DefaultCountryRepository implements CountryRepository {
  private readonly log: Logger;

  constructor(@inject(TYPES.factories.LogFactory) logFactory: LogFactory) {
    this.log = logFactory.createLogger(this.constructor.name);
  }

  listAllCountries(): ReadonlyArray<CountryEntity> {
    this.log.debug('Fetching all countries');
    const countryEntities = countryJsonDataSource.value;

    if (countryEntities.length === 0) {
      this.log.warn('No countries found');
      return [];
    }

    this.log.trace('Returning countries: [%j]', countryEntities);
    return countryEntities;
  }

  findCountryById(id: string): CountryEntity | null {
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
