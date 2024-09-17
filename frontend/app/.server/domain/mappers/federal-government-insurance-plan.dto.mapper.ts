import { injectable } from 'inversify';

import type { FederalGovernmentInsurancePlanDto } from '~/.server/domain/dtos/federal-government-insurance-plan.dto';
import type { FederalGovernmentInsurancePlanEntity } from '~/.server/domain/entities/federal-government-insurance-plan.entity';

export interface FederalGovernmentInsurancePlanDtoMapper {
  mapFederalGovernmentInsurancePlanEntityToFederalGovernmentInsurancePlanDto(federalGovernmentInsurancePlanEntity: FederalGovernmentInsurancePlanEntity): FederalGovernmentInsurancePlanDto;
  mapFederalGovernmentInsurancePlanEntitiesToFederalGovernmentInsurancePlanDtos(federalGovernmentInsurancePlanEntities: FederalGovernmentInsurancePlanEntity[]): FederalGovernmentInsurancePlanDto[];
}

@injectable()
export class FederalGovernmentInsurancePlanDtoMapperImpl implements FederalGovernmentInsurancePlanDtoMapper {
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
