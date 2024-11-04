import { inject, injectable, optional } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type {
  AddressValidationService,
  ApplicantService,
  AuditService,
  BenefitRenewalService,
  ClientApplicationService,
  ClientFriendlyStatusService,
  CountryService,
  DemographicSurveyService,
  FederalGovernmentInsurancePlanService,
  LetterService,
  LetterTypeService,
  MaritalStatusService,
  PreferredCommunicationMethodService,
  PreferredLanguageService,
  ProvinceTerritoryStateService,
  ProvincialGovernmentInsurancePlanService,
  RedisService,
  SessionService,
} from '~/.server/domain/services';
import type { HCaptchaService } from '~/.server/web/services';

export interface ContainerServiceProvider {
  getAddressValidationService(): AddressValidationService;
  getApplicantService(): ApplicantService;
  getAuditService(): AuditService;
  getBenefitRenewalService(): BenefitRenewalService;
  getClientApplicationService(): ClientApplicationService;
  getClientFriendlyStatusService(): ClientFriendlyStatusService;
  getCountryService(): CountryService;
  getFederalGovernmentInsurancePlanService(): FederalGovernmentInsurancePlanService;
  getHCaptchaService(): HCaptchaService;
  getLetterService(): LetterService;
  getLetterTypeService(): LetterTypeService;
  getMaritalStatusService(): MaritalStatusService;
  getPreferredCommunicationMethodService(): PreferredCommunicationMethodService;
  getPreferredLanguageService(): PreferredLanguageService;
  getProvinceTerritoryStateService(): ProvinceTerritoryStateService;
  getProvincialGovernmentInsurancePlanService(): ProvincialGovernmentInsurancePlanService;
  getRedisService(): RedisService | undefined;
  getSessionService(): SessionService;
  getDemographicSurveyService(): DemographicSurveyService;
}

@injectable()
export class ContainerServiceProviderImpl implements ContainerServiceProvider {
  constructor(
    @inject(SERVICE_IDENTIFIER.ADDRESS_VALIDATION_SERVICE) private readonly addressValidationService: AddressValidationService,
    @inject(SERVICE_IDENTIFIER.APPLICANT_SERVICE) private readonly applicantService: ApplicantService,
    @inject(SERVICE_IDENTIFIER.AUDIT_SERVICE) private readonly auditService: AuditService,
    @inject(SERVICE_IDENTIFIER.BENEFIT_RENEWAL_SERVICE) private readonly benefitRenewalService: BenefitRenewalService,
    @inject(SERVICE_IDENTIFIER.CLIENT_APPLICATION_SERVICE) private readonly clientApplicationService: ClientApplicationService,
    @inject(SERVICE_IDENTIFIER.CLIENT_FRIENDLY_STATUS_SERVICE) private readonly clientFriendlyStatusService: ClientFriendlyStatusService,
    @inject(SERVICE_IDENTIFIER.COUNTRY_SERVICE) private readonly countryService: CountryService,
    @inject(SERVICE_IDENTIFIER.FEDERAL_GOVERNMENT_INSURANCE_PLAN_SERVICE) private readonly federalGovernmentInsurancePlanService: FederalGovernmentInsurancePlanService,
    @inject(SERVICE_IDENTIFIER.HCAPTCHA_SERVICE) private readonly hCaptchaService: HCaptchaService,
    @inject(SERVICE_IDENTIFIER.LETTER_SERVICE) private readonly letterService: LetterService,
    @inject(SERVICE_IDENTIFIER.LETTER_TYPE_SERVICE) private readonly letterTypeService: LetterTypeService,
    @inject(SERVICE_IDENTIFIER.MARITAL_STATUS_SERVICE) private readonly maritalStatusService: MaritalStatusService,
    @inject(SERVICE_IDENTIFIER.PREFERRED_COMMUNICATION_METHOD_SERVICE) private readonly preferredCommunicationMethodService: PreferredCommunicationMethodService,
    @inject(SERVICE_IDENTIFIER.PREFERRED_LANGUAGE_SERVICE) private readonly preferredLanguageService: PreferredLanguageService,
    @inject(SERVICE_IDENTIFIER.PROVINCE_TERRITORY_STATE_SERVICE) private readonly provinceTerritoryStateService: ProvinceTerritoryStateService,
    @inject(SERVICE_IDENTIFIER.PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_SERVICE) private readonly provincialGovernmentInsurancePlanService: ProvincialGovernmentInsurancePlanService,
    @inject(SERVICE_IDENTIFIER.REDIS_SERVICE) @optional() private readonly redisService: RedisService | undefined,
    @inject(SERVICE_IDENTIFIER.SESSION_SERVICE) private readonly sessionService: SessionService,
    @inject(SERVICE_IDENTIFIER.DEMOGRAPHIC_SURVEY_SERVICE) private readonly demographicSurveyService: DemographicSurveyService,
  ) {}

  getAddressValidationService(): AddressValidationService {
    return this.addressValidationService;
  }

  getApplicantService(): ApplicantService {
    return this.applicantService;
  }

  getAuditService(): AuditService {
    return this.auditService;
  }

  getBenefitRenewalService(): BenefitRenewalService {
    return this.benefitRenewalService;
  }

  getClientApplicationService(): ClientApplicationService {
    return this.clientApplicationService;
  }

  getClientFriendlyStatusService(): ClientFriendlyStatusService {
    return this.clientFriendlyStatusService;
  }

  getCountryService(): CountryService {
    return this.countryService;
  }

  getFederalGovernmentInsurancePlanService(): FederalGovernmentInsurancePlanService {
    return this.federalGovernmentInsurancePlanService;
  }

  getHCaptchaService(): HCaptchaService {
    return this.hCaptchaService;
  }

  getLetterService(): LetterService {
    return this.letterService;
  }

  getLetterTypeService(): LetterTypeService {
    return this.letterTypeService;
  }

  getMaritalStatusService(): MaritalStatusService {
    return this.maritalStatusService;
  }

  getPreferredCommunicationMethodService(): PreferredCommunicationMethodService {
    return this.preferredCommunicationMethodService;
  }

  getPreferredLanguageService(): PreferredLanguageService {
    return this.preferredLanguageService;
  }

  getProvinceTerritoryStateService(): ProvinceTerritoryStateService {
    return this.provinceTerritoryStateService;
  }

  getProvincialGovernmentInsurancePlanService(): ProvincialGovernmentInsurancePlanService {
    return this.provincialGovernmentInsurancePlanService;
  }

  getRedisService(): RedisService | undefined {
    return this.redisService;
  }

  getSessionService(): SessionService {
    return this.sessionService;
  }

  getDemographicSurveyService(): DemographicSurveyService {
    return this.demographicSurveyService;
  }
}
