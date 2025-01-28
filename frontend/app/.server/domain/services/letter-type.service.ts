import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { LetterTypeDto, LetterTypeLocalizedDto } from '~/.server/domain/dtos';
import { LetterTypeNotFoundException } from '~/.server/domain/exceptions';
import type { LetterTypeDtoMapper } from '~/.server/domain/mappers';
import type { LetterTypeRepository } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories';

/**
 * Service interface for managing letter type data.
 */
export interface LetterTypeService {
  /**
   * Retrieves a list of all letter types.
   *
   * @returns An array of letter type DTOs.
   */
  listLetterTypes(): ReadonlyArray<LetterTypeDto>;

  /**
   * Retrieves a specific letter type by its ID.
   *
   * @param id - The ID of the letter type to retrieve.
   * @returns The letter type DTO corresponding to the specified ID.
   * @throws {LetterTypeNotFoundException} If no letter type is found with the specified ID.
   */
  getLetterTypeById(id: string): LetterTypeDto;

  /**
   * Retrieves a list of all letter types in the specified locale.
   *
   * @param locale - The desired locale (e.g., 'en' or 'fr').
   * @returns An array of letter type DTOs in the specified locale.
   */
  listLocalizedLetterTypes(locale: AppLocale): ReadonlyArray<LetterTypeLocalizedDto>;

  /**
   * Retrieves a specific letter type by its ID in the specified locale.
   *
   * @param id - The ID of the letter type to retrieve.
   * @param locale - The desired locale (e.g., 'en' or 'fr').
   * @returns The letter type DTO corresponding to the specified ID in the given locale.
   * @throws {LetterTypeNotFoundException} If no letter type is found with the specified ID.
   */
  getLocalizedLetterTypeById(id: string, locale: AppLocale): LetterTypeLocalizedDto;
}

@injectable()
export class DefaultLetterTypeService implements LetterTypeService {
  private readonly log: Logger;
  private readonly letterTypeDtoMapper: LetterTypeDtoMapper;
  private readonly letterTypeRepository: LetterTypeRepository;
  private readonly serverConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_LETTER_TYPES_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_LETTER_TYPE_CACHE_TTL_SECONDS'>;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.domain.mappers.LetterTypeDtoMapper) letterTypeDtoMapper: LetterTypeDtoMapper,
    @inject(TYPES.domain.repositories.LetterTypeRepository) letterTypeRepository: LetterTypeRepository,
    @inject(TYPES.configs.ServerConfig) serverConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_LETTER_TYPES_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_LETTER_TYPE_CACHE_TTL_SECONDS'>,
  ) {
    this.log = logFactory.createLogger('DefaultLetterTypeService');
    this.letterTypeDtoMapper = letterTypeDtoMapper;
    this.letterTypeRepository = letterTypeRepository;
    this.serverConfig = serverConfig;
    this.init();
  }

  private init(): void {
    // Configure caching for letter type operations
    const allLetterTypesCacheTTL = 1000 * this.serverConfig.LOOKUP_SVC_ALL_LETTER_TYPES_CACHE_TTL_SECONDS;
    const letterTypeCacheTTL = 1000 * this.serverConfig.LOOKUP_SVC_LETTER_TYPE_CACHE_TTL_SECONDS;

    this.log.debug('Cache TTL values; allLetterTypesCacheTTL: %d ms, letterTypeCacheTTL: %d ms', allLetterTypesCacheTTL, letterTypeCacheTTL);

    this.listLetterTypes = moize(this.listLetterTypes, {
      maxAge: allLetterTypesCacheTTL,
      onCacheAdd: () => this.log.info('Creating new listLetterTypes memo'),
    });

    this.getLetterTypeById = moize(this.getLetterTypeById, {
      maxAge: letterTypeCacheTTL,
      maxSize: Infinity,
      onCacheAdd: () => this.log.info('Creating new getLetterTypeById memo'),
    });

    this.log.debug('DefaultLetterTypeService initiated.');
  }

  listLetterTypes(): ReadonlyArray<LetterTypeDto> {
    this.log.trace('Getting all letter types');
    const letterTypeEntities = this.letterTypeRepository.listAllLetterTypes();
    const letterTypeDtos = this.letterTypeDtoMapper.mapLetterTypeEntitiesToLetterTypeDtos(letterTypeEntities);
    this.log.trace('Returning letter types: [%j]', letterTypeDtos);
    return letterTypeDtos;
  }

  getLetterTypeById(id: string): LetterTypeDto {
    this.log.trace('Getting letter type with id: [%s]', id);
    const letterTypeEntity = this.letterTypeRepository.findLetterTypeById(id);

    if (!letterTypeEntity) {
      this.log.error('Letter type with id: [%s] not found', id);
      throw new LetterTypeNotFoundException(`Letter type with id: [${id}] not found`);
    }

    const letterTypeDto = this.letterTypeDtoMapper.mapLetterTypeEntityToLetterTypeDto(letterTypeEntity);
    this.log.trace('Returning letter type: [%j]', letterTypeDto);
    return letterTypeDto;
  }

  listLocalizedLetterTypes(locale: AppLocale): ReadonlyArray<LetterTypeLocalizedDto> {
    this.log.trace('Getting all localized letter types with locale: [%s]', locale);
    const letterTypeDtos = this.listLetterTypes();
    const localizedLetterTypeDtos = this.letterTypeDtoMapper.mapLetterTypeDtosToLetterTypeLocalizedDtos(letterTypeDtos, locale);
    this.log.trace('Returning localized letter types: [%j]', localizedLetterTypeDtos);
    return localizedLetterTypeDtos;
  }

  getLocalizedLetterTypeById(id: string, locale: AppLocale): LetterTypeLocalizedDto {
    this.log.trace('Getting localized letter type with id: [%s] and locale: [%s]', id, locale);
    const letterTypeDto = this.getLetterTypeById(id);
    const localizedLetterTypeDto = this.letterTypeDtoMapper.mapLetterTypeDtoToLetterTypeLocalizedDto(letterTypeDto, locale);
    this.log.trace('Returning localized letter type: [%j]', localizedLetterTypeDto);
    return localizedLetterTypeDto;
  }
}
