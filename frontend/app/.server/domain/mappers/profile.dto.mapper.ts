import { injectable } from 'inversify';
import { isDeepStrictEqual } from 'node:util';

import type { UpdateAddressRequestDto, UpdateCommunicationPreferenceRequestDto, UpdateDentalBenefitsRequestDto, UpdateEmailAddressRequestDto, UpdatePhoneNumbersRequestDto } from '~/.server/domain/dtos';
import type { UpdateAddressRequestEntity, UpdateCommunicationPreferenceRequestEntity, UpdateDentalBenefitsRequestEntity, UpdateEmailAddressRequestEntity, UpdatePhoneNumbersRequestEntity } from '~/.server/domain/entities';

export interface ProfileDtoMapper {
  mapUpdateDentalBenefitsRequestDtoToUpdateDentalBenefitsRequestEntity(updateDentalBenefitsRequestDto: UpdateDentalBenefitsRequestDto): UpdateDentalBenefitsRequestEntity;
  mapUpdateEmailAddressRequestDtoToUpdateEmailAddressRequestEntity(updateEmailRequestDto: UpdateEmailAddressRequestDto): UpdateEmailAddressRequestEntity;
  mapUpdatePhoneNumbersRequestDtoToUpdatePhoneNumbersRequestEntity(updatePhoneNumbersRequestDto: UpdatePhoneNumbersRequestDto): UpdatePhoneNumbersRequestEntity;
  mapUpdateAddressRequestDtoToUpdateAddressRequestEntity(updateAddressRequestDto: UpdateAddressRequestDto): UpdateAddressRequestEntity;
  mapUpdateCommunicationPreferenceRequestDtoToUpdateCommunicationPreferenceRequestEntity(updateCommunicationPreferenceRequestDto: UpdateCommunicationPreferenceRequestDto): UpdateCommunicationPreferenceRequestEntity;
}

@injectable()
export class DefaultProfileDtoMapper implements ProfileDtoMapper {
  mapUpdateDentalBenefitsRequestDtoToUpdateDentalBenefitsRequestEntity(updateDentalBenefitsRequestDto: UpdateDentalBenefitsRequestDto): UpdateDentalBenefitsRequestEntity {
    return {
      BenefitApplication: {
        Applicant: {
          ApplicantDetail: {
            InsurancePlan: [
              {
                InsurancePlanFederalIdentification: {
                  IdentificationID: updateDentalBenefitsRequestDto.federalSocialProgram ?? '00000000-0000-0000-0000-000000000000',
                },
                InsurancePlanProvincialIdentification: {
                  IdentificationID: updateDentalBenefitsRequestDto.provincialTerritorialSocialProgram ?? '00000000-0000-0000-0000-000000000000',
                },
              },
            ],
          },
          ClientIdentification: [
            {
              IdentificationID: updateDentalBenefitsRequestDto.clientId,
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

  mapUpdateAddressRequestDtoToUpdateAddressRequestEntity(updateAddressRequestDto: UpdateAddressRequestDto): UpdateAddressRequestEntity {
    const { clientId, mailingAddress, homeAddress } = updateAddressRequestDto;
    return {
      BenefitApplication: {
        Applicant: {
          ClientIdentification: [
            {
              IdentificationID: clientId,
              IdentificationCategoryText: 'Guid Primary Key',
            },
          ],
          MailingSameAsHomeIndicator: isDeepStrictEqual(mailingAddress, homeAddress),
          PersonContactInformation: [
            {
              Address: [
                {
                  AddressCategoryCode: { ReferenceDataName: 'Mailing' },
                  AddressCityName: mailingAddress.city,
                  AddressCountry: { CountryCode: { ReferenceDataID: mailingAddress.country } },
                  AddressPostalCode: mailingAddress.postalCode ?? '',
                  AddressProvince: { ProvinceCode: { ReferenceDataID: mailingAddress.province ?? '00000000-0000-0000-0000-000000000000' } },
                  AddressSecondaryUnitText: '',
                  AddressStreet: { StreetName: mailingAddress.address },
                },
                {
                  AddressCategoryCode: { ReferenceDataName: 'Home' },
                  AddressCityName: homeAddress.city,
                  AddressCountry: { CountryCode: { ReferenceDataID: homeAddress.country } },
                  AddressPostalCode: homeAddress.postalCode ?? '',
                  AddressProvince: { ProvinceCode: { ReferenceDataID: homeAddress.province ?? '00000000-0000-0000-0000-000000000000' } },
                  AddressSecondaryUnitText: '',
                  AddressStreet: { StreetName: homeAddress.address },
                },
              ],
            },
          ],
        },
      },
    };
  }

  mapUpdateCommunicationPreferenceRequestDtoToUpdateCommunicationPreferenceRequestEntity(updateCommunicationPreferenceRequestDto: UpdateCommunicationPreferenceRequestDto): UpdateCommunicationPreferenceRequestEntity {
    return {
      BenefitApplication: {
        Applicant: {
          ClientIdentification: [
            {
              IdentificationID: updateCommunicationPreferenceRequestDto.clientId,
              IdentificationCategoryText: 'Guid Primary Key',
            },
          ],
          PersonLanguage: [
            {
              CommunicationCategoryCode: {
                ReferenceDataID: updateCommunicationPreferenceRequestDto.preferredLanguage,
              },
              PreferredIndicator: true,
            },
          ],
          PreferredMethodCommunicationCode: {
            ReferenceDataID: updateCommunicationPreferenceRequestDto.preferredMethodSunLife,
          },
          PreferredMethodCommunicationGCCode: {
            ReferenceDataID: updateCommunicationPreferenceRequestDto.preferredMethodGovernmentOfCanada,
          },
        },
      },
    };
  }
}
