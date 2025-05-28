import { injectable } from 'inversify';

import type { GovernmentInsurancePlanEntity } from '~/.server/domain/entities';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';
import governmentInsurancePlanJsonDataSource from '~/.server/resources/power-platform/government-insurance-plan.json';

export interface GovernmentInsurancePlanRepository {
  /**
   * Fetch all federal government insurance plan entities.
   * @returns All federal government insurance plan entities.
   */
  listAllFederalGovernmentInsurancePlans(): GovernmentInsurancePlanEntity[];

  /**
   * Fetch a federal government insurance plan entity by its id.
   * @param id The id of the federal government insurance plan entity.
   * @returns The federal government insurance plan entity or null if not found.
   */
  findFederalGovernmentInsurancePlanById(id: string): GovernmentInsurancePlanEntity | null;

  /**
   * Fetch all provincial government insurance plan entities.
   * @returns All provincial government insurance plan entities.
   */
  listAllProvincialGovernmentInsurancePlans(): GovernmentInsurancePlanEntity[];

  /**
   * Fetch a provincial government insurance plan entity by its id.
   * @param id The id of the provincial government insurance plan entity.
   * @returns The provincial government insurance plan entity or null if not found.
   */
  findProvincialGovernmentInsurancePlanById(id: string): GovernmentInsurancePlanEntity | null;
}

@injectable()
export class DefaultGovernmentInsurancePlanRepository implements GovernmentInsurancePlanRepository {
  private readonly log: Logger;

  constructor() {
    this.log = createLogger('DefaultGovernmentInsurancePlanRepository');
  }

  listAllFederalGovernmentInsurancePlans(): GovernmentInsurancePlanEntity[] {
    throw new Error('Federal government insurance plan service is not yet implemented');
    //TODO: Implement listAllFederalGovernmentInsurancePlans service
  }

  findFederalGovernmentInsurancePlanById(id: string): GovernmentInsurancePlanEntity | null {
    throw new Error('Federal government insurance plan service is not yet implemented');
    //TODO: Implement findFederalGovernmentInsurancePlanById service
  }

  listAllProvincialGovernmentInsurancePlans(): GovernmentInsurancePlanEntity[] {
    throw new Error('Provincial government insurance plan service is not yet implemented');
    //TODO: Implement listAllProvincialGovernmentInsurancePlans service
  }

  findProvincialGovernmentInsurancePlanById(id: string): GovernmentInsurancePlanEntity | null {
    throw new Error('Provincial government insurance plan service is not yet implemented');
    //TODO: Implement findProvincialGovernmentInsurancePlanById service
  }
}

@injectable()
export class MockGovernmentInsurancePlanRepository implements GovernmentInsurancePlanRepository {
  private readonly log: Logger;

  constructor() {
    this.log = createLogger('MockGovernmentInsurancePlanRepository');
  }

  listAllFederalGovernmentInsurancePlans(): GovernmentInsurancePlanEntity[] {
    this.log.debug('Fetching all federal government insurance plans');
    const federalGovernmentInsurancePlanEntities = governmentInsurancePlanJsonDataSource.value.filter(({ _esdc_provinceterritorystateid_value }) => _esdc_provinceterritorystateid_value === null);

    if (federalGovernmentInsurancePlanEntities.length === 0) {
      this.log.warn('No federal government insurance plans found');
      return [];
    }

    this.log.trace('Returning federal government insurance plans: [%j]', federalGovernmentInsurancePlanEntities);
    return federalGovernmentInsurancePlanEntities;
  }

  findFederalGovernmentInsurancePlanById(id: string): GovernmentInsurancePlanEntity | null {
    this.log.debug('Fetching federal government insurance plan with id: [%s]', id);

    const federalGovernmentInsurancePlanEntities = governmentInsurancePlanJsonDataSource.value.filter(({ _esdc_provinceterritorystateid_value }) => _esdc_provinceterritorystateid_value === null);
    const federalGovernmentInsurancePlanEntity = federalGovernmentInsurancePlanEntities.find(({ esdc_governmentinsuranceplanid }) => esdc_governmentinsuranceplanid === id);

    if (!federalGovernmentInsurancePlanEntity) {
      this.log.info('Federal government insurance plan not found; id: [%s]', id);
      return null;
    }

    return federalGovernmentInsurancePlanEntity;
  }

  listAllProvincialGovernmentInsurancePlans(): GovernmentInsurancePlanEntity[] {
    this.log.debug('Fetching all provincial government insurance plans');
    const provincialGovernmentInsurancePlanEntities = governmentInsurancePlanJsonDataSource.value.filter(({ _esdc_provinceterritorystateid_value }) => _esdc_provinceterritorystateid_value !== null);

    if (provincialGovernmentInsurancePlanEntities.length === 0) {
      this.log.warn('No provincial government insurance plans found');
      return [];
    }

    this.log.trace('Returning provincial government insurance plans: [%j]', provincialGovernmentInsurancePlanEntities);
    return provincialGovernmentInsurancePlanEntities;
  }

  findProvincialGovernmentInsurancePlanById(id: string): GovernmentInsurancePlanEntity | null {
    this.log.debug('Fetching provincial government insurance plan with id: [%s]', id);

    const provincialGovernmentInsurancePlanEntities = governmentInsurancePlanJsonDataSource.value.filter(({ _esdc_provinceterritorystateid_value }) => _esdc_provinceterritorystateid_value !== null);
    const provincialGovernmentInsurancePlanEntity = provincialGovernmentInsurancePlanEntities.find(({ esdc_governmentinsuranceplanid }) => esdc_governmentinsuranceplanid === id);

    if (!provincialGovernmentInsurancePlanEntity) {
      this.log.info('Provincial government insurance plan not found; id: [%s]', id);
      return null;
    }

    return provincialGovernmentInsurancePlanEntity;
  }
}
