import { injectable } from 'inversify';

import type { ClientApplicationBasicInfoRequestDto, ClientApplicationDto, ClientApplicationSinRequestDto } from '~/.server/domain/dtos';
import type { ClientApplicationBasicInfoRequestEntity, ClientApplicationEntity, ClientApplicationSinRequestEntity } from '~/.server/domain/entities';

export interface ClientApplicationDtoMapper {
  mapClientApplicationEntityToClientApplicationDto(clientApplicationEntity: ClientApplicationEntity): ClientApplicationDto;
  mapClientApplicationBasicInfoRequestDtoToClientApplicationBasicInfoRequestEntity(clientApplicationBasicInfoRequestDto: ClientApplicationBasicInfoRequestDto): ClientApplicationBasicInfoRequestEntity;
  mapClientApplicationSinRequestDtoToClientApplicationSinRequestEntity(clientApplicationSinRequestDto: ClientApplicationSinRequestDto): ClientApplicationSinRequestEntity;
}

@injectable()
export class ClientApplicationDtoMapperImpl implements ClientApplicationDtoMapper {
  mapClientApplicationEntityToClientApplicationDto(clientApplicationEntity: ClientApplicationEntity): ClientApplicationDto {
    const { Flags } = clientApplicationEntity.BenefitApplication.Applicant;
    return {
      clientNumber: clientApplicationEntity.BenefitApplication.Applicant.ClientIdentification[0].IdentificationID,
      dateOfBirth: clientApplicationEntity.BenefitApplication.Applicant.PersonBirthDate.date,
      firstName: clientApplicationEntity.BenefitApplication.Applicant.PersonName[0].PersonGivenName[0],
      hasAppliedBeforeApril302024: this.resolveFlagValue(Flags, 'appliedBeforeApril302024'),
      hasBeenAssessedByCRA: this.resolveFlagValue(Flags, 'isCraAssessed'),
      lastName: clientApplicationEntity.BenefitApplication.Applicant.PersonName[0].PersonSurName,
      sin: clientApplicationEntity.BenefitApplication.Applicant.PersonSINIdentification.IdentificationID,
    };
  }

  mapClientApplicationBasicInfoRequestDtoToClientApplicationBasicInfoRequestEntity(clientApplicationBasicInfoRequestDto: ClientApplicationBasicInfoRequestDto) {
    return {
      Applicant: {
        PersonName: [
          {
            PersonGivenName: [clientApplicationBasicInfoRequestDto.firstName],
            PersonSurName: clientApplicationBasicInfoRequestDto.lastName,
          },
        ],
        PersonBirthDate: {
          date: clientApplicationBasicInfoRequestDto.dateOfBirth,
        },
        ClientIdentification: [
          {
            IdentificationID: clientApplicationBasicInfoRequestDto.clientNumber,
          },
        ],
      },
    };
  }

  mapClientApplicationSinRequestDtoToClientApplicationSinRequestEntity(clientApplicationSinRequestDto: ClientApplicationSinRequestDto): ClientApplicationSinRequestEntity {
    return {
      Applicant: {
        PersonSINIdentification: {
          IdentificationID: clientApplicationSinRequestDto.sin,
        },
      },
    };
  }

  /**
   * Resolves the flag value from the flags array.
   *
   * @param flags The flags array.
   * @param flagCategoryText The flag category text.
   * @returns The flag value.
   */
  private resolveFlagValue(flags: ReadonlyArray<Readonly<{ Flag: boolean; FlagCategoryText: string }>>, flagCategoryText: string): boolean {
    return flags.find(({ FlagCategoryText }) => FlagCategoryText === flagCategoryText)?.Flag ?? false;
  }
}
