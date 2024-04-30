import { PersonalInfo, PersonalInformationApi } from '~/schemas/personal-informaton-service-schemas.server';

export function toPersonalInformationApi(personalInformation: PersonalInfo): PersonalInformationApi {
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
          dateTime: personalInformation.birthDate,
        },
        PersonContactInformation: [
          {
            Address: [toAddress(personalInformation.mailingAddress, 'Mailing'), toAddress(personalInformation.homeAddress, 'Home')],
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
          IdentificationID: '',
        },
        MailingSameAsHomeIndicator: personalInformation.homeAndMailingAddressTheSame,
        PreferredMethodCommunicationCode: {
          ReferenceDataID: personalInformation.preferredLanguageId,
        },
      },
      InsurancePlan: toInsurancePlanApi(personalInformation.privateDentalPlanId, personalInformation.federalDentalPlanId, personalInformation.provincialTerritorialDentalPlanId),
      PrivateDentalInsuranceIndicator: personalInformation.privateDentalPlanId ? true : false,
      FederalDentalCoverageIndicator: toFederalDentalCoverageIndicator(personalInformation.federalDentalPlanId),
      ProvicialDentalCoverageIndicator: personalInformation.provincialTerritorialDentalPlanId ? true : false,
    },
  };
}

export function toPersonalInformation(personalInformationApi: PersonalInformationApi): PersonalInfo {
  const addressList = personalInformationApi.BenefitApplication.Applicant?.PersonContactInformation.at(0)?.Address;
  const homeAddressList = addressList?.filter((address) => address.AddressCategoryCode.ReferenceDataName === 'Home');
  const mailingAddressList = addressList?.filter((address) => address.AddressCategoryCode.ReferenceDataName === 'Mailing');

  return {
    applicantCategoryCode: personalInformationApi.BenefitApplication.Applicant?.ApplicantCategoryCode.ReferenceDataID,
    applictantId: personalInformationApi.BenefitApplication.Applicant?.ClientIdentification?.filter((clientInfoDto) => clientInfoDto.IdentificationCategoryText === 'Applicant ID').at(0)?.IdentificationID,
    clientId: personalInformationApi.BenefitApplication.Applicant?.ClientIdentification?.filter((clientInfoDto) => clientInfoDto.IdentificationCategoryText === 'Client ID').at(0)?.IdentificationID,
    clientNumber: personalInformationApi.BenefitApplication.Applicant?.ClientIdentification?.filter((clientInfoDto) => clientInfoDto.IdentificationCategoryText === 'Client Number').at(0)?.IdentificationID,
    birthDate: personalInformationApi.BenefitApplication.Applicant?.PersonBirthDate.dateTime,
    firstName: personalInformationApi.BenefitApplication.Applicant?.PersonName?.at(0)?.PersonGivenName?.at(0),
    lastName: personalInformationApi.BenefitApplication.Applicant?.PersonName?.at(0)?.PersonSurName,
    emailAddress: personalInformationApi.BenefitApplication.Applicant?.PersonContactInformation.at(0)?.EmailAddress.at(0)?.EmailAddressID,
    maritalStatusId: personalInformationApi.BenefitApplication.Applicant?.PersonMaritalStatus.StatusCode.ReferenceDataID,
    homeAddress: homeAddressList
      ?.map((aHomeAddress) => ({
        streetName: aHomeAddress.AddressStreet.StreetName,
        secondAddressLine: aHomeAddress.AddressSecondaryUnitText,
        cityName: aHomeAddress.AddressCityName,
        provinceTerritoryStateId: aHomeAddress.AddressProvince.ProvinceCode.ReferenceDataID,
        countryId: aHomeAddress.AddressCountry.CountryCode.ReferenceDataID,
        postalCode: aHomeAddress.AddressPostalCode,
      }))
      .at(0),
    mailingAddress: mailingAddressList
      ?.map((aMailingAddress) => ({
        streetName: aMailingAddress.AddressStreet.StreetName,
        secondAddressLine: aMailingAddress.AddressSecondaryUnitText,
        cityName: aMailingAddress.AddressCityName,
        provinceTerritoryStateId: aMailingAddress.AddressProvince.ProvinceCode.ReferenceDataID,
        countryId: aMailingAddress.AddressCountry.CountryCode.ReferenceDataID,
        postalCode: aMailingAddress.AddressPostalCode,
      }))
      .at(0),

    primaryTelephoneNumber: personalInformationApi.BenefitApplication.Applicant?.PersonContactInformation.at(0)?.TelephoneNumber.find((phoneNumber) => phoneNumber.TelephoneNumberCategoryCode.ReferenceDataName === 'Primary')?.FullTelephoneNumber
      .TelephoneNumberFullID,
    alternateTelephoneNumber: personalInformationApi.BenefitApplication.Applicant?.PersonContactInformation.at(0)?.TelephoneNumber.find((phoneNumber) => phoneNumber.TelephoneNumberCategoryCode.ReferenceDataName === 'Alternate')?.FullTelephoneNumber
      .TelephoneNumberFullID,
    preferredLanguageId: personalInformationApi.BenefitApplication.Applicant?.PreferredMethodCommunicationCode?.ReferenceDataID,
    federalDentalPlanId: personalInformationApi.BenefitApplication.InsurancePlan?.find((insurancePlan) => insurancePlan.InsurancePlanIdentification?.IdentificationCategoryText === 'Federal')?.InsurancePlanIdentification?.IdentificationID,
    provincialTerritorialDentalPlanId: personalInformationApi.BenefitApplication.InsurancePlan?.find((insurancePlan) => insurancePlan.InsurancePlanIdentification?.IdentificationCategoryText === 'Provincial and Territorial')?.InsurancePlanIdentification
      ?.IdentificationID,
    privateDentalPlanId: personalInformationApi.BenefitApplication.InsurancePlan?.find((insurancePlan) => insurancePlan.InsurancePlanIdentification?.IdentificationCategoryText === 'Private')?.InsurancePlanIdentification?.IdentificationID,
  };
}

interface ToAddressApi {
  apartment?: string;
  category: string;
  city?: string;
  country?: string;
  postalCode?: string;
  province?: string;
  street?: string;
}

function toAddressApi({ apartment, category, city, country, postalCode, province, street }: ToAddressApi) {
  return {
    AddressCategoryCode: {
      ReferenceDataName: category,
    },
    AddressCityName: city ?? '',
    AddressCountry: {
      CountryCode: {
        ReferenceDataID: country ?? '',
      },
    },
    AddressPostalCode: postalCode ?? '',
    AddressProvince: {
      ProvinceCode: {
        ReferenceDataID: province ?? '',
      },
    },
    AddressSecondaryUnitText: apartment ?? '',
    AddressStreet: {
      StreetName: street ?? '',
    },
  };
}

interface AddressDto {
  streetName?: string | undefined;
  secondAddressLine?: string | undefined;
  countryId?: string | undefined;
  provinceTerritoryStateId?: string | undefined;
  cityName?: string | undefined;
  postalCode?: string | undefined;
}

function toAddress(addressDto: AddressDto | undefined, category: string) {
  return toAddressApi({
    apartment: addressDto?.secondAddressLine,
    category: category,
    city: addressDto?.cityName,
    country: addressDto?.countryId,
    postalCode: addressDto?.postalCode,
    province: addressDto?.provinceTerritoryStateId,
    street: addressDto?.streetName,
  });
}

function toInsurancePlanApi(
  federalDentalPlanId: string | undefined,
  provincialTerritorialDentalPlanId: string | undefined,
  privateDentalPlanId: string | undefined,
): {
  InsurancePlanIdentification?: {
    IdentificationID: string;
    IdentificationCategoryText?: string;
  };
}[] {
  const listOfInsurancePlans = [];

  if (federalDentalPlanId) {
    listOfInsurancePlans.push({ InsurancePlanIdentification: { IdentificationID: federalDentalPlanId, IdentificationCategoryText: 'Federal' } });
  }
  if (provincialTerritorialDentalPlanId) {
    listOfInsurancePlans.push({ InsurancePlanIdentification: { IdentificationID: provincialTerritorialDentalPlanId, IdentificationCategoryText: 'Provincial and Territorial' } });
  }
  if (privateDentalPlanId) {
    listOfInsurancePlans.push({ InsurancePlanIdentification: { IdentificationID: privateDentalPlanId, IdentificationCategoryText: 'Private' } });
  }

  return listOfInsurancePlans;
}

function toFederalDentalCoverageIndicator(federalDentalPlanId: string | undefined): { ReferenceDataID: string | undefined; ReferenceDataName: string | undefined } | undefined {
  return federalDentalPlanId ? { ReferenceDataID: federalDentalPlanId, ReferenceDataName: 'true' } : undefined; //TODO: Revisit once sample FederalDentalCoverageIndicator response gets sent
}
