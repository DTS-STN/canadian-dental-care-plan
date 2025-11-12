import { injectable } from 'inversify';

import type { EvidentiaryDocumentDto, EvidentiaryDocumentLocalizedDto } from '~/.server/domain/dtos';
import type { EvidentiaryDocumentEntity } from '~/.server/domain/entities';

export interface EvidentiaryDocumentDtoMapper {
  mapEvidentiaryDocumentDtoToEvidentiaryDocumentLocalizedDto(evidentiaryDocumentDto: EvidentiaryDocumentDto, locale: AppLocale): EvidentiaryDocumentLocalizedDto;
  mapEvidentiaryDocumentDtosToEvidentiaryDocumentLocalizedDtos(evidentiaryDocumentDtos: ReadonlyArray<EvidentiaryDocumentDto>, locale: AppLocale): ReadonlyArray<EvidentiaryDocumentLocalizedDto>;
  mapEvidentiaryDocumentEntityToEvidentiaryDocumentDto(evidentiaryDocumentEntity: EvidentiaryDocumentEntity): EvidentiaryDocumentDto;
  mapEvidentiaryDocumentEntitiesToEvidentiaryDocumentDtos(evidentiaryDocumentEntities: ReadonlyArray<EvidentiaryDocumentEntity>): ReadonlyArray<EvidentiaryDocumentDto>;
}

@injectable()
export class DefaultEvidentiaryDocumentDtoMapper implements EvidentiaryDocumentDtoMapper {
  mapEvidentiaryDocumentDtoToEvidentiaryDocumentLocalizedDto(evidentiaryDocumentDto: EvidentiaryDocumentDto, locale: AppLocale): EvidentiaryDocumentLocalizedDto {
    const { documentType, ...rest } = evidentiaryDocumentDto;
    return {
      ...rest,
      documentType: {
        id: documentType.id,
        name: locale === 'fr' ? documentType.nameFrench : documentType.nameEnglish,
      },
    };
  }

  mapEvidentiaryDocumentDtosToEvidentiaryDocumentLocalizedDtos(evidentiaryDocumentDtos: ReadonlyArray<EvidentiaryDocumentDto>, locale: AppLocale): ReadonlyArray<EvidentiaryDocumentLocalizedDto> {
    return evidentiaryDocumentDtos.map((dto) => this.mapEvidentiaryDocumentDtoToEvidentiaryDocumentLocalizedDto(dto, locale));
  }

  mapEvidentiaryDocumentEntityToEvidentiaryDocumentDto(evidentiaryDocumentEntity: EvidentiaryDocumentEntity): EvidentiaryDocumentDto {
    return {
      id: evidentiaryDocumentEntity.id,
      fileName: evidentiaryDocumentEntity.fileName,
      clientID: evidentiaryDocumentEntity.clientID,
      documentTypeId: evidentiaryDocumentEntity.documentTypeId,
      mscaUploadDate: evidentiaryDocumentEntity.mscaUploadDate,
      healthCanadaTransferDate: evidentiaryDocumentEntity.healthCanadaTransferDate,
      client: evidentiaryDocumentEntity.client,
      documentType: evidentiaryDocumentEntity.documentType,
    };
  }

  mapEvidentiaryDocumentEntitiesToEvidentiaryDocumentDtos(evidentiaryDocumentEntities: ReadonlyArray<EvidentiaryDocumentEntity>): ReadonlyArray<EvidentiaryDocumentDto> {
    return evidentiaryDocumentEntities.map((entity) => this.mapEvidentiaryDocumentEntityToEvidentiaryDocumentDto(entity));
  }
}
