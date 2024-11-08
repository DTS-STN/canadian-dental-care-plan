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
import { assignServiceIdentifiers, serviceIdentifier as serviceId } from '~/.server/utils/service-identifier.utils';
import type { HCaptchaDtoMapper } from '~/.server/web/mappers';
import type { HCaptchaRepository } from '~/.server/web/repositories';
import type { HCaptchaService } from '~/.server/web/services';
import type { CsrfTokenValidator } from '~/.server/web/validators';

/**
 * Represents a service identifier for dependency injection purposes.
 * The identifier restricts the use of `string` and `symbol` types, allowing only specific types
 * from `interfaces.ServiceIdentifier` to be used for registering and resolving dependencies.
 *
 * @template T - The type associated with the service identifier.
 * @example
 * ```typescript
 * const identifier: ServiceIdentifier<ExampleService> = serviceIdentifier('ExampleService');
 * ```
 */
export type ServiceIdentifier<T> = Exclude<interfaces.ServiceIdentifier<T>, string | symbol>;

/**
 * Recursive type defining the structure of the service identifier registry.
 * Allows nesting of `Types` objects to create hierarchical structures.
 *
 * @template T - Type associated with each key in the registry.
 * @example
 * ```typescript
 * const exampleRegistry: Types = {
 *   ExampleService: serviceId<ExampleService>(),
 *   nested: {
 *     NestedService: serviceId<NestedService>()
 *   }
 * };
 * ```
 */
export type TypesContant<T = unknown> = Readonly<{
  // The index signature ensures that the registry can hold a string key with either a
  // service identifier or another nested `Types` object.
  [key: string]: ServiceIdentifier<T> | TypesContant<T>;
}>;

/**
 * Contains service identifiers for dependency injection, structured by categories for easier organization.
 * This constant provides unique identifiers for each service, repository, and mapper used in the application.
 *
 * @example
 * ```typescript
 * const addressValidationService = container.get(TYPES.AddressValidationService);
 * const applicantDtoMapper = container.get(TYPES.ApplicantDtoMapper);
 * ```
 */
export const TYPES = assignServiceIdentifiers({
  AddressValidationDtoMapper: serviceId<AddressValidationDtoMapper>(),
  AddressValidationRepository: serviceId<AddressValidationRepository>(),
  AddressValidationService: serviceId<AddressValidationService>(),
  ApplicantDtoMapper: serviceId<ApplicantDtoMapper>(),
  ApplicantRepository: serviceId<ApplicantRepository>(),
  ApplicantService: serviceId<ApplicantService>(),
  ApplicationStatusDtoMapper: serviceId<ApplicationStatusDtoMapper>(),
  ApplicationStatusRepository: serviceId<ApplicationStatusRepository>(),
  ApplicationStatusService: serviceId<ApplicationStatusService>(),
  AuditService: serviceId<AuditService>(),
  BenefitRenewalDtoMapper: serviceId<BenefitRenewalDtoMapper>(),
  BenefitRenewalRepository: serviceId<BenefitRenewalRepository>(),
  BenefitRenewalService: serviceId<BenefitRenewalService>(),
  ClientApplicationDtoMapper: serviceId<ClientApplicationDtoMapper>(),
  ClientApplicationRepository: serviceId<ClientApplicationRepository>(),
  ClientApplicationService: serviceId<ClientApplicationService>(),
  ClientConfig: serviceId<ClientConfig>(),
  ClientFriendlyStatusDtoMapper: serviceId<ClientFriendlyStatusDtoMapper>(),
  ClientFriendlyStatusRepository: serviceId<ClientFriendlyStatusRepository>(),
  ClientFriendlyStatusService: serviceId<ClientFriendlyStatusService>(),
  ConfigFactory: serviceId<ConfigFactory>(),
  CountryDtoMapper: serviceId<CountryDtoMapper>(),
  CountryRepository: serviceId<CountryRepository>(),
  CountryService: serviceId<CountryService>(),
  DemographicSurveyDtoMapper: serviceId<DemographicSurveyDtoMapper>(),
  DemographicSurveyRepository: serviceId<DemographicSurveyRepository>(),
  DemographicSurveyService: serviceId<DemographicSurveyService>(),
  FederalGovernmentInsurancePlanDtoMapper: serviceId<FederalGovernmentInsurancePlanDtoMapper>(),
  FederalGovernmentInsurancePlanRepository: serviceId<FederalGovernmentInsurancePlanRepository>(),
  FederalGovernmentInsurancePlanService: serviceId<FederalGovernmentInsurancePlanService>(),
  HCaptchaDtoMapper: serviceId<HCaptchaDtoMapper>(),
  HCaptchaRepository: serviceId<HCaptchaRepository>(),
  HCaptchaService: serviceId<HCaptchaService>(),
  LetterDtoMapper: serviceId<LetterDtoMapper>(),
  LetterRepository: serviceId<LetterRepository>(),
  LetterService: serviceId<LetterService>(),
  LetterTypeDtoMapper: serviceId<LetterTypeDtoMapper>(),
  LetterTypeRepository: serviceId<LetterTypeRepository>(),
  LetterTypeService: serviceId<LetterTypeService>(),
  LogFactory: serviceId<LogFactory>(),
  MaritalStatusDtoMapper: serviceId<MaritalStatusDtoMapper>(),
  MaritalStatusRepository: serviceId<MaritalStatusRepository>(),
  MaritalStatusService: serviceId<MaritalStatusService>(),
  PreferredCommunicationMethodDtoMapper: serviceId<PreferredCommunicationMethodDtoMapper>(),
  PreferredCommunicationMethodRepository: serviceId<PreferredCommunicationMethodRepository>(),
  PreferredCommunicationMethodService: serviceId<PreferredCommunicationMethodService>(),
  PreferredLanguageDtoMapper: serviceId<PreferredLanguageDtoMapper>(),
  PreferredLanguageRepository: serviceId<PreferredLanguageRepository>(),
  PreferredLanguageService: serviceId<PreferredLanguageService>(),
  ProvinceTerritoryStateDtoMapper: serviceId<ProvinceTerritoryStateDtoMapper>(),
  ProvinceTerritoryStateRepository: serviceId<ProvinceTerritoryStateRepository>(),
  ProvinceTerritoryStateService: serviceId<ProvinceTerritoryStateService>(),
  ProvincialGovernmentInsurancePlanDtoMapper: serviceId<ProvincialGovernmentInsurancePlanDtoMapper>(),
  ProvincialGovernmentInsurancePlanRepository: serviceId<ProvincialGovernmentInsurancePlanRepository>(),
  ProvincialGovernmentInsurancePlanService: serviceId<ProvincialGovernmentInsurancePlanService>(),
  RedisService: serviceId<RedisService>(),
  ServerConfig: serviceId<ServerConfig>(),
  SessionService: serviceId<SessionService>(),
  web: {
    validators: {
      CsrfTokenValidator: serviceId<CsrfTokenValidator>(),
    },
  },
} as const satisfies TypesContant);

export default { TYPES };
