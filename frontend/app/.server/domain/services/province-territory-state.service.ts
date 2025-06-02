import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { ProvinceTerritoryStateDto, ProvinceTerritoryStateLocalizedDto } from '~/.server/domain/dtos';
import { ProvinceTerritoryStateNotFoundException } from '~/.server/domain/exceptions';
import type { ProvinceTerritoryStateDtoMapper } from '~/.server/domain/mappers';
import type { ProvinceTerritoryStateRepository } from '~/.server/domain/repositories';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';

/**
 * Service interface for managing province territory state data.
 */
export interface ProvinceTerritoryStateService {
  /**
   * Retrieves a list of all province territory states.
   *
   * @returns An array of province territory state DTOs.
   */
  listProvinceTerritoryStates(): Promise<ReadonlyArray<ProvinceTerritoryStateDto>>;

  /**
   * Retrieves a specific province territory state by its ID.
   *
   * @param id - The ID of the province territory state to retrieve.
   * @returns The province territory state DTO corresponding to the specified ID.
   * @throws {ProvinceTerritoryStateNotFoundException} If no province territory state is found with the specified ID.
   */
  getProvinceTerritoryStateById(id: string): Promise<ProvinceTerritoryStateDto>;

  /**
   * Retrieves a specific province territory state by its Code.
   *
   * @param code - The code of the province territory state to retrieve.
   * @returns The province territory state DTO corresponding to the specified code.
   * @throws {ProvinceTerritoryStateNotFoundException} If no province territory state is found with the specified Code.
   */
  getProvinceTerritoryStateByCode(code: string): Promise<ProvinceTerritoryStateDto>;
  /**
   * Retrieves a list of all province territory states, localized to the specified locale.
   *
   * @param locale - The locale code for localization.
   * @returns An array of localized province territory state DTOs.
   */
  listAndSortLocalizedProvinceTerritoryStates(locale: AppLocale): Promise<ReadonlyArray<ProvinceTerritoryStateLocalizedDto>>;

  /**
   * Retrieves a list of province territory states filtered by country ID and localized to the specified locale, then sorted by name.
   *
   * @param countryId - The ID of the country to filter by.
   * @param locale - The locale code for localization.
   * @returns An array of localized province territory state DTOs filtered by country ID and sorted by name.
   */
  listAndSortLocalizedProvinceTerritoryStatesByCountryId(countryId: string, locale: AppLocale): Promise<ReadonlyArray<ProvinceTerritoryStateLocalizedDto>>;

  /**
   * Retrieves a specific province territory state by its ID, localized to the specified locale.
   *
   * @param id - The ID of the province territory state to retrieve.
   * @param locale - The locale code for localization.
   * @returns The localized province territory state DTO corresponding to the specified ID.
   * @throws {ProvinceTerritoryStateNotFoundException} If no province territory state is found with the specified ID.
   */
  getLocalizedProvinceTerritoryStateById(id: string, locale: AppLocale): Promise<ProvinceTerritoryStateLocalizedDto>;

  /**
   * Retrieves a specific province territory state by its code, localized to the specified locale.
   *
   * @param id - The code of the province territory state to retrieve.
   * @param locale - The locale code for localization.
   * @returns The localized province territory state DTO corresponding to the specified code.
   * @throws {ProvinceTerritoryStateNotFoundException} If no province territory state is found with the specified code.
   */
  getLocalizedProvinceTerritoryStateByCode(code: string, locale: AppLocale): Promise<ProvinceTerritoryStateLocalizedDto>;
}

@injectable()
export class DefaultProvinceTerritoryStateService implements ProvinceTerritoryStateService {
  private readonly log: Logger;
  private readonly provinceTerritoryStateDtoMapper: ProvinceTerritoryStateDtoMapper;
  private readonly provinceTerritoryStateRepository: ProvinceTerritoryStateRepository;
  private readonly serverConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_PROVINCE_TERRITORY_STATES_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_PROVINCE_TERRITORY_STATE_CACHE_TTL_SECONDS'>;

  constructor(
    @inject(TYPES.domain.mappers.ProvinceTerritoryStateDtoMapper) provinceTerritoryStateDtoMapper: ProvinceTerritoryStateDtoMapper,
    @inject(TYPES.domain.repositories.ProvinceTerritoryStateRepository) provinceTerritoryStateRepository: ProvinceTerritoryStateRepository,
    @inject(TYPES.configs.ServerConfig) serverConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_PROVINCE_TERRITORY_STATES_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_PROVINCE_TERRITORY_STATE_CACHE_TTL_SECONDS'>,
  ) {
    this.log = createLogger('DefaultProvinceTerritoryStateService');
    this.provinceTerritoryStateDtoMapper = provinceTerritoryStateDtoMapper;
    this.provinceTerritoryStateRepository = provinceTerritoryStateRepository;
    this.serverConfig = serverConfig;
    this.init();
  }

  private init(): void {
    const allProvinceTerritoryStatesCacheTTL = 1000 * this.serverConfig.LOOKUP_SVC_ALL_PROVINCE_TERRITORY_STATES_CACHE_TTL_SECONDS;
    const provinceTerritoryStateCacheTTL = 1000 * this.serverConfig.LOOKUP_SVC_PROVINCE_TERRITORY_STATE_CACHE_TTL_SECONDS;

    this.log.debug('Cache TTL values; allProvinceTerritoryStatesCacheTTL: %d ms, provinceTerritoryStateCacheTTL: %d ms', allProvinceTerritoryStatesCacheTTL, provinceTerritoryStateCacheTTL);

    this.listProvinceTerritoryStates = moize(this.listProvinceTerritoryStates, {
      maxAge: allProvinceTerritoryStatesCacheTTL,
      onCacheAdd: () => this.log.info('Creating new listProvinceTerritoryStates memo'),
    });

    this.getProvinceTerritoryStateById = moize(this.getProvinceTerritoryStateById, {
      maxAge: provinceTerritoryStateCacheTTL,

      maxSize: Infinity,
      onCacheAdd: () => this.log.info('Creating new getProvinceTerritoryStateById memo'),
    });
    this.getProvinceTerritoryStateByCode = moize(this.getProvinceTerritoryStateByCode, {
      maxAge: provinceTerritoryStateCacheTTL,
      maxSize: Infinity,
      onCacheAdd: () => this.log.info('Creating new getProvinceTerritoryStateByCode memo'),
    });

    this.log.debug('DefaultProvinceTerritoryStateService initiated.');
  }

  async listProvinceTerritoryStates(): Promise<ReadonlyArray<ProvinceTerritoryStateDto>> {
    this.log.debug('Get all province territory states');
    const provinceTerritoryStateEntities = await this.provinceTerritoryStateRepository.listAllProvinceTerritoryStates();
    const provinceTerritoryStateDtos = this.provinceTerritoryStateDtoMapper.mapProvinceTerritoryStateEntitiesToProvinceTerritoryStateDtos(provinceTerritoryStateEntities);
    this.log.trace('Returning province territory states: [%j]', provinceTerritoryStateDtos);
    return provinceTerritoryStateDtos;
  }

  async getProvinceTerritoryStateById(id: string): Promise<ProvinceTerritoryStateDto> {
    this.log.debug('Get province territory state with id: [%s]', id);
    const provinceTerritoryStateEntity = await this.provinceTerritoryStateRepository.findProvinceTerritoryStateById(id);

    if (!provinceTerritoryStateEntity) {
      throw new ProvinceTerritoryStateNotFoundException(`Province territory state: [${id}] not found`);
    }

    const provinceTerritoryStateDto = this.provinceTerritoryStateDtoMapper.mapProvinceTerritoryStateEntityToProvinceTerritoryStateDto(provinceTerritoryStateEntity);
    this.log.trace('Returning province territory state: [%j]', provinceTerritoryStateDto);
    return provinceTerritoryStateDto;
  }

  async getProvinceTerritoryStateByCode(code: string): Promise<ProvinceTerritoryStateDto> {
    this.log.debug('Get province territory state with code: [%s]', code);
    const provinceTerritoryStateEntity = await this.provinceTerritoryStateRepository.findProvinceTerritoryStateByCode(code);

    if (!provinceTerritoryStateEntity) {
      throw new ProvinceTerritoryStateNotFoundException(`Province territory state with code [${code}] not found`);
    }

    const provinceTerritoryStateDto = this.provinceTerritoryStateDtoMapper.mapProvinceTerritoryStateEntityToProvinceTerritoryStateDto(provinceTerritoryStateEntity);
    this.log.trace('Returning province territory state: [%j]', provinceTerritoryStateDto);
    return provinceTerritoryStateDto;
  }

  async listAndSortLocalizedProvinceTerritoryStates(locale: AppLocale): Promise<ReadonlyArray<ProvinceTerritoryStateLocalizedDto>> {
    this.log.debug('Get and sort all localized province territory states with locale: [%s]', locale);
    const provinceTerritoryStateDtos = await this.listProvinceTerritoryStates();
    const localizedProvinceTerritoryStateDtos = this.provinceTerritoryStateDtoMapper.mapProvinceTerritoryStateDtosToProvinceTerritoryStateLocalizedDtos(provinceTerritoryStateDtos, locale);
    const sortedLocalizedProvinceTerritoryStateDtos = this.sortLocalizedProvinceTerritoryStateDtos(localizedProvinceTerritoryStateDtos, locale);
    this.log.trace('Returning localized and sorted province territory states: [%j]', sortedLocalizedProvinceTerritoryStateDtos);
    return sortedLocalizedProvinceTerritoryStateDtos;
  }

  async listAndSortLocalizedProvinceTerritoryStatesByCountryId(countryId: string, locale: AppLocale): Promise<ReadonlyArray<ProvinceTerritoryStateLocalizedDto>> {
    this.log.debug('Get and sort all localized province territory states with countryId: [%s] and locale: [%s]', countryId, locale);
    const filterByCountryIdPredicate = (dto: ProvinceTerritoryStateDto) => dto.countryId === countryId;
    const provincesTerritoriesStates = await this.listProvinceTerritoryStates();
    const provinceTerritoryStateDtos = provincesTerritoriesStates.filter(filterByCountryIdPredicate);
    const localizedProvinceTerritoryStateDtos = this.provinceTerritoryStateDtoMapper.mapProvinceTerritoryStateDtosToProvinceTerritoryStateLocalizedDtos(provinceTerritoryStateDtos, locale);
    const sortedLocalizedProvinceTerritoryStateDtos = this.sortLocalizedProvinceTerritoryStateDtos(localizedProvinceTerritoryStateDtos, locale);
    this.log.trace('Returning localized and sorted province territory states: [%j]', sortedLocalizedProvinceTerritoryStateDtos);
    return sortedLocalizedProvinceTerritoryStateDtos;
  }

  async getLocalizedProvinceTerritoryStateById(id: string, locale: AppLocale): Promise<ProvinceTerritoryStateLocalizedDto> {
    this.log.debug('Get localized province territory state with id: [%s] and locale: [%s]', id, locale);
    const provinceTerritoryStateDto = await this.getProvinceTerritoryStateById(id);
    const localizedProvinceTerritoryStateDto = this.provinceTerritoryStateDtoMapper.mapProvinceTerritoryStateDtoToProvinceTerritoryStateLocalizedDto(provinceTerritoryStateDto, locale);
    this.log.trace('Returning localized province territory state: [%j]', localizedProvinceTerritoryStateDto);
    return localizedProvinceTerritoryStateDto;
  }

  async getLocalizedProvinceTerritoryStateByCode(code: string, locale: AppLocale): Promise<ProvinceTerritoryStateLocalizedDto> {
    this.log.debug('Get localized province territory state with code: [%s] and locale: [%s]', code, locale);
    const provinceTerritoryStateDto = await this.getProvinceTerritoryStateByCode(code);
    const localizedProvinceTerritoryStateDto = this.provinceTerritoryStateDtoMapper.mapProvinceTerritoryStateDtoToProvinceTerritoryStateLocalizedDto(provinceTerritoryStateDto, locale);
    this.log.trace('Returning localized province territory state with code [%s]: [%j]', code, localizedProvinceTerritoryStateDto);
    return localizedProvinceTerritoryStateDto;
  }
  /**
   * Sort the localized province territory states by name.
   */
  private sortLocalizedProvinceTerritoryStateDtos(dtos: ReadonlyArray<ProvinceTerritoryStateLocalizedDto>, locale: AppLocale) {
    const sortByNamePredicate = (a: ProvinceTerritoryStateLocalizedDto, b: ProvinceTerritoryStateLocalizedDto) => a.name.localeCompare(b.name, locale);
    return dtos.toSorted(sortByNamePredicate);
  }
}
