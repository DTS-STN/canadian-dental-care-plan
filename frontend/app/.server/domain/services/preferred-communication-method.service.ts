import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { PreferredCommunicationMethodDto } from '~/.server/domain/dtos';
import { PreferredCommunicationMethodNotFoundException } from '~/.server/domain/exceptions';
import type { PreferredCommunicationMethodDtoMapper } from '~/.server/domain/mappers';
import type { PreferredCommunicationMethodRepository } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories';

export interface PreferredCommunicationMethodService {
  listPreferredCommunicationMethods(): PreferredCommunicationMethodDto[];
  getPreferredCommunicationMethodById(id: string): PreferredCommunicationMethodDto;
}

@injectable()
export class PreferredCommunicationMethodServiceImpl implements PreferredCommunicationMethodService {
  private readonly log: Logger;

  constructor(
    @inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory,
    @inject(SERVICE_IDENTIFIER.PREFERRED_COMMUNICATION_METHOD_DTO_MAPPER) private readonly preferredCommunicationMethodDtoMapper: PreferredCommunicationMethodDtoMapper,
    @inject(SERVICE_IDENTIFIER.PREFERRED_COMMUNICATION_METHOD_REPOSITORY) private readonly preferredCommunicationMethodRepository: PreferredCommunicationMethodRepository,
    @inject(SERVICE_IDENTIFIER.SERVER_CONFIG) private readonly serverConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_PREFERRED_COMMUNICATION_METHODS_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_PREFERRED_COMMUNICATION_METHOD_CACHE_TTL_SECONDS'>,
  ) {
    this.log = logFactory.createLogger('PreferredCommunicationMethodServiceImpl');

    // set moize options
    this.listPreferredCommunicationMethods.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_ALL_PREFERRED_COMMUNICATION_METHODS_CACHE_TTL_SECONDS;
    this.getPreferredCommunicationMethodById.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_PREFERRED_COMMUNICATION_METHOD_CACHE_TTL_SECONDS;
  }

  private listPreferredCommunicationMethodsImpl(): PreferredCommunicationMethodDto[] {
    this.log.debug('Get all preferred communication methods');
    const preferredCommunicationMethodEntities = this.preferredCommunicationMethodRepository.findAll();
    const preferredCommunicationMethodDtos = this.preferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodEntitiesToPreferredCommunicationMethodDtos(preferredCommunicationMethodEntities);
    this.log.trace('Returning preferred communication methods: [%j]', preferredCommunicationMethodDtos);
    return preferredCommunicationMethodDtos;
  }

  listPreferredCommunicationMethods = moize(this.listPreferredCommunicationMethodsImpl, {
    onCacheAdd: () => this.log.info('Creating new listPreferredCommunicationMethods memo'),
  });

  private getPreferredCommunicationMethodByIdImpl(id: string): PreferredCommunicationMethodDto {
    this.log.debug('Get preferred communication method with id: [%s]', id);
    const preferredCommunicationMethodEntity = this.preferredCommunicationMethodRepository.findById(id);

    if (!preferredCommunicationMethodEntity) throw new PreferredCommunicationMethodNotFoundException(`Perferred communication method with id: [${id}] not found`);

    const preferredCommunicationMethodDto = this.preferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodEntityToPreferredCommunicationMethodDto(preferredCommunicationMethodEntity);

    this.log.trace('Returning preferred communication method: [%j]', preferredCommunicationMethodDto);
    return preferredCommunicationMethodDto;
  }

  getPreferredCommunicationMethodById = moize(this.getPreferredCommunicationMethodByIdImpl, {
    maxSize: Infinity,
    onCacheAdd: () => this.log.info('Creating new getPreferredCommunicationMethodById memo'),
  });
}
