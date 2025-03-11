import type { ContainerModuleLoadOptions, interfaces } from 'inversify';
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
export const servicesContainerModule = new ContainerModule((options: ContainerModuleLoadOptions) => {
  options.bind(TYPES.auth.RaoidcService).to(DefaultRaoidcService);
  options.bind(TYPES.core.BuildInfoService).to(DefaultBuildInfoService);
  // RedisService options.bindings depend on the SESSION_STORAGE_TYPE configuration string
  options.bind(TYPES.data.services.RedisService).to(DefaultRedisService).when(sessionTypeIs('redis'));
  options.bind(TYPES.domain.services.AddressValidationService).to(DefaultAddressValidationService);
  options.bind(TYPES.domain.services.ApplicantService).to(DefaultApplicantService);
  options.bind(TYPES.domain.services.ApplicationStatusService).to(DefaultApplicationStatusService);
  options.bind(TYPES.domain.services.ApplicationYearService).to(DefaultApplicationYearService);
  options.bind(TYPES.domain.services.AuditService).to(DefaultAuditService);
  options.bind(TYPES.domain.services.BenefitApplicationService).to(DefaultBenefitApplicationService);
  options.bind(TYPES.domain.services.BenefitRenewalService).to(DefaultBenefitRenewalService);
  options.bind(TYPES.domain.services.ClientApplicationService).to(DefaultClientApplicationService);
  options.bind(TYPES.domain.services.ClientFriendlyStatusService).to(DefaultClientFriendlyStatusService);
  options.bind(TYPES.domain.services.CountryService).to(DefaultCountryService);
  options.bind(TYPES.domain.services.DemographicSurveyService).to(DefaultDemographicSurveyServiceService);
  options.bind(TYPES.domain.services.FederalGovernmentInsurancePlanService).to(DefaultFederalGovernmentInsurancePlanService);
  options.bind(TYPES.domain.services.LetterService).to(DefaultLetterService);
  options.bind(TYPES.domain.services.LetterTypeService).to(DefaultLetterTypeService);
  options.bind(TYPES.domain.services.MaritalStatusService).to(DefaultMaritalStatusService);
  options.bind(TYPES.domain.services.PreferredCommunicationMethodService).to(DefaultPreferredCommunicationMethodService);
  options.bind(TYPES.domain.services.PreferredLanguageService).to(DefaultPreferredLanguageService);
  options.bind(TYPES.domain.services.ProvinceTerritoryStateService).to(DefaultProvinceTerritoryStateService);
  options.bind(TYPES.domain.services.ProvincialGovernmentInsurancePlanService).to(DefaultProvincialGovernmentInsurancePlanService);

  options.bind(TYPES.domain.services.VerificationCodeService).to(DefaultVerificationCodeService).when(isMockEnabled('verification-code', false));
  options.bind(TYPES.domain.services.VerificationCodeService).to(StubVerificationCodeService).when(isMockEnabled('verification-code', true));

  options.bind(TYPES.http.HttpClient).to(DefaultHttpClient);
  options.bind(TYPES.observability.InstrumentationService).to(DefaultInstrumentationService);
  options.bind(TYPES.web.services.DynatraceService).to(DefaultDynatraceService);
  options.bind(TYPES.web.services.HCaptchaService).to(DefaultHCaptchaService);
});
