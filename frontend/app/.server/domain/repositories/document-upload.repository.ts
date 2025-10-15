import { injectable } from 'inversify';

import type { DocumentScanRequestDto, DocumentUploadRequestDto } from '~/.server/domain/dtos';
import type { DocumentScanResponseEntity, DocumentUploadResponseEntity } from '~/.server/domain/entities';
import type { Logger } from '~/.server/logging';
import { createLogger } from '~/.server/logging';

/**
 * A repository that provides document uploading and scanning functionality.
 */
export interface DocumentUploadRepository {
  /**
   * Upload a document to a predetermined drop location.
   * This will process the file through scan for threats and upload the file to an SFTP/FTPS drop location.
   *
   * @param documentUploadRequestDto The document upload request DTO
   * @returns A Promise that resolves to the document upload response entity.
   */
  uploadDocument(documentUploadRequestDto: DocumentUploadRequestDto): Promise<DocumentUploadResponseEntity>;

  /**
   * Scan a document for threats and return scan result synchronously.
   *
   * @param documentScanRequestDto The document scan request DTO
   * @returns A Promise that resolves to the document scan response entity.
   */
  scanDocument(documentScanRequestDto: DocumentScanRequestDto): Promise<DocumentScanResponseEntity>;

  /**
   * Retrieves metadata associated with the document upload repository.
   *
   * @returns A record where the keys and values are strings representing metadata information.
   */
  getMetadata(): Record<string, string>;

  /**
   * Performs a health check to ensure that the document upload repository is operational.
   *
   * @throws An error if the health check fails or the repository is unavailable.
   * @returns A promise that resolves when the health check completes successfully.
   */
  checkHealth(): Promise<void>;
}

@injectable()
export class MockDocumentUploadRepository implements DocumentUploadRepository {
  private readonly log: Logger;

  constructor() {
    this.log = createLogger('MockDocumentUploadRepository');
  }

  async uploadDocument(documentUploadRequestDto: DocumentUploadRequestDto): Promise<DocumentUploadResponseEntity> {
    this.log.debug('Uploading document for fileName [%s]', documentUploadRequestDto.fileName);

    this.log.debug('Successfully uploaded document: [%s]', documentUploadRequestDto.fileName);

    return await Promise.resolve({
      Error: null,
      DocumentFileName: documentUploadRequestDto.fileName,
    });
  }

  async scanDocument(documentScanRequestDto: DocumentScanRequestDto): Promise<DocumentScanResponseEntity> {
    this.log.debug('Scanning document for fileName [%s]', documentScanRequestDto.fileName);

    this.log.debug('Successfully scanned document. File is safe.');

    return await Promise.resolve({
      Error: null,
      Percent: '100',
    });
  }

  getMetadata(): Record<string, string> {
    return {
      mockEnabled: 'true',
    };
  }

  async checkHealth(): Promise<void> {
    return await Promise.resolve();
  }
}
