import type { ReadonlyDeep } from 'type-fest';

export type ApplicantRequestEntity = ReadonlyDeep<{
  Applicant: {
    PersonSINIdentification: {
      IdentificationID: string;
    };
  };
}>;

export type ApplicantResponseEntity = ReadonlyDeep<{
  BenefitApplication: {
    Applicant: {
      ClientIdentification: Array<{
        IdentificationID: string;
        IdentificationCategoryText: 'Client ID' | 'Client Number';
      }>;
      PersonBirthDate: {
        date: string;
      };
      PersonName: Array<{
        PersonGivenName: Array<string>;
        PersonSurName: string;
      }>;
      PersonSINIdentification: {
        IdentificationID: string;
      };
    };
  };
}>;
