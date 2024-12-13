import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { PreferredCommunicationMethodDto, PreferredCommunicationMethodLocalizedDto } from '~/.server/domain/dtos';
import { PreferredCommunicationMethodNotFoundException } from '~/.server/domain/exceptions';
import type { PreferredCommunicationMethodDtoMapper } from '~/.server/domain/mappers';
import type { PreferredCommunicationMethodRepository } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories';

export interface PreferredCommunicationMethodService {
  getLocalizedPreferredCommunicationMethodById(id: string, locale: AppLocale): PreferredCommunicationMethodLocalizedDto;
  getPreferredCommunicationMethodById(id: string): PreferredCommunicationMethodDto;
  listAndSortLocalizedPreferredCommunicationMethods(locale: AppLocale): ReadonlyArray<PreferredCommunicationMethodLocalizedDto>;
  listPreferredCommunicationMethods(): ReadonlyArray<PreferredCommunicationMethodDto>;
}

@injectable()
export class DefaultPreferredCommunicationMethodService implements PreferredCommunicationMethodService {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.domain.mappers.PreferredCommunicationMethodDtoMapper) private readonly preferredCommunicationMethodDtoMapper: PreferredCommunicationMethodDtoMapper,
    @inject(TYPES.domain.repositories.PreferredCommunicationMethodRepository) private readonly preferredCommunicationMethodRepository: PreferredCommunicationMethodRepository,
    @inject(TYPES.configs.ServerConfig) private readonly serverConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_PREFERRED_COMMUNICATION_METHODS_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_PREFERRED_COMMUNICATION_METHOD_CACHE_TTL_SECONDS'>,
  ) {
    this.log = logFactory.createLogger(this.constructor.name);
    this.init();
  }

  private init(): void {
    const allPreferredCommunicationMethodsCacheTTL = 1000 * this.serverConfig.LOOKUP_SVC_ALL_PREFERRED_COMMUNICATION_METHODS_CACHE_TTL_SECONDS;
    const preferredCommunicationMethodCacheTTL = 1000 * this.serverConfig.LOOKUP_SVC_PREFERRED_COMMUNICATION_METHOD_CACHE_TTL_SECONDS;

    this.log.debug('Cache TTL values; allPreferredCommunicationMethodsCacheTTL: %d ms, preferredCommunicationMethodCacheTTL: %d ms', allPreferredCommunicationMethodsCacheTTL, preferredCommunicationMethodCacheTTL);

    this.listPreferredCommunicationMethods = moize(this.listPreferredCommunicationMethods, {
      maxAge: allPreferredCommunicationMethodsCacheTTL,
      onCacheAdd: () => this.log.info('Creating new listPreferredCommunicationMethods memo'),
    });

    this.getPreferredCommunicationMethodById = moize(this.getPreferredCommunicationMethodById, {
      maxAge: preferredCommunicationMethodCacheTTL,
      maxSize: Infinity,
      onCacheAdd: () => this.log.info('Creating new getPreferredCommunicationMethodById memo'),
    });

    this.log.debug('%s initiated.', this.constructor.name);
  }

  listPreferredCommunicationMethods(): PreferredCommunicationMethodDto[] {
    this.log.debug('Get all preferred communication methods');
    const preferredCommunicationMethodEntities = this.preferredCommunicationMethodRepository.listAllPreferredCommunicationMethods();
    const preferredCommunicationMethodDtos = this.preferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodEntitiesToPreferredCommunicationMethodDtos(preferredCommunicationMethodEntities);
    this.log.trace('Returning preferred communication methods: [%j]', preferredCommunicationMethodDtos);
    return preferredCommunicationMethodDtos;
  }

  getPreferredCommunicationMethodById(id: string): PreferredCommunicationMethodDto {
    this.log.debug('Get preferred communication method with id: [%s]', id);
    const preferredCommunicationMethodEntity = this.preferredCommunicationMethodRepository.findPreferredCommunicationMethodById(id);

    if (!preferredCommunicationMethodEntity) throw new PreferredCommunicationMethodNotFoundException(`Perferred communication method with id: [${id}] not found`);

    const preferredCommunicationMethodDto = this.preferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodEntityToPreferredCommunicationMethodDto(preferredCommunicationMethodEntity);

    this.log.trace('Returning preferred communication method: [%j]', preferredCommunicationMethodDto);
    return preferredCommunicationMethodDto;
  }

  listAndSortLocalizedPreferredCommunicationMethods(locale: AppLocale): ReadonlyArray<PreferredCommunicationMethodLocalizedDto> {
    this.log.debug('Get and sort all localized preferred communication methods with locale: [%s]', locale);
    const preferredCommunicationMethodDtos = this.listPreferredCommunicationMethods();
    const localizedPreferredCommunicationMethodDtos = this.preferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodDtosToPreferredCommunicationMethodLocalizedDtos(preferredCommunicationMethodDtos, locale);
    const sortedLocalizedPreferredCommunicationMethodDtos = this.sortLocalizedPreferredCommunicationMethodDtos(localizedPreferredCommunicationMethodDtos, locale);
    this.log.trace('Returning localized and sorted preferred communication methods: [%j]', sortedLocalizedPreferredCommunicationMethodDtos);
    return sortedLocalizedPreferredCommunicationMethodDtos;
  }

  getLocalizedPreferredCommunicationMethodById(id: string, locale: AppLocale): PreferredCommunicationMethodLocalizedDto {
    this.log.debug('Get localized preferred communication method with id: [%s] and locale: [%s]', id, locale);
    const preferredCommunicationMethodDto = this.getPreferredCommunicationMethodById(id);
    const localizedPreferredCommunicationMethodDto = this.preferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodDtoToPreferredCommunicationMethodLocalizedDto(preferredCommunicationMethodDto, locale);
    this.log.trace('Returning localized preferred communication method: [%j]', localizedPreferredCommunicationMethodDto);
    return localizedPreferredCommunicationMethodDto;
  }

  /**
   * Sort the localized preferred communication methods by name.
   */
  private sortLocalizedPreferredCommunicationMethodDtos(dtos: ReadonlyArray<PreferredCommunicationMethodLocalizedDto>, locale: AppLocale) {
    const sortByNamePredicate = (a: PreferredCommunicationMethodLocalizedDto, b: PreferredCommunicationMethodLocalizedDto) => a.name.localeCompare(b.name, locale);
    return dtos.toSorted(sortByNamePredicate);
  }
}
