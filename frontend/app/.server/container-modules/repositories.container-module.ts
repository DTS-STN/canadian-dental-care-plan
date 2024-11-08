import { ContainerModule } from 'inversify';

import { TYPES } from '~/.server/constants';
import {
  AddressValidationRepositoryImpl,
  ApplicantRepositoryImpl,
  ApplicationStatusRepositoryImpl,
  BenefitRenewalRepositoryImpl,
  ClientApplicationRepositoryImpl,
  ClientFriendlyStatusRepositoryImpl,
  CountryRepositoryImpl,
  DemographicSurveyRepositoryImpl,
  FederalGovernmentInsurancePlanRepositoryImpl,
  LetterRepositoryImpl,
  LetterTypeRepositoryImpl,
  MaritalStatusRepositoryImpl,
  PreferredCommunicationMethodRepositoryImpl,
  PreferredLanguageRepositoryImpl,
  ProvinceTerritoryStateRepositoryImpl,
  ProvincialGovernmentInsurancePlanRepositoryImpl,
} from '~/.server/domain/repositories';
import { HCaptchaRepositoryImpl } from '~/.server/web/repositories';

/**
 * Container module for repositories.
 */
export const repositoriesContainerModule = new ContainerModule((bind) => {
  bind(TYPES.ADDRESS_VALIDATION_REPOSITORY).to(AddressValidationRepositoryImpl);
  bind(TYPES.APPLICANT_REPOSITORY).to(ApplicantRepositoryImpl);
  bind(TYPES.APPLICATION_STATUS_REPOSITORY).to(ApplicationStatusRepositoryImpl);
  bind(TYPES.BENEFIT_RENEWAL_REPOSITORY).to(BenefitRenewalRepositoryImpl);
  bind(TYPES.CLIENT_APPLICATION_REPOSITORY).to(ClientApplicationRepositoryImpl);
  bind(TYPES.CLIENT_FRIENDLY_STATUS_REPOSITORY).to(ClientFriendlyStatusRepositoryImpl);
  bind(TYPES.COUNTRY_REPOSITORY).to(CountryRepositoryImpl);
  bind(TYPES.DEMOGRAPHIC_SURVEY_REPOSITORY).to(DemographicSurveyRepositoryImpl);
  bind(TYPES.FEDERAL_GOVERNMENT_INSURANCE_PLAN_REPOSITORY).to(FederalGovernmentInsurancePlanRepositoryImpl);
  bind(TYPES.HCAPTCHA_REPOSITORY).to(HCaptchaRepositoryImpl);
  bind(TYPES.LETTER_REPOSITORY).to(LetterRepositoryImpl);
  bind(TYPES.LETTER_TYPE_REPOSITORY).to(LetterTypeRepositoryImpl);
  bind(TYPES.MARITAL_STATUS_REPOSITORY).to(MaritalStatusRepositoryImpl);
  bind(TYPES.PREFERRED_COMMUNICATION_METHOD_REPOSITORY).to(PreferredCommunicationMethodRepositoryImpl);
  bind(TYPES.PREFERRED_LANGUAGE_REPOSITORY).to(PreferredLanguageRepositoryImpl);
  bind(TYPES.PROVINCE_TERRITORY_STATE_REPOSITORY).to(ProvinceTerritoryStateRepositoryImpl);
  bind(TYPES.PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_REPOSITORY).to(ProvincialGovernmentInsurancePlanRepositoryImpl);
});
