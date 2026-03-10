import type { ClientApplicationDto } from '~/.server/domain/dtos/client-application.dto';

export type ClientApplicationRenewalEligibilityDto = ClientApplicationDto;

export type ClientApplicationRenewalEligibilityBasicInfoRequestDto = Readonly<{
  clientNumber: string;
  dateOfBirth: string;
  firstName: string;
  lastName: string;
  applicationYearId: string;

  /** A unique identifier for the user making the request - used for auditing */
  userId: string;
}>;

export type ClientApplicationRenewalEligibilityBasicInfoAndSinRequestDto = Readonly<{
  clientNumber: string;
  dateOfBirth: string;
  firstName: string;
  lastName: string;
  applicationYearId: string;
  sin: string;

  /** A unique identifier for the user making the request - used for auditing */
  userId: string;
}>;

export type ClientApplicationRenewalEligibilitySinRequestDto = Readonly<{
  sin: string;
  applicationYearId: string;

  /** A unique identifier for the user making the request - used for auditing */
  userId: string;
}>;
