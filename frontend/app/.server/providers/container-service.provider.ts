import type { Container } from 'inversify';
import { injectable } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type {
  AddressValidationService,
  BenefitRenewalService,
  ClientApplicationService,
  ClientFriendlyStatusService,
  CountryService,
  FederalGovernmentInsurancePlanService,
  MaritalStatusService,
  PreferredCommunicationMethodService,
  PreferredLanguageService,
  ProvinceTerritoryStateService,
  ProvincialGovernmentInsurancePlanService,
} from '~/.server/domain/services';

export interface ContainerServiceProvider {
  getAddressValidationService(): AddressValidationService;
  getBenefitRenewalService(): BenefitRenewalService;
  getClientApplicationService(): ClientApplicationService;
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

  getAddressValidationService(): AddressValidationService {
    return this.container.get<AddressValidationService>(SERVICE_IDENTIFIER.ADDRESS_VALIDATION_SERVICE);
  }

  getBenefitRenewalService(): BenefitRenewalService {
    return this.container.get<BenefitRenewalService>(SERVICE_IDENTIFIER.BENEFIT_RENEWAL_SERVICE);
  }

  getClientApplicationService(): ClientApplicationService {
    return this.container.get<ClientApplicationService>(SERVICE_IDENTIFIER.CLIENT_APPLICATION_SERVICE);
  }

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
