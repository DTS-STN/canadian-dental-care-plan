import { injectable } from 'inversify';

import type { ApplicationYearResultDto, IntakeApplicationYearResultDto, RenewalApplicationYearResultDto } from '~/.server/domain/dtos';
import type { ApplicationYearResultEntity } from '~/.server/domain/entities';

export interface ApplicationYearDtoMapper {
  mapApplicationYearResultEntityToApplicationYearResultDtos(applicationYearResultEntity: ApplicationYearResultEntity): ReadonlyArray<ApplicationYearResultDto>;

  mapApplicationYearResultDtoToIntakeApplicationYearResultDto(applicationYearResultDto: ApplicationYearResultDto): IntakeApplicationYearResultDto;

  mapApplicationYearResultDtoToRenewalApplicationYearResultDto(toRenewalApplicationYearResultDtoArgs: ToRenewalApplicationYearResultDtoArgs): RenewalApplicationYearResultDto;
}

interface ToRenewalApplicationYearResultDtoArgs {
  coverageEndDate: string;
  applicationYearResultDto: ApplicationYearResultDto;
}

@injectable()
export class DefaultApplicationYearDtoMapper implements ApplicationYearDtoMapper {
  mapApplicationYearResultDtoToIntakeApplicationYearResultDto(applicationYearResultDto: ApplicationYearResultDto): IntakeApplicationYearResultDto {
    return {
      taxYear: applicationYearResultDto.taxYear,
      intakeYearId: applicationYearResultDto.applicationYearId,
    };
  }

  mapApplicationYearResultDtoToRenewalApplicationYearResultDto({ coverageEndDate, applicationYearResultDto }: ToRenewalApplicationYearResultDtoArgs): RenewalApplicationYearResultDto {
    return {
      taxYear: applicationYearResultDto.taxYear,
      coverageEndDate,
      renewalYearId: applicationYearResultDto.applicationYearId,
    };
  }

  mapApplicationYearResultEntityToApplicationYearResultDtos(applicationYearResultEntity: ApplicationYearResultEntity): ReadonlyArray<ApplicationYearResultDto> {
    const applicationYearData = applicationYearResultEntity['BenefitApplicationYear'];

    const applicationYears = applicationYearData.map((applicationYear) => ({
      applicationYear: applicationYear.BenefitApplicationYearEffectivePeriod.StartDate.YearDate,
      applicationYearId: applicationYear.BenefitApplicationYearIdentification[0].IdentificationID,
      coverageStartDate: applicationYear.BenefitApplicationYearCoveragePeriod.StartDate.date,
      coverageEndDate: applicationYear.BenefitApplicationYearCoveragePeriod.EndDate.date,
      intakeStartDate: applicationYear.BenefitApplicationYearIntakePeriod.StartDate.date,
      intakeEndDate: applicationYear.BenefitApplicationYearIntakePeriod.EndDate?.date,
      nextApplicationYearId: applicationYear.BenefitApplicationYearNext.BenefitApplicationYearIdentification?.IdentificationID,
      renewalStartDate: applicationYear.BenefitApplicationYearRenewalPeriod.StartDate?.date,
      renewalEndDate: applicationYear.BenefitApplicationYearRenewalPeriod.EndDate?.date,
      taxYear: applicationYear.BenefitApplicationYearTaxYear.YearDate,
    }));

    return applicationYears;
  }
}
