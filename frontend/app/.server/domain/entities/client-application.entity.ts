import type { ReadonlyDeep } from 'type-fest';

export type ClientApplicationEntity = ReadonlyDeep<{
  BenefitApplication: {
    Applicant: {
      PersonBirthDate: {
        date: string;
        dateTime?: string;
        DayDate?: string;
        MonthDate?: string;
        YearDate?: string;
      };
      PersonContactInformation: Array<{
        Address: Array<{
          AddressCategoryCode: {
            ReferenceDataName: string;
          };
          AddressCityName: string;
          AddressCountry: {
            CountryCode: {
              ReferenceDataID: string;
              ReferenceDataName?: string;
            };
          };
          AddressPostalCode: string;
          AddressProvince: {
            ProvinceCode: {
              ReferenceDataID: string;
              ReferenceDataName?: string;
            };
          };
          AddressSecondaryUnitText: string;
          AddressStreet: {
            StreetName: string;
          };
        }>;
        EmailAddress: Array<{
          EmailAddressID: string;
        }>;
        TelephoneNumber: Array<{
          FullTelephoneNumber: {
            TelephoneNumberFullID: string;
          };
          TelephoneNumberCategoryCode: {
            ReferenceDataName: string;
          };
        }>;
      }>;
      PersonLanguage: Array<{
        CommunicationCategoryCode: {
          ReferenceDataID: string;
        };
        PreferredIndicator: boolean;
      }>;
      PersonMaritalStatus: {
        StatusCode: {
          ReferenceDataID: string;
        };
      };
      PersonName: Array<{
        PersonGivenName: Array<string>;
        PersonSurName: string;
      }>;
      PersonSINIdentification: {
        IdentificationID: string;
        IdentificationCategoryText?: string;
      };
      MailingSameAsHomeIndicator: boolean;
      PreferredMethodCommunicationCode: {
        ReferenceDataID: string;
      };
      ApplicantDetail: {
        AttestParentOrGuardianIndicator: boolean;
        ConsentToSharePersonalInformationIndicator: boolean;
        DisabilityTaxCreditIndicator: boolean;
        FederalDentalCoverageIndicator: boolean;
        InsurancePlan?: Array<{
          InsurancePlanIdentification: Array<{
            IdentificationID: string;
            IdentificationCategoryText?: string;
          }>;
        }>;
        LivingIndependentlyIndicator: boolean;
        PrivateDentalInsuranceIndicator: boolean;
        ProvincialDentalCoverageIndicator: boolean;
      };
      ClientIdentification: Array<{
        IdentificationID: string;
        IdentificationCategoryText?: string;
      }>;
      Flags: Array<{
        Flag: boolean;
        FlagCategoryText: string;
      }>;
      RelatedPerson: Array<{
        PersonBirthDate: {
          date: string;
          dateTime?: string;
          DayDate?: string;
          MonthDate?: string;
          YearDate?: string;
        };
        PersonName: Array<{
          PersonGivenName: Array<string>;
          PersonSurName: string;
        }>;
        PersonRelationshipCode: {
          ReferenceDataName: string;
        };
        PersonSINIdentification: {
          IdentificationID: string;
          IdentificationCategoryText?: string;
        };
        ApplicantDetail: {
          PrivateDentalInsuranceIndicator: boolean;
          InsurancePlan?: Array<{
            InsurancePlanIdentification: Array<{
              IdentificationID: string;
              IdentificationCategoryText?: string;
            }>;
          }>;
          ConsentToSharePersonalInformationIndicator: boolean;
          AttestParentOrGuardianIndicator: boolean;
        };
        ClientIdentification: Array<{
          IdentificationID: string;
          IdentificationCategoryText?: string;
        }>;
      }>;
    };
    BenefitApplicationChannelCode: {
      ReferenceDataID: string;
    };
    BenefitApplicationCategoryCode: {
      ReferenceDataID: string;
    };
    BenefitApplicationIdentification: Array<{
      IdentificationID: string;
      IdentificationCategoryText?: string;
    }>;
    BenefitApplicationYear: {
      BenefitApplicationYearIdentification: Array<{
        IdentificationID: string;
        IdentificationCategoryText?: string;
      }>;
    };
  };
}>;

export type ClientApplicationBasicInfoRequestEntity = ReadonlyDeep<{
  Applicant: {
    PersonName: Array<{
      PersonGivenName: Array<string>;
      PersonSurName: string;
    }>;

    PersonBirthDate: {
      date: string;
    };
    ClientIdentification: Array<{
      IdentificationID: string;
    }>;
  };
}>;

export type ClientApplicationSinRequestEntity = ReadonlyDeep<{
  Applicant: {
    PersonSINIdentification: {
      IdentificationID: string;
    };
  };
}>;
