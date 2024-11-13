import type { ReadonlyDeep } from 'type-fest';

export type BenefitApplicationDto = ReadonlyDeep<{
  applicantInformation: ApplicantInformationDto;
  children: ChildDto[];
  communicationPreferences: CommunicationPreferencesDto;
  contactInformation: ContactInformationDto;
  dateOfBirth: string;
  dentalBenefits?: DentalBenefitsDto;
  dentalInsurance?: boolean;
  disabilityTaxCredit?: boolean;
  livingIndependently?: boolean;
  partnerInformation?: PartnerInformationDto;
  typeOfApplication: TypeOfApplicationDto;

  /** A unique identifier for the user making the request - used for auditing */
  userId: string;
}>;

export type ApplicantInformationDto = ReadonlyDeep<{
  firstName: string;
  lastName: string;
  maritalStatus: string;
  socialInsuranceNumber: string;
}>;

export type ChildDto = ReadonlyDeep<{
  dentalBenefits: DentalBenefitsDto;
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
  preferredLanguage: string;
  preferredMethod: string;
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

export type DentalBenefitsDto = ReadonlyDeep<{
  hasFederalBenefits: boolean;
  federalSocialProgram?: string;
  hasProvincialTerritorialBenefits: boolean;
  provincialTerritorialSocialProgram?: string;
}>;

export type PartnerInformationDto = ReadonlyDeep<{
  confirm: boolean;
  dateOfBirth: string;
  firstName: string;
  lastName: string;
  socialInsuranceNumber: string;
}>;

export type TypeOfApplicationDto = 'adult' | 'adult-child' | 'child';
