import { GetApplicantResponse, PersonalInformation, UpdateApplicantRequest } from '~/schemas/personal-informaton-service-schemas.server';

export function toGetApplicantRequest(sin: string) {
  return {
    Applicant: {
      PersonSINIdentification: {
        IdentificationID: sin,
      },
    },
  };
}

export function toUpdateApplicantRequest(personalInformation: PersonalInformation): UpdateApplicantRequest {
  return {
    BenefitApplication: {
      Applicant: {
        ApplicantCategoryCode: {
          ReferenceDataID: personalInformation.applicantCategoryCode,
        },
        ClientIdentification: [
          {
            IdentificationID: personalInformation.applictantId,
            IdentificationCategoryText: 'Applicant ID',
          },
          {
            IdentificationID: personalInformation.clientId,
            IdentificationCategoryText: 'Client ID',
          },
          {
            IdentificationID: personalInformation.clientNumber,
            IdentificationCategoryText: 'Client Number',
          },
        ],
        PersonBirthDate: {
          date: personalInformation.birthDate,
        },
        PersonContactInformation: [
          {
            Address: [toUpdateAddressRequest({ ...personalInformation.mailingAddress, category: 'Mailing' }), toUpdateAddressRequest({ ...personalInformation.homeAddress, category: 'Home' })],
            EmailAddress: [
              {
                EmailAddressID: personalInformation.emailAddress,
              },
            ],
            TelephoneNumber: [
              {
                FullTelephoneNumber: {
                  TelephoneNumberFullID: personalInformation.primaryTelephoneNumber,
                },
                TelephoneNumberCategoryCode: {
                  ReferenceDataName: 'Primary',
                },
              },
              {
                FullTelephoneNumber: {
                  TelephoneNumberFullID: personalInformation.alternateTelephoneNumber,
                },
                TelephoneNumberCategoryCode: {
                  ReferenceDataName: 'Alternate',
                },
              },
            ],
          },
        ],
        PersonMaritalStatus: {
          StatusCode: {
            ReferenceDataID: personalInformation.maritalStatusId,
          },
        },
        PersonName: [
          {
            PersonGivenName: [personalInformation.firstName ?? ''],
            PersonSurName: personalInformation.lastName,
          },
        ],
        PersonSINIdentification: {
          IdentificationID: personalInformation.sin ?? '',
          IdentificationCategoryText: 'some text',
        },
        MailingSameAsHomeIndicator: personalInformation.homeAndMailingAddressTheSame,
        PreferredMethodCommunicationCode: {
          ReferenceDataID: personalInformation.preferredLanguageId,
        },
      },
      BenefitApplicationIdentification: [
        {
          IdentificationID: personalInformation.benefitApplicationIdentification ?? '',
          IdentificationCategoryText: 'Dental Application ID',
        },
      ],
    },
  };
}

export function toPersonalInformation(getApplicantResponse: GetApplicantResponse): PersonalInformation {
  const addressList = getApplicantResponse.BenefitApplication.Applicant?.PersonContactInformation.at(0)?.Address;
  const homeAddressList = addressList?.filter((address) => address.AddressCategoryCode.ReferenceDataName === 'Home');
  const mailingAddressList = addressList?.filter((address) => address.AddressCategoryCode.ReferenceDataName === 'Mailing');

  return {
    applicantCategoryCode: getApplicantResponse.BenefitApplication.Applicant?.ApplicantCategoryCode.ReferenceDataID,
    applictantId: getApplicantResponse.BenefitApplication.Applicant?.ClientIdentification?.filter((clientInfoDto) => clientInfoDto.IdentificationCategoryText === 'Applicant ID').at(0)?.IdentificationID,
    clientId: getApplicantResponse.BenefitApplication.Applicant?.ClientIdentification?.filter((clientInfoDto) => clientInfoDto.IdentificationCategoryText === 'Client ID').at(0)?.IdentificationID,
    clientNumber: getApplicantResponse.BenefitApplication.Applicant?.ClientIdentification?.filter((clientInfoDto) => clientInfoDto.IdentificationCategoryText === 'Client Number').at(0)?.IdentificationID,
    birthDate: getApplicantResponse.BenefitApplication.Applicant?.PersonBirthDate.date,
    firstName: getApplicantResponse.BenefitApplication.Applicant?.PersonName?.at(0)?.PersonGivenName?.at(0),
    lastName: getApplicantResponse.BenefitApplication.Applicant?.PersonName?.at(0)?.PersonSurName,
    emailAddress: getApplicantResponse.BenefitApplication.Applicant?.PersonContactInformation.at(0)?.EmailAddress.at(0)?.EmailAddressID,
    maritalStatusId: getApplicantResponse.BenefitApplication.Applicant?.PersonMaritalStatus.StatusCode.ReferenceDataID,
    homeAddress: homeAddressList
      ?.map((aHomeAddress) => ({
        streetName: aHomeAddress.AddressStreet.StreetName,
        apartment: aHomeAddress.AddressSecondaryUnitText,
        cityName: aHomeAddress.AddressCityName,
        provinceTerritoryStateId: aHomeAddress.AddressProvince.ProvinceCode.ReferenceDataID,
        countryId: aHomeAddress.AddressCountry.CountryCode.ReferenceDataID,
        postalCode: aHomeAddress.AddressPostalCode,
      }))
      .at(0),
    mailingAddress: mailingAddressList
      ?.map((aMailingAddress) => ({
        streetName: aMailingAddress.AddressStreet.StreetName,
        apartment: aMailingAddress.AddressSecondaryUnitText,
        cityName: aMailingAddress.AddressCityName,
        provinceTerritoryStateId: aMailingAddress.AddressProvince.ProvinceCode.ReferenceDataID,
        countryId: aMailingAddress.AddressCountry.CountryCode.ReferenceDataID,
        postalCode: aMailingAddress.AddressPostalCode,
      }))
      .at(0),

    primaryTelephoneNumber: getApplicantResponse.BenefitApplication.Applicant?.PersonContactInformation.at(0)?.TelephoneNumber.find((phoneNumber) => phoneNumber.TelephoneNumberCategoryCode.ReferenceDataName === 'Primary')?.FullTelephoneNumber
      .TelephoneNumberFullID,
    alternateTelephoneNumber: getApplicantResponse.BenefitApplication.Applicant?.PersonContactInformation.at(0)?.TelephoneNumber.find((phoneNumber) => phoneNumber.TelephoneNumberCategoryCode.ReferenceDataName === 'Alternate')?.FullTelephoneNumber
      .TelephoneNumberFullID,
    preferredLanguageId: getApplicantResponse.BenefitApplication.Applicant?.PreferredMethodCommunicationCode?.ReferenceDataID,
  };
}

interface ToUpdateAddressRequestArgs {
  apartment?: string;
  category: string;
  cityName?: string;
  countryId?: string;
  streetName?: string;
  postalCode?: string;
  provinceTerritoryStateId?: string;
}

function toUpdateAddressRequest({ apartment, category, cityName, countryId, streetName, postalCode, provinceTerritoryStateId }: ToUpdateAddressRequestArgs) {
  return {
    AddressCategoryCode: {
      ReferenceDataName: category,
    },
    AddressCityName: cityName,
    AddressCountry: {
      CountryCode: {
        ReferenceDataID: countryId,
      },
    },
    AddressPostalCode: postalCode,
    AddressProvince: {
      ProvinceCode: {
        ReferenceDataID: provinceTerritoryStateId,
      },
    },
    AddressSecondaryUnitText: apartment,
    AddressStreet: {
      StreetName: streetName,
    },
  };
}
