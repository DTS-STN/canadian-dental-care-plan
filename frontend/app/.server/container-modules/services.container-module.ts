import type { interfaces } from 'inversify';
import { ContainerModule } from 'inversify';

import { DefaultRaoidcService } from '~/.server/auth/raoidc.service';
import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import { DefaultBuildInfoService } from '~/.server/core';
import { DefaultRedisService } from '~/.server/data';
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
  DefaultVerificationCodeService,
  StubVerificationCodeService,
} from '~/.server/domain/services';
import { DefaultHttpClient } from '~/.server/http';
import { DefaultInstrumentationService } from '~/.server/observability';
import type { MockName } from '~/.server/utils/env.utils';
import { DefaultDynatraceService, DefaultHCaptchaService } from '~/.server/web/services';

function isMockEnabled(mockName: MockName, shouldEnable: boolean) {
  return ({ parentContext }: interfaces.Request) => {
    const serverConfig = parentContext.container.get(TYPES.configs.ServerConfig);
    const isMockIncluded = serverConfig.ENABLED_MOCKS.includes(mockName);
    return shouldEnable ? isMockIncluded : !isMockIncluded;
  };
}

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
  bind(TYPES.core.BuildInfoService).to(DefaultBuildInfoService);
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

  bind(TYPES.domain.services.VerificationCodeService).to(DefaultVerificationCodeService).when(isMockEnabled('verification-code', false));
  bind(TYPES.domain.services.VerificationCodeService).to(StubVerificationCodeService).when(isMockEnabled('verification-code', true));

  bind(TYPES.http.HttpClient).to(DefaultHttpClient);
  bind(TYPES.observability.InstrumentationService).to(DefaultInstrumentationService);
  bind(TYPES.web.services.DynatraceService).to(DefaultDynatraceService);
  bind(TYPES.web.services.HCaptchaService).to(DefaultHCaptchaService);
});
