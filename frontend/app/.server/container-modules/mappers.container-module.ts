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
  DefaultMaritalStatusDtoMapper,
  DefaultPreferredCommunicationMethodDtoMapper,
  DefaultPreferredLanguageDtoMapper,
  DefaultProvinceTerritoryStateDtoMapper,
  DefaultProvincialGovernmentInsurancePlanDtoMapper,
} from '~/.server/domain/mappers';
import { DefaultBenefitApplicationStateMapper, DefaultBenefitRenewalStateMapper } from '~/.server/routes/mappers';
import { DefaultDynatraceDtoMapper, DefaultHCaptchaDtoMapper } from '~/.server/web/mappers';

/**
 * Container module for mappers.
 */
export const mappersContainerModule = new ContainerModule((bind) => {
  bind(TYPES.domain.mappers.AddressValidationDtoMapper).to(DefaultAddressValidationDtoMapper);
  bind(TYPES.domain.mappers.ApplicantDtoMapper).to(DefaultApplicantDtoMapper);
  bind(TYPES.domain.mappers.ApplicationStatusDtoMapper).to(DefaultApplicationStatusDtoMapper);
  bind(TYPES.domain.mappers.ApplicationYearDtoMapper).to(DefaultApplicationYearDtoMapper);
  bind(TYPES.domain.mappers.BenefitApplicationDtoMapper).to(DefaultBenefitApplicationDtoMapper);
  bind(TYPES.domain.mappers.BenefitRenewalDtoMapper).to(DefaultBenefitRenewalDtoMapper);
  bind(TYPES.domain.mappers.ClientApplicationDtoMapper).to(DefaultClientApplicationDtoMapper);
  bind(TYPES.domain.mappers.ClientFriendlyStatusDtoMapper).to(DefaultClientFriendlyStatusDtoMapper);
  bind(TYPES.domain.mappers.CountryDtoMapper).to(DefaultCountryDtoMapper);
  bind(TYPES.domain.mappers.DemographicSurveyDtoMapper).to(DefaultDemographicSurveyDtoMapper);
  bind(TYPES.domain.mappers.FederalGovernmentInsurancePlanDtoMapper).to(DefaultFederalGovernmentInsurancePlanDtoMapper);
  bind(TYPES.domain.mappers.LetterDtoMapper).to(DefaultLetterDtoMapper);
  bind(TYPES.domain.mappers.LetterTypeDtoMapper).to(DefaultLetterTypeDtoMapper);
  bind(TYPES.domain.mappers.MaritalStatusDtoMapper).to(DefaultMaritalStatusDtoMapper);
  bind(TYPES.domain.mappers.PreferredCommunicationMethodDtoMapper).to(DefaultPreferredCommunicationMethodDtoMapper);
  bind(TYPES.domain.mappers.PreferredLanguageDtoMapper).to(DefaultPreferredLanguageDtoMapper);
  bind(TYPES.domain.mappers.ProvinceTerritoryStateDtoMapper).to(DefaultProvinceTerritoryStateDtoMapper);
  bind(TYPES.domain.mappers.ProvincialGovernmentInsurancePlanDtoMapper).to(DefaultProvincialGovernmentInsurancePlanDtoMapper);
  bind(TYPES.routes.mappers.BenefitRenewalStateMapper).to(DefaultBenefitRenewalStateMapper);
  bind(TYPES.routes.mappers.BenefitApplicationStateMapper).to(DefaultBenefitApplicationStateMapper);
  bind(TYPES.web.mappers.DynatraceDtoMapper).to(DefaultDynatraceDtoMapper);
  bind(TYPES.web.mappers.HCaptchaDtoMapper).to(DefaultHCaptchaDtoMapper);
});
