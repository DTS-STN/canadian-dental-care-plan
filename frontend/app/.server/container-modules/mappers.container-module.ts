import { ContainerModule } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants/service-identifier.contant';
import {
  ClientApplicationDtoMapperImpl,
  ClientFriendlyStatusDtoMapperImpl,
  CountryDtoMapperImpl,
  FederalGovernmentInsurancePlanDtoMapperImpl,
  MaritalStatusDtoMapperImpl,
  PreferredCommunicationMethodDtoMapperImpl,
  PreferredLanguageDtoMapperImpl,
  ProvinceTerritoryStateDtoMapperImpl,
  ProvincialGovernmentInsurancePlanDtoMapperImpl,
} from '~/.server/domain/mappers';
import type {
  ClientApplicationDtoMapper,
  ClientFriendlyStatusDtoMapper,
  CountryDtoMapper,
  FederalGovernmentInsurancePlanDtoMapper,
  MaritalStatusDtoMapper,
  PreferredCommunicationMethodDtoMapper,
  PreferredLanguageDtoMapper,
  ProvinceTerritoryStateDtoMapper,
  ProvincialGovernmentInsurancePlanDtoMapper,
} from '~/.server/domain/mappers';

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
