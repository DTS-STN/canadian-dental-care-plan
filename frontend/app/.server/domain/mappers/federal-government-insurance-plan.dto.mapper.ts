import { injectable } from 'inversify';

import type { FederalGovernmentInsurancePlanDto, FederalGovernmentInsurancePlanLocalizedDto } from '~/.server/domain/dtos';
import type { FederalGovernmentInsurancePlanEntity } from '~/.server/domain/entities';

export interface FederalGovernmentInsurancePlanDtoMapper {
  mapFederalGovernmentInsurancePlanDtoToFederalGovernmentInsurancePlanLocalizedDto(federalGovernmentInsuranceDto: FederalGovernmentInsurancePlanDto, locale: AppLocale): FederalGovernmentInsurancePlanLocalizedDto;
  mapFederalGovernmentInsurancePlanDtosToFederalGovernmentInsurancePlanLocalizedDtos(federalGovernmentInsurancePlanDtos: ReadonlyArray<FederalGovernmentInsurancePlanDto>, locale: AppLocale): ReadonlyArray<FederalGovernmentInsurancePlanLocalizedDto>;
  mapFederalGovernmentInsurancePlanEntityToFederalGovernmentInsurancePlanDto(federalGovernmentInsurancePlanEntity: FederalGovernmentInsurancePlanEntity): FederalGovernmentInsurancePlanDto;
  mapFederalGovernmentInsurancePlanEntitiesToFederalGovernmentInsurancePlanDtos(federalGovernmentInsurancePlanEntities: ReadonlyArray<FederalGovernmentInsurancePlanEntity>): ReadonlyArray<FederalGovernmentInsurancePlanDto>;
}

@injectable()
export class DefaultFederalGovernmentInsurancePlanDtoMapper implements FederalGovernmentInsurancePlanDtoMapper {
  mapFederalGovernmentInsurancePlanDtoToFederalGovernmentInsurancePlanLocalizedDto(federalGovernmentInsuranceDto: FederalGovernmentInsurancePlanDto, locale: AppLocale): FederalGovernmentInsurancePlanLocalizedDto {
    const { nameEn, nameFr, ...rest } = federalGovernmentInsuranceDto;
    return {
      ...rest,
      name: locale === 'fr' ? nameFr : nameEn,
    };
  }

  mapFederalGovernmentInsurancePlanDtosToFederalGovernmentInsurancePlanLocalizedDtos(federalGovernmentInsurancePlanDtos: ReadonlyArray<FederalGovernmentInsurancePlanDto>, locale: AppLocale): ReadonlyArray<FederalGovernmentInsurancePlanLocalizedDto> {
    return federalGovernmentInsurancePlanDtos.map((dto) => this.mapFederalGovernmentInsurancePlanDtoToFederalGovernmentInsurancePlanLocalizedDto(dto, locale));
  }

  mapFederalGovernmentInsurancePlanEntityToFederalGovernmentInsurancePlanDto(federalGovernmentInsurancePlanEntity: FederalGovernmentInsurancePlanEntity): FederalGovernmentInsurancePlanDto {
    const id = federalGovernmentInsurancePlanEntity.esdc_governmentinsuranceplanid;
    const nameEn = federalGovernmentInsurancePlanEntity.esdc_nameenglish;
    const nameFr = federalGovernmentInsurancePlanEntity.esdc_namefrench;
    return { id, nameEn, nameFr };
  }

  mapFederalGovernmentInsurancePlanEntitiesToFederalGovernmentInsurancePlanDtos(federalGovernmentInsurancePlanEntities: FederalGovernmentInsurancePlanEntity[]): FederalGovernmentInsurancePlanDto[] {
    return federalGovernmentInsurancePlanEntities.map((entity) => this.mapFederalGovernmentInsurancePlanEntityToFederalGovernmentInsurancePlanDto(entity));
  }
}
