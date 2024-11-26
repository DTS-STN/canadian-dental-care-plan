import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { CountryDto, CountryLocalizedDto } from '~/.server/domain/dtos';
import { CountryNotFoundException } from '~/.server/domain/exceptions';
import type { CountryDtoMapper } from '~/.server/domain/mappers';
import type { CountryRepository } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories';
import { moveToTop } from '~/.server/utils/collection.utils';

/**
 * Service interface for managing country data.
 */
export interface CountryService {
  /**
   * Retrieves a list of all countries.
   *
   * @returns An array of Country DTOs.
   */
  listCountries(): ReadonlyArray<CountryDto>;

  /**
   * Retrieves a specific country by its ID.
   *
   * @param id - The ID of the country to retrieve.
   * @returns The Country DTO corresponding to the specified ID.
   * @throws {CountryNotFoundException} If no country is found with the specified ID.
   */
  getCountryById(id: string): CountryDto;

  /**
   * Retrieves a list of all countries in the specified locale.
   *
   * @param locale - The desired locale (e.g., 'en' or 'fr').
   * @returns An array of Country DTOs in the specified locale.
   */
  listAndSortLocalizedCountries(locale: AppLocale): ReadonlyArray<CountryLocalizedDto>;

  /**
   * Retrieves a specific country by its ID in the specified locale.
   *
   * @param id - The ID of the country to retrieve.
   * @param locale - The desired locale (e.g., 'en' or 'fr').
   * @returns The Country DTO corresponding to the specified ID in the given locale.
   * @throws {CountryNotFoundException} If no country is found with the specified ID.
   */
  getLocalizedCountryById(id: string, locale: AppLocale): CountryLocalizedDto;
}

export type CountryServiceImpl_ServiceConfig = Pick<ServerConfig, 'CANADA_COUNTRY_ID' | 'LOOKUP_SVC_ALL_COUNTRIES_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_COUNTRY_CACHE_TTL_SECONDS'>;

/**
 * Implementation of the CountryService interface.
 * This service provides methods to manage and retrieve country data,
 * including localized versions of the data.
 *
 * The service uses caching to optimize performance and reduce redundant
 * database lookups. It integrates with a logging system to trace operations.
 */
@injectable()
export class DefaultCountryService implements CountryService {
  private readonly log: Logger;

  /**
   * Constructs a new DefaultCountryService instance.
   *
   * @param logFactory - A factory for creating logger instances.
   * @param countryDtoMapper - The mapper responsible for transforming country entities into DTOs.
   * @param countryRepository - The repository for accessing country data.
   * @param serverConfig - The server configuration containing necessary constants and cache TTL values.
   */
  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.domain.mappers.CountryDtoMapper) private readonly countryDtoMapper: CountryDtoMapper,
    @inject(TYPES.domain.repositories.CountryRepository) private readonly countryRepository: CountryRepository,
    @inject(TYPES.configs.ServerConfig) private readonly serverConfig: CountryServiceImpl_ServiceConfig,
  ) {
    this.log = logFactory.createLogger('DefaultCountryService');

    // Configure caching for country operations
    this.listCountries.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_ALL_COUNTRIES_CACHE_TTL_SECONDS;
    this.getCountryById.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_COUNTRY_CACHE_TTL_SECONDS;
  }

  /**
   * Retrieves a list of all countries.
   *
   * @returns An array of Country DTOs.
   */
  listCountries = moize(this.DefaultlistCountries, {
    onCacheAdd: () => this.log.info('Creating new listCountries memo'),
  });

  /**
   * Retrieves a specific country by its ID.
   *
   * @param id - The ID of the country to retrieve.
   * @returns The Country DTO corresponding to the specified ID.
   * @throws {CountryNotFoundException} If no country is found with the specified ID.
   */
  getCountryById = moize(this.DefaultgetCountryById, {
    maxSize: Infinity,
    onCacheAdd: () => this.log.info('Creating new getCountryById memo'),
  });

  /**
   * Retrieves a list of all countries in the specified locale and sorts them.
   *
   * @param locale - The desired locale (e.g., 'en' or 'fr').
   * @returns An array of localized Country DTOs.
   */
  listAndSortLocalizedCountries(locale: AppLocale): ReadonlyArray<CountryLocalizedDto> {
    this.log.debug('Get and sort all localized countries with locale: [%s]', locale);
    const countryDtos = this.listCountries();
    const localizedCountryDtos = this.countryDtoMapper.mapCountryDtosToCountryLocalizedDtos(countryDtos, locale);
    const sortedLocalizedCountryDtos = this.sortLocalizedCountries(localizedCountryDtos, locale);
    this.log.trace('Returning sorted localized countries: [%j]', sortedLocalizedCountryDtos);
    return sortedLocalizedCountryDtos;
  }

  /**
   * Retrieves a specific country by its ID in the specified locale.
   *
   * @param id - The ID of the country to retrieve.
   * @param locale - The desired locale (e.g., 'en' or 'fr').
   * @returns The localized Country DTO corresponding to the specified ID.
   * @throws {CountryNotFoundException} If no country is found with the specified ID.
   */
  getLocalizedCountryById(id: string, locale: AppLocale): CountryLocalizedDto {
    this.log.debug('Get localized country with id: [%s] and locale: [%s]', id, locale);
    const countryDto = this.getCountryById(id);
    const localizedCountryDto = this.countryDtoMapper.mapCountryDtoToCountryLocalizedDto(countryDto, locale);
    this.log.trace('Returning localized country: [%j]', localizedCountryDto);
    return localizedCountryDto;
  }

  private DefaultlistCountries(): ReadonlyArray<CountryDto> {
    this.log.debug('Get all countries');
    const countryEntities = this.countryRepository.listAllCountries();
    const countryDtos = this.countryDtoMapper.mapCountryEntitiesToCountryDtos(countryEntities);
    this.log.trace('Returning countries: [%j]', countryDtos);
    return countryDtos;
  }

  private DefaultgetCountryById(id: string): CountryDto {
    this.log.debug('Get country with id: [%s]', id);
    const countryEntity = this.countryRepository.findCountryById(id);

    if (!countryEntity) {
      this.log.error('Country with id: [%s] not found', id);
      throw new CountryNotFoundException(`Country with id: [${id}] not found`);
    }

    const countryDto = this.countryDtoMapper.mapCountryEntityToCountryDto(countryEntity);
    this.log.trace('Returning country: [%j]', countryDto);
    return countryDto;
  }

  private sortLocalizedCountries(countries: ReadonlyArray<CountryLocalizedDto>, locale: AppLocale): ReadonlyArray<CountryLocalizedDto> {
    const sortByNamePredicate = (a: CountryLocalizedDto, b: CountryLocalizedDto) => a.name.localeCompare(b.name, locale);
    const moveCanadaToTopPredicate = (country: CountryLocalizedDto) => country.id === this.serverConfig.CANADA_COUNTRY_ID;
    return moveToTop(countries.toSorted(sortByNamePredicate), moveCanadaToTopPredicate);
  }
}
