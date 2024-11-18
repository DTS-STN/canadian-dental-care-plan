import type { interfaces } from 'inversify';
import { ContainerModule } from 'inversify';

import { RedisServiceImpl } from '../data/services';
import { DefaultRaoidcService } from '~/.server/auth/raoidc.service';
import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import {
  ApplicantServiceImpl,
  ApplicationStatusServiceImpl,
  AuditServiceImpl,
  BenefitApplicationServiceImpl,
  BenefitRenewalServiceImpl,
  ClientApplicationServiceImpl,
  ClientFriendlyStatusServiceImpl,
  CountryServiceImpl,
  DefaultAddressValidationService,
  DemographicSurveyServiceServiceImpl,
  FederalGovernmentInsurancePlanServiceImpl,
  LetterServiceImpl,
  LetterTypeServiceImpl,
  MaritalStatusServiceImpl,
  PreferredCommunicationMethodServiceImpl,
  PreferredLanguageServiceImpl,
  ProvinceTerritoryStateServiceImpl,
  ProvincialGovernmentInsurancePlanServiceImpl,
} from '~/.server/domain/services';
import { FileSessionService, HCaptchaServiceImpl, RedisSessionService } from '~/.server/web/services';

function sessionTypeIs(sessionType: ServerConfig['SESSION_STORAGE_TYPE']) {
  return ({ parentContext }: interfaces.Request) => {
    const serverConfig = parentContext.container.get(TYPES.configs.ServerConfig);
    return serverConfig.SESSION_STORAGE_TYPE === sessionType;
  };
}

/**
 * Container module for services.
 */
export const servicesContainerModule = new ContainerModule((bind) => {
  bind(TYPES.auth.RaoidcService).to(DefaultRaoidcService);
  // RedisService bindings depend on the SESSION_STORAGE_TYPE configuration string
  bind(TYPES.data.services.RedisService).to(RedisServiceImpl).when(sessionTypeIs('redis'));
  bind(TYPES.domain.services.AddressValidationService).to(DefaultAddressValidationService);
  bind(TYPES.domain.services.ApplicantService).to(ApplicantServiceImpl);
  bind(TYPES.domain.services.ApplicationStatusService).to(ApplicationStatusServiceImpl);
  bind(TYPES.domain.services.AuditService).to(AuditServiceImpl);
  bind(TYPES.domain.services.BenefitApplicationService).to(BenefitApplicationServiceImpl);
  bind(TYPES.domain.services.BenefitRenewalService).to(BenefitRenewalServiceImpl);
  bind(TYPES.domain.services.ClientApplicationService).to(ClientApplicationServiceImpl);
  bind(TYPES.domain.services.ClientFriendlyStatusService).to(ClientFriendlyStatusServiceImpl);
  bind(TYPES.domain.services.CountryService).to(CountryServiceImpl);
  bind(TYPES.domain.services.DemographicSurveyService).to(DemographicSurveyServiceServiceImpl);
  bind(TYPES.domain.services.FederalGovernmentInsurancePlanService).to(FederalGovernmentInsurancePlanServiceImpl);
  bind(TYPES.domain.services.LetterService).to(LetterServiceImpl);
  bind(TYPES.domain.services.LetterTypeService).to(LetterTypeServiceImpl);
  bind(TYPES.domain.services.MaritalStatusService).to(MaritalStatusServiceImpl);
  bind(TYPES.domain.services.PreferredCommunicationMethodService).to(PreferredCommunicationMethodServiceImpl);
  bind(TYPES.domain.services.PreferredLanguageService).to(PreferredLanguageServiceImpl);
  bind(TYPES.domain.services.ProvinceTerritoryStateService).to(ProvinceTerritoryStateServiceImpl);
  bind(TYPES.domain.services.ProvincialGovernmentInsurancePlanService).to(ProvincialGovernmentInsurancePlanServiceImpl);
  bind(TYPES.web.services.HCaptchaService).to(HCaptchaServiceImpl);
  // SessionService bindings depend on the SESSION_STORAGE_TYPE configuration string
  bind(TYPES.web.services.SessionService).to(FileSessionService).when(sessionTypeIs('file'));
  bind(TYPES.web.services.SessionService).to(RedisSessionService).when(sessionTypeIs('redis'));
});
