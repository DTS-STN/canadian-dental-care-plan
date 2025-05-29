import type { ReadonlyDeep } from 'type-fest';

export type AdultBenefitRenewalDto = BenefitRenewalDto &
  ReadonlyDeep<{
    changeIndicators: AdultChangeIndicators;
  }>;

export type AdultChangeIndicators = ReadonlyDeep<{
  hasAddressChanged: boolean;
  hasMaritalStatusChanged: boolean;
  hasPhoneChanged: boolean;
}>;

export type AdultChildBenefitRenewalDto = BenefitRenewalDto &
  ReadonlyDeep<{
    changeIndicators: AdultChildChangeIndicators;
  }>;

export type AdultChildChangeIndicators = ReadonlyDeep<{
  hasAddressChanged: boolean;
  hasMaritalStatusChanged: boolean;
  hasPhoneChanged: boolean;
}>;

export type ItaBenefitRenewalDto = BenefitRenewalDto &
  ReadonlyDeep<{
    changeIndicators: ItaChangeIndicators;
  }>;

export type ItaChangeIndicators = ReadonlyDeep<{
  hasAddressChanged: boolean;
}>;

export type ChildBenefitRenewalDto = BenefitRenewalDto &
  ReadonlyDeep<{
    changeIndicators: ChildChangeIndicators;
  }>;

export type ChildChangeIndicators = ReadonlyDeep<{
  hasAddressChanged: boolean;
  hasMaritalStatusChanged: boolean;
  hasPhoneChanged: boolean;
}>;

export type ProtectedBenefitRenewalDto = BenefitRenewalDto;

export type BenefitRenewalDto = ReadonlyDeep<{
  applicantInformation: RenewalApplicantInformationDto;
  applicationYearId: string;
  children: RenewalChildDto[];
  communicationPreferences: RenewalCommunicationPreferencesDto;
  contactInformation: RenewalContactInformationDto;
  dateOfBirth: string;
  dentalBenefits: string[];
  dentalInsurance?: boolean;
  demographicSurvey?: DemographicSurveyDto;
  partnerInformation?: RenewalPartnerInformationDto;
  typeOfApplication: RenewalTypeOfApplicationDto;

  /** A unique identifier for the user making the request - used for auditing */
  userId: string;
}>;

export type RenewalApplicantInformationDto = ReadonlyDeep<{
  clientId: string;
  clientNumber: string;
  firstName: string;
  lastName: string;
  maritalStatus: string;
  socialInsuranceNumber: string;
}>;

export type RenewalChildDto = ReadonlyDeep<{
  clientId: string;
  clientNumber: string;
  dentalBenefits: string[];
  dentalInsurance: boolean;
  demographicSurvey?: DemographicSurveyDto;
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

export type DemographicSurveyDto = ReadonlyDeep<{
  indigenousStatus?: string;
  firstNations?: string;
  disabilityStatus?: string;
  ethnicGroups?: string[];
  anotherEthnicGroup?: string;
  locationBornStatus?: string;
  genderStatus?: string;
}>;
