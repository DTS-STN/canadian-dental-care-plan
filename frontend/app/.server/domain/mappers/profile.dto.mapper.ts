import { injectable } from 'inversify';

import type { UpdateAddressRequestDto, UpdateDentalBenefitsRequestDto, UpdateEmailAddressRequestDto, UpdatePhoneNumbersRequestDto } from '~/.server/domain/dtos';
import type { UpdateAddressRequestEntity, UpdateDentalBenefitsRequestEntity, UpdateEmailAddressRequestEntity, UpdatePhoneNumbersRequestEntity } from '~/.server/domain/entities';

export interface ProfileDtoMapper {
  mapUpdateDentalBenefitsRequestDtoToUpdateDentalBenefitsRequestEntity(updateDentalBenefitsRequestDto: UpdateDentalBenefitsRequestDto): UpdateDentalBenefitsRequestEntity;
  mapUpdateEmailAddressRequestDtoToUpdateEmailAddressRequestEntity(updateEmailRequestDto: UpdateEmailAddressRequestDto): UpdateEmailAddressRequestEntity;
  mapUpdatePhoneNumbersRequestDtoToUpdatePhoneNumbersRequestEntity(updatePhoneNumbersRequestDto: UpdatePhoneNumbersRequestDto): UpdatePhoneNumbersRequestEntity;
  mapUpdateAddressRequestDtoToUpdateAddressRequestEntity(updateAddressRequestDto: UpdateAddressRequestDto): UpdateAddressRequestEntity;
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

  mapUpdateAddressRequestDtoToUpdateAddressRequestEntity(updateAddressRequestDto: UpdateAddressRequestDto): UpdateAddressRequestEntity {
    return {
      BenefitApplication: {
        Applicant: {
          ClientIdentification: [
            {
              IdentificationID: updateAddressRequestDto.clientId,
              IdentificationCategoryText: 'Guid Primary Key',
            },
          ],
          PersonContactInformation: [
            {
              Address: [
                {
                  AddressCategoryCode: { ReferenceDataName: 'Mailing' },
                  AddressCityName: updateAddressRequestDto.mailingAddress.city,
                  AddressCountry: { CountryCode: { ReferenceDataID: updateAddressRequestDto.mailingAddress.country } },
                  AddressPostalCode: updateAddressRequestDto.mailingAddress.postalCode ?? '',
                  AddressProvince: { ProvinceCode: { ReferenceDataID: updateAddressRequestDto.mailingAddress.province ?? '' } },
                  AddressSecondaryUnitText: '',
                  AddressStreet: { StreetName: updateAddressRequestDto.mailingAddress.address },
                },
                {
                  AddressCategoryCode: { ReferenceDataName: 'Home' },
                  AddressCityName: updateAddressRequestDto.homeAddress.city,
                  AddressCountry: { CountryCode: { ReferenceDataID: updateAddressRequestDto.homeAddress.country } },
                  AddressPostalCode: updateAddressRequestDto.homeAddress.postalCode ?? '',
                  AddressProvince: { ProvinceCode: { ReferenceDataID: updateAddressRequestDto.homeAddress.province ?? '' } },
                  AddressSecondaryUnitText: '',
                  AddressStreet: { StreetName: updateAddressRequestDto.homeAddress.address },
                },
              ],
            },
          ],
        },
      },
    };
  }
}
