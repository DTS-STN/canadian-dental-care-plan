import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { MaritalStatusDto, MaritalStatusLocalizedDto } from '~/.server/domain/dtos';
import { MaritalStatusNotFoundException } from '~/.server/domain/exceptions';
import type { MaritalStatusDtoMapper } from '~/.server/domain/mappers';
import type { MaritalStatusRepository } from '~/.server/domain/repositories';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';

/**
 * Service interface for managing marital status data.
 */
export interface MaritalStatusService {
  /**
   * Retrieves a list of all marital statuses.
   *
   * @returns An array of MaritalStatus DTOs.
   */
  listMaritalStatuses(): ReadonlyArray<MaritalStatusDto>;

  /**
   * Retrieves a specific marital status by its ID.
   *
   * @param id - The ID of the marital status to retrieve.
   * @returns The MaritalStatus DTO corresponding to the specified ID.
   * @throws {MaritalStatusNotFoundException} If no marital status is found with the specified ID.
   */
  getMaritalStatusById(id: string): MaritalStatusDto;

  /**
   * Retrieves a list of all marital statuses in the specified locale.
   *
   * @param locale - The desired locale (e.g., 'en' or 'fr').
   * @returns An array of MaritalStatus DTOs in the specified locale.
   */
  listLocalizedMaritalStatuses(locale: AppLocale): ReadonlyArray<MaritalStatusLocalizedDto>;

  /**
   * Retrieves a specific marital status by its ID in the specified locale.
   *
   * @param id - The ID of the marital status to retrieve.
   * @param locale - The desired locale (e.g., 'en' or 'fr').
   * @returns The MaritalStatus DTO corresponding to the specified ID in the given locale.
   * @throws {MaritalStatusNotFoundException} If no marital status is found with the specified ID.
   */
  getLocalizedMaritalStatusById(id: string, locale: AppLocale): MaritalStatusLocalizedDto;
}

/**
 * Implementation of the MaritalStatusService interface.
 *
 * This service provides methods to manage and retrieve marital status data,
 * including localized versions of the data.
 *
 * The service uses caching to optimize performance and reduce redundant
 * database lookups. It integrates with a logging system to trace operations.
 */
@injectable()
export class DefaultMaritalStatusService implements MaritalStatusService {
  private readonly log: Logger;
  private readonly maritalStatusDtoMapper: MaritalStatusDtoMapper;
  private readonly maritalStatusRepository: MaritalStatusRepository;
  private readonly serverConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_MARITAL_STATUSES_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_MARITAL_STATUS_CACHE_TTL_SECONDS'>;

  constructor(
    @inject(TYPES.domain.mappers.MaritalStatusDtoMapper) maritalStatusDtoMapper: MaritalStatusDtoMapper,
    @inject(TYPES.domain.repositories.MaritalStatusRepository) maritalStatusRepository: MaritalStatusRepository,
    @inject(TYPES.configs.ServerConfig) serverConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_MARITAL_STATUSES_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_MARITAL_STATUS_CACHE_TTL_SECONDS'>,
  ) {
    this.log = createLogger('DefaultMaritalStatusService');
    this.maritalStatusDtoMapper = maritalStatusDtoMapper;
    this.maritalStatusRepository = maritalStatusRepository;
    this.serverConfig = serverConfig;
    this.init();
  }

  private init(): void {
    // Configure caching for marital status operations
    const allMaritalStatusesCacheTTL = 1000 * this.serverConfig.LOOKUP_SVC_ALL_MARITAL_STATUSES_CACHE_TTL_SECONDS;
    const maritalStatusCacheTTL = 1000 * this.serverConfig.LOOKUP_SVC_MARITAL_STATUS_CACHE_TTL_SECONDS;

    this.log.debug('Cache TTL values; allMaritalStatusesCacheTTL: %d ms, maritalStatusCacheTTL: %d ms', allMaritalStatusesCacheTTL, maritalStatusCacheTTL);

    this.listMaritalStatuses = moize(this.listMaritalStatuses, {
      maxAge: allMaritalStatusesCacheTTL,
      onCacheAdd: () => this.log.info('Creating new listMaritalStatuses memo'),
    });

    this.getMaritalStatusById = moize(this.getMaritalStatusById, {
      maxAge: maritalStatusCacheTTL,
      maxSize: Infinity,
      onCacheAdd: () => this.log.info('Creating new getMaritalStatusById memo'),
    });

    this.log.debug('DefaultMaritalStatusService initiated.');
  }

  listMaritalStatuses(): ReadonlyArray<MaritalStatusDto> {
    this.log.debug('Get all marital statuses');
    const maritalStatusEntities = this.maritalStatusRepository.listAllMaritalStatuses();
    const maritalStatusDtos = this.maritalStatusDtoMapper.mapMaritalStatusEntitiesToMaritalStatusDtos(maritalStatusEntities);
    this.log.trace('Returning marital statuses: [%j]', maritalStatusDtos);
    return maritalStatusDtos;
  }

  getMaritalStatusById(id: string): MaritalStatusDto {
    this.log.debug('Get marital status with id: [%s]', id);
    const maritalStatusEntity = this.maritalStatusRepository.findMaritalStatusById(id);

    if (!maritalStatusEntity) {
      this.log.error('Marital status with id: [%s] not found', id);
      throw new MaritalStatusNotFoundException(`Marital status with id: [${id}] not found`);
    }

    const maritalStatusDto = this.maritalStatusDtoMapper.mapMaritalStatusEntityToMaritalStatusDto(maritalStatusEntity);
    this.log.trace('Returning marital status: [%j]', maritalStatusDto);
    return maritalStatusDto;
  }

  listLocalizedMaritalStatuses(locale: AppLocale): ReadonlyArray<MaritalStatusLocalizedDto> {
    this.log.debug('Get all localized marital statuses with locale: [%s]', locale);
    const maritalStatusDtos = this.listMaritalStatuses();
    const localizedMaritalStatusDtos = this.maritalStatusDtoMapper.mapMaritalStatusDtosToMaritalStatusLocalizedDtos(maritalStatusDtos, locale);
    this.log.trace('Returning localized marital statuses: [%j]', localizedMaritalStatusDtos);
    return localizedMaritalStatusDtos;
  }

  getLocalizedMaritalStatusById(id: string, locale: AppLocale): MaritalStatusLocalizedDto {
    this.log.debug('Get localized marital status with id: [%s] and locale: [%s]', id, locale);
    const maritalStatusDto = this.getMaritalStatusById(id);
    const localizedMaritalStatusDto = this.maritalStatusDtoMapper.mapMaritalStatusDtoToMaritalStatusLocalizedDto(maritalStatusDto, locale);
    this.log.trace('Returning localized marital status: [%j]', localizedMaritalStatusDto);
    return localizedMaritalStatusDto;
  }
}
