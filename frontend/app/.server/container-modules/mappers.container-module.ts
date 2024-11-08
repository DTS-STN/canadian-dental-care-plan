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
  bind(TYPES.AddressValidationDtoMapper).to(AddressValidationDtoMapperImpl);
  bind(TYPES.ApplicantDtoMapper).to(ApplicantDtoMapperImpl);
  bind(TYPES.ApplicationStatusDtoMapper).to(ApplicationStatusDtoMapperImpl);
  bind(TYPES.BenefitRenewalDtoMapper).to(BenefitRenewalDtoMapperImpl);
  bind(TYPES.ClientApplicationDtoMapper).to(ClientApplicationDtoMapperImpl);
  bind(TYPES.ClientFriendlyStatusDtoMapper).to(ClientFriendlyStatusDtoMapperImpl);
  bind(TYPES.CountryDtoMapper).to(CountryDtoMapperImpl);
  bind(TYPES.DemographicSurveyDtoMapper).to(DemographicSurveyDtoMapperImpl);
  bind(TYPES.FederalGovernmentInsurancePlanDtoMapper).to(FederalGovernmentInsurancePlanDtoMapperImpl);
  bind(TYPES.HCaptchaDtoMapper).to(HCaptchaDtoMapperImpl);
  bind(TYPES.LetterDtoMapper).to(LetterDtoMapperImpl);
  bind(TYPES.LetterTypeDtoMapper).to(LetterTypeDtoMapperImpl);
  bind(TYPES.MaritalStatusDtoMapper).to(MaritalStatusDtoMapperImpl);
  bind(TYPES.PreferredCommunicationMethodDtoMapper).to(PreferredCommunicationMethodDtoMapperImpl);
  bind(TYPES.PreferredLanguageDtoMapper).to(PreferredLanguageDtoMapperImpl);
  bind(TYPES.ProvinceTerritoryStateDtoMapper).to(ProvinceTerritoryStateDtoMapperImpl);
  bind(TYPES.ProvincialGovernmentInsurancePlanDtoMapper).to(ProvincialGovernmentInsurancePlanDtoMapperImpl);
});
