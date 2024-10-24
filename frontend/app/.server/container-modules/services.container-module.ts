import { ContainerModule } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type {
  AddressValidationService,
  BenefitRenewalService,
  ClientApplicationService,
  ClientFriendlyStatusService,
  CountryService,
  FederalGovernmentInsurancePlanService,
  MaritalStatusService,
  PreferredCommunicationMethodService,
  PreferredLanguageService,
  ProvinceTerritoryStateService,
  ProvincialGovernmentInsurancePlanService,
  SessionService,
} from '~/.server/domain/services';
import {
  AddressValidationServiceImpl,
  BenefitRenewalServiceImpl,
  ClientApplicationServiceImpl,
  ClientFriendlyStatusServiceImpl,
  CountryServiceImpl,
  FederalGovernmentInsurancePlanServiceImpl,
  FileSessionService,
  MaritalStatusServiceImpl,
  PreferredCommunicationMethodServiceImpl,
  PreferredLanguageServiceImpl,
  ProvinceTerritoryStateServiceImpl,
  ProvincialGovernmentInsurancePlanServiceImpl,
  RedisSessionService,
} from '~/.server/domain/services';

/**
 * Container module for services.
 */
export const servicesContainerModule = new ContainerModule((bind) => {
  bind<AddressValidationService>(SERVICE_IDENTIFIER.ADDRESS_VALIDATION_SERVICE).to(AddressValidationServiceImpl);
  bind<BenefitRenewalService>(SERVICE_IDENTIFIER.BENEFIT_RENEWAL_SERVICE).to(BenefitRenewalServiceImpl);
  bind<ClientApplicationService>(SERVICE_IDENTIFIER.CLIENT_APPLICATION_SERVICE).to(ClientApplicationServiceImpl);
  bind<ClientFriendlyStatusService>(SERVICE_IDENTIFIER.CLIENT_FRIENDLY_STATUS_SERVICE).to(ClientFriendlyStatusServiceImpl);
  bind<CountryService>(SERVICE_IDENTIFIER.COUNTRY_SERVICE).to(CountryServiceImpl);
  bind<FederalGovernmentInsurancePlanService>(SERVICE_IDENTIFIER.FEDERAL_GOVERNMENT_INSURANCE_PLAN_SERVICE).to(FederalGovernmentInsurancePlanServiceImpl);
  bind<MaritalStatusService>(SERVICE_IDENTIFIER.MARITAL_STATUS_SERVICE).to(MaritalStatusServiceImpl);
  bind<PreferredCommunicationMethodService>(SERVICE_IDENTIFIER.PREFERRED_COMMUNICATION_METHOD_SERVICE).to(PreferredCommunicationMethodServiceImpl);
  bind<PreferredLanguageService>(SERVICE_IDENTIFIER.PREFERRED_LANGUAGE_SERVICE).to(PreferredLanguageServiceImpl);
  bind<ProvinceTerritoryStateService>(SERVICE_IDENTIFIER.PROVINCE_TERRITORY_STATE_SERVICE).to(ProvinceTerritoryStateServiceImpl);
  bind<ProvincialGovernmentInsurancePlanService>(SERVICE_IDENTIFIER.PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_SERVICE).to(ProvincialGovernmentInsurancePlanServiceImpl);

  // Register session service implementations
  bind<SessionService>(SERVICE_IDENTIFIER.SESSION_SERVICE_FILE).to(FileSessionService);
  bind<SessionService>(SERVICE_IDENTIFIER.SESSION_SERVICE_REDIS).to(RedisSessionService);

  // Resolve session service implementation based on server configuration
  bind<SessionService>(SERVICE_IDENTIFIER.SESSION_SERVICE).toDynamicValue((context) => {
    const serverConfig = context.container.get<ServerConfig>(SERVICE_IDENTIFIER.SERVER_CONFIG);

    switch (serverConfig.SESSION_STORAGE_TYPE) {
      case 'file': {
        return context.container.get<SessionService>(SERVICE_IDENTIFIER.SESSION_SERVICE_FILE);
      }
      case 'redis': {
        return context.container.get<SessionService>(SERVICE_IDENTIFIER.SESSION_SERVICE_REDIS);
      }
      default: {
        throw new Error(`Unknown session storage type: [${serverConfig.SESSION_STORAGE_TYPE}]`);
      }
    }
  });
});
