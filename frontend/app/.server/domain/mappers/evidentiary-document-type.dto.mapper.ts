import { injectable } from 'inversify';

import type { EvidentiaryDocumentTypeDto, EvidentiaryDocumentTypeLocalizedDto } from '~/.server/domain/dtos';
import type { EvidentiaryDocumentTypeEntity } from '~/.server/domain/entities';

export interface EvidentiaryDocumentTypeDtoMapper {
  mapEvidentiaryDocumentTypeDtoToEvidentiaryDocumentTypeLocalizedDto(evidentiaryDocumentTypeDto: EvidentiaryDocumentTypeDto, locale: AppLocale): EvidentiaryDocumentTypeLocalizedDto;
  mapEvidentiaryDocumentTypeDtosToEvidentiaryDocumentTypeLocalizedDtos(evidentiaryDocumentTypeDtos: ReadonlyArray<EvidentiaryDocumentTypeDto>, locale: AppLocale): ReadonlyArray<EvidentiaryDocumentTypeLocalizedDto>;
  mapEvidentiaryDocumentTypeEntityToEvidentiaryDocumentTypeDto(evidentiaryDocumentTypeEntity: EvidentiaryDocumentTypeEntity): EvidentiaryDocumentTypeDto;
  mapEvidentiaryDocumentTypeEntitiesToEvidentiaryDocumentTypeDtos(evidentiaryDocumentTypeEntities: ReadonlyArray<EvidentiaryDocumentTypeEntity>): ReadonlyArray<EvidentiaryDocumentTypeDto>;
}

@injectable()
export class DefaultEvidentiaryDocumentTypeDtoMapper implements EvidentiaryDocumentTypeDtoMapper {
  mapEvidentiaryDocumentTypeDtoToEvidentiaryDocumentTypeLocalizedDto(evidentiaryDocumentTypeDto: EvidentiaryDocumentTypeDto, locale: AppLocale): EvidentiaryDocumentTypeLocalizedDto {
    const { nameEn, nameFr, ...rest } = evidentiaryDocumentTypeDto;
    return {
      ...rest,
      name: locale === 'fr' ? nameFr : nameEn,
    };
  }

  mapEvidentiaryDocumentTypeDtosToEvidentiaryDocumentTypeLocalizedDtos(evidentiaryDocumentTypeDtos: ReadonlyArray<EvidentiaryDocumentTypeDto>, locale: AppLocale): ReadonlyArray<EvidentiaryDocumentTypeLocalizedDto> {
    return evidentiaryDocumentTypeDtos.map((dto) => this.mapEvidentiaryDocumentTypeDtoToEvidentiaryDocumentTypeLocalizedDto(dto, locale));
  }

  mapEvidentiaryDocumentTypeEntityToEvidentiaryDocumentTypeDto(evidentiaryDocumentTypeEntity: EvidentiaryDocumentTypeEntity): EvidentiaryDocumentTypeDto {
    const id = evidentiaryDocumentTypeEntity.esdc_value;
    const nameEn = evidentiaryDocumentTypeEntity.esdc_nameenglish;
    const nameFr = evidentiaryDocumentTypeEntity.esdc_namefrench;
    return { id, nameEn, nameFr };
  }

  mapEvidentiaryDocumentTypeEntitiesToEvidentiaryDocumentTypeDtos(EvidentiaryDocumentTypeEntities: ReadonlyArray<EvidentiaryDocumentTypeEntity>): ReadonlyArray<EvidentiaryDocumentTypeDto> {
    return EvidentiaryDocumentTypeEntities.map((entity) => this.mapEvidentiaryDocumentTypeEntityToEvidentiaryDocumentTypeDto(entity));
  }
}
