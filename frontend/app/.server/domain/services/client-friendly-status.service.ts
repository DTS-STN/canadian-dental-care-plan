import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs/server.config';
import { SERVICE_IDENTIFIER } from '~/.server/constants/service-identifier.contant';
import type { ClientFriendlyStatusDto } from '~/.server/domain/dtos/client-friendly-status.dto';
import type { ClientFriendlyStatusDtoMapper } from '~/.server/domain/mappers/client-friendly-status.dto.mapper';
import type { ClientFriendlyStatusRepository } from '~/.server/domain/repositories/client-friendly-status.repository';
import type { LogFactory, Logger } from '~/.server/factories/log.factory';

export interface ClientFriendlyStatusService {
  findAll(): ClientFriendlyStatusDto[];
  findById(id: string): ClientFriendlyStatusDto | null;
}

@injectable()
export class ClientFriendlyStatusServiceImpl implements ClientFriendlyStatusService {
  private readonly log: Logger;

  constructor(
    @inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory,
    @inject(SERVICE_IDENTIFIER.CLIENT_FRIENDLY_STATUS_DTO_MAPPER) private readonly clientFriendlyStatusDtoMapper: ClientFriendlyStatusDtoMapper,
    @inject(SERVICE_IDENTIFIER.CLIENT_FRIENDLY_STATUS_REPOSITORY) private readonly clientFriendlyStatusRepository: ClientFriendlyStatusRepository,
    @inject(SERVICE_IDENTIFIER.SERVER_CONFIG) private readonly serverConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_CLIENT_FRIENDLY_STATUSES_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_CLIENT_FRIENDLY_STATUSE_CACHE_TTL_SECONDS'>,
  ) {
    this.log = logFactory.createLogger('ClientFriendlyStatusRepositoryImpl');

    // set moize options
    this.findAll.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_ALL_CLIENT_FRIENDLY_STATUSES_CACHE_TTL_SECONDS;
    this.findById.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_CLIENT_FRIENDLY_STATUSE_CACHE_TTL_SECONDS;
  }

  private findAllImpl(): ClientFriendlyStatusDto[] {
    this.log.debug('Get all client friendly statuses');
    const clientFriendlyStatusEntities = this.clientFriendlyStatusRepository.findAll();
    const clientFriendlyStatusDtos = this.clientFriendlyStatusDtoMapper.mapClientFriendlyStatusEntitiesToClientFriendlyStatusDtos(clientFriendlyStatusEntities);
    this.log.trace('Returning client friendly statuses: [%j]', clientFriendlyStatusDtos);
    return clientFriendlyStatusDtos;
  }

  findAll = moize(this.findAllImpl, {
    onCacheAdd: () => this.log.info('Creating new findAll memo'),
  });

  private findByIdImpl(id: string): ClientFriendlyStatusDto | null {
    this.log.debug('Get client friendly status with id: [%s]', id);
    const clientFriendlyStatusEntity = this.clientFriendlyStatusRepository.findById(id);
    const clientFriendlyStatusDto = clientFriendlyStatusEntity ? this.clientFriendlyStatusDtoMapper.mapClientFriendlyStatusEntityToClientFriendlyStatusDto(clientFriendlyStatusEntity) : null;
    this.log.trace('Returning client friendly status: [%j]', clientFriendlyStatusDto);
    return clientFriendlyStatusDto;
  }

  findById = moize(this.findByIdImpl, {
    maxSize: Infinity,
    onCacheAdd: () => this.log.info('Creating new findById memo'),
  });
}
