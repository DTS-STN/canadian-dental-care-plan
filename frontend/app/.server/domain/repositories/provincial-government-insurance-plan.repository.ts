import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { ProvincialGovernmentInsurancePlanEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories';
import provincialGovernmentInsurancePlanJsonDataSource from '~/.server/resources/power-platform/provincial-government-insurance-plan.json';

export interface ProvincialGovernmentInsurancePlanRepository {
  /**
   * Fetch all provincial government insurance plan entities.
   * @returns All provincial government insurance plan entities.
   */
  listAllProvincialGovernmentInsurancePlans(): ProvincialGovernmentInsurancePlanEntity[];

  /**
   * Fetch a provincial government insurance plan entity by its id.
   * @param id The id of the provincial government insurance plan entity.
   * @returns The provincial government insurance plan entity or null if not found.
   */
  findProvincialGovernmentInsurancePlanById(id: string): ProvincialGovernmentInsurancePlanEntity | null;
}

@injectable()
export class DefaultProvincialGovernmentInsurancePlanRepository implements ProvincialGovernmentInsurancePlanRepository {
  private readonly log: Logger;

  constructor(@inject(TYPES.factories.LogFactory) logFactory: LogFactory) {
    this.log = logFactory.createLogger('DefaultProvincialGovernmentInsurancePlanRepository');
  }

  listAllProvincialGovernmentInsurancePlans(): ProvincialGovernmentInsurancePlanEntity[] {
    this.log.debug('Fetching all provincial government insurance plans');
    const provincialGovernmentInsurancePlanEntities = provincialGovernmentInsurancePlanJsonDataSource.value;

    if (provincialGovernmentInsurancePlanEntities.length === 0) {
      this.log.warn('No provincial government insurance plans found');
      return [];
    }

    this.log.trace('Returning provincial government insurance plans: [%j]', provincialGovernmentInsurancePlanEntities);
    return provincialGovernmentInsurancePlanEntities;
  }

  findProvincialGovernmentInsurancePlanById(id: string): ProvincialGovernmentInsurancePlanEntity | null {
    this.log.debug('Fetching provincial government insurance plan with id: [%s]', id);

    const provincialGovernmentInsurancePlanEntities = provincialGovernmentInsurancePlanJsonDataSource.value;
    const provincialGovernmentInsurancePlanEntity = provincialGovernmentInsurancePlanEntities.find(({ esdc_governmentinsuranceplanid }) => esdc_governmentinsuranceplanid === id);

    if (!provincialGovernmentInsurancePlanEntity) {
      this.log.warn('Provincial government insurance plan not found; id: [%s]', id);
      return null;
    }

    return provincialGovernmentInsurancePlanEntity;
  }
}
