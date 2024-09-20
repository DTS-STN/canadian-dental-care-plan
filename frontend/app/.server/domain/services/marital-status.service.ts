import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { MaritalStatusDto } from '~/.server/domain/dtos';
import type { MaritalStatusDtoMapper } from '~/.server/domain/mappers';
import type { MaritalStatusRepository } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories';

export interface MaritalStatusService {
  findAll(): MaritalStatusDto[];
  findById(id: string): MaritalStatusDto | null;
}

@injectable()
export class MaritalStatusServiceImpl implements MaritalStatusService {
  private readonly log: Logger;

  constructor(
    @inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory,
    @inject(SERVICE_IDENTIFIER.MARITAL_STATUS_DTO_MAPPER) private readonly maritalStatusDtoMapper: MaritalStatusDtoMapper,
    @inject(SERVICE_IDENTIFIER.MARITAL_STATUS_REPOSITORY) private readonly maritalStatusRepository: MaritalStatusRepository,
    @inject(SERVICE_IDENTIFIER.SERVER_CONFIG) private readonly serverConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_MARITAL_STATUSES_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_MARITAL_STATUS_CACHE_TTL_SECONDS'>,
  ) {
    this.log = logFactory.createLogger('MaritalStatusServiceImpl');

    // set moize options
    this.findAll.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_ALL_MARITAL_STATUSES_CACHE_TTL_SECONDS;
    this.findById.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_MARITAL_STATUS_CACHE_TTL_SECONDS;
  }

  private findAllImpl(): MaritalStatusDto[] {
    this.log.debug('Get all marital statuses');
    const maritalStatusEntities = this.maritalStatusRepository.findAll();
    const maritalStatusDtos = this.maritalStatusDtoMapper.mapMaritalStatusEntitiesToMaritalStatusDtos(maritalStatusEntities);
    this.log.trace('Returning marital statuses: [%j]', maritalStatusDtos);
    return maritalStatusDtos;
  }

  findAll = moize(this.findAllImpl, {
    onCacheAdd: () => this.log.info('Creating new findAll memo'),
  });

  private findByIdImpl(id: string): MaritalStatusDto | null {
    this.log.debug('Get marital status with id: [%s]', id);
    const maritalStatusEntity = this.maritalStatusRepository.findById(id);
    const maritalStatusDto = maritalStatusEntity ? this.maritalStatusDtoMapper.mapMaritalStatusEntityToMaritalStatusDto(maritalStatusEntity) : null;
    this.log.trace('Returning marital status: [%j]', maritalStatusDto);
    return maritalStatusDto;
  }

  findById = moize(this.findByIdImpl, {
    maxSize: Infinity,
    onCacheAdd: () => this.log.info('Creating new findById memo'),
  });
}
