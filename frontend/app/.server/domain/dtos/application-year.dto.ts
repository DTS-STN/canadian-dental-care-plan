/**
 * Represents a Data Transfer Object (DTO) for an application year result.
 */
export type ApplicationYearResultDto = Readonly<{
  applicationYear: string;
  applicationYearId: string;
  taxYear: string;
  intakeStartDate: string;
  intakeEndDate?: string;
  nextApplicationYearId?: string;
  renewalStartDate?: string;
  renewalEndDate?: string;
  coverageStartDate: string;
  coverageEndDate: string;
}>;

/**
 * Represents a Data Transfer Object (DTO) for a renewal application year result.
 */
export type RenewalApplicationYearResultDto = Readonly<{
  renewalYearId?: string;
  taxYear: string;
  coverageStartDate: string;
}>;

/**
 * Represents a Data Transfer Object (DTO) for an intake application year result.
 */
export type IntakeApplicationYearResultDto = Readonly<{
  intakeYearId: string;
  taxYear: string;
}>;
