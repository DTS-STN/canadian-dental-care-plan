import type { ReadonlyDeep } from 'type-fest';

export type ClientApplicationDto = ReadonlyDeep<{
  /**
   * The year ID of the application, which corresponds to the benefit application year in the database. This is used to
   * determine which year's rules and eligibility criteria to apply when processing the application.
   */
  applicationYearId: string;
  applicantInformation: ClientApplicantInformationDto;
  children: Array<ClientChildDto>;
  communicationPreferences: ClientCommunicationPreferencesDto;
  contactInformation: ClientContactInformationDto;
  /** Valid co-pay tier (1, 2 or 3) code for the earning taxation year */
  coverageCopayTierCode?: string;
  dateOfBirth: string;
  dentalBenefits?: Array<string>;
  dentalInsurance?: boolean;
  /**
   * Applicant profile eligibility status code
   */
  eligibilityStatusCode?: string;
  livingIndependently?: boolean;
  partnerInformation?: ClientPartnerInformationDto;
  t4DentalIndicator?: boolean;
  typeOfApplication: 'adult' | 'children' | 'family';
}>;

export type ClientApplicantInformationDto = Readonly<{
  firstName: string;
  lastName: string;
  maritalStatus?: string; // optional because ITA clients initially have no marital status
  socialInsuranceNumber: string;
  clientId: string;
  clientNumber: string;
}>;

export type ClientChildDto = ReadonlyDeep<{
  dentalBenefits: Array<string>;
  dentalInsurance: boolean;
  information: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    isParent: boolean;
    clientId: string;
    clientNumber: string;
    socialInsuranceNumber?: string;
  };
  t4DentalIndicator?: boolean;
}>;

export type ClientCommunicationPreferencesDto = ReadonlyDeep<{
  preferredLanguage?: string;
  preferredMethodSunLife?: string;
  preferredMethodGovernmentOfCanada?: string;
}>;

export type ClientContactInformationDto = ReadonlyDeep<{
  copyMailingAddress?: boolean;
  // home address fields are optional because ITA clients initially have no home address
  homeAddress?: string;
  homeApartment?: string;
  homeCity?: string;
  homeCountry?: string;
  homePostalCode?: string;
  homeProvince?: string;
  mailingAddress: string;
  mailingApartment?: string;
  mailingCity: string;
  mailingCountry: string;
  mailingPostalCode?: string;
  mailingProvince?: string;
  phoneNumber?: string;
  phoneNumberAlt?: string;
  email?: string;
  emailVerified?: boolean;
}>;

export type ClientPartnerInformationDto = ReadonlyDeep<{
  confirm: boolean;
  yearOfBirth: string;
  firstName: string;
  lastName: string;
  socialInsuranceNumber?: string;
}>;

export type ClientApplicationBasicInfoRequestDto = Readonly<{
  clientNumber: string;
  dateOfBirth: string;
  firstName: string;
  lastName: string;
  applicationYearId?: string;

  /** A unique identifier for the user making the request - used for auditing */
  userId: string;
}>;

export type ClientApplicationBasicInfoAndSinRequestDto = Readonly<{
  clientNumber: string;
  dateOfBirth: string;
  firstName: string;
  lastName: string;
  applicationYearId?: string;
  sin: string;

  /** A unique identifier for the user making the request - used for auditing */
  userId: string;
}>;

export type ClientApplicationSinRequestDto = Readonly<{
  sin: string;
  applicationYearId?: string;

  /** A unique identifier for the user making the request - used for auditing */
  userId: string;
}>;
