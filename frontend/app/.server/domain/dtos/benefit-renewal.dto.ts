import type { ApplicantInformationDto, BenefitApplicationDto, ChildDto } from '~/.server/domain/dtos/benefit-application.dto';

export type AdultBenefitRenewalDto = BenefitRenewalDto &
  Readonly<{
    changeIndicators: AdultChangeIndicators;
  }>;

export type AdultChangeIndicators = Readonly<{
  hasAddressChanged: boolean;
  hasEmailChanged: boolean;
  hasMaritalStatusChanged: boolean;
  hasPhoneChanged: boolean;
}>;

export type AdultChildBenefitRenewalDto = BenefitRenewalDto &
  Readonly<{
    changeIndicators: AdultChildChangeIndicators;
  }>;

export type AdultChildChangeIndicators = Readonly<{
  hasAddressChanged: boolean;
  hasEmailChanged: boolean;
  hasMaritalStatusChanged: boolean;
  hasPhoneChanged: boolean;
}>;

export type ItaBenefitRenewalDto = BenefitRenewalDto &
  Readonly<{
    changeIndicators: ItaChangeIndicators;
  }>;

export type ItaChangeIndicators = Readonly<{
  hasAddressChanged: boolean;
}>;

export type ChildBenefitRenewalDto = BenefitRenewalDto &
  Readonly<{
    changeIndicators: ChildChangeIndicators;
  }>;

export type ChildChangeIndicators = Readonly<{
  hasAddressChanged: boolean;
  hasEmailChanged: boolean;
  hasMaritalStatusChanged: boolean;
  hasPhoneChanged: boolean;
}>;

export type ProtectedBenefitRenewalDto = BenefitRenewalDto;

export type BenefitRenewalDto = Omit<BenefitApplicationDto, 'applicantInformation' | 'children' | 'partnerInformation'> &
  Readonly<{
    applicantInformation: RenewalApplicantInformationDto;
    applicationYearId: string;
    children: RenewalChildDto[];
    demographicSurvey?: DemographicSurveyDto;
    partnerInformation?: RenewalPartnerInformationDto;
  }>;

export type RenewalApplicantInformationDto = ApplicantInformationDto &
  Readonly<{
    clientId: string;
    clientNumber: string;
  }>;

export type RenewalChildDto = ChildDto &
  Readonly<{
    clientId: string;
    clientNumber: string;
    demographicSurvey?: DemographicSurveyDto;
  }>;

export type RenewalPartnerInformationDto = Readonly<{
  confirm: boolean;
  yearOfBirth: string;
  socialInsuranceNumber: string;
}>;

export type DemographicSurveyDto = Readonly<{
  indigenousStatus?: string;
  firstNations?: string;
  disabilityStatus?: string;
  ethnicGroups?: string[];
  anotherEthnicGroup?: string;
  locationBornStatus?: string;
  genderStatus?: string;
}>;
