import type { ReadonlyDeep } from 'type-fest';

export type BenefitApplicationRequestEntity = ReadonlyDeep<{
  BenefitApplication: {
    Applicant: {
      ApplicantDetail: {
        PrivateDentalInsuranceIndicator?: boolean;
        DisabilityTaxCreditIndicator?: boolean;
        LivingIndependentlyIndicator?: boolean;
        InsurancePlan?: {
          InsurancePlanIdentification?: {
            IdentificationID?: string;
          }[];
        }[];
      };
      PersonBirthDate: {
        date: string;
      };
      PersonContactInformation: {
        Address: {
          AddressCategoryCode: {
            ReferenceDataName: string;
          };
          AddressCityName: string;
          AddressCountry: {
            CountryCode: {
              ReferenceDataID: string;
            };
          };
          AddressPostalCode: string;
          AddressProvince: {
            ProvinceCode: {
              ReferenceDataID: string;
            };
          };
          AddressSecondaryUnitText: string;
          AddressStreet: {
            StreetName: string;
          };
        }[];
        EmailAddress: {
          EmailAddressID: string;
        }[];
        TelephoneNumber: {
          TelephoneNumberCategoryCode: {
            ReferenceDataID: string;
            ReferenceDataName: string;
          };
        }[];
      }[];
      PersonLanguage: {
        CommunicationCategoryCode: {
          ReferenceDataID: string;
        };
        PreferredIndicator: boolean;
      }[];
      PersonMaritalStatus: {
        StatusCode: {
          ReferenceDataID: string;
        };
      };
      PersonName: {
        PersonGivenName: string[];
        PersonSurName: string;
      }[];
      PersonSINIdentification: {
        IdentificationID: string;
      };
      RelatedPerson: {
        ApplicantDetail: {
          PrivateDentalInsuranceIndicator?: boolean;
          InsurancePlan?: {
            InsurancePlanIdentification?: {
              IdentificationID?: string;
            }[];
          }[];
          ConsentToSharePersonalInformationIndicator?: boolean;
          AttestParentOrGuardianIndicator?: boolean;
        };
        PersonBirthDate: {
          date: string;
        };
        PersonName: {
          PersonGivenName: string[];
          PersonSurName: string;
        }[];
        PersonRelationshipCode: {
          ReferenceDataName: string;
        };
        PersonSINIdentification: {
          IdentificationID: string;
        };
      }[];
      MailingSameAsHomeIndicator: boolean;
      PreferredMethodCommunicationCode: {
        ReferenceDataID: string;
      };
    };
    BenefitApplicationCategoryCode: {
      ReferenceDataID: string;
      ReferenceDataName?: string;
    };
    BenefitApplicationChannelCode: {
      ReferenceDataID: string;
    };
    BenefitApplicationYear?: {
      BenefitApplicationYearIdentification: {
        IdentificationID: string;
      }[];
    };
  };
}>;

export type BenefitApplicationResponseEntity = ReadonlyDeep<{
  BenefitApplication: {
    BenefitApplicationIdentification: {
      IdentificationID: string;
      IdentificationCategoryText: string;
    }[];
  };
}>;
