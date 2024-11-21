import type { BenefitApplicationDto } from './benefit-application.dto';

export type AdultChildBenefitRenewalDto = BenefitApplicationDto &
  Readonly<{
    changeIndicators: AdultChildChangeIndicators;
  }>;

export type AdultChildChangeIndicators = Readonly<{
  hasAddressChanged: boolean;
  hasEmailChanged: boolean;
  hasMaritalStatusChanged: boolean;
  hasPhoneChanged: boolean;
  hasFederalBenefitsChanged: boolean;
  hasProvincialTerritorialBenefitsChanged: boolean;
}>;

export type ItaBenefitRenewalDto = BenefitApplicationDto &
  Readonly<{
    changeIndicators: ItaChangeIndicators;
  }>;

export type ItaChangeIndicators = Readonly<{
  hasAddressChanged: boolean;
}>;

// TODO remove this when mapping to BenefitRenewalDto is complete
export type BenefitRenewalRequestDto = Readonly<{
  applicantInformation: Readonly<{
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    clientNumber: string;
  }>;
  partnerInformation?: Readonly<{
    confirm: boolean;
    yearOfBirth: string;
    socialInsuranceNumber: string;
  }>;
  maritalStatus?: string;
  contactInformation?: Readonly<{
    phoneNumber?: string;
    phoneNumberAlt?: string;
    email?: string;
  }>;
  hasAddressChanged?: boolean;
  addressInformation?: Readonly<{
    copyMailingAddress: boolean;
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
  }>;
  dentalInsurance: boolean;
  dentalBenefits?: Readonly<{
    hasFederalBenefits: boolean;
    federalSocialProgram?: string;
    hasProvincialTerritorialBenefits: boolean;
    provincialTerritorialSocialProgram?: string;
    province?: string;
  }>;
  typeOfRenewal: 'adult-child' | 'child' | 'delegate';
  communicationPreference?: Readonly<{
    email?: string;
    preferredMethod?: string;
  }>;
}>;

// TODO remove this when mapping to application code is complete
export type BenefitRenewalResponseDto = Readonly<{
  confirmationCode: string;
  submittedOn: string;
}>;
