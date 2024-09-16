import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs/server.config';
import { SERVICE_IDENTIFIER } from '~/.server/constants/service-identifier.contant';
import type { PreferredLanguageDto } from '~/.server/domain/dtos/preferred-language.dto';
import type { PreferredLanguageDtoMapper } from '~/.server/domain/mappers/preferred-language.dto.mapper';
import type { PreferredLanguageRepository } from '~/.server/domain/repositories/preferred-language.repository';
import type { LogFactory, Logger } from '~/.server/factories/log.factory';

export interface PreferredLanguageService {
  getAllPreferredLanguages(): PreferredLanguageDto[];
  getPreferredLanguageById(id: string): PreferredLanguageDto | null;
}

@injectable()
export class PreferredLanguageServiceImpl implements PreferredLanguageService {
  private readonly log: Logger;

  constructor(
    @inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory,
    @inject(SERVICE_IDENTIFIER.PREFERRED_LANGUAGE_DTO_MAPPER) private readonly preferredLanguageDtoMapper: PreferredLanguageDtoMapper,
    @inject(SERVICE_IDENTIFIER.PREFERRED_LANGUAGE_REPOSITORY) private readonly preferredLanguageRepository: PreferredLanguageRepository,
    @inject(SERVICE_IDENTIFIER.SERVER_CONFIG) private readonly serverConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_PREFERRED_LANGUAGES_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_PREFERRED_LANGUAGE_CACHE_TTL_SECONDS'>,
  ) {
    this.log = logFactory.createLogger('PreferredLanguageRepositoryImpl');

    // set moize options
    this.getAllPreferredLanguages.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_ALL_PREFERRED_LANGUAGES_CACHE_TTL_SECONDS;
    this.getPreferredLanguageById.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_PREFERRED_LANGUAGE_CACHE_TTL_SECONDS;
  }

  private getAllPreferredLanguagesImpl(): PreferredLanguageDto[] {
    this.log.debug('Get all preferred languages');
    const preferredLanguageEntities = this.preferredLanguageRepository.getAllPreferredLanguages();
    const preferredLanguageDtos = this.preferredLanguageDtoMapper.mapPreferredLanguageEntitiesToPreferredLanguageDtos(preferredLanguageEntities);
    this.log.trace('Returning preferred languages: [%j]', preferredLanguageDtos);
    return preferredLanguageDtos;
  }

  getAllPreferredLanguages = moize(this.getAllPreferredLanguagesImpl, {
    onCacheAdd: () => this.log.info('Creating new getAllPreferredLanguages memo'),
  });

  private getPreferredLanguageByIdImpl(id: string): PreferredLanguageDto | null {
    this.log.debug('Get preferred language with id: [%s]', id);
    const preferredLanguageEntity = this.preferredLanguageRepository.getPreferredLanguageById(id);
    const preferredLanguageDto = preferredLanguageEntity ? this.preferredLanguageDtoMapper.mapPreferredLanguageEntityToPreferredLanguageDto(preferredLanguageEntity) : null;
    this.log.trace('Returning preferred language: [%j]', preferredLanguageDto);
    return preferredLanguageDto;
  }

  getPreferredLanguageById = moize(this.getPreferredLanguageByIdImpl, {
    maxSize: Infinity,
    onCacheAdd: () => this.log.info('Creating new getPreferredLanguageById memo'),
  });
}
