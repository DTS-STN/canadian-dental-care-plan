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
