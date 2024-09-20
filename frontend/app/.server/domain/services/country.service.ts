import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { CountryDto } from '~/.server/domain/dtos';
import type { CountryDtoMapper } from '~/.server/domain/mappers';
import type { CountryRepository } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories/log.factory';

export interface CountryService {
  findAll(): CountryDto[];
  findById(id: string): CountryDto | null;
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
    this.findAll.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_ALL_COUNTRIES_CACHE_TTL_SECONDS;
    this.findById.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_COUNTRY_CACHE_TTL_SECONDS;
  }

  private findAllImpl(): CountryDto[] {
    this.log.debug('Get all countries');
    const countryEntities = this.countryRepository.findAll();
    const countryDtos = this.countryDtoMapper.mapCountryEntitiesToCountryDtos(countryEntities);
    this.log.trace('Returning countries: [%j]', countryDtos);
    return countryDtos;
  }

  findAll = moize(this.findAllImpl, {
    onCacheAdd: () => this.log.info('Creating new findAll memo'),
  });

  private findByIdImpl(id: string): CountryDto | null {
    this.log.debug('Get country with id: [%s]', id);
    const countryEntity = this.countryRepository.findById(id);
    const countryDto = countryEntity ? this.countryDtoMapper.mapCountryEntityToCountryDto(countryEntity) : null;
    this.log.trace('Returning country: [%j]', countryDto);
    return countryDto;
  }

  findById = moize(this.findByIdImpl, {
    maxSize: Infinity,
    onCacheAdd: () => this.log.info('Creating new findById memo'),
  });
}
