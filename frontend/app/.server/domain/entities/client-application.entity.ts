export type ClientApplicationEntity = Readonly<{
  BenefitApplication: Readonly<{
    Applicant: Readonly<{
      ApplicantDetail: Readonly<{
        PrivateDentalInsuranceIndicator: boolean;
        InsurancePlan?: ReadonlyArray<
          Readonly<{
            InsurancePlanIdentification: ReadonlyArray<
              Readonly<{
                IdentificationID: string;
              }>
            >;
          }>
        >;
        ConsentToSharePersonalInformationIndicator?: boolean;
        AttestParentOrGuardianIndicator?: boolean;
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
              TelephoneNumberCategoryCode: Readonly<{
                ReferenceDataID: string;
                ReferenceDataName?: string;
              }>;
            }>
          >;
        }>
      >;
      PersonLanguage: ReadonlyArray<
        Readonly<{
          CommunicationCategoryCode: Readonly<{
            ReferenceDataID: string;
            ReferenceDataName?: string;
          }>;
          PreferredIndicator: boolean;
        }>
      >;
      PersonMaritalStatus: Readonly<{
        StatusCode: Readonly<{
          ReferenceDataID: string;
          ReferenceDataName?: string;
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
      }>;
      RelatedPerson: ReadonlyArray<
        Readonly<{
          PersonBirthDate: Readonly<{
            date: string;
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
          }>;
          ApplicantDetail: Readonly<{
            PrivateDentalInsuranceIndicator: boolean;
            InsurancePlan?: ReadonlyArray<
              Readonly<{
                InsurancePlanIdentification: ReadonlyArray<
                  Readonly<{
                    IdentificationID: string;
                  }>
                >;
              }>
            >;
            ConsentToSharePersonalInformationIndicator?: boolean;
            AttestParentOrGuardianIndicator?: boolean;
          }>;
        }>
      >;
      MailingSameAsHomeIndicator: boolean;
      PreferredMethodCommunicationCode: Readonly<{
        ReferenceDataID: string;
        ReferenceDataName?: string;
      }>;
    }>;
    BenefitApplicationCategoryCode: Readonly<{
      ReferenceDataID: string;
      ReferenceDataName?: string;
    }>;
    BenefitApplicationChannelCode: Readonly<{
      ReferenceDataID: string;
      ReferenceDataName?: string;
    }>;
  }>;
}>;
