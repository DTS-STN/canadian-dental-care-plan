import { injectable } from 'inversify';

import type { EligibilityDto } from '../dtos/eligibility.dto';
import type { EligibilityEntity } from '../entities/eligibility.entity';

export interface EligibilityDtoMapper {
  mapEligibilityEntityToEligibilityDto(eligibilityEntity: EligibilityEntity): EligibilityDto;
}

@injectable()
export class DefaultEligibilityDtoMapper implements EligibilityDtoMapper {
  mapEligibilityEntityToEligibilityDto(eligibilityEntity: EligibilityEntity): EligibilityDto {
    const applicant = eligibilityEntity.BenefitApplication.Applicant;

    return {
      clientId: applicant.ClientIdentification[0].IdentificationID,
      firstName: applicant.PersonName[0].PersonGivenName[0],
      lastName: applicant.PersonName[0].PersonSurName,
      earnings: applicant.ApplicantEarning.map((earning) => ({
        taxationYear: earning.EarningTaxationYear.YearDate,
        isEligible: earning.Coverage.some((coverage) => coverage.CoverageCategoryCode.ReferenceDataName === 'Co-Pay Tier (TPC)'),
      })),
    };
  }
}
