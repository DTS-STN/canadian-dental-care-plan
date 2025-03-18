import type { ReadonlyDeep } from 'type-fest';

export type BenefitApplicationDto = ReadonlyDeep<{
  applicantInformation: ApplicantInformationDto;
  applicationYearId: string;
  children: ChildDto[];
  communicationPreferences: CommunicationPreferencesDto;
  contactInformation: ContactInformationDto;
  dateOfBirth: string;
  dentalBenefits: string[];
  dentalInsurance?: boolean;
  livingIndependently?: boolean;
  partnerInformation?: PartnerInformationDto;
  termsAndConditions: TermsAndConditionsDto;
  typeOfApplication: TypeOfApplicationDto;

  /** A unique identifier for the user making the request - used for auditing */
  userId: string;
}>;

export type ApplicantInformationDto = ReadonlyDeep<{
  clientNumber?: string;
  firstName: string;
  lastName: string;
  maritalStatus: string;
  socialInsuranceNumber: string;
}>;

export type ChildDto = ReadonlyDeep<{
  dentalBenefits: string[];
  dentalInsurance: boolean;
  information: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    isParent: boolean;
    socialInsuranceNumber?: string;
  };
}>;

export type CommunicationPreferencesDto = ReadonlyDeep<{
  email?: string;
  emailVerified?: boolean;
  preferredLanguage: string;
  preferredMethod: string;
  preferredMethodGovernmentOfCanada?: string;
}>;

export type ContactInformationDto = ReadonlyDeep<{
  copyMailingAddress: boolean;
  homeAddress: string;
  homeApartment?: string;
  homeCity: string;
  homeCountry: string;
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

export type TermsAndConditionsDto = ReadonlyDeep<{
  acknowledgeTerms: boolean;
  acknowledgePrivacy: boolean;
  shareData: boolean;
}>;

export type PartnerInformationDto = ReadonlyDeep<{
  confirm: boolean;
  yearOfBirth: string;
  socialInsuranceNumber: string;
}>;

export type TypeOfApplicationDto = 'adult' | 'adult-child' | 'child';
