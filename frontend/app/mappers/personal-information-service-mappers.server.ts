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

export function toPersonalInformation(getApplicantResponse: GetApplicantResponse): PersonalInformation {
  const applicant = getApplicantResponse.BenefitApplication.Applicant;

  const addresses = applicant?.PersonContactInformation.at(0)?.Address;
  const homeAddress = addresses?.find((address) => address.AddressCategoryCode.ReferenceDataName === 'Home');
  const mailingAddress = addresses?.find((address) => address.AddressCategoryCode.ReferenceDataName === 'Mailing');

  return {
    applicantCategoryCode: applicant?.ApplicantCategoryCode.ReferenceDataID,
    applictantId: applicant?.ClientIdentification?.find((clientInfoDto) => clientInfoDto.IdentificationCategoryText === 'Applicant ID')?.IdentificationID,
    clientId: applicant?.ClientIdentification?.find((clientInfoDto) => clientInfoDto.IdentificationCategoryText === 'Client ID')?.IdentificationID,
    clientNumber: applicant?.ClientIdentification?.find((clientInfoDto) => clientInfoDto.IdentificationCategoryText === 'Client Number')?.IdentificationID,
    birthDate: applicant?.PersonBirthDate.date,
    firstName: applicant?.PersonName?.at(0)?.PersonGivenName?.at(0),
    lastName: applicant?.PersonName?.at(0)?.PersonSurName,
    emailAddress: applicant?.PersonContactInformation.at(0)?.EmailAddress.at(0)?.EmailAddressID,
    maritalStatusId: applicant?.PersonMaritalStatus.StatusCode.ReferenceDataID,
    homeAddress: toAddress(homeAddress),
    mailingAddress: toAddress(mailingAddress),
    primaryTelephoneNumber: applicant?.PersonContactInformation.at(0)?.TelephoneNumber.find((phoneNumber) => phoneNumber.TelephoneNumberCategoryCode.ReferenceDataName === 'Primary')?.FullTelephoneNumber.TelephoneNumberFullID,
    alternateTelephoneNumber: applicant?.PersonContactInformation.at(0)?.TelephoneNumber.find((phoneNumber) => phoneNumber.TelephoneNumberCategoryCode.ReferenceDataName === 'Alternate')?.FullTelephoneNumber.TelephoneNumberFullID,
    preferredLanguageId: applicant?.PreferredMethodCommunicationCode?.ReferenceDataID,
  };
}

interface ToAddressArgs {
  AddressCategoryCode: { ReferenceDataID?: string; ReferenceDataName?: string };
  AddressStreet: { StreetName?: string };
  AddressProvince: { ProvinceCode: { ReferenceDataID?: string; ReferenceDataName?: string }; ProvinceName?: string };
  AddressCountry: { CountryCode: { ReferenceDataID?: string; ReferenceDataName?: string } };
  AddressSecondaryUnitText?: string;
  AddressCityName?: string;
  AddressPostalCode?: string;
}

function toAddress(address?: ToAddressArgs) {
  if (!address) {
    return undefined;
  }

  return {
    streetName: address.AddressStreet.StreetName,
    apartment: address.AddressSecondaryUnitText,
    cityName: address.AddressCityName,
    provinceTerritoryStateId: address.AddressProvince.ProvinceCode.ReferenceDataID,
    countryId: address.AddressCountry.CountryCode.ReferenceDataID,
    postalCode: address.AddressPostalCode,
  };
}
