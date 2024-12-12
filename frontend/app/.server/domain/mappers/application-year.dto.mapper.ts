import { injectable } from 'inversify';

import type { ApplicationYearResultDto } from '~/.server/domain/dtos';
import type { ApplicationYearResultEntity } from '~/.server/domain/entities';

export interface ApplicationYearDtoMapper {
  mapApplicationYearResultEntityToApplicationYearResultDto(applicationYearResultEntity: ApplicationYearResultEntity): ReadonlyArray<ApplicationYearResultDto>;
}

@injectable()
export class DefaultApplicationYearDtoMapper implements ApplicationYearDtoMapper {
  mapApplicationYearResultEntityToApplicationYearResultDto(applicationYearResultEntity: ApplicationYearResultEntity): ReadonlyArray<ApplicationYearResultDto> {
    const applicationYearData = applicationYearResultEntity['BenefitApplicationYear'];

    const applicationYears = applicationYearData.map((applicationYear) => ({
      id: applicationYear.BenefitApplicationYearIdentification[0].IdentificationID,
      applicationYear: applicationYear.BenefitApplicationYearEffectivePeriod.StartDate.YearDate,
      taxYear: applicationYear.BenefitApplicationYearTaxYear.YearDate,
      coverageStartDate: applicationYear.BenefitApplicationYearCoveragePeriod.StartDate.date,
      coverageEndDate: applicationYear.BenefitApplicationYearCoveragePeriod.EndDate.date,
      intakeStartDate: applicationYear.BenefitApplicationYearIntakePeriod.StartDate.date,
      intakeEndDate: applicationYear.BenefitApplicationYearIntakePeriod.EndDate?.date,
      renewalStartDate: applicationYear.BenefitApplicationYearRenewalPeriod.StartDate?.date,
      renewalEndDate: applicationYear.BenefitApplicationYearRenewalPeriod.EndDate?.date,
    }));

    return applicationYears;
  }
}
