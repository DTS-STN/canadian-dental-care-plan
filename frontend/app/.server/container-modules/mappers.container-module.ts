import { ContainerModule } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
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
  bind(SERVICE_IDENTIFIER.ADDRESS_VALIDATION_DTO_MAPPER).to(AddressValidationDtoMapperImpl);
  bind(SERVICE_IDENTIFIER.APPLICANT_DTO_MAPPER).to(ApplicantDtoMapperImpl);
  bind(SERVICE_IDENTIFIER.APPLICATION_STATUS_DTO_MAPPER).to(ApplicationStatusDtoMapperImpl);
  bind(SERVICE_IDENTIFIER.BENEFIT_RENEWAL_DTO_MAPPER).to(BenefitRenewalDtoMapperImpl);
  bind(SERVICE_IDENTIFIER.CLIENT_APPLICATION_DTO_MAPPER).to(ClientApplicationDtoMapperImpl);
  bind(SERVICE_IDENTIFIER.CLIENT_FRIENDLY_STATUS_DTO_MAPPER).to(ClientFriendlyStatusDtoMapperImpl);
  bind(SERVICE_IDENTIFIER.COUNTRY_DTO_MAPPER).to(CountryDtoMapperImpl);
  bind(SERVICE_IDENTIFIER.DEMOGRAPHIC_SURVEY_DTO_MAPPER).to(DemographicSurveyDtoMapperImpl);
  bind(SERVICE_IDENTIFIER.FEDERAL_GOVERNMENT_INSURANCE_PLAN_DTO_MAPPER).to(FederalGovernmentInsurancePlanDtoMapperImpl);
  bind(SERVICE_IDENTIFIER.HCAPTCHA_DTO_MAPPER).to(HCaptchaDtoMapperImpl);
  bind(SERVICE_IDENTIFIER.LETTER_DTO_MAPPER).to(LetterDtoMapperImpl);
  bind(SERVICE_IDENTIFIER.LETTER_TYPE_DTO_MAPPER).to(LetterTypeDtoMapperImpl);
  bind(SERVICE_IDENTIFIER.MARITAL_STATUS_DTO_MAPPER).to(MaritalStatusDtoMapperImpl);
  bind(SERVICE_IDENTIFIER.PREFERRED_COMMUNICATION_METHOD_DTO_MAPPER).to(PreferredCommunicationMethodDtoMapperImpl);
  bind(SERVICE_IDENTIFIER.PREFERRED_LANGUAGE_DTO_MAPPER).to(PreferredLanguageDtoMapperImpl);
  bind(SERVICE_IDENTIFIER.PROVINCE_TERRITORY_STATE_DTO_MAPPER).to(ProvinceTerritoryStateDtoMapperImpl);
  bind(SERVICE_IDENTIFIER.PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_DTO_MAPPER).to(ProvincialGovernmentInsurancePlanDtoMapperImpl);
});
