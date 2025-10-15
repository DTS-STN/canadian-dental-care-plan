import { injectable } from 'inversify';

import type { DocumentScanResponseDto, DocumentUploadErrorDto, DocumentUploadResponseDto } from '~/.server/domain/dtos';
import type { DocumentScanResponseEntity, DocumentUploadErrorEntity, DocumentUploadResponseEntity } from '~/.server/domain/entities';

export interface DocumentUploadDtoMapper {
  mapDocumentUploadResponseEntityToDto(responseEntity: DocumentUploadResponseEntity): DocumentUploadResponseDto;
  mapDocumentUploadErrorEntityToDto(errorEntity: DocumentUploadErrorEntity): DocumentUploadErrorDto;
  mapDocumentScanResponseEntityToDto(responseEntity: DocumentScanResponseEntity): DocumentScanResponseDto;
}

@injectable()
export class DefaultDocumentUploadDtoMapper implements DocumentUploadDtoMapper {
  mapDocumentUploadResponseEntityToDto(responseEntity: DocumentUploadResponseEntity): DocumentUploadResponseDto {
    return {
      Error: responseEntity.Error ? this.mapDocumentUploadErrorEntityToDto(responseEntity.Error) : null,
      DocumentFileName: responseEntity.DocumentFileName,
    };
  }

  mapDocumentUploadErrorEntityToDto(errorEntity: DocumentUploadErrorEntity): DocumentUploadErrorDto {
    return {
      ErrorCode: errorEntity.ErrorCode,
      ErrorMessage: errorEntity.ErrorMessage,
    };
  }

  mapDocumentScanResponseEntityToDto(responseEntity: DocumentScanResponseEntity): DocumentScanResponseDto {
    return {
      Error: responseEntity.Error ? this.mapDocumentUploadErrorEntityToDto(responseEntity.Error) : null,
      Percent: responseEntity.Percent,
    };
  }
}
