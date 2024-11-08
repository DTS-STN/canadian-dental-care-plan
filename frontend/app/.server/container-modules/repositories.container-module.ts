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
  bind(TYPES.domain.repositories.AddressValidationRepository).to(AddressValidationRepositoryImpl);
  bind(TYPES.domain.repositories.ApplicantRepository).to(ApplicantRepositoryImpl);
  bind(TYPES.domain.repositories.ApplicationStatusRepository).to(ApplicationStatusRepositoryImpl);
  bind(TYPES.domain.repositories.BenefitRenewalRepository).to(BenefitRenewalRepositoryImpl);
  bind(TYPES.domain.repositories.ClientApplicationRepository).to(ClientApplicationRepositoryImpl);
  bind(TYPES.domain.repositories.ClientFriendlyStatusRepository).to(ClientFriendlyStatusRepositoryImpl);
  bind(TYPES.domain.repositories.CountryRepository).to(CountryRepositoryImpl);
  bind(TYPES.domain.repositories.DemographicSurveyRepository).to(DemographicSurveyRepositoryImpl);
  bind(TYPES.domain.repositories.FederalGovernmentInsurancePlanRepository).to(FederalGovernmentInsurancePlanRepositoryImpl);
  bind(TYPES.domain.repositories.LetterRepository).to(LetterRepositoryImpl);
  bind(TYPES.domain.repositories.LetterTypeRepository).to(LetterTypeRepositoryImpl);
  bind(TYPES.domain.repositories.MaritalStatusRepository).to(MaritalStatusRepositoryImpl);
  bind(TYPES.domain.repositories.PreferredCommunicationMethodRepository).to(PreferredCommunicationMethodRepositoryImpl);
  bind(TYPES.domain.repositories.PreferredLanguageRepository).to(PreferredLanguageRepositoryImpl);
  bind(TYPES.domain.repositories.ProvinceTerritoryStateRepository).to(ProvinceTerritoryStateRepositoryImpl);
  bind(TYPES.domain.repositories.ProvincialGovernmentInsurancePlanRepository).to(ProvincialGovernmentInsurancePlanRepositoryImpl);
  bind(TYPES.web.repositories.HCaptchaRepository).to(HCaptchaRepositoryImpl);
});
