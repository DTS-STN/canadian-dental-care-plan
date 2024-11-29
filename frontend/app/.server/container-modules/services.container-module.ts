import type { interfaces } from 'inversify';
import { ContainerModule } from 'inversify';

import { DefaultRaoidcService } from '~/.server/auth/raoidc.service';
import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import { DefaultRedisService } from '~/.server/data/services';
import {
  DefaultAddressValidationService,
  DefaultApplicantService,
  DefaultApplicationStatusService,
  DefaultApplicationYearService,
  DefaultAuditService,
  DefaultBenefitApplicationService,
  DefaultBenefitRenewalService,
  DefaultClientApplicationService,
  DefaultClientFriendlyStatusService,
  DefaultCountryService,
  DefaultDemographicSurveyServiceService,
  DefaultFederalGovernmentInsurancePlanService,
  DefaultLetterService,
  DefaultLetterTypeService,
  DefaultMaritalStatusService,
  DefaultPreferredCommunicationMethodService,
  DefaultPreferredLanguageService,
  DefaultProvinceTerritoryStateService,
  DefaultProvincialGovernmentInsurancePlanService,
} from '~/.server/domain/services';
import { DefaultDynatraceService, DefaultHCaptchaService, FileSessionService, RedisSessionService } from '~/.server/web/services';

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
  bind(TYPES.data.services.RedisService).to(DefaultRedisService).when(sessionTypeIs('redis'));
  bind(TYPES.domain.services.AddressValidationService).to(DefaultAddressValidationService);
  bind(TYPES.domain.services.ApplicantService).to(DefaultApplicantService);
  bind(TYPES.domain.services.ApplicationStatusService).to(DefaultApplicationStatusService);
  bind(TYPES.domain.services.ApplicationYearService).to(DefaultApplicationYearService);
  bind(TYPES.domain.services.AuditService).to(DefaultAuditService);
  bind(TYPES.domain.services.BenefitApplicationService).to(DefaultBenefitApplicationService);
  bind(TYPES.domain.services.BenefitRenewalService).to(DefaultBenefitRenewalService);
  bind(TYPES.domain.services.ClientApplicationService).to(DefaultClientApplicationService);
  bind(TYPES.domain.services.ClientFriendlyStatusService).to(DefaultClientFriendlyStatusService);
  bind(TYPES.domain.services.CountryService).to(DefaultCountryService);
  bind(TYPES.domain.services.DemographicSurveyService).to(DefaultDemographicSurveyServiceService);
  bind(TYPES.domain.services.FederalGovernmentInsurancePlanService).to(DefaultFederalGovernmentInsurancePlanService);
  bind(TYPES.domain.services.LetterService).to(DefaultLetterService);
  bind(TYPES.domain.services.LetterTypeService).to(DefaultLetterTypeService);
  bind(TYPES.domain.services.MaritalStatusService).to(DefaultMaritalStatusService);
  bind(TYPES.domain.services.PreferredCommunicationMethodService).to(DefaultPreferredCommunicationMethodService);
  bind(TYPES.domain.services.PreferredLanguageService).to(DefaultPreferredLanguageService);
  bind(TYPES.domain.services.ProvinceTerritoryStateService).to(DefaultProvinceTerritoryStateService);
  bind(TYPES.domain.services.ProvincialGovernmentInsurancePlanService).to(DefaultProvincialGovernmentInsurancePlanService);
  bind(TYPES.web.services.DynatraceService).to(DefaultDynatraceService);
  bind(TYPES.web.services.HCaptchaService).to(DefaultHCaptchaService);
  // SessionService bindings depend on the SESSION_STORAGE_TYPE configuration string
  bind(TYPES.web.services.SessionService).to(FileSessionService).when(sessionTypeIs('file'));
  bind(TYPES.web.services.SessionService).to(RedisSessionService).when(sessionTypeIs('redis'));
});
