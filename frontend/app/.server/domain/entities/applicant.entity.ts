export type ApplicantRequestEntity = Readonly<{
  Applicant: Readonly<{
    PersonSINIdentification: Readonly<{
      IdentificationID: string;
    }>;
  }>;
}>;

export type ApplicantResponseEntity = Readonly<{
  BenefitApplication?: Readonly<{
    Applicant?: Readonly<{
      ClientIdentification?: ReadonlyArray<{
        IdentificationID?: string;
        IdentificationCategoryText?: string;
      }>;
    }>;
  }>;
}>;
