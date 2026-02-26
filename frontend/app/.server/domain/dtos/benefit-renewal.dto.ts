import type { ReadonlyDeep } from 'type-fest';

export type AdultBenefitRenewalDto = BenefitRenewalDto;

export type AdultChildBenefitRenewalDto = BenefitRenewalDto;

export type ItaBenefitRenewalDto = BenefitRenewalDto;

export type ChildBenefitRenewalDto = BenefitRenewalDto;

export type ProtectedBenefitRenewalDto = BenefitRenewalDto;

export type BenefitRenewalDto = ReadonlyDeep<{
  applicantInformation: RenewalApplicantInformationDto;
  applicationYearId: string;
  children: RenewalChildDto[];
  communicationPreferences: RenewalCommunicationPreferencesDto;
  contactInformation: RenewalContactInformationDto;
  dateOfBirth: string;
  dentalBenefits: string[];
  dentalInsurance?: DentalInsuranceDto;
  partnerInformation?: RenewalPartnerInformationDto;
  typeOfApplication: RenewalTypeOfApplicationDto;
  termsAndConditions: TermsAndConditionsDto;
  changeIndicators?: ChangeIndicatorsDto;

  /** A unique identifier for the user making the request - used for auditing */
  userId: string;
}>;

export type RenewalApplicantInformationDto = ReadonlyDeep<{
  clientId: string;
  clientNumber: string;
  firstName: string;
  lastName: string;
  maritalStatus?: string;
  socialInsuranceNumber: string;
}>;

export type RenewalChildDto = ReadonlyDeep<{
  clientId: string;
  clientNumber: string;
  dentalBenefits: string[];
  dentalInsurance: DentalInsuranceDto;
  information: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    isParent: boolean;
    socialInsuranceNumber?: string;
  };
}>;

export type RenewalCommunicationPreferencesDto = ReadonlyDeep<{
  email?: string;
  emailVerified?: boolean;
  preferredLanguage: string;
  preferredMethod: string;
  preferredMethodGovernmentOfCanada: string;
}>;

export type RenewalContactInformationDto = ReadonlyDeep<{
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

export type RenewalPartnerInformationDto = ReadonlyDeep<{
  confirm: boolean;
  yearOfBirth: string;
  socialInsuranceNumber: string;
}>;

export type RenewalTypeOfApplicationDto = 'adult' | 'adult-child' | 'child';

type DentalInsuranceDto = ReadonlyDeep<{
  hasDentalInsurance: boolean;
  dentalInsuranceEligibilityConfirmation?: boolean;
}>;

type TermsAndConditionsDto = ReadonlyDeep<{
  acknowledgeTerms: boolean;
  acknowledgePrivacy: boolean;
  shareData: boolean;
}>;

export type ChangeIndicatorsDto = ReadonlyDeep<{
  hasAddressChanged?: boolean;
  hasMaritalStatusChanged?: boolean;
  hasPhoneChanged?: boolean;
  hasEmailChanged?: boolean;
}>;
