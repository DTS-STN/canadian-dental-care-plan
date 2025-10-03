import type { HealthCheck } from '@dts-stn/health-checks';
import type { Newable } from 'inversify';

import type { BearerTokenResolver, TokenRolesExtractor } from '~/.server/auth';
import type { RaoidcService } from '~/.server/auth/raoidc.service';
import type { ClientConfig, ServerConfig } from '~/.server/configs';
import type { BuildInfoService } from '~/.server/core';
import type { RedisService } from '~/.server/data';
import type {
  AddressValidationDtoMapper,
  ApplicantDtoMapper,
  ApplicationStatusDtoMapper,
  ApplicationYearDtoMapper,
  BenefitApplicationDtoMapper,
  BenefitRenewalDtoMapper,
  ClientApplicationDtoMapper,
  ClientFriendlyStatusDtoMapper,
  CountryDtoMapper,
  DemographicSurveyDtoMapper,
  FederalGovernmentInsurancePlanDtoMapper,
  LanguageDtoMapper,
  LetterDtoMapper,
  LetterTypeDtoMapper,
  ProvinceTerritoryStateDtoMapper,
  ProvincialGovernmentInsurancePlanDtoMapper,
  VerificationCodeDtoMapper,
} from '~/.server/domain/mappers';
import type {
  AddressValidationRepository,
  ApplicantDocumentRepository,
  ApplicantRepository,
  ApplicationStatusRepository,
  ApplicationYearRepository,
  BenefitApplicationRepository,
  BenefitRenewalRepository,
  ClientApplicationRepository,
  ClientFriendlyStatusRepository,
  CountryRepository,
  DemographicSurveyRepository,
  GovernmentInsurancePlanRepository,
  LetterRepository,
  LetterTypeRepository,
  ProfileRepository,
  ProvinceTerritoryStateRepository,
  VerificationCodeRepository,
} from '~/.server/domain/repositories';
import type {
  AddressValidationService,
  ApplicantDocumentService,
  ApplicantService,
  ApplicationStatusService,
  ApplicationYearService,
  AuditService,
  BenefitApplicationService,
  BenefitRenewalService,
  ClientApplicationService,
  ClientFriendlyStatusService,
  CountryService,
  DemographicSurveyService,
  FederalGovernmentInsurancePlanService,
  LanguageService,
  LetterService,
  LetterTypeService,
  ProfileService,
  ProvinceTerritoryStateService,
  ProvincialGovernmentInsurancePlanService,
  VerificationCodeService,
} from '~/.server/domain/services';
import type { HttpClient } from '~/.server/http';
import type { InstrumentationService } from '~/.server/observability';
import type { BenefitApplicationStateMapper, BenefitRenewalStateMapper } from '~/.server/routes/mappers';
import type { SecurityHandler } from '~/.server/routes/security';
import type { AddressValidatorFactory, HomeAddressValidatorFactory, MailingAddressValidatorFactory } from '~/.server/routes/validators';
import { assignServiceIdentifiers, serviceIdentifier as serviceId } from '~/.server/utils/service-identifier.utils';
import type { HCaptchaDtoMapper } from '~/.server/web/mappers';
import type { DynatraceDtoMapper } from '~/.server/web/mappers/dynatrace.dto.mapper';
import type { DynatraceRepository, HCaptchaRepository } from '~/.server/web/repositories';
import type { DynatraceService, HCaptchaService } from '~/.server/web/services';
import type { CsrfTokenValidator, HCaptchaValidator, RaoidcSessionValidator } from '~/.server/web/validators';

/**
 * Represents a type-safe service identifier used for dependency injection.
 *
 * This type enforces that only class constructors (`Newable<T>`) can be used
 * as service identifiers, avoiding plain strings or symbols.
 *
 * @template TInstance - The class or service instance associated with the identifier.
 *
 * @example
 * ```ts
 * const id: ServiceIdentifier<MyService> = serviceIdentifier('MyService');
 * ```
 */
export type ServiceIdentifier<TInstance = unknown> = Newable<TInstance>;

/**
 * Describes a map of service identifiers that can be used in a dependency injection container.
 *
 * This type is recursive, allowing for nested namespaces or categories (e.g., `Routes`, `Web`, `Core`).
 * Each property is either:
 * - A `ServiceIdentifier<T>`, or
 * - Another `ServiceTypesMap`, supporting deep hierarchies.
 *
 * @template T - The base type for services in the map (defaults to `unknown`).
 *
 * @example
 * ```ts
 * const TYPES: ServiceTypesMap = {
 *   MyService: serviceIdentifier<MyService>(),
 *   web: {
 *     HttpClient: serviceIdentifier<HttpClient>(),
 *   },
 * };
 * ```
 */
export type ServiceTypesMap<T = unknown> = Readonly<{
  [key: string]: ServiceIdentifier<T> | ServiceTypesMap<T>;
}>;

/**
 * Collection of service identifiers used by the dependency injection container.
 *
 * This registry organizes all services, repositories, mappers, validators, and other
 * dependencies into a single structured object for easy lookup and type safety.
 *
 * Use this to register or retrieve dependencies from the container:
 *
 * @example
 * ```ts
 * const service = container.get(TYPES.MyService);
 * const validator = container.get(TYPES.HomeAddressValidatorFactory);
 * ```
 *
 * Each identifier is created using `serviceIdentifier<T>()`, ensuring type safety.
 *
 * @see assignServiceIdentifiers - Helper function that recursively applies identifiers.
 */
export const TYPES = assignServiceIdentifiers({
  AddressValidationDtoMapper: serviceId<AddressValidationDtoMapper>(),
  AddressValidationRepository: serviceId<AddressValidationRepository>(),
  AddressValidationService: serviceId<AddressValidationService>(),
  AddressValidatorFactory: serviceId<AddressValidatorFactory>(),
  ApplicantDocumentRepository: serviceId<ApplicantDocumentRepository>(),
  ApplicantDocumentService: serviceId<ApplicantDocumentService>(),
  ApplicantDtoMapper: serviceId<ApplicantDtoMapper>(),
  ApplicantRepository: serviceId<ApplicantRepository>(),
  ApplicantService: serviceId<ApplicantService>(),
  ApplicationStatusDtoMapper: serviceId<ApplicationStatusDtoMapper>(),
  ApplicationStatusRepository: serviceId<ApplicationStatusRepository>(),
  ApplicationStatusService: serviceId<ApplicationStatusService>(),
  ApplicationYearDtoMapper: serviceId<ApplicationYearDtoMapper>(),
  ApplicationYearRepository: serviceId<ApplicationYearRepository>(),
  ApplicationYearService: serviceId<ApplicationYearService>(),
  AuditService: serviceId<AuditService>(),
  BearerTokenResolver: serviceId<BearerTokenResolver>(),
  BenefitApplicationDtoMapper: serviceId<BenefitApplicationDtoMapper>(),
  BenefitApplicationRepository: serviceId<BenefitApplicationRepository>(),
  BenefitApplicationService: serviceId<BenefitApplicationService>(),
  BenefitApplicationStateMapper: serviceId<BenefitApplicationStateMapper>(),
  BenefitRenewalDtoMapper: serviceId<BenefitRenewalDtoMapper>(),
  BenefitRenewalRepository: serviceId<BenefitRenewalRepository>(),
  BenefitRenewalService: serviceId<BenefitRenewalService>(),
  BenefitRenewalStateMapper: serviceId<BenefitRenewalStateMapper>(),
  BuildInfoService: serviceId<BuildInfoService>(),
  ClientApplicationDtoMapper: serviceId<ClientApplicationDtoMapper>(),
  ClientApplicationRepository: serviceId<ClientApplicationRepository>(),
  ClientApplicationService: serviceId<ClientApplicationService>(),
  ClientConfig: serviceId<ClientConfig>(),
  ClientFriendlyStatusDtoMapper: serviceId<ClientFriendlyStatusDtoMapper>(),
  ClientFriendlyStatusRepository: serviceId<ClientFriendlyStatusRepository>(),
  ClientFriendlyStatusService: serviceId<ClientFriendlyStatusService>(),
  CountryDtoMapper: serviceId<CountryDtoMapper>(),
  CountryRepository: serviceId<CountryRepository>(),
  CountryService: serviceId<CountryService>(),
  CsrfTokenValidator: serviceId<CsrfTokenValidator>(),
  DemographicSurveyDtoMapper: serviceId<DemographicSurveyDtoMapper>(),
  DemographicSurveyRepository: serviceId<DemographicSurveyRepository>(),
  DemographicSurveyService: serviceId<DemographicSurveyService>(),
  DynatraceDtoMapper: serviceId<DynatraceDtoMapper>(),
  DynatraceRepository: serviceId<DynatraceRepository>(),
  DynatraceService: serviceId<DynatraceService>(),
  FederalGovernmentInsurancePlanDtoMapper: serviceId<FederalGovernmentInsurancePlanDtoMapper>(),
  FederalGovernmentInsurancePlanService: serviceId<FederalGovernmentInsurancePlanService>(),
  GovernmentInsurancePlanRepository: serviceId<GovernmentInsurancePlanRepository>(),
  HCaptchaDtoMapper: serviceId<HCaptchaDtoMapper>(),
  HCaptchaRepository: serviceId<HCaptchaRepository>(),
  HCaptchaService: serviceId<HCaptchaService>(),
  HCaptchaValidator: serviceId<HCaptchaValidator>(),
  HealthCheck: serviceId<HealthCheck>(),
  HealthTokenRolesExtractor: serviceId<TokenRolesExtractor>(),
  HomeAddressValidatorFactory: serviceId<HomeAddressValidatorFactory>(),
  HttpClient: serviceId<HttpClient>(),
  InstrumentationService: serviceId<InstrumentationService>(),
  LanguageDtoMapper: serviceId<LanguageDtoMapper>(),
  LanguageService: serviceId<LanguageService>(),
  LetterDtoMapper: serviceId<LetterDtoMapper>(),
  LetterRepository: serviceId<LetterRepository>(),
  LetterService: serviceId<LetterService>(),
  LetterTypeDtoMapper: serviceId<LetterTypeDtoMapper>(),
  LetterTypeRepository: serviceId<LetterTypeRepository>(),
  LetterTypeService: serviceId<LetterTypeService>(),
  MailingAddressValidatorFactory: serviceId<MailingAddressValidatorFactory>(),
  ProvinceTerritoryStateDtoMapper: serviceId<ProvinceTerritoryStateDtoMapper>(),
  ProvinceTerritoryStateRepository: serviceId<ProvinceTerritoryStateRepository>(),
  ProvinceTerritoryStateService: serviceId<ProvinceTerritoryStateService>(),
  ProvincialGovernmentInsurancePlanDtoMapper: serviceId<ProvincialGovernmentInsurancePlanDtoMapper>(),
  ProvincialGovernmentInsurancePlanService: serviceId<ProvincialGovernmentInsurancePlanService>(),
  RaoidcService: serviceId<RaoidcService>(),
  RaoidcSessionValidator: serviceId<RaoidcSessionValidator>(),
  RedisService: serviceId<RedisService>(),
  SecurityHandler: serviceId<SecurityHandler>(),
  ServerConfig: serviceId<ServerConfig>(),
  VerificationCodeDtoMapper: serviceId<VerificationCodeDtoMapper>(),
  VerificationCodeRepository: serviceId<VerificationCodeRepository>(),
  VerificationCodeService: serviceId<VerificationCodeService>(),
  ProfileService: serviceId<ProfileService>(),
  ProfileRepository: serviceId<ProfileRepository>(),
} as const satisfies ServiceTypesMap);
