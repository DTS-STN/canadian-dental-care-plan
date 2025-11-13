import type { ReadonlyDeep } from 'type-fest';

export type ClientEligibilityEntity = ReadonlyDeep<{
  Applicant: {
    ApplicantEarning: Array<{
      BenefitApplicationYearIdentification: {
        IdentificationID: string;
        IdentificationCategoryText: "Application Year ID";
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
        IdentificationCategoryText: "Client Earning ID";
      }>;
      EarningTaxationYear: {
        YearDate: string;
      };
      PrivateDentalInsuranceIndicator: boolean;
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
    BenefitApplicationYearIdentification: {
      IdentificationID: string;
      IdentificationCategoryText: "Application Year ID";
    };
    ClientIdentification: Array<{
      IdentificationID: string;
      IdentificationCategoryText: 'Client Number' | 'Client ID';
    }>;
    PersonContactInformation: Array<unknown>;
    PersonLanguage: Array<unknown>;
    PersonName: Array<{
      PersonGivenName: Array<string>;
      PersonSurName: string;
    }>;
  };
}>;
