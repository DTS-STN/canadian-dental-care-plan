import { ContainerModule } from 'inversify';

import { TYPES } from '~/.server/constants';
import {
  AddressValidationDtoMapperImpl,
  ApplicantDtoMapperImpl,
  ApplicationStatusDtoMapperImpl,
  BenefitApplicationDtoMapperImpl,
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
import { BenefitApplicationStateMapperImpl } from '~/.server/routes/mappers';
import { HCaptchaDtoMapperImpl } from '~/.server/web/mappers';

/**
 * Container module for mappers.
 */
export const mappersContainerModule = new ContainerModule((bind) => {
  bind(TYPES.domain.mappers.AddressValidationDtoMapper).to(AddressValidationDtoMapperImpl);
  bind(TYPES.domain.mappers.ApplicantDtoMapper).to(ApplicantDtoMapperImpl);
  bind(TYPES.domain.mappers.ApplicationStatusDtoMapper).to(ApplicationStatusDtoMapperImpl);
  bind(TYPES.domain.mappers.BenefitApplicationDtoMapper).to(BenefitApplicationDtoMapperImpl);
  bind(TYPES.domain.mappers.BenefitRenewalDtoMapper).to(BenefitRenewalDtoMapperImpl);
  bind(TYPES.domain.mappers.ClientApplicationDtoMapper).to(ClientApplicationDtoMapperImpl);
  bind(TYPES.domain.mappers.ClientFriendlyStatusDtoMapper).to(ClientFriendlyStatusDtoMapperImpl);
  bind(TYPES.domain.mappers.CountryDtoMapper).to(CountryDtoMapperImpl);
  bind(TYPES.domain.mappers.DemographicSurveyDtoMapper).to(DemographicSurveyDtoMapperImpl);
  bind(TYPES.domain.mappers.FederalGovernmentInsurancePlanDtoMapper).to(FederalGovernmentInsurancePlanDtoMapperImpl);
  bind(TYPES.domain.mappers.LetterDtoMapper).to(LetterDtoMapperImpl);
  bind(TYPES.domain.mappers.LetterTypeDtoMapper).to(LetterTypeDtoMapperImpl);
  bind(TYPES.domain.mappers.MaritalStatusDtoMapper).to(MaritalStatusDtoMapperImpl);
  bind(TYPES.domain.mappers.PreferredCommunicationMethodDtoMapper).to(PreferredCommunicationMethodDtoMapperImpl);
  bind(TYPES.domain.mappers.PreferredLanguageDtoMapper).to(PreferredLanguageDtoMapperImpl);
  bind(TYPES.domain.mappers.ProvinceTerritoryStateDtoMapper).to(ProvinceTerritoryStateDtoMapperImpl);
  bind(TYPES.domain.mappers.ProvincialGovernmentInsurancePlanDtoMapper).to(ProvincialGovernmentInsurancePlanDtoMapperImpl);
  bind(TYPES.routes.mappers.BenefitApplicationStateMapper).to(BenefitApplicationStateMapperImpl);
  bind(TYPES.web.mappers.HCaptchaDtoMapper).to(HCaptchaDtoMapperImpl);
});
