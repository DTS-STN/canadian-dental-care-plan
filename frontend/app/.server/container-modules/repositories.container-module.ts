import { ContainerModule } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import {
  AddressValidationRepositoryImpl,
  ApplicantRepositoryImpl,
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
  bind(SERVICE_IDENTIFIER.ADDRESS_VALIDATION_REPOSITORY).to(AddressValidationRepositoryImpl);
  bind(SERVICE_IDENTIFIER.APPLICANT_REPOSITORY).to(ApplicantRepositoryImpl);
  bind(SERVICE_IDENTIFIER.BENEFIT_RENEWAL_REPOSITORY).to(BenefitRenewalRepositoryImpl);
  bind(SERVICE_IDENTIFIER.CLIENT_APPLICATION_REPOSITORY).to(ClientApplicationRepositoryImpl);
  bind(SERVICE_IDENTIFIER.CLIENT_FRIENDLY_STATUS_REPOSITORY).to(ClientFriendlyStatusRepositoryImpl);
  bind(SERVICE_IDENTIFIER.COUNTRY_REPOSITORY).to(CountryRepositoryImpl);
  bind(SERVICE_IDENTIFIER.DEMOGRAPHIC_SURVEY_REPOSITORY).to(DemographicSurveyRepositoryImpl);
  bind(SERVICE_IDENTIFIER.FEDERAL_GOVERNMENT_INSURANCE_PLAN_REPOSITORY).to(FederalGovernmentInsurancePlanRepositoryImpl);
  bind(SERVICE_IDENTIFIER.HCAPTCHA_REPOSITORY).to(HCaptchaRepositoryImpl);
  bind(SERVICE_IDENTIFIER.LETTER_REPOSITORY).to(LetterRepositoryImpl);
  bind(SERVICE_IDENTIFIER.LETTER_TYPE_REPOSITORY).to(LetterTypeRepositoryImpl);
  bind(SERVICE_IDENTIFIER.MARITAL_STATUS_REPOSITORY).to(MaritalStatusRepositoryImpl);
  bind(SERVICE_IDENTIFIER.PREFERRED_COMMUNICATION_METHOD_REPOSITORY).to(PreferredCommunicationMethodRepositoryImpl);
  bind(SERVICE_IDENTIFIER.PREFERRED_LANGUAGE_REPOSITORY).to(PreferredLanguageRepositoryImpl);
  bind(SERVICE_IDENTIFIER.PROVINCE_TERRITORY_STATE_REPOSITORY).to(ProvinceTerritoryStateRepositoryImpl);
  bind(SERVICE_IDENTIFIER.PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_REPOSITORY).to(ProvincialGovernmentInsurancePlanRepositoryImpl);
});
