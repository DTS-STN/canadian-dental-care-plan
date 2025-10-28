import type { ReadonlyDeep } from 'type-fest';

export type ClientApplicationDto = ReadonlyDeep<{
  applicantInformation: ClientApplicantInformationDto;
  children: ClientChildDto[];
  communicationPreferences: ClientCommunicationPreferencesDto;
  contactInformation: ClientContactInformationDto;
  dateOfBirth: string;
  dentalBenefits: string[];
  dentalInsurance?: boolean;
  hasFiledTaxes: boolean;
  isInvitationToApplyClient: boolean;
  livingIndependently?: boolean;
  partnerInformation?: ClientPartnerInformationDto;
  typeOfApplication: string;
}>;

export type ClientApplicantInformationDto = Readonly<{
  firstName: string;
  lastName: string;
  maritalStatus?: string; // optional because ITA clients initially have no marital status
  socialInsuranceNumber: string;
  clientId: string;
  clientNumber?: string;
}>;

export type ClientChildDto = ReadonlyDeep<{
  dentalBenefits: string[];
  dentalInsurance: boolean;
  information: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    isParent: boolean;
    clientId: string;
    clientNumber?: string;
    socialInsuranceNumber: string;
  };
}>;

export type ClientCommunicationPreferencesDto = ReadonlyDeep<{
  email?: string;
  preferredLanguage: string;
  preferredMethodSunLife: string;
  preferredMethodGovernmentOfCanada: string;
}>;

export type ClientContactInformationDto = ReadonlyDeep<{
  copyMailingAddress: boolean;
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
}>;

export type ClientPartnerInformationDto = ReadonlyDeep<{
  confirm: boolean;
  yearOfBirth: string;
  firstName: string;
  lastName: string;
  socialInsuranceNumber: string;
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

export type ClientApplicationSinRequestDto = Readonly<{
  sin: string;
  applicationYearId?: string;

  /** A unique identifier for the user making the request - used for auditing */
  userId: string;
}>;
