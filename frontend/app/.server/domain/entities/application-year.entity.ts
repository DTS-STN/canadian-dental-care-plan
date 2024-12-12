import type { ReadonlyDeep } from 'type-fest';

export type ApplicationYearRequestEntity = Readonly<{
  currentDate: string;
}>;

export type ApplicationYearResultEntity = ReadonlyDeep<{
  BenefitApplicationYear: {
    BenefitApplicationYearIdentification: {
      IdentificationID: string;
    }[];
    BenefitApplicationYearEffectivePeriod: {
      StartDate: {
        YearDate: string;
      };
    };
    BenefitApplicationYearTaxYear: {
      YearDate: string;
    };
    BenefitApplicationYearIntakePeriod: {
      StartDate: {
        date: string;
      };
      EndDate?: {
        date?: string;
      };
    };
    BenefitApplicationYearRenewalPeriod: {
      StartDate?: {
        date?: string;
      };
      EndDate?: {
        date?: string;
      };
    };
    BenefitApplicationYearNext: {
      BenefitApplicationYearIdentification?: {
        IdentificationID?: string;
      };
    };
    BenefitApplicationYearCoveragePeriod: {
      StartDate: {
        date: string;
      };
      EndDate: {
        date: string;
      };
    };
  }[];
}>;
