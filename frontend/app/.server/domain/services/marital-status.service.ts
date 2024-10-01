import { inject, injectable } from 'inversify';
import moize from 'moize';

import { MaritalStatusNotFoundException } from '../exceptions/MaritalStatusNotFoundException';
import type { ServerConfig } from '~/.server/configs';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { MaritalStatusDto } from '~/.server/domain/dtos';
import type { MaritalStatusDtoMapper } from '~/.server/domain/mappers';
import type { MaritalStatusRepository } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories';

export interface MaritalStatusService {
  listMaritalStatuses(): ReadonlyArray<MaritalStatusDto>;
  getMaritalStatusById(id: string): MaritalStatusDto;
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
    this.listMaritalStatuses.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_ALL_MARITAL_STATUSES_CACHE_TTL_SECONDS;
    this.getMaritalStatusById.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_MARITAL_STATUS_CACHE_TTL_SECONDS;
  }

  listMaritalStatuses = moize(this.listMaritalStatusesImpl, {
    onCacheAdd: () => this.log.info('Creating new listMaritalStatuses memo'),
  });

  getMaritalStatusById = moize(this.getMaritalStatusByIdImpl, {
    maxSize: Infinity,
    onCacheAdd: () => this.log.info('Creating new getMaritalStatusById memo'),
  });

  private listMaritalStatusesImpl(): ReadonlyArray<MaritalStatusDto> {
    this.log.debug('Get all marital statuses');
    const maritalStatusEntities = this.maritalStatusRepository.findAll();
    const maritalStatusDtos = this.maritalStatusDtoMapper.mapMaritalStatusEntitiesToMaritalStatusDtos(maritalStatusEntities);
    this.log.trace('Returning marital statuses: [%j]', maritalStatusDtos);
    return maritalStatusDtos;
  }

  private getMaritalStatusByIdImpl(id: string): MaritalStatusDto {
    this.log.debug('Get marital status with id: [%s]', id);
    const maritalStatusEntity = this.maritalStatusRepository.findById(id);

    if (!maritalStatusEntity) {
      this.log.error('Marital status with id: [%s] not found', id);
      throw new MaritalStatusNotFoundException(`Marital status with id: [${id}] not found`);
    }

    const maritalStatusDto = this.maritalStatusDtoMapper.mapMaritalStatusEntityToMaritalStatusDto(maritalStatusEntity);
    this.log.trace('Returning marital status: [%j]', maritalStatusDto);
    return maritalStatusDto;
  }
}
