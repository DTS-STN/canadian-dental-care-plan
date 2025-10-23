import { injectable } from 'inversify';

import type { UpdateDentalBenefitsRequestDto, UpdateEmailAddressRequestDto, UpdatePhoneNumbersRequestDto } from '~/.server/domain/dtos';
import type { UpdateDentalBenefitsRequestEntity, UpdateEmailAddressRequestEntity, UpdatePhoneNumbersRequestEntity } from '~/.server/domain/entities';

export interface ProfileDtoMapper {
  mapUpdateDentalBenefitsRequestDtoToUpdateDentalBenefitsRequestEntity(updateDentalBenefitsRequestDto: UpdateDentalBenefitsRequestDto): UpdateDentalBenefitsRequestEntity;
  mapUpdateEmailAddressRequestDtoToUpdateEmailAddressRequestEntity(updateEmailRequestDto: UpdateEmailAddressRequestDto): UpdateEmailAddressRequestEntity;
  mapUpdatePhoneNumbersRequestDtoToUpdatePhoneNumbersRequestEntity(updatePhoneNumbersRequestDto: UpdatePhoneNumbersRequestDto): UpdatePhoneNumbersRequestEntity;
}

@injectable()
export class DefaultProfileDtoMapper implements ProfileDtoMapper {
  mapUpdateDentalBenefitsRequestDtoToUpdateDentalBenefitsRequestEntity(updateDentalBenefitsRequestDto: UpdateDentalBenefitsRequestDto): UpdateDentalBenefitsRequestEntity {
    // Only add items to the InsurancePlan array if the corresponding boolean is true and program is provided
    const insurancePlans = [];

    // Federal benefits
    if (updateDentalBenefitsRequestDto.hasFederalBenefits && updateDentalBenefitsRequestDto.federalSocialProgram) {
      insurancePlans.push({ InsurancePlanIdentification: [{ IdentificationID: updateDentalBenefitsRequestDto.federalSocialProgram }] });
    }

    // Provincial/Territorial benefits
    if (updateDentalBenefitsRequestDto.hasProvincialTerritorialBenefits && updateDentalBenefitsRequestDto.provincialTerritorialSocialProgram) {
      insurancePlans.push({ InsurancePlanIdentification: [{ IdentificationID: updateDentalBenefitsRequestDto.provincialTerritorialSocialProgram }] });
    }

    return {
      BenefitApplication: {
        Applicant: {
          ApplicantDetail: {
            ApplicantDetail: {
              InsurancePlan: insurancePlans,
            },
          },
          ClientIdentification: [
            {
              IdentificationID: updateDentalBenefitsRequestDto.province ?? '',
              IdentificationCategoryText: 'Guid Primary Key',
            },
          ],
        },
      },
    };
  }

  mapUpdateEmailAddressRequestDtoToUpdateEmailAddressRequestEntity(updateEmailAddressRequestDto: UpdateEmailAddressRequestDto): UpdateEmailAddressRequestEntity {
    return {
      BenefitApplication: {
        Applicant: {
          ApplicantDetail: {
            ApplicantEmailVerifiedIndicator: true,
          },
          ClientIdentification: [
            {
              IdentificationID: updateEmailAddressRequestDto.clientId,
              IdentificationCategoryText: 'Guid Primary Key',
            },
          ],
          PersonContactInformation: [
            {
              EmailAddress: [
                {
                  EmailAddressID: updateEmailAddressRequestDto.email,
                },
              ],
            },
          ],
        },
      },
    };
  }

  mapUpdatePhoneNumbersRequestDtoToUpdatePhoneNumbersRequestEntity(updatePhoneNumbersRequestDto: UpdatePhoneNumbersRequestDto): UpdatePhoneNumbersRequestEntity {
    return {
      BenefitApplication: {
        Applicant: {
          ClientIdentification: [
            {
              IdentificationID: updatePhoneNumbersRequestDto.clientId,
              IdentificationCategoryText: 'Guid Primary Key',
            },
          ],
          PersonContactInformation: [
            {
              TelephoneNumber: [
                {
                  TelephoneNumberCategoryCode: {
                    ReferenceDataID: updatePhoneNumbersRequestDto.phoneNumber ?? '',
                    ReferenceDataName: 'Primary',
                  },
                },
                {
                  TelephoneNumberCategoryCode: {
                    ReferenceDataID: updatePhoneNumbersRequestDto.phoneNumberAlt ?? '',
                    ReferenceDataName: 'Alternate',
                  },
                },
              ],
            },
          ],
        },
      },
    };
  }
}
