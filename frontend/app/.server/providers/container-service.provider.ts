import type { Container } from 'inversify';
import { injectable } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants/service-identifier.contant';
import type { ClientFriendlyStatusService } from '~/.server/domain/services/client-friendly-status.service';
import type { CountryService } from '~/.server/domain/services/country.service';
import type { FederalGovernmentInsurancePlanService } from '~/.server/domain/services/federal-government-insurance-plan.service';
import type { MaritalStatusService } from '~/.server/domain/services/marital-status.service';
import type { PreferredCommunicationMethodService } from '~/.server/domain/services/preferred-communication-method.service';
import type { PreferredLanguageService } from '~/.server/domain/services/preferred-language.service';
import type { ProvinceTerritoryStateService } from '~/.server/domain/services/province-territory-state.service';
import type { ProvincialGovernmentInsurancePlanService } from '~/.server/domain/services/provincial-government-insurance-plan.service';

export interface ContainerServiceProvider {
  getClientFriendlyStatusService(): ClientFriendlyStatusService;
  getCountryService(): CountryService;
  getFederalGovernmentInsurancePlanService(): FederalGovernmentInsurancePlanService;
  getMaritalStatusService(): MaritalStatusService;
  getPreferredCommunicationMethodService(): PreferredCommunicationMethodService;
  getPreferredLanguageService(): PreferredLanguageService;
  getProvinceTerritoryStateService(): ProvinceTerritoryStateService;
  getProvincialGovernmentInsurancePlanService(): ProvincialGovernmentInsurancePlanService;
}

@injectable()
export class ContainerServiceProviderImpl implements ContainerServiceProvider {
  constructor(private readonly container: Container) {}

  getClientFriendlyStatusService(): ClientFriendlyStatusService {
    return this.container.get<ClientFriendlyStatusService>(SERVICE_IDENTIFIER.CLIENT_FRIENDLY_STATUS_SERVICE);
  }

  getCountryService(): CountryService {
    return this.container.get<CountryService>(SERVICE_IDENTIFIER.COUNTRY_SERVICE);
  }

  getFederalGovernmentInsurancePlanService(): FederalGovernmentInsurancePlanService {
    return this.container.get<FederalGovernmentInsurancePlanService>(SERVICE_IDENTIFIER.FEDERAL_GOVERNMENT_INSURANCE_PLAN_SERVICE);
  }

  getMaritalStatusService(): MaritalStatusService {
    return this.container.get<MaritalStatusService>(SERVICE_IDENTIFIER.MARITAL_STATUS_SERVICE);
  }

  getPreferredCommunicationMethodService(): PreferredCommunicationMethodService {
    return this.container.get<PreferredCommunicationMethodService>(SERVICE_IDENTIFIER.PREFERRED_COMMUNICATION_METHOD_SERVICE);
  }

  getPreferredLanguageService(): PreferredLanguageService {
    return this.container.get<PreferredLanguageService>(SERVICE_IDENTIFIER.PREFERRED_LANGUAGE_SERVICE);
  }

  getProvinceTerritoryStateService(): ProvinceTerritoryStateService {
    return this.container.get<ProvinceTerritoryStateService>(SERVICE_IDENTIFIER.PROVINCE_TERRITORY_STATE_SERVICE);
  }

  getProvincialGovernmentInsurancePlanService(): ProvincialGovernmentInsurancePlanService {
    return this.container.get<ProvincialGovernmentInsurancePlanService>(SERVICE_IDENTIFIER.PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_SERVICE);
  }
}
