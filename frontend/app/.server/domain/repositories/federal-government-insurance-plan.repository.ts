import { injectable } from 'inversify';

import type { FederalGovernmentInsurancePlanEntity } from '~/.server/domain/entities';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';
import federalGovernmentInsurancePlanJsonDataSource from '~/.server/resources/power-platform/federal-government-insurance-plan.json';

export interface FederalGovernmentInsurancePlanRepository {
  /**
   * Fetch all federal government insurance plan entities.
   * @returns All federal government insurance plan entities.
   */
  listAllFederalGovernmentInsurancePlans(): FederalGovernmentInsurancePlanEntity[];

  /**
   * Fetch a federal government insurance plan entity by its id.
   * @param id The id of the federal government insurance plan entity.
   * @returns The federal government insurance plan entity or null if not found.
   */
  findFederalGovernmentInsurancePlanById(id: string): FederalGovernmentInsurancePlanEntity | null;
}

@injectable()
export class DefaultFederalGovernmentInsurancePlanRepository implements FederalGovernmentInsurancePlanRepository {
  private readonly log: Logger;

  constructor() {
    this.log = createLogger('DefaultFederalGovernmentInsurancePlanRepository');
  }

  listAllFederalGovernmentInsurancePlans(): FederalGovernmentInsurancePlanEntity[] {
    this.log.debug('Fetching all federal government insurance plans');
    const federalGovernmentInsurancePlanEntities = federalGovernmentInsurancePlanJsonDataSource.value;

    if (federalGovernmentInsurancePlanEntities.length === 0) {
      this.log.warn('No federal government insurance plans found');
      return [];
    }

    this.log.trace('Returning federal government insurance plans: [%j]', federalGovernmentInsurancePlanEntities);
    return federalGovernmentInsurancePlanEntities;
  }

  findFederalGovernmentInsurancePlanById(id: string): FederalGovernmentInsurancePlanEntity | null {
    this.log.debug('Fetching federal government insurance plan with id: [%s]', id);

    const federalGovernmentInsurancePlanEntities = federalGovernmentInsurancePlanJsonDataSource.value;
    const federalGovernmentInsurancePlanEntity = federalGovernmentInsurancePlanEntities.find(({ esdc_governmentinsuranceplanid }) => esdc_governmentinsuranceplanid === id);

    if (!federalGovernmentInsurancePlanEntity) {
      this.log.info('Federal government insurance plan not found; id: [%s]', id);
      return null;
    }

    return federalGovernmentInsurancePlanEntity;
  }
}
