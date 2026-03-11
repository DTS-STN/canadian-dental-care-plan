import type { ClientApplicationDto } from '~/.server/domain/dtos/client-application.dto';

/**
 * Represents the result of a client application renewal eligibility check when the application is not found in the
 * system. This indicates that there is no existing application for the client
 */
type ClientApplicationRenewalNotFoundResult = {
  result: 'INELIGIBLE-CLIENT-APPLICATION-NOT-FOUND';
  clientApplication?: undefined;
};

/**
 * Represents the result of a client application renewal eligibility check when the application is found but has no
 * associated client numbers, which makes it ineligible for renewal.
 */
type ClientApplicationRenewalIneligibleNoClientNumbersResult = {
  result: 'INELIGIBLE-NO-CLIENT-NUMBERS';
  clientApplication: ClientApplicationDto;
};

/**
 * Represents the result of a client application renewal eligibility check when the application is found but has no
 * associated eligibilities, which makes it ineligible for renewal.
 */
type ClientApplicationRenewalIneligibleNoEligibilitiesResult = {
  result: 'INELIGIBLE-NO-ELIGIBILITIES';
  clientApplication: ClientApplicationDto;
};

/**
 * Represents the result of a client application renewal eligibility check when the application is found but the client
 * is not enrolled or not eligible in the program, which makes it ineligible for renewal.
 */
type ClientApplicationRenewalIneligibleNotEnrolledResult = {
  result: 'INELIGIBLE-NOT-ENROLLED';
  clientApplication: ClientApplicationDto;
};

/**
 * Represents the result of a client application renewal eligibility check when the application is found and the client
 * is enrolled and eligible in the program, which makes it eligible for renewal. This includes the details of the
 * client application and the set of eligible client numbers that can be included in the renewal application.
 */
type ClientApplicationRenewalEligibleResult = {
  result: 'ELIGIBLE';
  clientApplication: ClientApplicationRenewalEligibleDto;
};

/**
 * Represents the details of a client application that is eligible for renewal, including the set of eligible client
 * numbers that can be included in the renewal application.
 */
export type ClientApplicationRenewalEligibleDto = ClientApplicationDto & {
  /**
   * An array of client numbers that are eligible for renewal. This is a subset of the client numbers associated with
   * the application, and is used to determine which client numbers should be included in the renewal application.
   */
  eligibleClientNumbers: ReadonlyArray<string>;
  inputModel: 'full' | 'simplified';
};

export type ClientApplicationRenewalEligibilityDto =
  | ClientApplicationRenewalNotFoundResult //
  | ClientApplicationRenewalIneligibleNoClientNumbersResult
  | ClientApplicationRenewalIneligibleNoEligibilitiesResult
  | ClientApplicationRenewalIneligibleNotEnrolledResult
  | ClientApplicationRenewalEligibleResult;

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
