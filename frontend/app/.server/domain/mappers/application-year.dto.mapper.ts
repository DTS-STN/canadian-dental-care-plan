import { injectable } from 'inversify';

import type { ApplicationYearResultDto, RenewalApplicationYearResultDto } from '~/.server/domain/dtos';
import type { ApplicationYearResultEntity } from '~/.server/domain/entities';

export interface ApplicationYearDtoMapper {
  mapApplicationYearResultEntityToApplicationYearResultDtos(applicationYearResultEntity: ApplicationYearResultEntity): ReadonlyArray<ApplicationYearResultDto>;

  mapApplicationYearResultDtoToRenewalApplicationYearResultDto(applicationYearResultDto: ApplicationYearResultDto): RenewalApplicationYearResultDto;
}

@injectable()
export class DefaultApplicationYearDtoMapper implements ApplicationYearDtoMapper {
  mapApplicationYearResultDtoToRenewalApplicationYearResultDto(applicationYearResultDto: ApplicationYearResultDto): RenewalApplicationYearResultDto {
    return {
      intakeYearId: applicationYearResultDto.intakeYearId,
      taxYear: applicationYearResultDto.taxYear,
      coverageStartDate: applicationYearResultDto.coverageStartDate,
      coverageEndDate: applicationYearResultDto.coverageEndDate,
      renewalYearId: applicationYearResultDto.renewalYearId,
    };
  }

  mapApplicationYearResultEntityToApplicationYearResultDtos(applicationYearResultEntity: ApplicationYearResultEntity): ReadonlyArray<ApplicationYearResultDto> {
    const applicationYearData = applicationYearResultEntity['BenefitApplicationYear'];

    const applicationYears = applicationYearData.map((applicationYear) => ({
      applicationYear: applicationYear.BenefitApplicationYearEffectivePeriod.StartDate.YearDate,
      taxYear: applicationYear.BenefitApplicationYearTaxYear.YearDate,
      coverageStartDate: applicationYear.BenefitApplicationYearCoveragePeriod.StartDate.date,
      coverageEndDate: applicationYear.BenefitApplicationYearCoveragePeriod.EndDate.date,
      intakeStartDate: applicationYear.BenefitApplicationYearIntakePeriod.StartDate.date,
      intakeEndDate: applicationYear.BenefitApplicationYearIntakePeriod.EndDate?.date,
      intakeYearId: applicationYear.BenefitApplicationYearIdentification[0].IdentificationID, // TODO this is incorrect but tentatively used to make integration work; Interop may change/remove the application year endpoint
      renewalStartDate: applicationYear.BenefitApplicationYearRenewalPeriod.StartDate?.date,
      renewalEndDate: applicationYear.BenefitApplicationYearRenewalPeriod.EndDate?.date,
      renewalYearId: applicationYear.BenefitApplicationYearIdentification[0].IdentificationID,
    }));

    return applicationYears;
  }
}
