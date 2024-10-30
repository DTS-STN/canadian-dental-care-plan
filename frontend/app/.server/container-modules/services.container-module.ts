import type { interfaces } from 'inversify';
import { ContainerModule } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type {
  AddressValidationService,
  ApplicantService,
  AuditService,
  BenefitRenewalService,
  ClientApplicationService,
  ClientFriendlyStatusService,
  CountryService,
  FederalGovernmentInsurancePlanService,
  LetterService,
  LetterTypeService,
  MaritalStatusService,
  PreferredCommunicationMethodService,
  PreferredLanguageService,
  ProvinceTerritoryStateService,
  ProvincialGovernmentInsurancePlanService,
  RedisService,
  SessionService,
} from '~/.server/domain/services';
import {
  AddressValidationServiceImpl,
  ApplicantServiceImpl,
  AuditServiceImpl,
  BenefitRenewalServiceImpl,
  ClientApplicationServiceImpl,
  ClientFriendlyStatusServiceImpl,
  CountryServiceImpl,
  FederalGovernmentInsurancePlanServiceImpl,
  FileSessionService,
  LetterServiceImpl,
  LetterTypeServiceImpl,
  MaritalStatusServiceImpl,
  PreferredCommunicationMethodServiceImpl,
  PreferredLanguageServiceImpl,
  ProvinceTerritoryStateServiceImpl,
  ProvincialGovernmentInsurancePlanServiceImpl,
  RedisServiceImpl,
  RedisSessionService,
} from '~/.server/domain/services';

function sessionTypeIs(sessionType: ServerConfig['SESSION_STORAGE_TYPE']) {
  return ({ parentContext }: interfaces.Request) => {
    const serverConfig = parentContext.container.get<ServerConfig>(SERVICE_IDENTIFIER.SERVER_CONFIG);
    return serverConfig.SESSION_STORAGE_TYPE === sessionType;
  };
}

/**
 * Container module for services.
 */
export const servicesContainerModule = new ContainerModule((bind) => {
  bind<AddressValidationService>(SERVICE_IDENTIFIER.ADDRESS_VALIDATION_SERVICE).to(AddressValidationServiceImpl);
  bind<ApplicantService>(SERVICE_IDENTIFIER.APPLICANT_SERVICE).to(ApplicantServiceImpl);
  bind<AuditService>(SERVICE_IDENTIFIER.AUDIT_SERVICE).to(AuditServiceImpl);
  bind<BenefitRenewalService>(SERVICE_IDENTIFIER.BENEFIT_RENEWAL_SERVICE).to(BenefitRenewalServiceImpl);
  bind<ClientApplicationService>(SERVICE_IDENTIFIER.CLIENT_APPLICATION_SERVICE).to(ClientApplicationServiceImpl);
  bind<ClientFriendlyStatusService>(SERVICE_IDENTIFIER.CLIENT_FRIENDLY_STATUS_SERVICE).to(ClientFriendlyStatusServiceImpl);
  bind<CountryService>(SERVICE_IDENTIFIER.COUNTRY_SERVICE).to(CountryServiceImpl);
  bind<FederalGovernmentInsurancePlanService>(SERVICE_IDENTIFIER.FEDERAL_GOVERNMENT_INSURANCE_PLAN_SERVICE).to(FederalGovernmentInsurancePlanServiceImpl);
  bind<LetterService>(SERVICE_IDENTIFIER.LETTER_SERVICE).to(LetterServiceImpl);
  bind<LetterTypeService>(SERVICE_IDENTIFIER.LETTER_TYPE_SERVICE).to(LetterTypeServiceImpl);
  bind<MaritalStatusService>(SERVICE_IDENTIFIER.MARITAL_STATUS_SERVICE).to(MaritalStatusServiceImpl);
  bind<PreferredCommunicationMethodService>(SERVICE_IDENTIFIER.PREFERRED_COMMUNICATION_METHOD_SERVICE).to(PreferredCommunicationMethodServiceImpl);
  bind<PreferredLanguageService>(SERVICE_IDENTIFIER.PREFERRED_LANGUAGE_SERVICE).to(PreferredLanguageServiceImpl);
  bind<ProvinceTerritoryStateService>(SERVICE_IDENTIFIER.PROVINCE_TERRITORY_STATE_SERVICE).to(ProvinceTerritoryStateServiceImpl);
  bind<ProvincialGovernmentInsurancePlanService>(SERVICE_IDENTIFIER.PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_SERVICE).to(ProvincialGovernmentInsurancePlanServiceImpl);

  // RedisService bindings depend on the SESSION_STORAGE_TYPE configuration string
  bind<RedisService>(SERVICE_IDENTIFIER.REDIS_SERVICE).to(RedisServiceImpl).when(sessionTypeIs('redis'));

  // SessionService bindings depend on the SESSION_STORAGE_TYPE configuration string
  bind<SessionService>(SERVICE_IDENTIFIER.SESSION_SERVICE).to(FileSessionService).when(sessionTypeIs('file'));
  bind<SessionService>(SERVICE_IDENTIFIER.SESSION_SERVICE).to(RedisSessionService).when(sessionTypeIs('redis'));
});
