import type { interfaces } from 'inversify';
import { ContainerModule } from 'inversify';

import { TYPES } from '~/.server/constants';
import {
  DefaultAddressValidationRepository,
  DefaultApplicantRepository,
  DefaultApplicationStatusRepository,
  DefaultApplicationYearRepository,
  DefaultBenefitApplicationRepository,
  DefaultBenefitRenewalRepository,
  DefaultClientApplicationRepository,
  DefaultClientFriendlyStatusRepository,
  DefaultCountryRepository,
  DefaultDemographicSurveyRepository,
  DefaultFederalGovernmentInsurancePlanRepository,
  DefaultLetterRepository,
  DefaultLetterTypeRepository,
  DefaultMaritalStatusRepository,
  DefaultPreferredCommunicationMethodRepository,
  DefaultPreferredLanguageRepository,
  DefaultProvinceTerritoryStateRepository,
  DefaultProvincialGovernmentInsurancePlanRepository,
  DefaultVerificationCodeRepository,
  MockAddressValidationRepository,
  MockApplicantRepository,
  MockApplicationStatusRepository,
  MockApplicationYearRepository,
  MockBenefitApplicationRepository,
  MockBenefitRenewalRepository,
  MockClientApplicationRepository,
  MockLetterRepository,
  MockVerificationCodeRepository,
} from '~/.server/domain/repositories';
import type { MockName } from '~/.server/utils/env.utils';
import { DefaultDynatraceRepository, DefaultHCaptchaRepository } from '~/.server/web/repositories';

/**
 * Determines if a service implementation should be injected based on server configuration.
 * Used for conditional binding of implementations (e.g., enabling/disabling mocks).
 *
 * @param mockName - The name of the mock to check in the server configuration.
 * @param shouldEnable - If `true`, returns `true` if the mock is enabled in the configuration;
 * if `false`, returns `true` if the mock is not enabled.
 * @returns A function that takes an `interfaces.Request` and returns a boolean indicating
 * whether the service implementation should be injected based on the server configuration
 * and the `shouldEnable` parameter.
 *
 * @example
 * // Binds AddressValidationRepository to a mock if the mock is enabled in server config,
 * // otherwise binds to the actual implementation.
 * bind(TYPES.domain.repositories.AddressValidationRepository).to(DefaultAddressValidationRepository).when(isMockEnabled('wsaddress', false));
 * bind(TYPES.domain.repositories.AddressValidationRepository).to(MockAddressValidationRepository).when(isMockEnabled('wsaddress', true));
 */
function isMockEnabled(mockName: MockName, shouldEnable: boolean) {
  return ({ parentContext }: interfaces.Request) => {
    const serverConfig = parentContext.container.get(TYPES.configs.ServerConfig);
    const isMockIncluded = serverConfig.ENABLED_MOCKS.includes(mockName);
    return shouldEnable ? isMockIncluded : !isMockIncluded;
  };
}

/**
 * Container module for repositories.
 */
export const repositoriesContainerModule = new ContainerModule((bind) => {
  bind(TYPES.domain.repositories.AddressValidationRepository).to(DefaultAddressValidationRepository).when(isMockEnabled('wsaddress', false));
  bind(TYPES.domain.repositories.AddressValidationRepository).to(MockAddressValidationRepository).when(isMockEnabled('wsaddress', true));

  bind(TYPES.domain.repositories.ApplicantRepository).to(DefaultApplicantRepository).when(isMockEnabled('power-platform', false));
  bind(TYPES.domain.repositories.ApplicantRepository).to(MockApplicantRepository).when(isMockEnabled('power-platform', true));

  bind(TYPES.domain.repositories.ApplicationStatusRepository).to(DefaultApplicationStatusRepository).when(isMockEnabled('status-check', false));
  bind(TYPES.domain.repositories.ApplicationStatusRepository).to(MockApplicationStatusRepository).when(isMockEnabled('status-check', true));

  bind(TYPES.domain.repositories.ApplicationYearRepository).to(DefaultApplicationYearRepository).when(isMockEnabled('power-platform', false));
  bind(TYPES.domain.repositories.ApplicationYearRepository).to(MockApplicationYearRepository).when(isMockEnabled('power-platform', true));

  bind(TYPES.domain.repositories.BenefitApplicationRepository).to(DefaultBenefitApplicationRepository).when(isMockEnabled('power-platform', false));
  bind(TYPES.domain.repositories.BenefitApplicationRepository).to(MockBenefitApplicationRepository).when(isMockEnabled('power-platform', true));

  bind(TYPES.domain.repositories.BenefitRenewalRepository).to(DefaultBenefitRenewalRepository).when(isMockEnabled('power-platform', false));
  bind(TYPES.domain.repositories.BenefitRenewalRepository).to(MockBenefitRenewalRepository).when(isMockEnabled('power-platform', true));

  bind(TYPES.domain.repositories.ClientApplicationRepository).to(DefaultClientApplicationRepository).when(isMockEnabled('power-platform', false));
  bind(TYPES.domain.repositories.ClientApplicationRepository).to(MockClientApplicationRepository).when(isMockEnabled('power-platform', true));

  bind(TYPES.domain.repositories.ClientFriendlyStatusRepository).to(DefaultClientFriendlyStatusRepository);
  bind(TYPES.domain.repositories.CountryRepository).to(DefaultCountryRepository);
  bind(TYPES.domain.repositories.DemographicSurveyRepository).to(DefaultDemographicSurveyRepository);
  bind(TYPES.domain.repositories.FederalGovernmentInsurancePlanRepository).to(DefaultFederalGovernmentInsurancePlanRepository);

  bind(TYPES.domain.repositories.LetterRepository).to(DefaultLetterRepository).when(isMockEnabled('cct', false));
  bind(TYPES.domain.repositories.LetterRepository).to(MockLetterRepository).when(isMockEnabled('cct', true));

  bind(TYPES.domain.repositories.LetterTypeRepository).to(DefaultLetterTypeRepository);
  bind(TYPES.domain.repositories.MaritalStatusRepository).to(DefaultMaritalStatusRepository);

  bind(TYPES.domain.repositories.VerificationCodeRepository).to(DefaultVerificationCodeRepository).when(isMockEnabled('gc-notify', false));
  bind(TYPES.domain.repositories.VerificationCodeRepository).to(MockVerificationCodeRepository).when(isMockEnabled('gc-notify', true));

  bind(TYPES.domain.repositories.PreferredCommunicationMethodRepository).to(DefaultPreferredCommunicationMethodRepository);
  bind(TYPES.domain.repositories.PreferredLanguageRepository).to(DefaultPreferredLanguageRepository);
  bind(TYPES.domain.repositories.ProvinceTerritoryStateRepository).to(DefaultProvinceTerritoryStateRepository);
  bind(TYPES.domain.repositories.ProvincialGovernmentInsurancePlanRepository).to(DefaultProvincialGovernmentInsurancePlanRepository);

  bind(TYPES.web.repositories.DynatraceRepository).to(DefaultDynatraceRepository);
  bind(TYPES.web.repositories.HCaptchaRepository).to(DefaultHCaptchaRepository);
});
