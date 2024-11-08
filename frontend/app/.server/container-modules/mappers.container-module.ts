import { ContainerModule } from 'inversify';

import { TYPES } from '~/.server/constants';
import {
  AddressValidationDtoMapperImpl,
  ApplicantDtoMapperImpl,
  ApplicationStatusDtoMapperImpl,
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
import { HCaptchaDtoMapperImpl } from '~/.server/web/mappers';

/**
 * Container module for mappers.
 */
export const mappersContainerModule = new ContainerModule((bind) => {
  bind(TYPES.ADDRESS_VALIDATION_DTO_MAPPER).to(AddressValidationDtoMapperImpl);
  bind(TYPES.APPLICANT_DTO_MAPPER).to(ApplicantDtoMapperImpl);
  bind(TYPES.APPLICATION_STATUS_DTO_MAPPER).to(ApplicationStatusDtoMapperImpl);
  bind(TYPES.BENEFIT_RENEWAL_DTO_MAPPER).to(BenefitRenewalDtoMapperImpl);
  bind(TYPES.CLIENT_APPLICATION_DTO_MAPPER).to(ClientApplicationDtoMapperImpl);
  bind(TYPES.CLIENT_FRIENDLY_STATUS_DTO_MAPPER).to(ClientFriendlyStatusDtoMapperImpl);
  bind(TYPES.COUNTRY_DTO_MAPPER).to(CountryDtoMapperImpl);
  bind(TYPES.DEMOGRAPHIC_SURVEY_DTO_MAPPER).to(DemographicSurveyDtoMapperImpl);
  bind(TYPES.FEDERAL_GOVERNMENT_INSURANCE_PLAN_DTO_MAPPER).to(FederalGovernmentInsurancePlanDtoMapperImpl);
  bind(TYPES.HCAPTCHA_DTO_MAPPER).to(HCaptchaDtoMapperImpl);
  bind(TYPES.LETTER_DTO_MAPPER).to(LetterDtoMapperImpl);
  bind(TYPES.LETTER_TYPE_DTO_MAPPER).to(LetterTypeDtoMapperImpl);
  bind(TYPES.MARITAL_STATUS_DTO_MAPPER).to(MaritalStatusDtoMapperImpl);
  bind(TYPES.PREFERRED_COMMUNICATION_METHOD_DTO_MAPPER).to(PreferredCommunicationMethodDtoMapperImpl);
  bind(TYPES.PREFERRED_LANGUAGE_DTO_MAPPER).to(PreferredLanguageDtoMapperImpl);
  bind(TYPES.PROVINCE_TERRITORY_STATE_DTO_MAPPER).to(ProvinceTerritoryStateDtoMapperImpl);
  bind(TYPES.PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_DTO_MAPPER).to(ProvincialGovernmentInsurancePlanDtoMapperImpl);
});
