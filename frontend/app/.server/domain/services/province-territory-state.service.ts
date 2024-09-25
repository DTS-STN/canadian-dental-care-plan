import { inject, injectable } from 'inversify';
import moize from 'moize';

import { ProvinceTerritoryStateNotFoundException } from '../exceptions/ProvinceTerritoryStateNotFoundException';
import type { ServerConfig } from '~/.server/configs';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { ProvinceTerritoryStateDto } from '~/.server/domain/dtos';
import type { ProvinceTerritoryStateDtoMapper } from '~/.server/domain/mappers';
import type { ProvinceTerritoryStateRepository } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories';

/**
 * Service interface for managing province territory state data.
 */
export interface ProvinceTerritoryStateService {
  /**
   * Retrieves a list of all province territory states.
   *
   * @returns An array of province territory state DTOs.
   */
  listProvinceTerritoryStates(): ProvinceTerritoryStateDto[];

  /**
   * Retrieves a specific province territory state by its ID.
   *
   * @param id - The ID of the province territory state to retrieve.
   * @returns The province territory state DTO corresponding to the specified ID.
   * @throws {ProvinceTerritoryStateNotFoundException} If no province territory state is found with the specified ID.
   */
  getProvinceTerritoryStateById(id: string): ProvinceTerritoryStateDto;
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
    this.listProvinceTerritoryStates.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_ALL_PROVINCE_TERRITORY_STATES_CACHE_TTL_SECONDS;
    this.getProvinceTerritoryStateById.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_PROVINCE_TERRITORY_STATE_CACHE_TTL_SECONDS;
  }

  private listProvinceTerritoryStatesImpl(): ProvinceTerritoryStateDto[] {
    this.log.debug('Get all province territory states');
    const provinceTerritoryStateEntities = this.provinceTerritoryStateRepository.findAll();
    const provinceTerritoryStateDtos = this.provinceTerritoryStateDtoMapper.mapProvinceTerritoryStateEntitiesToProvinceTerritoryStateDtos(provinceTerritoryStateEntities);
    this.log.trace('Returning province territory states: [%j]', provinceTerritoryStateDtos);
    return provinceTerritoryStateDtos;
  }

  listProvinceTerritoryStates = moize(this.listProvinceTerritoryStatesImpl, {
    onCacheAdd: () => this.log.info('Creating new listProvinceTerritoryStates memo'),
  });

  private getProvinceTerritoryStateByIdImpl(id: string): ProvinceTerritoryStateDto {
    this.log.debug('Get province territory state with id: [%s]', id);
    const provinceTerritoryStateEntity = this.provinceTerritoryStateRepository.findById(id);

    if (!provinceTerritoryStateEntity) {
      throw new ProvinceTerritoryStateNotFoundException(`Province territory state: [${id}] not found`);
    }

    const provinceTerritoryStateDto = this.provinceTerritoryStateDtoMapper.mapProvinceTerritoryStateEntityToProvinceTerritoryStateDto(provinceTerritoryStateEntity);
    this.log.trace('Returning province territory state: [%j]', provinceTerritoryStateDto);
    return provinceTerritoryStateDto;
  }

  getProvinceTerritoryStateById = moize(this.getProvinceTerritoryStateByIdImpl, {
    maxSize: Infinity,
    onCacheAdd: () => this.log.info('Creating new getProvinceTerritoryStateById memo'),
  });
}
