/**
 * Represents a Data Transfer Object (DTO) for an application year request.
 */
export type ApplicationYearRequestDto = Readonly<{
  /** The current date sent to get the application year(s). */
  date: string;

  /** A unique identifier for the user making the request - used for auditing */
  userId: string;
}>;

/**
 * Represents a Data Transfer Object (DTO) for an application year result.
 */
export type ApplicationYearResultDto = Readonly<{
  taxYear?: string;
  applicationYearId?: string;
}>;
