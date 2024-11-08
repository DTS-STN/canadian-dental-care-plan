import type { interfaces } from 'inversify';

import type { ClientConfig, ServerConfig } from '~/.server/configs';
import type {
  AddressValidationDtoMapper,
  ApplicantDtoMapper,
  ApplicationStatusDtoMapper,
  BenefitRenewalDtoMapper,
  ClientApplicationDtoMapper,
  ClientFriendlyStatusDtoMapper,
  CountryDtoMapper,
  DemographicSurveyDtoMapper,
  FederalGovernmentInsurancePlanDtoMapper,
  LetterDtoMapper,
  LetterTypeDtoMapper,
  MaritalStatusDtoMapper,
  PreferredCommunicationMethodDtoMapper,
  PreferredLanguageDtoMapper,
  ProvinceTerritoryStateDtoMapper,
  ProvincialGovernmentInsurancePlanDtoMapper,
} from '~/.server/domain/mappers';
import type {
  AddressValidationRepository,
  ApplicantRepository,
  ApplicationStatusRepository,
  BenefitRenewalRepository,
  ClientApplicationRepository,
  ClientFriendlyStatusRepository,
  CountryRepository,
  DemographicSurveyRepository,
  FederalGovernmentInsurancePlanRepository,
  LetterRepository,
  LetterTypeRepository,
  MaritalStatusRepository,
  PreferredCommunicationMethodRepository,
  PreferredLanguageRepository,
  ProvinceTerritoryStateRepository,
  ProvincialGovernmentInsurancePlanRepository,
} from '~/.server/domain/repositories';
import type {
  AddressValidationService,
  ApplicantService,
  ApplicationStatusService,
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
import type { ConfigFactory, LogFactory } from '~/.server/factories';
import type { HCaptchaDtoMapper } from '~/.server/web/mappers';
import type { HCaptchaRepository } from '~/.server/web/repositories';
import type { HCaptchaService } from '~/.server/web/services';
import type { CsrfTokenValidator } from '~/.server/web/validators';

/**
 * A type representing a service identifier for dependency injection purposes.
 * The identifier excludes `string` and `symbol` types, allowing only specific types
 * from the `interfaces.ServiceIdentifier`.
 *
 * @template T - The type associated with the service identifier.
 */
export type ServiceIdentifier<T = unknown> = Exclude<interfaces.ServiceIdentifier<T>, string | symbol>;

/**
 * A constant object defining various service identifiers for dependency injection.
 * These identifiers are used to register and resolve services in a dependency container.
 */
export const TYPES = {
  AddressValidationDtoMapper: serviceIdentifier<AddressValidationDtoMapper>('AddressValidationDtoMapper'),
  AddressValidationRepository: serviceIdentifier<AddressValidationRepository>('AddressValidationRepository'),
  AddressValidationService: serviceIdentifier<AddressValidationService>('AddressValidationService'),
  ApplicantDtoMapper: serviceIdentifier<ApplicantDtoMapper>('ApplicantDtoMapper'),
  ApplicantRepository: serviceIdentifier<ApplicantRepository>('ApplicantRepository'),
  ApplicantService: serviceIdentifier<ApplicantService>('ApplicantService'),
  ApplicationStatusDtoMapper: serviceIdentifier<ApplicationStatusDtoMapper>('ApplicationStatusDtoMapper'),
  ApplicationStatusRepository: serviceIdentifier<ApplicationStatusRepository>('ApplicationStatusRepository'),
  ApplicationStatusService: serviceIdentifier<ApplicationStatusService>('ApplicationStatusService'),
  AuditService: serviceIdentifier<AuditService>('AuditService'),
  BenefitRenewalDtoMapper: serviceIdentifier<BenefitRenewalDtoMapper>('BenefitRenewalDtoMapper'),
  BenefitRenewalRepository: serviceIdentifier<BenefitRenewalRepository>('BenefitRenewalRepository'),
  BenefitRenewalService: serviceIdentifier<BenefitRenewalService>('BenefitRenewalService'),
  ClientApplicationDtoMapper: serviceIdentifier<ClientApplicationDtoMapper>('ClientApplicationDtoMapper'),
  ClientApplicationRepository: serviceIdentifier<ClientApplicationRepository>('ClientApplicationRepository'),
  ClientApplicationService: serviceIdentifier<ClientApplicationService>('ClientApplicationService'),
  ClientConfig: serviceIdentifier<ClientConfig>('ClientConfig'),
  ClientFriendlyStatusDtoMapper: serviceIdentifier<ClientFriendlyStatusDtoMapper>('ClientFriendlyStatusDtoMapper'),
  ClientFriendlyStatusRepository: serviceIdentifier<ClientFriendlyStatusRepository>('ClientFriendlyStatusRepository'),
  ClientFriendlyStatusService: serviceIdentifier<ClientFriendlyStatusService>('ClientFriendlyStatusService'),
  ConfigFactory: serviceIdentifier<ConfigFactory>('ConfigFactory'),
  CountryDtoMapper: serviceIdentifier<CountryDtoMapper>('CountryDtoMapper'),
  CountryRepository: serviceIdentifier<CountryRepository>('CountryRepository'),
  CountryService: serviceIdentifier<CountryService>('CountryService'),
  DemographicSurveyDtoMapper: serviceIdentifier<DemographicSurveyDtoMapper>('DemographicSurveyDtoMapper'),
  DemographicSurveyRepository: serviceIdentifier<DemographicSurveyRepository>('DemographicSurveyRepository'),
  DemographicSurveyService: serviceIdentifier<DemographicSurveyService>('DemographicSurveyService'),
  FederalGovernmentInsurancePlanDtoMapper: serviceIdentifier<FederalGovernmentInsurancePlanDtoMapper>('FederalGovernmentInsurancePlanDtoMapper'),
  FederalGovernmentInsurancePlanRepository: serviceIdentifier<FederalGovernmentInsurancePlanRepository>('FederalGovernmentInsurancePlanRepository'),
  FederalGovernmentInsurancePlanService: serviceIdentifier<FederalGovernmentInsurancePlanService>('FederalGovernmentInsurancePlanService'),
  HCaptchaDtoMapper: serviceIdentifier<HCaptchaDtoMapper>('HCaptchaDtoMapper'),
  HCaptchaRepository: serviceIdentifier<HCaptchaRepository>('HCaptchaRepository'),
  HCaptchaService: serviceIdentifier<HCaptchaService>('HCaptchaService'),
  LetterDtoMapper: serviceIdentifier<LetterDtoMapper>('LetterDtoMapper'),
  LetterRepository: serviceIdentifier<LetterRepository>('LetterRepository'),
  LetterService: serviceIdentifier<LetterService>('LetterService'),
  LetterTypeDtoMapper: serviceIdentifier<LetterTypeDtoMapper>('LetterTypeDtoMapper'),
  LetterTypeRepository: serviceIdentifier<LetterTypeRepository>('LetterTypeRepository'),
  LetterTypeService: serviceIdentifier<LetterTypeService>('LetterTypeService'),
  LogFactory: serviceIdentifier<LogFactory>('LogFactory'),
  MaritalStatusDtoMapper: serviceIdentifier<MaritalStatusDtoMapper>('MaritalStatusDtoMapper'),
  MaritalStatusRepository: serviceIdentifier<MaritalStatusRepository>('MaritalStatusRepository'),
  MaritalStatusService: serviceIdentifier<MaritalStatusService>('MaritalStatusService'),
  PreferredCommunicationMethodDtoMapper: serviceIdentifier<PreferredCommunicationMethodDtoMapper>('PreferredCommunicationMethodDtoMapper'),
  PreferredCommunicationMethodRepository: serviceIdentifier<PreferredCommunicationMethodRepository>('PreferredCommunicationMethodRepository'),
  PreferredCommunicationMethodService: serviceIdentifier<PreferredCommunicationMethodService>('PreferredCommunicationMethodService'),
  PreferredLanguageDtoMapper: serviceIdentifier<PreferredLanguageDtoMapper>('PreferredLanguageDtoMapper'),
  PreferredLanguageRepository: serviceIdentifier<PreferredLanguageRepository>('PreferredLanguageRepository'),
  PreferredLanguageService: serviceIdentifier<PreferredLanguageService>('PreferredLanguageService'),
  ProvinceTerritoryStateDtoMapper: serviceIdentifier<ProvinceTerritoryStateDtoMapper>('ProvinceTerritoryStateDtoMapper'),
  ProvinceTerritoryStateRepository: serviceIdentifier<ProvinceTerritoryStateRepository>('ProvinceTerritoryStateRepository'),
  ProvinceTerritoryStateService: serviceIdentifier<ProvinceTerritoryStateService>('ProvinceTerritoryStateService'),
  ProvincialGovernmentInsurancePlanDtoMapper: serviceIdentifier<ProvincialGovernmentInsurancePlanDtoMapper>('ProvincialGovernmentInsurancePlanDtoMapper'),
  ProvincialGovernmentInsurancePlanRepository: serviceIdentifier<ProvincialGovernmentInsurancePlanRepository>('ProvincialGovernmentInsurancePlanRepository'),
  ProvincialGovernmentInsurancePlanService: serviceIdentifier<ProvincialGovernmentInsurancePlanService>('ProvincialGovernmentInsurancePlanService'),
  RedisService: serviceIdentifier<RedisService>('RedisService'),
  ServerConfig: serviceIdentifier<ServerConfig>('ServerConfig'),
  SessionService: serviceIdentifier<SessionService>('SessionService'),
  Web_CsrfTokenValidator: serviceIdentifier<CsrfTokenValidator>('WebCsrfTokenValidator'),
} as const satisfies Record<string, ServiceIdentifier>;

function serviceIdentifier<T>(identifier: string): ServiceIdentifier<T> {
  return Symbol.for(identifier) as unknown as ServiceIdentifier<T>;
}
