import { ContainerModule } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type {
  AddressValidationRepository,
  ApplicantRepository,
  BenefitRenewalRepository,
  ClientApplicationRepository,
  ClientFriendlyStatusRepository,
  CountryRepository,
  FederalGovernmentInsurancePlanRepository,
  MaritalStatusRepository,
  PreferredCommunicationMethodRepository,
  PreferredLanguageRepository,
  ProvinceTerritoryStateRepository,
  ProvincialGovernmentInsurancePlanRepository,
} from '~/.server/domain/repositories';
import {
  AddressValidationRepositoryImpl,
  ApplicantRepositoryImpl,
  BenefitRenewalRepositoryImpl,
  ClientApplicationRepositoryImpl,
  ClientFriendlyStatusRepositoryImpl,
  CountryRepositoryImpl,
  FederalGovernmentInsurancePlanRepositoryImpl,
  MaritalStatusRepositoryImpl,
  PreferredCommunicationMethodRepositoryImpl,
  PreferredLanguageRepositoryImpl,
  ProvinceTerritoryStateRepositoryImpl,
  ProvincialGovernmentInsurancePlanRepositoryImpl,
} from '~/.server/domain/repositories';

/**
 * Container module for repositories.
 */
export const repositoriesContainerModule = new ContainerModule((bind) => {
  bind<AddressValidationRepository>(SERVICE_IDENTIFIER.ADDRESS_VALIDATION_REPOSITORY).to(AddressValidationRepositoryImpl);
  bind<ApplicantRepository>(SERVICE_IDENTIFIER.APPLICANT_REPOSITORY).to(ApplicantRepositoryImpl);
  bind<BenefitRenewalRepository>(SERVICE_IDENTIFIER.BENEFIT_RENEWAL_REPOSITORY).to(BenefitRenewalRepositoryImpl);
  bind<ClientApplicationRepository>(SERVICE_IDENTIFIER.CLIENT_APPLICATION_REPOSITORY).to(ClientApplicationRepositoryImpl);
  bind<ClientFriendlyStatusRepository>(SERVICE_IDENTIFIER.CLIENT_FRIENDLY_STATUS_REPOSITORY).to(ClientFriendlyStatusRepositoryImpl);
  bind<CountryRepository>(SERVICE_IDENTIFIER.COUNTRY_REPOSITORY).to(CountryRepositoryImpl);
  bind<FederalGovernmentInsurancePlanRepository>(SERVICE_IDENTIFIER.FEDERAL_GOVERNMENT_INSURANCE_PLAN_REPOSITORY).to(FederalGovernmentInsurancePlanRepositoryImpl);
  bind<MaritalStatusRepository>(SERVICE_IDENTIFIER.MARITAL_STATUS_REPOSITORY).to(MaritalStatusRepositoryImpl);
  bind<PreferredCommunicationMethodRepository>(SERVICE_IDENTIFIER.PREFERRED_COMMUNICATION_METHOD_REPOSITORY).to(PreferredCommunicationMethodRepositoryImpl);
  bind<PreferredLanguageRepository>(SERVICE_IDENTIFIER.PREFERRED_LANGUAGE_REPOSITORY).to(PreferredLanguageRepositoryImpl);
  bind<ProvinceTerritoryStateRepository>(SERVICE_IDENTIFIER.PROVINCE_TERRITORY_STATE_REPOSITORY).to(ProvinceTerritoryStateRepositoryImpl);
  bind<ProvincialGovernmentInsurancePlanRepository>(SERVICE_IDENTIFIER.PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_REPOSITORY).to(ProvincialGovernmentInsurancePlanRepositoryImpl);
});
