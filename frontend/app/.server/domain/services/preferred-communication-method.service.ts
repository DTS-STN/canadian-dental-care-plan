import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs/server.config';
import { SERVICE_IDENTIFIER } from '~/.server/constants/service-identifier.contant';
import type { PreferredCommunicationMethodDto } from '~/.server/domain/dtos/preferred-communication-method.dto';
import type { PreferredCommunicationMethodDtoMapper } from '~/.server/domain/mappers/preferred-communication-method.dto.mapper';
import type { PreferredCommunicationMethodRepository } from '~/.server/domain/repositories/preferred-communication-method.repository';
import type { LogFactory, Logger } from '~/.server/factories/log.factory';

export interface PreferredCommunicationMethodService {
  findAll(): PreferredCommunicationMethodDto[];
  findById(id: string): PreferredCommunicationMethodDto | null;
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
    this.findAll.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_ALL_PREFERRED_COMMUNICATION_METHODS_CACHE_TTL_SECONDS;
    this.findById.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_PREFERRED_COMMUNICATION_METHOD_CACHE_TTL_SECONDS;
  }

  private findAllImpl(): PreferredCommunicationMethodDto[] {
    this.log.debug('Get all preferred communication methods');
    const preferredCommunicationMethodEntities = this.preferredCommunicationMethodRepository.findAll();
    const preferredCommunicationMethodDtos = this.preferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodEntitiesToPreferredCommunicationMethodDtos(preferredCommunicationMethodEntities);
    this.log.trace('Returning preferred communication methods: [%j]', preferredCommunicationMethodDtos);
    return preferredCommunicationMethodDtos;
  }

  findAll = moize(this.findAllImpl, {
    onCacheAdd: () => this.log.info('Creating new findAll memo'),
  });

  private findByIdImpl(id: string): PreferredCommunicationMethodDto | null {
    this.log.debug('Get preferred communication method with id: [%s]', id);
    const preferredCommunicationMethodEntity = this.preferredCommunicationMethodRepository.findById(id);
    const preferredCommunicationMethodDto = preferredCommunicationMethodEntity ? this.preferredCommunicationMethodDtoMapper.mapPreferredCommunicationMethodEntityToPreferredCommunicationMethodDto(preferredCommunicationMethodEntity) : null;
    this.log.trace('Returning preferred communication method: [%j]', preferredCommunicationMethodDto);
    return preferredCommunicationMethodDto;
  }

  findById = moize(this.findByIdImpl, {
    maxSize: Infinity,
    onCacheAdd: () => this.log.info('Creating new findById memo'),
  });
}
