import { injectable } from 'inversify';

import type { ApplicationYearResultEntity } from '~/.server/domain/entities';
import type { Logger } from '~/.server/logging';
import { createLogger } from '~/.server/logging';

// TODO this repository will return static values until the Power Platform and Interop APIs are available for querying
// specific values related to application years.
export interface ApplicationYearRepository {
  /**
   * Returns all intake application year entities given a date
   *
   * @param date The date (in `YYYY-MM-DD` format) used to request the intake application years
   * @returns A promise that resolves to a `ApplicationYearResultEntity` object containing all intake application years.
   */
  getIntakeApplicationYear(date: string): ApplicationYearResultEntity;

  /**
   * Returns all renewal application year entities given a date
   *
   * @param date The date (in `YYYY-MM-DD` format) used to request the renewal application years
   * @returns A promise that resolves to a `ApplicationYearResultEntity` object containing all renewal application years.
   */
  getRenewalApplicationYear(date: string): ApplicationYearResultEntity;
}

@injectable()
export class DefaultApplicationYearRepository implements ApplicationYearRepository {
  private readonly log: Logger;

  constructor() {
    this.log = createLogger('DefaultApplicationYearRepository');
  }

  getIntakeApplicationYear(date: string): ApplicationYearResultEntity {
    this.log.trace('Retrieving intake application year entity for date: [%s]', date);

    const applicationYearResultEntity = {
      BenefitApplicationYear: {
        BenefitApplicationYearIdentification: {
          IdentificationID: '9bb21bc9-028c-ef11-8a69-000d3a0a1a29',
        },
        BenefitApplicationYearTaxYear: {
          YearDate: '2024',
        },
        DependentEligibilityEndDate: {
          date: '2025-06-01',
        },
      },
    };

    this.log.trace('Returning intake application year entity: [%j]', applicationYearResultEntity);
    return applicationYearResultEntity;
  }

  getRenewalApplicationYear(date: string): ApplicationYearResultEntity {
    this.log.trace('Retrieving renewal application year entity for date: [%s]', date);

    const applicationYearResultEntity = {
      BenefitApplicationYear: {
        BenefitApplicationYearIdentification: {
          IdentificationID: '9bb21bc9-028c-ef11-8a69-000d3a0a1a29',
        },
        BenefitApplicationYearTaxYear: {
          YearDate: '2024',
        },
        DependentEligibilityEndDate: {
          date: '2025-06-30',
        },
      },
    };

    this.log.trace('Returning renewal application year entity: [%j]', applicationYearResultEntity);
    return applicationYearResultEntity;
  }
}
