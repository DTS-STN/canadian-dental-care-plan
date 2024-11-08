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
export class LetterTypeServiceImpl implements LetterTypeService {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.domain.mappers.LetterTypeDtoMapper) private readonly letterTypeDtoMapper: LetterTypeDtoMapper,
    @inject(TYPES.domain.repositories.LetterTypeRepository) private readonly letterTypeRepository: LetterTypeRepository,
    @inject(TYPES.configs.ServerConfig) private readonly serverConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_LETTER_TYPES_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_LETTER_TYPE_CACHE_TTL_SECONDS'>,
  ) {
    this.log = logFactory.createLogger('LetterTypeServiceImpl');

    // Configure caching for letter type operations
    // TODO new config for getLetterTypeById?
    this.listLetterTypes.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_ALL_LETTER_TYPES_CACHE_TTL_SECONDS;
    this.getLetterTypeById.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_LETTER_TYPE_CACHE_TTL_SECONDS;
  }

  listLetterTypes = moize(this.listLetterTypesImpl, {
    onCacheAdd: () => this.log.info('Creating new listLetterTypes memo'),
  });

  private listLetterTypesImpl(): ReadonlyArray<LetterTypeDto> {
    this.log.trace('Getting all letter types');
    const letterTypeEntities = this.letterTypeRepository.listAllLetterTypes();
    const letterTypeDtos = this.letterTypeDtoMapper.mapLetterTypeEntitiesToLetterTypeDtos(letterTypeEntities);
    this.log.trace('Returning letter types: [%j]', letterTypeDtos);
    return letterTypeDtos;
  }

  getLetterTypeById = moize(this.getLetterTypeByIdImpl, {
    maxSize: Infinity,
    onCacheAdd: () => this.log.info('Creating new getLetterTypeById memo'),
  });

  private getLetterTypeByIdImpl(id: string): LetterTypeDto {
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
