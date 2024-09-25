import { inject, injectable } from 'inversify';
import moize from 'moize';

import { CountryNotFoundException } from '../exceptions/CountryNotFoundException';
import type { ServerConfig } from '~/.server/configs';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { CountryDto, CountryLocalizedDto } from '~/.server/domain/dtos';
import type { CountryDtoMapper } from '~/.server/domain/mappers';
import type { CountryRepository } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories';

/**
 * Service interface for managing country data.
 */
export interface CountryService {
  /**
   * Retrieves a list of all countries.
   *
   * @returns An array of Country DTOs.
   */
  listCountries(): CountryDto[];

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
  listLocalizedCountries(locale: AppLocale): CountryLocalizedDto[];

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

@injectable()
export class CountryServiceImpl implements CountryService {
  private readonly log: Logger;

  constructor(
    @inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory,
    @inject(SERVICE_IDENTIFIER.COUNTRY_DTO_MAPPER) private readonly countryDtoMapper: CountryDtoMapper,
    @inject(SERVICE_IDENTIFIER.COUNTRY_REPOSITORY) private readonly countryRepository: CountryRepository,
    @inject(SERVICE_IDENTIFIER.SERVER_CONFIG) private readonly serverConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_COUNTRIES_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_COUNTRY_CACHE_TTL_SECONDS'>,
  ) {
    this.log = logFactory.createLogger('CountryServiceImpl');

    // set moize options
    this.listCountries.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_ALL_COUNTRIES_CACHE_TTL_SECONDS;
    this.getCountryById.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_COUNTRY_CACHE_TTL_SECONDS;
  }

  private listCountriesImpl(): CountryDto[] {
    this.log.debug('Get all countries');
    const countryEntities = this.countryRepository.findAll();
    const countryDtos = this.countryDtoMapper.mapCountryEntitiesToCountryDtos(countryEntities);
    this.log.trace('Returning countries: [%j]', countryDtos);
    return countryDtos;
  }

  listCountries = moize(this.listCountriesImpl, {
    onCacheAdd: () => this.log.info('Creating new findAll memo'),
  });

  private getCountryByIdImpl(id: string): CountryDto {
    this.log.debug('Get country with id: [%s]', id);
    const countryEntity = this.countryRepository.findById(id);

    if (!countryEntity) {
      throw new CountryNotFoundException(`Country with id: [${id}] not found`);
    }

    const countryDto = this.countryDtoMapper.mapCountryEntityToCountryDto(countryEntity);
    this.log.trace('Returning country: [%j]', countryDto);
    return countryDto;
  }

  getCountryById = moize(this.getCountryByIdImpl, {
    maxSize: Infinity,
    onCacheAdd: () => this.log.info('Creating new findById memo'),
  });

  listLocalizedCountries(locale: AppLocale): CountryLocalizedDto[] {
    this.log.debug('Get all localized countries with locale: [%s]', locale);
    const countryDtos = this.listCountries();
    const localizedCountryDtos = this.countryDtoMapper.mapCountryDtosToCountryLocalizedDtos(countryDtos, locale);
    this.log.trace('Returning localized countries: [%j]', localizedCountryDtos);
    return localizedCountryDtos;
  }

  getLocalizedCountryById(id: string, locale: AppLocale): CountryLocalizedDto {
    this.log.debug('Get locolized country with id: [%s] and locale: [%]', id, locale);
    const countryDto = this.getCountryById(id);
    const localizedCountryDto = this.countryDtoMapper.mapCountryDtoToCountryLocalizedDto(countryDto, locale);
    this.log.trace('Returning locolized country: [%j]', localizedCountryDto);
    return localizedCountryDto;
  }
}
