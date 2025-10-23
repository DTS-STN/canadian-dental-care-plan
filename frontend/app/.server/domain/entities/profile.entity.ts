import type { ReadonlyDeep } from 'type-fest';

export type UpdatePhoneNumbersRequestEntity = ReadonlyDeep<{
  BenefitApplication: {
    Applicant: {
      ClientIdentification: Array<{
        IdentificationID: string;
        IdentificationCategoryText: 'Guid Primary Key';
      }>;
      PersonContactInformation: Array<{
        TelephoneNumber: Array<{
          TelephoneNumberCategoryCode: {
            ReferenceDataID: string;
            ReferenceDataName: 'Primary' | 'Alternate';
          };
        }>;
      }>;
    };
  };
}>;

export type UpdateEmailAddressRequestEntity = ReadonlyDeep<{
  BenefitApplication: {
    Applicant: {
      ApplicantDetail: {
        ApplicantEmailVerifiedIndicator: boolean;
      };
      ClientIdentification: Array<{
        IdentificationID: string;
        IdentificationCategoryText: 'Guid Primary Key';
      }>;
      PersonContactInformation: Array<{
        EmailAddress: Array<{
          EmailAddressID: string;
        }>;
      }>;
    };
  };
}>;
