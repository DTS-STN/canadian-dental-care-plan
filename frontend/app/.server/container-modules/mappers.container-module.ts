import { ContainerModule } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import {
  AddressValidationDtoMapperImpl,
  ApplicantDtoMapperImpl,
  BenefitRenewalDtoMapperImpl,
  ClientApplicationDtoMapperImpl,
  ClientFriendlyStatusDtoMapperImpl,
  CountryDtoMapperImpl,
  DemographicSurveyDtoMapperImpl,
  FederalGovernmentInsurancePlanDtoMapperImpl,
  LetterDtoMapperImpl,
  LetterTypeDtoMapperImpl,
  MaritalStatusDtoMapperImpl,
  PreferredCommunicationMethodDtoMapperImpl,
  PreferredLanguageDtoMapperImpl,
  ProvinceTerritoryStateDtoMapperImpl,
  ProvincialGovernmentInsurancePlanDtoMapperImpl,
} from '~/.server/domain/mappers';
import type {
  AddressValidationDtoMapper,
  ApplicantDtoMapper,
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

/**
 * Container module for mappers.
 */
export const mappersContainerModule = new ContainerModule((bind) => {
  bind<AddressValidationDtoMapper>(SERVICE_IDENTIFIER.ADDRESS_VALIDATION_DTO_MAPPER).to(AddressValidationDtoMapperImpl);
  bind<ApplicantDtoMapper>(SERVICE_IDENTIFIER.APPLICANT_DTO_MAPPER).to(ApplicantDtoMapperImpl);
  bind<BenefitRenewalDtoMapper>(SERVICE_IDENTIFIER.BENEFIT_RENEWAL_DTO_MAPPER).to(BenefitRenewalDtoMapperImpl);
  bind<ClientApplicationDtoMapper>(SERVICE_IDENTIFIER.CLIENT_APPLICATION_DTO_MAPPER).to(ClientApplicationDtoMapperImpl);
  bind<ClientFriendlyStatusDtoMapper>(SERVICE_IDENTIFIER.CLIENT_FRIENDLY_STATUS_DTO_MAPPER).to(ClientFriendlyStatusDtoMapperImpl);
  bind<CountryDtoMapper>(SERVICE_IDENTIFIER.COUNTRY_DTO_MAPPER).to(CountryDtoMapperImpl);
  bind<DemographicSurveyDtoMapper>(SERVICE_IDENTIFIER.DEMOGRAPHIC_SURVEY_DTO_MAPPER).to(DemographicSurveyDtoMapperImpl);
  bind<FederalGovernmentInsurancePlanDtoMapper>(SERVICE_IDENTIFIER.FEDERAL_GOVERNMENT_INSURANCE_PLAN_DTO_MAPPER).to(FederalGovernmentInsurancePlanDtoMapperImpl);
  bind<LetterDtoMapper>(SERVICE_IDENTIFIER.LETTER_DTO_MAPPER).to(LetterDtoMapperImpl);
  bind<LetterTypeDtoMapper>(SERVICE_IDENTIFIER.LETTER_TYPE_DTO_MAPPER).to(LetterTypeDtoMapperImpl);
  bind<MaritalStatusDtoMapper>(SERVICE_IDENTIFIER.MARITAL_STATUS_DTO_MAPPER).to(MaritalStatusDtoMapperImpl);
  bind<PreferredCommunicationMethodDtoMapper>(SERVICE_IDENTIFIER.PREFERRED_COMMUNICATION_METHOD_DTO_MAPPER).to(PreferredCommunicationMethodDtoMapperImpl);
  bind<PreferredLanguageDtoMapper>(SERVICE_IDENTIFIER.PREFERRED_LANGUAGE_DTO_MAPPER).to(PreferredLanguageDtoMapperImpl);
  bind<ProvinceTerritoryStateDtoMapper>(SERVICE_IDENTIFIER.PROVINCE_TERRITORY_STATE_DTO_MAPPER).to(ProvinceTerritoryStateDtoMapperImpl);
  bind<ProvincialGovernmentInsurancePlanDtoMapper>(SERVICE_IDENTIFIER.PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_DTO_MAPPER).to(ProvincialGovernmentInsurancePlanDtoMapperImpl);
});
