import { inject, injectable } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants/service-identifier.contant';
import type { ProvinceTerritoryStateEntity } from '~/.server/domain/entities/province-territory-state.entity';
import type { LogFactory, Logger } from '~/.server/factories/log.factory';
import provinceTerritoryStateJsonDataSource from '~/.server/resources/power-platform/province-territory-state.json';

export interface ProvinceTerritoryStateRepository {
  /**
   * Fetch all province territory state entities.
   * @returns All province territory state entities.
   */
  findAll(): ProvinceTerritoryStateEntity[];

  /**
   * Fetch a province territory state entity by its id.
   * @param id The id of the province territory state entity.
   * @returns The province territory state entity or null if not found.
   */
  findById(id: string): ProvinceTerritoryStateEntity | null;
}

@injectable()
export class ProvinceTerritoryStateRepositoryImpl implements ProvinceTerritoryStateRepository {
  private readonly log: Logger;

  constructor(@inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory) {
    this.log = logFactory.createLogger('ProvinceTerritoryStateRepositoryImpl');
  }

  findAll(): ProvinceTerritoryStateEntity[] {
    this.log.debug('Fetching all province territory states');
    const provinceTerritoryStateEntities = provinceTerritoryStateJsonDataSource.value;

    if (provinceTerritoryStateEntities.length === 0) {
      this.log.warn('No province territory states found');
      return [];
    }

    this.log.trace('Returning province territory states: [%j]', provinceTerritoryStateEntities);
    return provinceTerritoryStateEntities;
  }

  findById(id: string): ProvinceTerritoryStateEntity | null {
    this.log.debug('Fetching province territory state with id: [%s]', id);

    const provinceTerritoryStateEntities = provinceTerritoryStateJsonDataSource.value;
    const provinceTerritoryStateEntity = provinceTerritoryStateEntities.find(({ esdc_provinceterritorystateid }) => esdc_provinceterritorystateid === id);

    if (!provinceTerritoryStateEntity) {
      this.log.warn('ProvinceTerritoryState not found; id: [%s]', id);
      return null;
    }

    return provinceTerritoryStateEntity;
  }
}
