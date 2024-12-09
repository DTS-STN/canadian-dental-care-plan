import type { ApplicantInformationDto, BenefitApplicationDto, ChildDto } from '~/.server/domain/dtos/benefit-application.dto';

export type AdultChildBenefitRenewalDto = BenefitRenewalDto &
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

export type ItaBenefitRenewalDto = BenefitRenewalDto &
  Readonly<{
    changeIndicators: ItaChangeIndicators;
  }>;

export type ItaChangeIndicators = Readonly<{
  hasAddressChanged: boolean;
}>;

export type ProtectedBenefitRenewalDto = BenefitRenewalDto;

export type BenefitRenewalDto = Omit<BenefitApplicationDto, 'applicantInformation' | 'children'> &
  Readonly<{
    children: RenewalChildDto[];
    applicantInformation: RenewalApplicantInformationDto;
  }>;

export type RenewalApplicantInformationDto = ApplicantInformationDto &
  Readonly<{
    clientNumber: string;
  }>;

export type RenewalChildDto = ChildDto &
  Readonly<{
    clientNumber: string;
  }>;
