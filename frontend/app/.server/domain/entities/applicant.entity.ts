import type { ReadonlyDeep } from 'type-fest';

export type ApplicantRequestEntity = ReadonlyDeep<{
  Applicant: {
    PersonSINIdentification: {
      IdentificationID: string;
    };
  };
}>;

export type ApplicantResponseEntity = ReadonlyDeep<{
  BenefitApplication?: {
    Applicant?: {
      ClientIdentification?: Array<{
        IdentificationID?: string;
        IdentificationCategoryText?: string;
      }>;
    };
  };
}>;
