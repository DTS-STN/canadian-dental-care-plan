import { injectable } from 'inversify';

import type { ClientEligibilityDto, ClientEligibilityRequestDto } from '../dtos/client-eligibility.dto';
import type { ClientEligibilityEntity, ClientEligibilityRequestEntity } from '../entities/client-eligibility.entity';

export interface ClientEligibilityDtoMapper {
  mapClientEligibilityEntityToClientEligibilityDto(clientEligibilityEntity: ClientEligibilityEntity): ClientEligibilityDto;
  mapClientEligibilityRequestDtoToClientEligibilityRequestEntity(clientEligibilityRequestDto: ClientEligibilityRequestDto): ClientEligibilityRequestEntity;
}

@injectable()
export class DefaultClientEligibilityDtoMapper implements ClientEligibilityDtoMapper {
  mapClientEligibilityEntityToClientEligibilityDto(clientEligibilityEntity: ClientEligibilityEntity): ClientEligibilityDto {
    const applicant = clientEligibilityEntity.Applicant;

    return {
      clientId: applicant.ClientIdentification.find(({ IdentificationCategoryText }) => IdentificationCategoryText === 'Client ID')?.IdentificationID ?? '',
      clientNumber: applicant.ClientIdentification.find(({ IdentificationCategoryText }) => IdentificationCategoryText === 'Client Number')?.IdentificationID ?? '',
      firstName: applicant.PersonName[0].PersonGivenName[0],
      lastName: applicant.PersonName[0].PersonSurName,
      earnings: applicant.ApplicantEarning.map((earning) => ({
        taxationYear: earning.EarningTaxationYear.YearDate,
        isEligible: earning.Coverage.some((coverage) => coverage.CoverageCategoryCode.ReferenceDataName === 'Co-Pay Tier (TPC)'),
      })),
    };
  }

  mapClientEligibilityRequestDtoToClientEligibilityRequestEntity(clientEligibilityRequestDto: ClientEligibilityRequestDto): ClientEligibilityRequestEntity {
    return {
      Applicant: {
        PersonClientNumberIdentification: {
          IdentificationID: clientEligibilityRequestDto.clientNumber,
          IdentificationCategoryText: 'Client Number',
        },
      },
    };
  }
}
