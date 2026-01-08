import type { ReadonlyDeep } from 'type-fest';

export type ClientEligibilityEntity = ReadonlyDeep<{
  Applicant: {
    ApplicantEarning: Array<{
      BenefitApplicationYearIdentification: {
        IdentificationID: string;
        IdentificationCategoryText: string;
      };
      BenefitEligibilityStatus: {
        StatusCode: {
          ReferenceDataID: string;
        };
      };
      Coverage: Array<{
        CoverageCategoryCode: {
          ReferenceDataName: string;
          CoverageTierCode: {
            ReferenceDataID: string;
          };
        };
      }>;
      EarningIdentification: Array<{
        IdentificationID: string;
        IdentificationCategoryText: string;
      }>;
      EarningTaxationYear: {
        YearDate: string;
      };
      PrivateDentalInsuranceIndicator: boolean;
    }>;
    ApplicantCategoryCode: { ReferenceDataID: string };
    ApplicantEnrollmentStatus?: {
      StatusCode?: { ReferenceDataID?: string };
    };
    BenefitEligibilityStatus?: {
      StatusCode?: { ReferenceDataID?: string };
    };
    BenefitEligibilityNextYearStatus?: {
      StatusCode?: { ReferenceDataID?: string };
    };
    BenefitApplicationYearIdentification: {
      IdentificationID: string;
      IdentificationCategoryText: string;
    };
    ClientIdentification: Array<{
      IdentificationID: string;
      IdentificationCategoryText: 'Client Number' | 'Client ID';
    }>;
    PersonName: Array<{
      PersonGivenName: Array<string>;
      PersonSurName: string;
    }>;
  };
}>;

export type ClientEligibilityRequestEntity = ReadonlyDeep<
  Array<{
    Applicant: {
      PersonClientNumberIdentification: {
        IdentificationID: string;
        IdentificationCategoryText: 'Client Number';
      };
    };
  }>
>;
