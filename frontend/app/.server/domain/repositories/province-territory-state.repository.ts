import { injectable } from 'inversify';

import type { ProvinceTerritoryStateEntity } from '~/.server/domain/entities';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';
import provinceTerritoryStateJsonDataSource from '~/.server/resources/power-platform/province-territory-state.json';

export interface ProvinceTerritoryStateRepository {
  /**
   * Fetch all province territory state entities.
   * @returns All province territory state entities.
   */
  listAllProvinceTerritoryStates(): ProvinceTerritoryStateEntity[];

  /**
   * Fetch a province territory state entity by its id.
   * @param id The id of the province territory state entity.
   * @returns The province territory state entity or null if not found.
   */
  findProvinceTerritoryStateById(id: string): ProvinceTerritoryStateEntity | null;

  /**
   * Fetch a province territory state entity by its id.
   * @param id The id of the province territory state entity.
   * @returns The province territory state entity or null if not found.
   */
  findProvinceTerritoryStateByCode(code: string): ProvinceTerritoryStateEntity | null;
}

@injectable()
export class DefaultProvinceTerritoryStateRepository implements ProvinceTerritoryStateRepository {
  private readonly log: Logger;

  constructor() {
    this.log = createLogger('DefaultProvinceTerritoryStateRepository');
  }

  listAllProvinceTerritoryStates(): ProvinceTerritoryStateEntity[] {
    this.log.debug('Fetching all province territory states');
    const provinceTerritoryStateEntities = provinceTerritoryStateJsonDataSource.value;

    if (provinceTerritoryStateEntities.length === 0) {
      this.log.warn('No province territory states found');
      return [];
    }

    this.log.trace('Returning province territory states: [%j]', provinceTerritoryStateEntities);
    return provinceTerritoryStateEntities;
  }

  findProvinceTerritoryStateById(id: string): ProvinceTerritoryStateEntity | null {
    this.log.debug('Fetching province territory state with id: [%s]', id);

    const provinceTerritoryStateEntities = provinceTerritoryStateJsonDataSource.value;
    const provinceTerritoryStateEntity = provinceTerritoryStateEntities.find(({ esdc_provinceterritorystateid }) => esdc_provinceterritorystateid === id);

    if (!provinceTerritoryStateEntity) {
      this.log.warn('ProvinceTerritoryState not found; id: [%s]', id);
      return null;
    }

    return provinceTerritoryStateEntity;
  }

  findProvinceTerritoryStateByCode(code: string): ProvinceTerritoryStateEntity | null {
    this.log.debug('Fetching province territory state with code: [%s]', code);

    const provinceTerritoryStateEntities = provinceTerritoryStateJsonDataSource.value;
    const provinceTerritoryStateEntity = provinceTerritoryStateEntities.find(({ esdc_internationalalphacode }) => esdc_internationalalphacode === code);

    if (!provinceTerritoryStateEntity) {
      this.log.warn('ProvinceTerritoryState not found; code: [%s]', code);
      return null;
    }

    return provinceTerritoryStateEntity;
  }
}
