import { injectable } from 'inversify';

import type { ProvinceTerritoryStateDto } from '~/.server/domain/dtos/province-territory-state.dto';
import type { ProvinceTerritoryStateEntity } from '~/.server/domain/entities/province-territory-state.entity';

export interface ProvinceTerritoryStateDtoMapper {
  mapProvinceTerritoryStateEntityToProvinceTerritoryStateDto(provinceTerritoryStateEntity: ProvinceTerritoryStateEntity): ProvinceTerritoryStateDto;
  mapProvinceTerritoryStateEntitiesToProvinceTerritoryStateDtos(provinceTerritoryStateEntities: ProvinceTerritoryStateEntity[]): ProvinceTerritoryStateDto[];
}

@injectable()
export class ProvinceTerritoryStateDtoMapperImpl implements ProvinceTerritoryStateDtoMapper {
  mapProvinceTerritoryStateEntityToProvinceTerritoryStateDto(provinceTerritoryStateEntity: ProvinceTerritoryStateEntity): ProvinceTerritoryStateDto {
    const id = provinceTerritoryStateEntity.esdc_provinceterritorystateid;
    const countryId = provinceTerritoryStateEntity._esdc_countryid_value;
    const nameEn = provinceTerritoryStateEntity.esdc_nameenglish;
    const nameFr = provinceTerritoryStateEntity.esdc_namefrench;
    const abbr = provinceTerritoryStateEntity.esdc_internationalalphacode;
    return { id, countryId, nameEn, nameFr, abbr };
  }

  mapProvinceTerritoryStateEntitiesToProvinceTerritoryStateDtos(provinceTerritoryStateEntities: ProvinceTerritoryStateEntity[]): ProvinceTerritoryStateDto[] {
    return provinceTerritoryStateEntities.map((entity) => this.mapProvinceTerritoryStateEntityToProvinceTerritoryStateDto(entity));
  }
}
