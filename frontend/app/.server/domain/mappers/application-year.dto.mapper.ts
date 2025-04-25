import { injectable } from 'inversify';

import type { ApplicationYearResultDto } from '~/.server/domain/dtos';
import type { ApplicationYearResultEntity } from '~/.server/domain/entities';

export interface ApplicationYearDtoMapper {
  mapApplicationYearResultEntityToApplicationYearResultDto(applicationYearResultEntity: ApplicationYearResultEntity): ApplicationYearResultDto;
}

@injectable()
export class DefaultApplicationYearDtoMapper implements ApplicationYearDtoMapper {
  mapApplicationYearResultEntityToApplicationYearResultDto(applicationYearResultEntity: ApplicationYearResultEntity): ApplicationYearResultDto {
    return {
      applicationYearId: applicationYearResultEntity.BenefitApplicationYear.BenefitApplicationYearIdentification.IdentificationID,
      taxYear: applicationYearResultEntity.BenefitApplicationYear.BenefitApplicationYearTaxYear.YearDate,
      dependentEligibilityEndDate: applicationYearResultEntity.BenefitApplicationYear.DependentEligibilityEndDate.date,
    };
  }
}
