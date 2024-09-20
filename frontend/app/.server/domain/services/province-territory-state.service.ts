import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { ProvinceTerritoryStateDto } from '~/.server/domain/dtos';
import type { ProvinceTerritoryStateDtoMapper } from '~/.server/domain/mappers';
import type { ProvinceTerritoryStateRepository } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories/log.factory';

export interface ProvinceTerritoryStateService {
  findAll(): ProvinceTerritoryStateDto[];
  findById(id: string): ProvinceTerritoryStateDto | null;
}

@injectable()
export class ProvinceTerritoryStateServiceImpl implements ProvinceTerritoryStateService {
  private readonly log: Logger;

  constructor(
    @inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory,
    @inject(SERVICE_IDENTIFIER.PROVINCE_TERRITORY_STATE_DTO_MAPPER) private readonly provinceTerritoryStateDtoMapper: ProvinceTerritoryStateDtoMapper,
    @inject(SERVICE_IDENTIFIER.PROVINCE_TERRITORY_STATE_REPOSITORY) private readonly provinceTerritoryStateRepository: ProvinceTerritoryStateRepository,
    @inject(SERVICE_IDENTIFIER.SERVER_CONFIG) private readonly serverConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_PROVINCE_TERRITORY_STATES_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_PROVINCE_TERRITORY_STATE_CACHE_TTL_SECONDS'>,
  ) {
    this.log = logFactory.createLogger('ProvinceTerritoryStateServiceImpl');

    // set moize options
    this.findAll.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_ALL_PROVINCE_TERRITORY_STATES_CACHE_TTL_SECONDS;
    this.findById.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_PROVINCE_TERRITORY_STATE_CACHE_TTL_SECONDS;
  }

  private findAllImpl(): ProvinceTerritoryStateDto[] {
    this.log.debug('Get all province territory states');
    const provinceTerritoryStateEntities = this.provinceTerritoryStateRepository.findAll();
    const provinceTerritoryStateDtos = this.provinceTerritoryStateDtoMapper.mapProvinceTerritoryStateEntitiesToProvinceTerritoryStateDtos(provinceTerritoryStateEntities);
    this.log.trace('Returning province territory states: [%j]', provinceTerritoryStateDtos);
    return provinceTerritoryStateDtos;
  }

  findAll = moize(this.findAllImpl, {
    onCacheAdd: () => this.log.info('Creating new findAll memo'),
  });

  private findByIdImpl(id: string): ProvinceTerritoryStateDto | null {
    this.log.debug('Get province territory state with id: [%s]', id);
    const provinceTerritoryStateEntity = this.provinceTerritoryStateRepository.findById(id);
    const provinceTerritoryStateDto = provinceTerritoryStateEntity ? this.provinceTerritoryStateDtoMapper.mapProvinceTerritoryStateEntityToProvinceTerritoryStateDto(provinceTerritoryStateEntity) : null;
    this.log.trace('Returning province territory state: [%j]', provinceTerritoryStateDto);
    return provinceTerritoryStateDto;
  }

  findById = moize(this.findByIdImpl, {
    maxSize: Infinity,
    onCacheAdd: () => this.log.info('Creating new findById memo'),
  });
}
