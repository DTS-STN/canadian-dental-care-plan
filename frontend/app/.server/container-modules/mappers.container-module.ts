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
  DefaultFederalGovernmentInsurancePlanDtoMapper,
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
    options.bind(TYPES.domain.mappers.AddressValidationDtoMapper).to(DefaultAddressValidationDtoMapper);
    options.bind(TYPES.domain.mappers.ApplicantDtoMapper).to(DefaultApplicantDtoMapper);
    options.bind(TYPES.domain.mappers.ApplicationStatusDtoMapper).to(DefaultApplicationStatusDtoMapper);
    options.bind(TYPES.domain.mappers.ApplicationYearDtoMapper).to(DefaultApplicationYearDtoMapper);
    options.bind(TYPES.domain.mappers.BenefitApplicationDtoMapper).to(DefaultBenefitApplicationDtoMapper);
    options.bind(TYPES.domain.mappers.BenefitRenewalDtoMapper).to(DefaultBenefitRenewalDtoMapper);
    options.bind(TYPES.domain.mappers.ClientApplicationDtoMapper).to(DefaultClientApplicationDtoMapper);
    options.bind(TYPES.domain.mappers.ClientFriendlyStatusDtoMapper).to(DefaultClientFriendlyStatusDtoMapper);
    options.bind(TYPES.domain.mappers.CountryDtoMapper).to(DefaultCountryDtoMapper);
    options.bind(TYPES.domain.mappers.DemographicSurveyDtoMapper).to(DefaultDemographicSurveyDtoMapper);
    options.bind(TYPES.domain.mappers.FederalGovernmentInsurancePlanDtoMapper).to(DefaultFederalGovernmentInsurancePlanDtoMapper);
    options.bind(TYPES.domain.mappers.LetterDtoMapper).to(DefaultLetterDtoMapper);
    options.bind(TYPES.domain.mappers.LetterTypeDtoMapper).to(DefaultLetterTypeDtoMapper);
    options.bind(TYPES.domain.mappers.ProvinceTerritoryStateDtoMapper).to(DefaultProvinceTerritoryStateDtoMapper);
    options.bind(TYPES.domain.mappers.ProvincialGovernmentInsurancePlanDtoMapper).to(DefaultProvincialGovernmentInsurancePlanDtoMapper);
    options.bind(TYPES.domain.mappers.VerificationCodeDtoMapper).to(DefaultVerificationCodeDtoMapper);
    options.bind(TYPES.routes.mappers.BenefitRenewalStateMapper).to(DefaultBenefitRenewalStateMapper);
    options.bind(TYPES.routes.mappers.BenefitApplicationStateMapper).to(DefaultBenefitApplicationStateMapper);
    options.bind(TYPES.web.mappers.DynatraceDtoMapper).to(DefaultDynatraceDtoMapper);
    options.bind(TYPES.web.mappers.HCaptchaDtoMapper).to(DefaultHCaptchaDtoMapper);
  });
}
