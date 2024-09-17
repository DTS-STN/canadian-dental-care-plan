import { injectable } from 'inversify';

import type { ProvincialGovernmentInsurancePlanDto } from '~/.server/domain/dtos/provincial-government-insurance-plan.dto';
import type { ProvincialGovernmentInsurancePlanEntity } from '~/.server/domain/entities/provincial-government-insurance-plan.entity';

export interface ProvincialGovernmentInsurancePlanDtoMapper {
  mapProvincialGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto(provincialGovernmentInsurancePlanEntity: ProvincialGovernmentInsurancePlanEntity): ProvincialGovernmentInsurancePlanDto;
  mapProvincialGovernmentInsurancePlanEntitiesToProvincialGovernmentInsurancePlanDtos(provincialGovernmentInsurancePlanEntities: ProvincialGovernmentInsurancePlanEntity[]): ProvincialGovernmentInsurancePlanDto[];
}

@injectable()
export class ProvincialGovernmentInsurancePlanDtoMapperImpl implements ProvincialGovernmentInsurancePlanDtoMapper {
  mapProvincialGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto(provincialGovernmentInsurancePlanEntity: ProvincialGovernmentInsurancePlanEntity): ProvincialGovernmentInsurancePlanDto {
    const id = provincialGovernmentInsurancePlanEntity.esdc_governmentinsuranceplanid;
    const nameEn = provincialGovernmentInsurancePlanEntity.esdc_nameenglish;
    const nameFr = provincialGovernmentInsurancePlanEntity.esdc_namefrench;
    const provinceTerritoryStateId = provincialGovernmentInsurancePlanEntity._esdc_provinceterritorystateid_value;
    return { id, nameEn, nameFr, provinceTerritoryStateId };
  }

  mapProvincialGovernmentInsurancePlanEntitiesToProvincialGovernmentInsurancePlanDtos(provincialGovernmentInsurancePlanEntities: ProvincialGovernmentInsurancePlanEntity[]): ProvincialGovernmentInsurancePlanDto[] {
    return provincialGovernmentInsurancePlanEntities.map((entity) => this.mapProvincialGovernmentInsurancePlanEntityToProvincialGovernmentInsurancePlanDto(entity));
  }
}
