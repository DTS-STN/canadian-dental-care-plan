import type { interfaces } from 'inversify';
import { ContainerModule } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import {
  AddressValidationServiceImpl,
  ApplicantServiceImpl,
  AuditServiceImpl,
  BenefitRenewalServiceImpl,
  ClientApplicationServiceImpl,
  ClientFriendlyStatusServiceImpl,
  CountryServiceImpl,
  DemographicSurveyServiceServiceImpl,
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
import { HCaptchaServiceImpl } from '~/.server/web/services';

function sessionTypeIs(sessionType: ServerConfig['SESSION_STORAGE_TYPE']) {
  return ({ parentContext }: interfaces.Request) => {
    const serverConfig = parentContext.container.get(SERVICE_IDENTIFIER.SERVER_CONFIG);
    return serverConfig.SESSION_STORAGE_TYPE === sessionType;
  };
}

/**
 * Container module for services.
 */
export const servicesContainerModule = new ContainerModule((bind) => {
  bind(SERVICE_IDENTIFIER.ADDRESS_VALIDATION_SERVICE).to(AddressValidationServiceImpl);
  bind(SERVICE_IDENTIFIER.APPLICANT_SERVICE).to(ApplicantServiceImpl);
  bind(SERVICE_IDENTIFIER.AUDIT_SERVICE).to(AuditServiceImpl);
  bind(SERVICE_IDENTIFIER.BENEFIT_RENEWAL_SERVICE).to(BenefitRenewalServiceImpl);
  bind(SERVICE_IDENTIFIER.CLIENT_APPLICATION_SERVICE).to(ClientApplicationServiceImpl);
  bind(SERVICE_IDENTIFIER.CLIENT_FRIENDLY_STATUS_SERVICE).to(ClientFriendlyStatusServiceImpl);
  bind(SERVICE_IDENTIFIER.COUNTRY_SERVICE).to(CountryServiceImpl);
  bind(SERVICE_IDENTIFIER.DEMOGRAPHIC_SURVEY_SERVICE).to(DemographicSurveyServiceServiceImpl);
  bind(SERVICE_IDENTIFIER.FEDERAL_GOVERNMENT_INSURANCE_PLAN_SERVICE).to(FederalGovernmentInsurancePlanServiceImpl);
  bind(SERVICE_IDENTIFIER.HCAPTCHA_SERVICE).to(HCaptchaServiceImpl);
  bind(SERVICE_IDENTIFIER.LETTER_SERVICE).to(LetterServiceImpl);
  bind(SERVICE_IDENTIFIER.LETTER_TYPE_SERVICE).to(LetterTypeServiceImpl);
  bind(SERVICE_IDENTIFIER.MARITAL_STATUS_SERVICE).to(MaritalStatusServiceImpl);
  bind(SERVICE_IDENTIFIER.PREFERRED_COMMUNICATION_METHOD_SERVICE).to(PreferredCommunicationMethodServiceImpl);
  bind(SERVICE_IDENTIFIER.PREFERRED_LANGUAGE_SERVICE).to(PreferredLanguageServiceImpl);
  bind(SERVICE_IDENTIFIER.PROVINCE_TERRITORY_STATE_SERVICE).to(ProvinceTerritoryStateServiceImpl);
  bind(SERVICE_IDENTIFIER.PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_SERVICE).to(ProvincialGovernmentInsurancePlanServiceImpl);

  // RedisService bindings depend on the SESSION_STORAGE_TYPE configuration string
  bind(SERVICE_IDENTIFIER.REDIS_SERVICE).to(RedisServiceImpl).when(sessionTypeIs('redis'));

  // SessionService bindings depend on the SESSION_STORAGE_TYPE configuration string
  bind(SERVICE_IDENTIFIER.SESSION_SERVICE).to(FileSessionService).when(sessionTypeIs('file'));
  bind(SERVICE_IDENTIFIER.SESSION_SERVICE).to(RedisSessionService).when(sessionTypeIs('redis'));
});
