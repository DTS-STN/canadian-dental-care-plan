import { inject, injectable } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants/service-identifier.contant';
import type { FederalGovernmentInsurancePlanEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories/log.factory';
import federalGovernmentInsurancePlanJsonDataSource from '~/.server/resources/power-platform/federal-government-insurance-plan.json';

export interface FederalGovernmentInsurancePlanRepository {
  /**
   * Fetch all federal government insurance plan entities.
   * @returns All federal government insurance plan entities.
   */
  findAll(): FederalGovernmentInsurancePlanEntity[];

  /**
   * Fetch a federal government insurance plan entity by its id.
   * @param id The id of the federal government insurance plan entity.
   * @returns The federal government insurance plan entity or null if not found.
   */
  findById(id: string): FederalGovernmentInsurancePlanEntity | null;
}

@injectable()
export class FederalGovernmentInsurancePlanRepositoryImpl implements FederalGovernmentInsurancePlanRepository {
  private readonly log: Logger;

  constructor(@inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory) {
    this.log = logFactory.createLogger('FederalGovernmentInsurancePlanRepositoryImpl');
  }

  findAll(): FederalGovernmentInsurancePlanEntity[] {
    this.log.debug('Fetching all federal government insurance plans');
    const federalGovernmentInsurancePlanEntities = federalGovernmentInsurancePlanJsonDataSource.value;

    if (federalGovernmentInsurancePlanEntities.length === 0) {
      this.log.warn('No federal government insurance plans found');
      return [];
    }

    this.log.trace('Returning federal government insurance plans: [%j]', federalGovernmentInsurancePlanEntities);
    return federalGovernmentInsurancePlanEntities;
  }

  findById(id: string): FederalGovernmentInsurancePlanEntity | null {
    this.log.debug('Fetching federal government insurance plan with id: [%s]', id);

    const federalGovernmentInsurancePlanEntities = federalGovernmentInsurancePlanJsonDataSource.value;
    const federalGovernmentInsurancePlanEntity = federalGovernmentInsurancePlanEntities.find(({ esdc_governmentinsuranceplanid }) => esdc_governmentinsuranceplanid === id);

    if (!federalGovernmentInsurancePlanEntity) {
      this.log.warn('Federal government insurance plan not found; id: [%s]', id);
      return null;
    }

    return federalGovernmentInsurancePlanEntity;
  }
}
