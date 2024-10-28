import type { interfaces } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type {
  AddressValidationService,
  ApplicantService,
  AuditService,
  BenefitRenewalService,
  ClientApplicationService,
  ClientFriendlyStatusService,
  CountryService,
  FederalGovernmentInsurancePlanService,
  LetterTypeService,
  MaritalStatusService,
  PreferredCommunicationMethodService,
  PreferredLanguageService,
  ProvinceTerritoryStateService,
  ProvincialGovernmentInsurancePlanService,
  SessionService,
} from '~/.server/domain/services';

export interface ContainerServiceProvider {
  getAddressValidationService(): AddressValidationService;
  getApplicantService(): ApplicantService;
  getAuditService(): AuditService;
  getBenefitRenewalService(): BenefitRenewalService;
  getClientApplicationService(): ClientApplicationService;
  getClientFriendlyStatusService(): ClientFriendlyStatusService;
  getCountryService(): CountryService;
  getFederalGovernmentInsurancePlanService(): FederalGovernmentInsurancePlanService;
  getLetterTypeService(): LetterTypeService;
  getMaritalStatusService(): MaritalStatusService;
  getPreferredCommunicationMethodService(): PreferredCommunicationMethodService;
  getPreferredLanguageService(): PreferredLanguageService;
  getProvinceTerritoryStateService(): ProvinceTerritoryStateService;
  getProvincialGovernmentInsurancePlanService(): ProvincialGovernmentInsurancePlanService;
  getSessionService(): SessionService;
}

export class ContainerServiceProviderImpl implements ContainerServiceProvider {
  constructor(private readonly container: interfaces.Container) {}

  getAddressValidationService(): AddressValidationService {
    return this.container.get<AddressValidationService>(SERVICE_IDENTIFIER.ADDRESS_VALIDATION_SERVICE);
  }

  getApplicantService(): ApplicantService {
    return this.container.get<ApplicantService>(SERVICE_IDENTIFIER.APPLICANT_SERVICE);
  }

  getAuditService(): AuditService {
    return this.container.get<AuditService>(SERVICE_IDENTIFIER.AUDIT_SERVICE);
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

  getLetterTypeService(): LetterTypeService {
    return this.container.get<LetterTypeService>(SERVICE_IDENTIFIER.LETTER_TYPE_SERVICE);
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

  getSessionService(): SessionService {
    return this.container.get<SessionService>(SERVICE_IDENTIFIER.SESSION_SERVICE);
  }
}
