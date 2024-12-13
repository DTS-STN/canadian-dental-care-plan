/**
 * Represents a Data Transfer Object (DTO) for an application year request.
 */
export type ApplicationYearRequestDto = Readonly<{
  /** The date sent to get the application year(s). */
  date: string;

  /** A unique identifier for the user making the request - used for auditing */
  userId: string;
}>;

/**
 * Represents a Data Transfer Object (DTO) for an application year result.
 */
export type ApplicationYearResultDto = Readonly<{
  id: string;
  applicationYear: string;
  taxYear: string;
  intakeStartDate: string;
  intakeEndDate?: string;
  renewalStartDate?: string;
  renewalEndDate?: string;
  coverageStartDate: string;
  coverageEndDate: string;
}>;
