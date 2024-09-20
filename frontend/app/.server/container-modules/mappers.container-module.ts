import { ContainerModule } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants/service-identifier.contant';
import { ClientApplicationDtoMapperImpl } from '~/.server/domain/mappers/client-application.dto.mapper';
import type { ClientApplicationDtoMapper } from '~/.server/domain/mappers/client-application.dto.mapper';
import type { ClientFriendlyStatusDtoMapper } from '~/.server/domain/mappers/client-friendly-status.dto.mapper';
import { ClientFriendlyStatusDtoMapperImpl } from '~/.server/domain/mappers/client-friendly-status.dto.mapper';
import type { CountryDtoMapper } from '~/.server/domain/mappers/country.dto.mapper';
import { CountryDtoMapperImpl } from '~/.server/domain/mappers/country.dto.mapper';
import type { FederalGovernmentInsurancePlanDtoMapper } from '~/.server/domain/mappers/federal-government-insurance-plan.dto.mapper';
import { FederalGovernmentInsurancePlanDtoMapperImpl } from '~/.server/domain/mappers/federal-government-insurance-plan.dto.mapper';
import type { MaritalStatusDtoMapper } from '~/.server/domain/mappers/marital-status.dto.mapper';
import { MaritalStatusDtoMapperImpl } from '~/.server/domain/mappers/marital-status.dto.mapper';
import type { PreferredCommunicationMethodDtoMapper } from '~/.server/domain/mappers/preferred-communication-method.dto.mapper';
import { PreferredCommunicationMethodDtoMapperImpl } from '~/.server/domain/mappers/preferred-communication-method.dto.mapper';
import type { PreferredLanguageDtoMapper } from '~/.server/domain/mappers/preferred-language.dto.mapper';
import { PreferredLanguageDtoMapperImpl } from '~/.server/domain/mappers/preferred-language.dto.mapper';
import type { ProvinceTerritoryStateDtoMapper } from '~/.server/domain/mappers/province-territory-state.dto.mapper';
import { ProvinceTerritoryStateDtoMapperImpl } from '~/.server/domain/mappers/province-territory-state.dto.mapper';
import type { ProvincialGovernmentInsurancePlanDtoMapper } from '~/.server/domain/mappers/provincial-government-insurance-plan.dto.mapper';
import { ProvincialGovernmentInsurancePlanDtoMapperImpl } from '~/.server/domain/mappers/provincial-government-insurance-plan.dto.mapper';

/**
 * Container module for mappers.
 */
export const mappersContainerModule = new ContainerModule((bind) => {
  bind<ClientApplicationDtoMapper>(SERVICE_IDENTIFIER.CLIENT_APPLICATION_DTO_MAPPER).to(ClientApplicationDtoMapperImpl);
  bind<ClientFriendlyStatusDtoMapper>(SERVICE_IDENTIFIER.CLIENT_FRIENDLY_STATUS_DTO_MAPPER).to(ClientFriendlyStatusDtoMapperImpl);
  bind<CountryDtoMapper>(SERVICE_IDENTIFIER.COUNTRY_DTO_MAPPER).to(CountryDtoMapperImpl);
  bind<FederalGovernmentInsurancePlanDtoMapper>(SERVICE_IDENTIFIER.FEDERAL_GOVERNMENT_INSURANCE_PLAN_DTO_MAPPER).to(FederalGovernmentInsurancePlanDtoMapperImpl);
  bind<MaritalStatusDtoMapper>(SERVICE_IDENTIFIER.MARITAL_STATUS_DTO_MAPPER).to(MaritalStatusDtoMapperImpl);
  bind<PreferredCommunicationMethodDtoMapper>(SERVICE_IDENTIFIER.PREFERRED_COMMUNICATION_METHOD_DTO_MAPPER).to(PreferredCommunicationMethodDtoMapperImpl);
  bind<PreferredLanguageDtoMapper>(SERVICE_IDENTIFIER.PREFERRED_LANGUAGE_DTO_MAPPER).to(PreferredLanguageDtoMapperImpl);
  bind<ProvinceTerritoryStateDtoMapper>(SERVICE_IDENTIFIER.PROVINCE_TERRITORY_STATE_DTO_MAPPER).to(ProvinceTerritoryStateDtoMapperImpl);
  bind<ProvincialGovernmentInsurancePlanDtoMapper>(SERVICE_IDENTIFIER.PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_DTO_MAPPER).to(ProvincialGovernmentInsurancePlanDtoMapperImpl);
});
