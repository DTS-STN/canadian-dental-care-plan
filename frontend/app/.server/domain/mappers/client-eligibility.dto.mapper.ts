import { injectable } from 'inversify';

import type { ClientEligibilityDto } from '../dtos/client-eligibility.dto';
import type { ClientEligibilityEntity } from '../entities/client-eligibility.entity';

export interface ClientEligibilityDtoMapper {
  mapClientEligibilityEntityToClientEligibilityDto(clientEligibilityEntity: ClientEligibilityEntity): ClientEligibilityDto;
}

@injectable()
export class DefaultClientEligibilityDtoMapper implements ClientEligibilityDtoMapper {
  mapClientEligibilityEntityToClientEligibilityDto(clientEligibilityEntity: ClientEligibilityEntity): ClientEligibilityDto {
    const applicant = clientEligibilityEntity.BenefitApplication.Applicant;

    return {
      clientId: applicant.ClientIdentification.find(({ IdentificationCategoryText }) => IdentificationCategoryText === 'Client ID')?.IdentificationID ?? '',
      clientNumber: applicant.ClientIdentification.find(({ IdentificationCategoryText }) => IdentificationCategoryText === 'Client Number')?.IdentificationID ?? '',
      firstName: applicant.PersonName[0].PersonGivenName[0],
      lastName: applicant.PersonName[0].PersonSurName,
      earnings: applicant.ApplicantEarning.map((earning) => ({
        taxationYear: earning.EarningTaxationYear.YearDate,
        isEligible: earning.Coverage.length > 0,
      })),
    };
  }
}
