/**
 * Represents a Data Transfer Object (DTO) for finding an applicant by SIN.
 */
export type FindApplicantBySinRequestDto = Readonly<{
  /** The SIN of the applicant. */
  sin: string;

  /** A unique identifier for the applicant - used for auditing */
  userId: string;
}>;

/**
 * Represents a Data Transfer Object (DTO) for an applicant.
 */
export type ApplicantDto = Readonly<{
  /** The client ID of the applicant. */
  clientId: string;
  /** The client number of the applicant. */
  clientNumber: string;
  /** The date of birth of the applicant. */
  dateOfBirth: string;
  /** The first name of the applicant. */
  firstName: string;
  /** The last name of the applicant. */
  lastName: string;
  /** The social insurance number of the applicant. */
  socialInsuranceNumber: string;
}>;
