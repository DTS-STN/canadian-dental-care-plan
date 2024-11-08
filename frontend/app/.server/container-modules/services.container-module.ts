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
    const serverConfig = parentContext.container.get(TYPES.ServerConfig);
    return serverConfig.SESSION_STORAGE_TYPE === sessionType;
  };
}

/**
 * Container module for services.
 */
export const servicesContainerModule = new ContainerModule((bind) => {
  bind(TYPES.AddressValidationService).to(AddressValidationServiceImpl);
  bind(TYPES.ApplicantService).to(ApplicantServiceImpl);
  bind(TYPES.ApplicationStatusService).to(ApplicationStatusServiceImpl);
  bind(TYPES.AuditService).to(AuditServiceImpl);
  bind(TYPES.BenefitRenewalService).to(BenefitRenewalServiceImpl);
  bind(TYPES.ClientApplicationService).to(ClientApplicationServiceImpl);
  bind(TYPES.ClientFriendlyStatusService).to(ClientFriendlyStatusServiceImpl);
  bind(TYPES.CountryService).to(CountryServiceImpl);
  bind(TYPES.DemographicSurveyService).to(DemographicSurveyServiceServiceImpl);
  bind(TYPES.FederalGovernmentInsurancePlanService).to(FederalGovernmentInsurancePlanServiceImpl);
  bind(TYPES.HCaptchaService).to(HCaptchaServiceImpl);
  bind(TYPES.LetterService).to(LetterServiceImpl);
  bind(TYPES.LetterTypeService).to(LetterTypeServiceImpl);
  bind(TYPES.MaritalStatusService).to(MaritalStatusServiceImpl);
  bind(TYPES.PreferredCommunicationMethodService).to(PreferredCommunicationMethodServiceImpl);
  bind(TYPES.PreferredLanguageService).to(PreferredLanguageServiceImpl);
  bind(TYPES.ProvinceTerritoryStateService).to(ProvinceTerritoryStateServiceImpl);
  bind(TYPES.ProvincialGovernmentInsurancePlanService).to(ProvincialGovernmentInsurancePlanServiceImpl);

  // RedisService bindings depend on the SESSION_STORAGE_TYPE configuration string
  bind(TYPES.RedisService).to(RedisServiceImpl).when(sessionTypeIs('redis'));

  // SessionService bindings depend on the SESSION_STORAGE_TYPE configuration string
  bind(TYPES.SessionService).to(FileSessionService).when(sessionTypeIs('file'));
  bind(TYPES.SessionService).to(RedisSessionService).when(sessionTypeIs('redis'));
});
