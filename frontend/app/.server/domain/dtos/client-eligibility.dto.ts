import type { ReadonlyDeep } from 'type-fest';

export type ClientEligibilityDto = ReadonlyDeep<{
  clientId: string;
  clientNumber: string;
  earnings: ReadonlyArray<{
    /** Indicates if client has co-pay tier coverage for the earning taxation year */
    hasCopayTierCoverage: boolean;
    /** Indicates if client is eligible for the earning taxation year */
    isEligible: boolean;
    /** Earnings status code */
    statusCode: string;
    /** Earning taxation year */
    taxationYear: number;
  }>;
  firstName: string;
  lastName: string;
  /** Applicant profile current eligibility status code */
  eligibilityStatusCode?: string;
  /** Applicant profile next year eligibility status code */
  eligibilityStatusCodeNextYear?: string;
  /** Applicant profile enrollment status code */
  enrollmentStatusCode?: string;
}>;

export type ClientEligibilityRequestDto = ReadonlyDeep<
  Array<{
    clientNumber: string;
  }>
>;
