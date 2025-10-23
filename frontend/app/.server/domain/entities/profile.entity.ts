import type { ReadonlyDeep } from 'type-fest';

export type UpdateDentalBenefitsRequestEntity = ReadonlyDeep<{
  BenefitApplication: {
    Applicant: {
      ApplicantDetail: {
        ApplicantDetail: {
          InsurancePlan: Array<{
            InsurancePlanIdentification: Array<{
              IdentificationID: string;
            }>;
          }>;
        };
      };
      ClientIdentification: Array<{
        IdentificationID: string;
        IdentificationCategoryText: 'Guid Primary Key';
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
