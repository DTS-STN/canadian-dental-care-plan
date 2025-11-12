import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { ApplicantEligibilityDto, UpdateAddressRequestDto, UpdateCommunicationPreferenceRequestDto, UpdateDentalBenefitsRequestDto, UpdateEmailAddressRequestDto, UpdatePhoneNumbersRequestDto } from '~/.server/domain/dtos';
import type { ApplicantEligibilityEntity, UpdateAddressRequestEntity, UpdateCommunicationPreferenceRequestEntity, UpdateDentalBenefitsRequestEntity, UpdateEmailAddressRequestEntity, UpdatePhoneNumbersRequestEntity } from '~/.server/domain/entities';

export interface ProfileDtoMapper {
  mapUpdateDentalBenefitsRequestDtoToUpdateDentalBenefitsRequestEntity(updateDentalBenefitsRequestDto: UpdateDentalBenefitsRequestDto): UpdateDentalBenefitsRequestEntity;
  mapUpdateEmailAddressRequestDtoToUpdateEmailAddressRequestEntity(updateEmailRequestDto: UpdateEmailAddressRequestDto): UpdateEmailAddressRequestEntity;
  mapUpdatePhoneNumbersRequestDtoToUpdatePhoneNumbersRequestEntity(updatePhoneNumbersRequestDto: UpdatePhoneNumbersRequestDto): UpdatePhoneNumbersRequestEntity;
  mapUpdateAddressRequestDtoToUpdateAddressRequestEntity(updateAddressRequestDto: UpdateAddressRequestDto): UpdateAddressRequestEntity;
  mapUpdateCommunicationPreferenceRequestDtoToUpdateCommunicationPreferenceRequestEntity(updateCommunicationPreferenceRequestDto: UpdateCommunicationPreferenceRequestDto): UpdateCommunicationPreferenceRequestEntity;
  mapApplicantEligibilityEntityToApplicantEligibilityDto(applicantEligibilityEntity: ApplicantEligibilityEntity): ApplicantEligibilityDto;
}

@injectable()
export class DefaultProfileDtoMapper implements ProfileDtoMapper {
  private readonly serverConfig: Pick<ServerConfig, 'ELIGIBILITY_STATUS_CODE_ELIGIBLE'>;

  constructor(
    @inject(TYPES.ServerConfig)
    serverConfig: Pick<ServerConfig, 'ELIGIBILITY_STATUS_CODE_ELIGIBLE'>,
  ) {
    this.serverConfig = serverConfig;
  }

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
                  AddressProvince: { ProvinceCode: { ReferenceDataID: updateAddressRequestDto.mailingAddress.province ?? '00000000-0000-0000-0000-000000000000' } },
                  AddressSecondaryUnitText: '',
                  AddressStreet: { StreetName: updateAddressRequestDto.mailingAddress.address },
                },
                {
                  AddressCategoryCode: { ReferenceDataName: 'Home' },
                  AddressCityName: updateAddressRequestDto.homeAddress.city,
                  AddressCountry: { CountryCode: { ReferenceDataID: updateAddressRequestDto.homeAddress.country } },
                  AddressPostalCode: updateAddressRequestDto.homeAddress.postalCode ?? '',
                  AddressProvince: { ProvinceCode: { ReferenceDataID: updateAddressRequestDto.homeAddress.province ?? '00000000-0000-0000-0000-000000000000' } },
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

  mapApplicantEligibilityEntityToApplicantEligibilityDto(applicantEligibilityEntity: ApplicantEligibilityEntity): ApplicantEligibilityDto {
    const applicant = applicantEligibilityEntity.BenefitApplication.Applicant;

    return {
      clientId: applicant.ClientIdentification[0].IdentificationID,
      firstName: applicant.PersonName[0].PersonGivenName[0],
      lastName: applicant.PersonName[0].PersonSurName,
      earnings: [
        {
          taxationYear: applicant.ApplicantEarning[0].EarningTaxationYear.YearDate,
          isEligible: this.toEligibilityStatusCode(applicant.BenefitEligibilityStatus.StatusCode.ReferenceDataID),
        },
      ],
    };
  }

  private toEligibilityStatusCode(statusCode: string) {
    const { ELIGIBILITY_STATUS_CODE_ELIGIBLE } = this.serverConfig;
    return statusCode === ELIGIBILITY_STATUS_CODE_ELIGIBLE;
  }
}
