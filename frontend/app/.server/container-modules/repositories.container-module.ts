import { ContainerModule } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants/service-identifier.contant';
import type { ClientApplicationRepository } from '~/.server/domain/repositories/client-application.repository';
import { ClientApplicationRepositoryImpl } from '~/.server/domain/repositories/client-application.repository';
import type { ClientFriendlyStatusRepository } from '~/.server/domain/repositories/client-friendly-status.repository';
import { ClientFriendlyStatusRepositoryImpl } from '~/.server/domain/repositories/client-friendly-status.repository';
import type { CountryRepository } from '~/.server/domain/repositories/country.repository';
import { CountryRepositoryImpl } from '~/.server/domain/repositories/country.repository';
import type { FederalGovernmentInsurancePlanRepository } from '~/.server/domain/repositories/federal-government-insurance-plan.repository';
import { FederalGovernmentInsurancePlanRepositoryImpl } from '~/.server/domain/repositories/federal-government-insurance-plan.repository';
import type { MaritalStatusRepository } from '~/.server/domain/repositories/marital-status.repository';
import { MaritalStatusRepositoryImpl } from '~/.server/domain/repositories/marital-status.repository';
import type { PreferredCommunicationMethodRepository } from '~/.server/domain/repositories/preferred-communication-method.repository';
import { PreferredCommunicationMethodRepositoryImpl } from '~/.server/domain/repositories/preferred-communication-method.repository';
import type { PreferredLanguageRepository } from '~/.server/domain/repositories/preferred-language.repository';
import { PreferredLanguageRepositoryImpl } from '~/.server/domain/repositories/preferred-language.repository';
import type { ProvinceTerritoryStateRepository } from '~/.server/domain/repositories/province-territory-state.repository';
import { ProvinceTerritoryStateRepositoryImpl } from '~/.server/domain/repositories/province-territory-state.repository';
import type { ProvincialGovernmentInsurancePlanRepository } from '~/.server/domain/repositories/provincial-government-insurance-plan.repository';
import { ProvincialGovernmentInsurancePlanRepositoryImpl } from '~/.server/domain/repositories/provincial-government-insurance-plan.repository';

/**
 * Container module for repositories.
 */
export const repositoriesContainerModule = new ContainerModule((bind) => {
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
