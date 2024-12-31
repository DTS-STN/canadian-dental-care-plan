import type { ReadonlyDeep } from 'type-fest';

export type ClientApplicationEntity = ReadonlyDeep<{
  BenefitApplication: {
    Applicant: {
      PersonBirthDate: {
        date: string;
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
        }>;
        EmailAddress: Array<{
          EmailAddressID: string;
        }>;
        TelephoneNumber: Array<{
          TelephoneNumberCategoryCode: {
            ReferenceDataID: string;
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
      };
      MailingSameAsHomeIndicator: boolean;
      PreferredMethodCommunicationCode: {
        ReferenceDataID: string;
      };
      ApplicantDetail: {
        DisabilityTaxCreditIndicator: boolean;
        InsurancePlan?: Array<{
          InsurancePlanIdentification: Array<{
            IdentificationID: string;
            IdentificationCategoryText?: string;
          }>;
        }>;
        InvitationToApplyIndicator: boolean;
        LivingIndependentlyIndicator: boolean;
        PreviousApplicationIndicator: boolean;
        PreviousTaxesFiledIndicator: boolean;
        PrivateDentalInsuranceIndicator: boolean;
      };
      ClientIdentification: Array<{
        IdentificationID: string;
        IdentificationCategoryText?: string;
      }>;
      RelatedPerson: Array<{
        PersonBirthDate: {
          date?: string;
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
        };
        ApplicantDetail: {
          PrivateDentalInsuranceIndicator?: boolean;
          InsurancePlan?: Array<{
            InsurancePlanIdentification: Array<{
              IdentificationID: string;
              IdentificationCategoryText?: string;
            }>;
          }>;
          ConsentToSharePersonalInformationIndicator?: boolean;
          AttestParentOrGuardianIndicator?: boolean;
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
    BenefitApplicationYear: {
      BenefitApplicationYearIdentification: Array<{
        IdentificationID: string;
      }>;
    };
  };
}>;

export type ClientApplicationBasicInfoRequestEntity = ReadonlyDeep<{
  Applicant: {
    PersonName: {
      PersonGivenName: Array<string>;
      PersonSurName: string;
    };
    PersonBirthDate: {
      date: string;
    };
    ClientIdentification: Array<{
      IdentificationID: string;
    }>;
  };
  BenefitApplicationYear: {
    IdentificationID: string;
  };
}>;

export type ClientApplicationSinRequestEntity = ReadonlyDeep<{
  Applicant: {
    PersonSINIdentification: {
      IdentificationID: string;
    };
  };
  BenefitApplicationYear: {
    IdentificationID: string;
  };
}>;
