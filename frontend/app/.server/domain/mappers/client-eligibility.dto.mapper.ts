import { injectable } from 'inversify';
import { Result } from 'oxide.ts';

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
      clientId: Result.from(applicant.ClientIdentification.find(({ IdentificationCategoryText }) => IdentificationCategoryText === 'Client ID')?.IdentificationID).expect('Client ID not found'),
      clientNumber: Result.from(applicant.ClientIdentification.find(({ IdentificationCategoryText }) => IdentificationCategoryText === 'Client Number')?.IdentificationID).expect('Client Number not found'),
      firstName: Result.from(applicant.PersonName.at(0)?.PersonGivenName.at(0)).expect('First name not found'),
      lastName: Result.from(applicant.PersonName.at(0)?.PersonSurName).expect('Last name not found'),
      earnings: applicant.ApplicantEarning.map((earning) => ({
        taxationYear: earning.EarningTaxationYear.YearDate,
        isEligible: earning.Coverage.some((coverage) => coverage.CoverageCategoryCode.ReferenceDataName === 'Co-Pay Tier (TPC)'),
      })),
    };
  }

  mapClientEligibilityRequestDtoToClientEligibilityRequestEntity(clientEligibilityRequestDto: ClientEligibilityRequestDto): ClientEligibilityRequestEntity {
    return clientEligibilityRequestDto.map((dto) => ({
      Applicant: {
        PersonClientNumberIdentification: {
          IdentificationID: dto.clientNumber,
          IdentificationCategoryText: 'Client Number',
        },
      },
    }));
  }
}
