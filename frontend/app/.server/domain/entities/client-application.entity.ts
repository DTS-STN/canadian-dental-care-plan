export type ClientApplicationEntity = Readonly<{
  BenefitApplication: Readonly<{
    Applicant: Readonly<{
      PersonBirthDate: Readonly<{
        date: string;
        dateTime?: string;
        DayDate?: string;
        MonthDate?: string;
        YearDate?: string;
      }>;
      PersonContactInformation: ReadonlyArray<
        Readonly<{
          Address: ReadonlyArray<
            Readonly<{
              AddressCategoryCode: Readonly<{
                ReferenceDataName: string;
              }>;
              AddressCityName: string;
              AddressCountry: Readonly<{
                CountryCode: Readonly<{
                  ReferenceDataID: string;
                  ReferenceDataName?: string;
                }>;
              }>;
              AddressPostalCode: string;
              AddressProvince: Readonly<{
                ProvinceCode: Readonly<{
                  ReferenceDataID: string;
                  ReferenceDataName?: string;
                }>;
              }>;
              AddressSecondaryUnitText: string;
              AddressStreet: Readonly<{
                StreetName: string;
              }>;
            }>
          >;
          EmailAddress: ReadonlyArray<
            Readonly<{
              EmailAddressID: string;
            }>
          >;
          TelephoneNumber: ReadonlyArray<
            Readonly<{
              FullTelephoneNumber: Readonly<{
                TelephoneNumberFullID: string;
              }>;
              TelephoneNumberCategoryCode: Readonly<{
                ReferenceDataName: string;
              }>;
            }>
          >;
        }>
      >;
      PersonLanguage: ReadonlyArray<
        Readonly<{
          CommunicationCategoryCode: Readonly<{
            ReferenceDataID: string;
          }>;
          PreferredIndicator: string;
        }>
      >;
      PersonMaritalStatus: Readonly<{
        StatusCode: Readonly<{
          ReferenceDataID: string;
        }>;
      }>;
      PersonName: ReadonlyArray<
        Readonly<{
          PersonGivenName: ReadonlyArray<string>;
          PersonSurName: string;
        }>
      >;
      PersonSINIdentification: Readonly<{
        IdentificationID: string;
        IdentificationCategoryText?: string;
      }>;
      MailingSameAsHomeIndicator: boolean;
      PreferredMethodCommunicationCode: Readonly<{
        ReferenceDataID: string;
      }>;
      ApplicantDetail: Readonly<{
        AttestParentOrGuardianIndicator: boolean;
        ConsentToSharePersonalInformationIndicator: boolean;
        DisabilityTaxCreditIndicator: boolean;
        FederalDentalCoverageIndicator: boolean;
        InsurancePlan?: ReadonlyArray<
          Readonly<{
            InsurancePlanIdentification: ReadonlyArray<
              Readonly<{
                IdentificationID: string;
                IdentificationCategoryText?: string;
              }>
            >;
          }>
        >;
        LivingIndependentlyIndicator: boolean;
        PrivateDentalInsuranceIndicator: boolean;
        ProvincialDentalCoverageIndicator: boolean;
      }>;
      ClientIdentification: ReadonlyArray<
        Readonly<{
          IdentificationID: string;
          IdentificationCategoryText?: string;
        }>
      >;
      Flags: ReadonlyArray<
        Readonly<{
          Flag: boolean;
          FlagCategoryText: string;
        }>
      >;
      RelatedPerson: ReadonlyArray<
        Readonly<{
          PersonBirthDate: Readonly<{
            date: string;
            dateTime?: string;
            DayDate?: string;
            MonthDate?: string;
            YearDate?: string;
          }>;
          PersonName: ReadonlyArray<
            Readonly<{
              PersonGivenName: ReadonlyArray<string>;
              PersonSurName: string;
            }>
          >;
          PersonRelationshipCode: Readonly<{
            ReferenceDataName: string;
          }>;
          PersonSINIdentification: Readonly<{
            IdentificationID: string;
            IdentificationCategoryText?: string;
          }>;
          ApplicantDetail: Readonly<{
            PrivateDentalInsuranceIndicator: boolean;
            InsurancePlan?: ReadonlyArray<
              Readonly<{
                InsurancePlanIdentification: ReadonlyArray<
                  Readonly<{
                    IdentificationID: string;
                    IdentificationCategoryText?: string;
                  }>
                >;
              }>
            >;
            ConsentToSharePersonalInformationIndicator?: boolean;
            AttestParentOrGuardianIndicator?: boolean;
          }>;
        }>
      >;
    }>;
    BenefitApplicationChannelCode: Readonly<{
      ReferenceDataID: string;
    }>;
    BenefitApplicationCategoryCode: Readonly<{
      ReferenceDataID: string;
    }>;
    BenefitApplicationIdentification: ReadonlyArray<
      Readonly<{
        IdentificationID: string;
        IdentificationCategoryText?: string;
      }>
    >;
    BenefitApplicationYear: Readonly<{
      BenefitApplicationYearIdentification: ReadonlyArray<
        Readonly<{
          IdentificationID: string;
          IdentificationCategoryText?: string;
        }>
      >;
    }>;
  }>;
}>;
