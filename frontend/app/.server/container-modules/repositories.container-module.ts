import { ContainerModule } from 'inversify';
import type { BindingConstraints } from 'inversify';

import type { ServerConfig } from '../configs';

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
  DefaultGovernmentInsurancePlanRepository,
  DefaultLetterRepository,
  DefaultLetterTypeRepository,
  DefaultProvinceTerritoryStateRepository,
  DefaultVerificationCodeRepository,
  MockAddressValidationRepository,
  MockApplicantRepository,
  MockApplicationStatusRepository,
  MockApplicationYearRepository,
  MockBenefitApplicationRepository,
  MockBenefitRenewalRepository,
  MockClientApplicationRepository,
  MockClientFriendlyStatusRepository,
  MockCountryRepository,
  MockGovernmentInsurancePlanRepository,
  MockLetterRepository,
  MockLetterTypeRepository,
  MockProvinceTerritoryStateRepository,
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
 * @returns A function that takes an `BindingConstraints` and returns a boolean indicating
 * whether the service implementation should be injected based on the server configuration
 * and the `shouldEnable` parameter.
 *
 * @example
 * // Binds AddressValidationRepository to a mock if the mock is enabled in server config,
 * // otherwise binds to the actual implementation.
 * options.bind(TYPES.domain.repositories.AddressValidationRepository).to(DefaultAddressValidationRepository).when(isMockEnabled(serverConfig, 'wsaddress', false));
 * options.bind(TYPES.domain.repositories.AddressValidationRepository).to(MockAddressValidationRepository).when(isMockEnabled(serverConfig, 'wsaddress', true));
 */
function isMockEnabled(serverConfig: Pick<ServerConfig, 'ENABLED_MOCKS'>, mockName: MockName, shouldEnable: boolean) {
  return (metadata: BindingConstraints) => {
    const isMockIncluded = serverConfig.ENABLED_MOCKS.includes(mockName);
    return shouldEnable ? isMockIncluded : !isMockIncluded;
  };
}

/**
 * Defines the container module for repository bindings.
 */
export function createRepositoriesContainerModule(serverConfig: Pick<ServerConfig, 'ENABLED_MOCKS'>): ContainerModule {
  // prettier-ignore
  return new ContainerModule((options) => {
    options.bind(TYPES.domain.repositories.AddressValidationRepository).to(DefaultAddressValidationRepository).when(isMockEnabled(serverConfig, 'wsaddress', false));
    options.bind(TYPES.domain.repositories.AddressValidationRepository).to(MockAddressValidationRepository).when(isMockEnabled(serverConfig, 'wsaddress', true));

    options.bind(TYPES.domain.repositories.ApplicantRepository).to(DefaultApplicantRepository).when(isMockEnabled(serverConfig, 'power-platform', false));
    options.bind(TYPES.domain.repositories.ApplicantRepository).to(MockApplicantRepository).when(isMockEnabled(serverConfig, 'power-platform', true));

    options.bind(TYPES.domain.repositories.ApplicationStatusRepository).to(DefaultApplicationStatusRepository).when(isMockEnabled(serverConfig, 'status-check', false));
    options.bind(TYPES.domain.repositories.ApplicationStatusRepository).to(MockApplicationStatusRepository).when(isMockEnabled(serverConfig, 'status-check', true));

    options.bind(TYPES.domain.repositories.ApplicationYearRepository).to(DefaultApplicationYearRepository).when(isMockEnabled(serverConfig, 'power-platform', false));
    options.bind(TYPES.domain.repositories.ApplicationYearRepository).to(MockApplicationYearRepository).when(isMockEnabled(serverConfig, 'power-platform', true));

    options.bind(TYPES.domain.repositories.BenefitApplicationRepository).to(DefaultBenefitApplicationRepository).when(isMockEnabled(serverConfig, 'power-platform', false));
    options.bind(TYPES.domain.repositories.BenefitApplicationRepository).to(MockBenefitApplicationRepository).when(isMockEnabled(serverConfig, 'power-platform', true));

    options.bind(TYPES.domain.repositories.BenefitRenewalRepository).to(DefaultBenefitRenewalRepository).when(isMockEnabled(serverConfig, 'power-platform', false));
    options.bind(TYPES.domain.repositories.BenefitRenewalRepository).to(MockBenefitRenewalRepository).when(isMockEnabled(serverConfig, 'power-platform', true));

    options.bind(TYPES.domain.repositories.ClientApplicationRepository).to(DefaultClientApplicationRepository).when(isMockEnabled(serverConfig, 'power-platform', false));
    options.bind(TYPES.domain.repositories.ClientApplicationRepository).to(MockClientApplicationRepository).when(isMockEnabled(serverConfig, 'power-platform', true));

    options.bind(TYPES.domain.repositories.ClientFriendlyStatusRepository).to(DefaultClientFriendlyStatusRepository).when(isMockEnabled(serverConfig, 'code-tables', false));
    options.bind(TYPES.domain.repositories.ClientFriendlyStatusRepository).to(MockClientFriendlyStatusRepository).when(isMockEnabled(serverConfig, 'code-tables', true));

    options.bind(TYPES.domain.repositories.CountryRepository).to(DefaultCountryRepository).when(isMockEnabled(serverConfig, 'code-tables', false));
    options.bind(TYPES.domain.repositories.CountryRepository).to(MockCountryRepository).when(isMockEnabled(serverConfig, 'code-tables', true));

    options.bind(TYPES.domain.repositories.DemographicSurveyRepository).to(DefaultDemographicSurveyRepository);

    options.bind(TYPES.domain.repositories.GovernmentInsurancePlanRepository).to(DefaultGovernmentInsurancePlanRepository).when(isMockEnabled(serverConfig, 'code-tables', false));
    options.bind(TYPES.domain.repositories.GovernmentInsurancePlanRepository).to(MockGovernmentInsurancePlanRepository).when(isMockEnabled(serverConfig, 'code-tables', true));
    
    options.bind(TYPES.domain.repositories.LetterRepository).to(DefaultLetterRepository).when(isMockEnabled(serverConfig, 'cct', false));
    options.bind(TYPES.domain.repositories.LetterRepository).to(MockLetterRepository).when(isMockEnabled(serverConfig, 'cct', true));

    options.bind(TYPES.domain.repositories.LetterTypeRepository).to(DefaultLetterTypeRepository).when(isMockEnabled(serverConfig, 'code-tables', false));
    options.bind(TYPES.domain.repositories.LetterTypeRepository).to(MockLetterTypeRepository).when(isMockEnabled(serverConfig, 'code-tables', true));

    options.bind(TYPES.domain.repositories.VerificationCodeRepository).to(DefaultVerificationCodeRepository).when(isMockEnabled(serverConfig, 'gc-notify', false));
    options.bind(TYPES.domain.repositories.VerificationCodeRepository).to(MockVerificationCodeRepository).when(isMockEnabled(serverConfig, 'gc-notify', true));

    options.bind(TYPES.domain.repositories.ProvinceTerritoryStateRepository).to(DefaultProvinceTerritoryStateRepository).when(isMockEnabled(serverConfig, 'code-tables', false));
    options.bind(TYPES.domain.repositories.ProvinceTerritoryStateRepository).to(MockProvinceTerritoryStateRepository).when(isMockEnabled(serverConfig, 'code-tables', true));

    options.bind(TYPES.web.repositories.DynatraceRepository).to(DefaultDynatraceRepository);
    options.bind(TYPES.web.repositories.HCaptchaRepository).to(DefaultHCaptchaRepository);
  });
}
