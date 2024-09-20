import { ContainerModule } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants/service-identifier.contant';
import type { ClientApplicationService } from '~/.server/domain/services/client-application.service';
import { ClientApplicationServiceImpl } from '~/.server/domain/services/client-application.service';
import type { ClientFriendlyStatusService } from '~/.server/domain/services/client-friendly-status.service';
import { ClientFriendlyStatusServiceImpl } from '~/.server/domain/services/client-friendly-status.service';
import type { CountryService } from '~/.server/domain/services/country.service';
import { CountryServiceImpl } from '~/.server/domain/services/country.service';
import type { FederalGovernmentInsurancePlanService } from '~/.server/domain/services/federal-government-insurance-plan.service';
import { FederalGovernmentInsurancePlanServiceImpl } from '~/.server/domain/services/federal-government-insurance-plan.service';
import type { MaritalStatusService } from '~/.server/domain/services/marital-status.service';
import { MaritalStatusServiceImpl } from '~/.server/domain/services/marital-status.service';
import type { PreferredCommunicationMethodService } from '~/.server/domain/services/preferred-communication-method.service';
import { PreferredCommunicationMethodServiceImpl } from '~/.server/domain/services/preferred-communication-method.service';
import type { PreferredLanguageService } from '~/.server/domain/services/preferred-language.service';
import { PreferredLanguageServiceImpl } from '~/.server/domain/services/preferred-language.service';
import type { ProvinceTerritoryStateService } from '~/.server/domain/services/province-territory-state.service';
import { ProvinceTerritoryStateServiceImpl } from '~/.server/domain/services/province-territory-state.service';
import type { ProvincialGovernmentInsurancePlanService } from '~/.server/domain/services/provincial-government-insurance-plan.service';
import { ProvincialGovernmentInsurancePlanServiceImpl } from '~/.server/domain/services/provincial-government-insurance-plan.service';

/**
 * Container module for services.
 */
export const servicesContainerModule = new ContainerModule((bind) => {
  bind<ClientApplicationService>(SERVICE_IDENTIFIER.CLIENT_APPLICATION_SERVICE).to(ClientApplicationServiceImpl);
  bind<ClientFriendlyStatusService>(SERVICE_IDENTIFIER.CLIENT_FRIENDLY_STATUS_SERVICE).to(ClientFriendlyStatusServiceImpl);
  bind<CountryService>(SERVICE_IDENTIFIER.COUNTRY_SERVICE).to(CountryServiceImpl);
  bind<FederalGovernmentInsurancePlanService>(SERVICE_IDENTIFIER.FEDERAL_GOVERNMENT_INSURANCE_PLAN_SERVICE).to(FederalGovernmentInsurancePlanServiceImpl);
  bind<MaritalStatusService>(SERVICE_IDENTIFIER.MARITAL_STATUS_SERVICE).to(MaritalStatusServiceImpl);
  bind<PreferredCommunicationMethodService>(SERVICE_IDENTIFIER.PREFERRED_COMMUNICATION_METHOD_SERVICE).to(PreferredCommunicationMethodServiceImpl);
  bind<PreferredLanguageService>(SERVICE_IDENTIFIER.PREFERRED_LANGUAGE_SERVICE).to(PreferredLanguageServiceImpl);
  bind<ProvinceTerritoryStateService>(SERVICE_IDENTIFIER.PROVINCE_TERRITORY_STATE_SERVICE).to(ProvinceTerritoryStateServiceImpl);
  bind<ProvincialGovernmentInsurancePlanService>(SERVICE_IDENTIFIER.PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_SERVICE).to(ProvincialGovernmentInsurancePlanServiceImpl);
});
