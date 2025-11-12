import type { ReadonlyDeep } from 'type-fest';

export type EligibilityEntity = ReadonlyDeep<{
  BenefitApplication: {
    Applicant: {
      ApplicantDetail: {
        PrivateDentalInsuranceIndicator: boolean;
      };
      ApplicantEarning: Array<{
        BenefitApplicationYearIdentification: Array<{
          IdentificationID: string;
        }>;
        BenefitEligibilityStatus: {
          StatusCode: {
            ReferenceDataId: string;
          };
        };
        Coverage: Array<{
          CoverageCategoryCode: {
            ReferenceDataName: string;
            CoverageTierCode: {
              ReferenceDataId: string;
            };
          };
        }>;
        EarningIdentification: Array<{
          IdentificationID: string;
          IdentificationCategoryText: 'Earning ID';
        }>;
        EarningTaxationYear: {
          YearDate: string;
        };
      }>;
      ApplicantCategoryCode: { ReferenceDataID: string };
      ApplicantEnrollmentStatus: {
        StatusCode: { ReferenceDataID: string };
      };
      BenefitEligibilityStatus: {
        StatusCode: { ReferenceDataID: string };
      };
      BenefitEligibilityNextYearStatus: {
        StatusCode: { ReferenceDataID: string };
      };
      BenefitApplicationYearIdentification: [{ IdentificationID: string }];
      ClientIdentification: Array<{
        IdentificationID: string;
        IdentificationCategoryText: 'Client Number';
      }>;
      PersonName: Array<{
        PersonGivenName: Array<string>;
        PersonSurName: string;
      }>;
    };
  };
}>;
