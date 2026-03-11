import type { ClientApplicationDto } from '~/.server/domain/dtos/client-application.dto';

export type ClientApplicationRenewalEligibilityDto =
  | {
      result: 'CLIENT-APPLICATION-NOT-FOUND';
      clientApplication?: undefined;
      eligibleClientNumbers?: undefined;
      inputModel?: undefined;
    }
  | {
      result: 'INELIGIBLE-NO-CLIENT-NUMBERS';
      clientApplication: ClientApplicationDto;
      eligibleClientNumbers?: undefined;
      inputModel?: undefined;
    }
  | {
      result: 'INELIGIBLE-NO-ELIGIBILITIES';
      clientApplication: ClientApplicationDto;
      eligibleClientNumbers?: undefined;
      inputModel?: undefined;
    }
  | {
      result: 'INELIGIBLE-NOT-ENROLLED';
      clientApplication: ClientApplicationDto;
      eligibleClientNumbers?: undefined;
      inputModel?: undefined;
    }
  | {
      result: 'ELIGIBLE';
      clientApplication: ClientApplicationDto;
      eligibleClientNumbers: ReadonlySet<string>;
      inputModel: 'full' | 'simplified';
    };

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
