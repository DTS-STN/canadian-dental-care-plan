import { ContainerModule } from 'inversify';

import { TYPES } from '~/.server/constants';
import {
  DefaultAddressValidationDtoMapper,
  DefaultApplicantDtoMapper,
  DefaultApplicationStatusDtoMapper,
  DefaultApplicationYearDtoMapper,
  DefaultBenefitApplicationDtoMapper,
  DefaultBenefitRenewalDtoMapper,
  DefaultClientApplicationDtoMapper,
  DefaultClientFriendlyStatusDtoMapper,
  DefaultCountryDtoMapper,
  DefaultDemographicSurveyDtoMapper,
  DefaultEvidentiaryDocumentTypeDtoMapper,
  DefaultFederalGovernmentInsurancePlanDtoMapper,
  DefaultLanguageDtoMapper,
  DefaultLetterDtoMapper,
  DefaultLetterTypeDtoMapper,
  DefaultProvinceTerritoryStateDtoMapper,
  DefaultProvincialGovernmentInsurancePlanDtoMapper,
  DefaultVerificationCodeDtoMapper,
} from '~/.server/domain/mappers';
import { DefaultBenefitApplicationStateMapper, DefaultBenefitRenewalStateMapper } from '~/.server/routes/mappers';
import { DefaultDynatraceDtoMapper, DefaultHCaptchaDtoMapper } from '~/.server/web/mappers';

/**
 * Defines the container module for mapper bindings.
 */
export function createMappersContainerModule(): ContainerModule {
  return new ContainerModule((options) => {
    options.bind(TYPES.AddressValidationDtoMapper).to(DefaultAddressValidationDtoMapper);
    options.bind(TYPES.ApplicantDtoMapper).to(DefaultApplicantDtoMapper);
    options.bind(TYPES.ApplicationStatusDtoMapper).to(DefaultApplicationStatusDtoMapper);
    options.bind(TYPES.ApplicationYearDtoMapper).to(DefaultApplicationYearDtoMapper);
    options.bind(TYPES.BenefitApplicationDtoMapper).to(DefaultBenefitApplicationDtoMapper);
    options.bind(TYPES.BenefitApplicationStateMapper).to(DefaultBenefitApplicationStateMapper);
    options.bind(TYPES.BenefitRenewalDtoMapper).to(DefaultBenefitRenewalDtoMapper);
    options.bind(TYPES.BenefitRenewalStateMapper).to(DefaultBenefitRenewalStateMapper);
    options.bind(TYPES.ClientApplicationDtoMapper).to(DefaultClientApplicationDtoMapper);
    options.bind(TYPES.ClientFriendlyStatusDtoMapper).to(DefaultClientFriendlyStatusDtoMapper);
    options.bind(TYPES.CountryDtoMapper).to(DefaultCountryDtoMapper);
    options.bind(TYPES.DemographicSurveyDtoMapper).to(DefaultDemographicSurveyDtoMapper);
    options.bind(TYPES.DynatraceDtoMapper).to(DefaultDynatraceDtoMapper);
    options.bind(TYPES.EvidentiaryDocumentTypeDtoMapper).to(DefaultEvidentiaryDocumentTypeDtoMapper);
    options.bind(TYPES.FederalGovernmentInsurancePlanDtoMapper).to(DefaultFederalGovernmentInsurancePlanDtoMapper);
    options.bind(TYPES.HCaptchaDtoMapper).to(DefaultHCaptchaDtoMapper);
    options.bind(TYPES.LanguageDtoMapper).to(DefaultLanguageDtoMapper);
    options.bind(TYPES.LetterDtoMapper).to(DefaultLetterDtoMapper);
    options.bind(TYPES.LetterTypeDtoMapper).to(DefaultLetterTypeDtoMapper);
    options.bind(TYPES.ProvinceTerritoryStateDtoMapper).to(DefaultProvinceTerritoryStateDtoMapper);
    options.bind(TYPES.ProvincialGovernmentInsurancePlanDtoMapper).to(DefaultProvincialGovernmentInsurancePlanDtoMapper);
    options.bind(TYPES.VerificationCodeDtoMapper).to(DefaultVerificationCodeDtoMapper);
  });
}
