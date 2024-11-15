import type { interfaces } from 'inversify';
import { ContainerModule } from 'inversify';

import { TYPES } from '~/.server/constants';
import {
  ApplicantRepositoryImpl,
  ApplicationStatusRepositoryImpl,
  BenefitApplicationRepositoryImpl,
  BenefitRenewalRepositoryImpl,
  ClientApplicationRepositoryImpl,
  ClientFriendlyStatusRepositoryImpl,
  CountryRepositoryImpl,
  DefaultAddressValidationRepository,
  DemographicSurveyRepositoryImpl,
  FederalGovernmentInsurancePlanRepositoryImpl,
  LetterRepositoryImpl,
  LetterTypeRepositoryImpl,
  MaritalStatusRepositoryImpl,
  MockAddressValidationRepository,
  PreferredCommunicationMethodRepositoryImpl,
  PreferredLanguageRepositoryImpl,
  ProvinceTerritoryStateRepositoryImpl,
  ProvincialGovernmentInsurancePlanRepositoryImpl,
} from '~/.server/domain/repositories';
import { HCaptchaRepositoryImpl } from '~/.server/web/repositories';
import type { MockName } from '~/utils/env-utils.server';

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
  bind(TYPES.domain.repositories.ApplicantRepository).to(ApplicantRepositoryImpl);
  bind(TYPES.domain.repositories.ApplicationStatusRepository).to(ApplicationStatusRepositoryImpl);
  bind(TYPES.domain.repositories.BenefitApplicationRepository).to(BenefitApplicationRepositoryImpl);
  bind(TYPES.domain.repositories.BenefitRenewalRepository).to(BenefitRenewalRepositoryImpl);
  bind(TYPES.domain.repositories.ClientApplicationRepository).to(ClientApplicationRepositoryImpl);
  bind(TYPES.domain.repositories.ClientFriendlyStatusRepository).to(ClientFriendlyStatusRepositoryImpl);
  bind(TYPES.domain.repositories.CountryRepository).to(CountryRepositoryImpl);
  bind(TYPES.domain.repositories.DemographicSurveyRepository).to(DemographicSurveyRepositoryImpl);
  bind(TYPES.domain.repositories.FederalGovernmentInsurancePlanRepository).to(FederalGovernmentInsurancePlanRepositoryImpl);
  bind(TYPES.domain.repositories.LetterRepository).to(LetterRepositoryImpl);
  bind(TYPES.domain.repositories.LetterTypeRepository).to(LetterTypeRepositoryImpl);
  bind(TYPES.domain.repositories.MaritalStatusRepository).to(MaritalStatusRepositoryImpl);
  bind(TYPES.domain.repositories.PreferredCommunicationMethodRepository).to(PreferredCommunicationMethodRepositoryImpl);
  bind(TYPES.domain.repositories.PreferredLanguageRepository).to(PreferredLanguageRepositoryImpl);
  bind(TYPES.domain.repositories.ProvinceTerritoryStateRepository).to(ProvinceTerritoryStateRepositoryImpl);
  bind(TYPES.domain.repositories.ProvincialGovernmentInsurancePlanRepository).to(ProvincialGovernmentInsurancePlanRepositoryImpl);
  bind(TYPES.web.repositories.HCaptchaRepository).to(HCaptchaRepositoryImpl);
});
