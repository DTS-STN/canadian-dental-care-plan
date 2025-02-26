/**
 * Represents a Data Transfer Object (DTO) for an email notification request.
 */
export type EmailNotificationRequestDto = Readonly<{
  /** The recipient's email address */
  email: string;

  /** The verification code sent to the recipient */
  verificationCode: string;

  /** The recipient's preferred language for communication */
  preferredLanguage: 'en' | 'fr';

  /** A unique identifier for the applicant - used for auditing */
  userId: string;
}>;
