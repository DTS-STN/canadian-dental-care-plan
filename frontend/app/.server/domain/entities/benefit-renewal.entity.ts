export type BenefitRenewalRequestEntity = Readonly<{
  BenefitApplication: Readonly<{
    Applicant: Readonly<{
      ApplicantDetail: Readonly<{
        PrivateDentalInsuranceIndicator?: boolean;
        DisabilityTaxCreditIndicator?: boolean;
        LivingIndependentlyIndicator?: boolean;
        InsurancePlan?: ReadonlyArray<
          Readonly<{
            InsurancePlanIdentification?: ReadonlyArray<
              Readonly<{
                IdentificationID?: string;
              }>
            >;
          }>
        >;
      }>;
      PersonBirthDate: Readonly<{
        date: string;
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
                }>;
              }>;
              AddressPostalCode: string;
              AddressProvince: Readonly<{
                ProvinceCode: Readonly<{
                  ReferenceDataID: string;
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
              TelephoneNumberCategoryCode: Readonly<{
                ReferenceDataID: string;
                ReferenceDataName: string;
              }>;
            }>
          >;
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
      PersonClientIdentification: Readonly<{
        IdentificationID: string;
      }>;
      RelatedPerson: ReadonlyArray<
        Readonly<{
          PersonBirthDate: Readonly<{
            date: string;
          }>;
          PersonRelationshipCode: Readonly<{
            ReferenceDataName: string;
          }>;
          PersonSINIdentification: Readonly<{
            IdentificationID: string;
          }>;
          ApplicantDetail: Readonly<{
            ConsentToSharePersonalInformationIndicator?: boolean;
            AttestParentOrGuardianIndicator?: boolean;
            PrivateDentalInsuranceIndicator?: boolean;
            InsurancePlan?: ReadonlyArray<
              Readonly<{
                InsurancePlanIdentification?: ReadonlyArray<
                  Readonly<{
                    IdentificationID?: string;
                  }>
                >;
              }>
            >;
          }>;
        }>
      >;
      MailingSameAsHomeIndicator: boolean;
      PreferredMethodCommunicationCode?: Readonly<{
        ReferenceDataID?: string;
      }>;
    }>;
    BenefitRenewalCategoryCode: Readonly<{
      ReferenceDataID: string;
    }>;
    BenefitRenewalChannelCode: Readonly<{
      ReferenceDataID: string;
    }>;
  }>;
}>;

export type BenefitRenewalResponseEntity = Readonly<{
  BenefitApplication: Readonly<{
    BenefitRenewalIdentification: ReadonlyArray<
      Readonly<{
        IdentificationID: string;
        IdentificationCategoryText: string;
      }>
    >;
  }>;
}>;
