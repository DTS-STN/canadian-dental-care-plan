import type { GetApplicantResponse, PersonalInformation } from '~/schemas/personal-informaton-service-schemas.server';

export function toGetApplicantRequest(sin: string) {
  return {
    Applicant: {
      PersonSINIdentification: {
        IdentificationID: sin,
      },
    },
  };
}

export function toPersonalInformation(getApplicantResponse: GetApplicantResponse): PersonalInformation {
  const applicant = getApplicantResponse.BenefitApplication.Applicant;

  const addresses = applicant?.PersonContactInformation.at(0)?.Address;
  const homeAddress = addresses?.find((address) => address.AddressCategoryCode.ReferenceDataName === 'Home');
  const mailingAddress = addresses?.find((address) => address.AddressCategoryCode.ReferenceDataName === 'Mailing');

  return {
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
