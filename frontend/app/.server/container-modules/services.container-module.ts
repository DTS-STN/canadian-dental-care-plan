import type { interfaces } from 'inversify';
import { ContainerModule } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import {
  AddressValidationServiceImpl,
  ApplicantServiceImpl,
  ApplicationStatusServiceImpl,
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
    const serverConfig = parentContext.container.get(TYPES.SERVER_CONFIG);
    return serverConfig.SESSION_STORAGE_TYPE === sessionType;
  };
}

/**
 * Container module for services.
 */
export const servicesContainerModule = new ContainerModule((bind) => {
  bind(TYPES.ADDRESS_VALIDATION_SERVICE).to(AddressValidationServiceImpl);
  bind(TYPES.APPLICANT_SERVICE).to(ApplicantServiceImpl);
  bind(TYPES.APPLICATION_STATUS_SERVICE).to(ApplicationStatusServiceImpl);
  bind(TYPES.AUDIT_SERVICE).to(AuditServiceImpl);
  bind(TYPES.BENEFIT_RENEWAL_SERVICE).to(BenefitRenewalServiceImpl);
  bind(TYPES.CLIENT_APPLICATION_SERVICE).to(ClientApplicationServiceImpl);
  bind(TYPES.CLIENT_FRIENDLY_STATUS_SERVICE).to(ClientFriendlyStatusServiceImpl);
  bind(TYPES.COUNTRY_SERVICE).to(CountryServiceImpl);
  bind(TYPES.DEMOGRAPHIC_SURVEY_SERVICE).to(DemographicSurveyServiceServiceImpl);
  bind(TYPES.FEDERAL_GOVERNMENT_INSURANCE_PLAN_SERVICE).to(FederalGovernmentInsurancePlanServiceImpl);
  bind(TYPES.HCAPTCHA_SERVICE).to(HCaptchaServiceImpl);
  bind(TYPES.LETTER_SERVICE).to(LetterServiceImpl);
  bind(TYPES.LETTER_TYPE_SERVICE).to(LetterTypeServiceImpl);
  bind(TYPES.MARITAL_STATUS_SERVICE).to(MaritalStatusServiceImpl);
  bind(TYPES.PREFERRED_COMMUNICATION_METHOD_SERVICE).to(PreferredCommunicationMethodServiceImpl);
  bind(TYPES.PREFERRED_LANGUAGE_SERVICE).to(PreferredLanguageServiceImpl);
  bind(TYPES.PROVINCE_TERRITORY_STATE_SERVICE).to(ProvinceTerritoryStateServiceImpl);
  bind(TYPES.PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_SERVICE).to(ProvincialGovernmentInsurancePlanServiceImpl);

  // RedisService bindings depend on the SESSION_STORAGE_TYPE configuration string
  bind(TYPES.REDIS_SERVICE).to(RedisServiceImpl).when(sessionTypeIs('redis'));

  // SessionService bindings depend on the SESSION_STORAGE_TYPE configuration string
  bind(TYPES.SESSION_SERVICE).to(FileSessionService).when(sessionTypeIs('file'));
  bind(TYPES.SESSION_SERVICE).to(RedisSessionService).when(sessionTypeIs('redis'));
});
