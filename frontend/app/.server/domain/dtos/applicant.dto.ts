/**
 * Represents a Data Transfer Object (DTO) for an applicant request.
 */
export type ApplicantRequestDto = Readonly<{
  /** The SIN of the applicant. */
  sin: string;

  /** A unique identifier for the applicant - used for auditing */
  userId: string;
}>;
