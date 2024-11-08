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
  bind(TYPES.AddressValidationRepository).to(AddressValidationRepositoryImpl);
  bind(TYPES.ApplicantRepository).to(ApplicantRepositoryImpl);
  bind(TYPES.ApplicationStatusRepository).to(ApplicationStatusRepositoryImpl);
  bind(TYPES.BenefitRenewalRepository).to(BenefitRenewalRepositoryImpl);
  bind(TYPES.ClientApplicationRepository).to(ClientApplicationRepositoryImpl);
  bind(TYPES.ClientFriendlyStatusRepository).to(ClientFriendlyStatusRepositoryImpl);
  bind(TYPES.CountryRepository).to(CountryRepositoryImpl);
  bind(TYPES.DemographicSurveyRepository).to(DemographicSurveyRepositoryImpl);
  bind(TYPES.FederalGovernmentInsurancePlanRepository).to(FederalGovernmentInsurancePlanRepositoryImpl);
  bind(TYPES.HCaptchaRepository).to(HCaptchaRepositoryImpl);
  bind(TYPES.LetterRepository).to(LetterRepositoryImpl);
  bind(TYPES.LetterTypeRepository).to(LetterTypeRepositoryImpl);
  bind(TYPES.MaritalStatusRepository).to(MaritalStatusRepositoryImpl);
  bind(TYPES.PreferredCommunicationMethodRepository).to(PreferredCommunicationMethodRepositoryImpl);
  bind(TYPES.PreferredLanguageRepository).to(PreferredLanguageRepositoryImpl);
  bind(TYPES.ProvinceTerritoryStateRepository).to(ProvinceTerritoryStateRepositoryImpl);
  bind(TYPES.ProvincialGovernmentInsurancePlanRepository).to(ProvincialGovernmentInsurancePlanRepositoryImpl);
});
