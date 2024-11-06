export type ApplicationStatusEntity = Readonly<{
  BenefitApplication: Readonly<{
    BenefitApplicationStatus: ReadonlyArray<
      Readonly<{
        ReferenceDataID?: string;
        ReferenceDataName: string;
      }>
    >;
  }>;
}>;

export type ApplicationStatusBasicInfoRequestEntity = Readonly<{
  BenefitApplication: Readonly<{
    Applicant: Readonly<{
      PersonName: ReadonlyArray<
        Readonly<{
          PersonGivenName: ReadonlyArray<string>;
          PersonSurName: string;
        }>
      >;
      PersonBirthDate: Readonly<{
        date: string;
      }>;
      ClientIdentification: ReadonlyArray<
        Readonly<{
          IdentificationID: string;
        }>
      >;
    }>;
  }>;
}>;

export type ApplicationStatusSinRequestEntity = Readonly<{
  BenefitApplication: Readonly<{
    Applicant: Readonly<{
      PersonSINIdentification: Readonly<{
        IdentificationID: string;
      }>;
      ClientIdentification: ReadonlyArray<
        Readonly<{
          IdentificationID: string;
        }>
      >;
    }>;
  }>;
}>;
