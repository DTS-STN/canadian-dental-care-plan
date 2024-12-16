import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { PreferredLanguageDto, PreferredLanguageLocalizedDto } from '~/.server/domain/dtos';
import { PreferredLanguageNotFoundException } from '~/.server/domain/exceptions';
import type { PreferredLanguageDtoMapper } from '~/.server/domain/mappers';
import type { PreferredLanguageRepository } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories';
import { moveToTop } from '~/.server/utils/collection.utils';

/**
 * Service to manage preferred languages
 */
export interface PreferredLanguageService {
  /**
   * Get all preferred languages
   * @returns List of preferred languages
   */
  listPreferredLanguages(): ReadonlyArray<PreferredLanguageDto>;

  /**
   * Get preferred language by id
   * @param id - Id of the preferred language
   * @returns Preferred language
   * @throws {PreferredLanguageNotFoundException} - If preferred language with id not found
   */
  getPreferredLanguageById(id: string): PreferredLanguageDto;

  listAndSortLocalizedPreferredLanguages(locale: AppLocale): ReadonlyArray<PreferredLanguageLocalizedDto>;

  getLocalizedPreferredLanguageById(id: string, locale: AppLocale): PreferredLanguageLocalizedDto;
}

export type PreferredLanguageServiceImpl_ServerConfig = Pick<ServerConfig, 'ENGLISH_LANGUAGE_CODE' | 'FRENCH_LANGUAGE_CODE' | 'LOOKUP_SVC_ALL_PREFERRED_LANGUAGES_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_PREFERRED_LANGUAGE_CACHE_TTL_SECONDS'>;

@injectable()
export class DefaultPreferredLanguageService implements PreferredLanguageService {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.domain.mappers.PreferredLanguageDtoMapper) private readonly preferredLanguageDtoMapper: PreferredLanguageDtoMapper,
    @inject(TYPES.domain.repositories.PreferredLanguageRepository) private readonly preferredLanguageRepository: PreferredLanguageRepository,
    @inject(TYPES.configs.ServerConfig) private readonly serverConfig: PreferredLanguageServiceImpl_ServerConfig,
  ) {
    this.log = logFactory.createLogger('DefaultPreferredLanguageService');
    this.init();
  }

  private init(): void {
    const allPreferredLanguagesCacheTTL = 1000 * this.serverConfig.LOOKUP_SVC_ALL_PREFERRED_LANGUAGES_CACHE_TTL_SECONDS;
    const preferredLanguageCacheTTL = 1000 * this.serverConfig.LOOKUP_SVC_PREFERRED_LANGUAGE_CACHE_TTL_SECONDS;

    this.log.debug('Cache TTL values; allPreferredLanguagesCacheTTL: %d ms, preferredLanguageCacheTTL: %d ms', allPreferredLanguagesCacheTTL, preferredLanguageCacheTTL);

    this.listPreferredLanguages = moize(this.listPreferredLanguages, {
      maxAge: allPreferredLanguagesCacheTTL,
      onCacheAdd: () => this.log.info('Creating new listPreferredLanguages memo'),
    });

    this.getPreferredLanguageById = moize(this.getPreferredLanguageById, {
      maxAge: preferredLanguageCacheTTL,
      maxSize: Infinity,
      onCacheAdd: () => this.log.info('Creating new getPreferredLanguageById memo'),
    });

    this.log.debug('DefaultPreferredLanguageService initiated.');
  }

  listPreferredLanguages(): ReadonlyArray<PreferredLanguageDto> {
    this.log.debug('Get all preferred languages');
    const preferredLanguageEntities = this.preferredLanguageRepository.listAllPreferredLanguages();
    const preferredLanguageDtos = this.preferredLanguageDtoMapper.mapPreferredLanguageEntitiesToPreferredLanguageDtos(preferredLanguageEntities);
    this.log.trace('Returning preferred languages: [%j]', preferredLanguageDtos);
    return preferredLanguageDtos;
  }

  getPreferredLanguageById(id: string): PreferredLanguageDto {
    this.log.debug('Get preferred language with id: [%s]', id);
    const preferredLanguageEntity = this.preferredLanguageRepository.findPreferredLanguageById(id);

    if (!preferredLanguageEntity) {
      this.log.error('Preferred language with id: [%s] not found', id);
      throw new PreferredLanguageNotFoundException(`Preferred language with id: [${id}] not found`);
    }

    const preferredLanguageDto = this.preferredLanguageDtoMapper.mapPreferredLanguageEntityToPreferredLanguageDto(preferredLanguageEntity);
    this.log.trace('Returning preferred language: [%j]', preferredLanguageDto);
    return preferredLanguageDto;
  }

  listAndSortLocalizedPreferredLanguages(locale: AppLocale): ReadonlyArray<PreferredLanguageLocalizedDto> {
    this.log.debug('Get and sort all localized preferred languages');
    const preferredLanguageDtos = this.listPreferredLanguages();
    const preferredLanguageLocalizedDtos = this.preferredLanguageDtoMapper.mapPreferredLanguageDtosToPreferredLanguageLocalizedDtos(preferredLanguageDtos, locale);
    const sortedPreferredLanguageLocalizedDtos = this.sortLocalizedPreferredLanguageDtos(preferredLanguageLocalizedDtos, locale);
    this.log.trace('Returning localized and sorted preferred languages: [%j]', sortedPreferredLanguageLocalizedDtos);
    return sortedPreferredLanguageLocalizedDtos;
  }

  getLocalizedPreferredLanguageById(id: string, locale: AppLocale): PreferredLanguageLocalizedDto {
    this.log.debug('Get localized preferred language with id: [%s]', id);
    const preferredLanguageDto = this.getPreferredLanguageById(id);
    const preferredLanguageLocalizedDto = this.preferredLanguageDtoMapper.mapPreferredLanguageDtoToPreferredLanguageLocalizedDto(preferredLanguageDto, locale);
    this.log.trace('Returning localized preferred language: [%j]', preferredLanguageLocalizedDto);
    return preferredLanguageLocalizedDto;
  }

  private sortLocalizedPreferredLanguageDtos(preferredLanguageLocalizedDtos: ReadonlyArray<PreferredLanguageLocalizedDto>, locale: AppLocale): ReadonlyArray<PreferredLanguageLocalizedDto> {
    const sortByNamePredicate = (a: PreferredLanguageLocalizedDto, b: PreferredLanguageLocalizedDto) => a.name.localeCompare(b.name, locale);
    const moveLanguageToTopPredicate = ({ id }: PreferredLanguageLocalizedDto) => {
      const languageCode = locale === 'fr' ? this.serverConfig.FRENCH_LANGUAGE_CODE : this.serverConfig.ENGLISH_LANGUAGE_CODE;
      return id === languageCode.toString();
    };
    return moveToTop(preferredLanguageLocalizedDtos.toSorted(sortByNamePredicate), moveLanguageToTopPredicate);
  }
}
