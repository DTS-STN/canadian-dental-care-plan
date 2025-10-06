import { injectable } from 'inversify';

import type { EvidentiaryDocumentEntity, FindEvidentiaryDocumentsRequest } from '~/.server/domain/entities';
import type { Logger } from '~/.server/logging';
import { createLogger } from '~/.server/logging';

/**
 * A repository that provides access to evidentiary document data.
 */
export interface EvidentiaryDocumentRepository {
  /**
   * Finds evidentiary documents based on the provided request object.
   *
   * @param findEvidentiaryDocumentsRequest The request object containing the SIN and userId for auditing.
   * @returns A promise that resolves to an array of evidentiary document entities.
   */
  findEvidentiaryDocuments(findEvidentiaryDocumentsRequest: FindEvidentiaryDocumentsRequest): Promise<ReadonlyArray<EvidentiaryDocumentEntity>>;

  /**
   * Retrieves metadata associated with the evidentiary documents repository.
   *
   * @returns A record where the keys and values are strings representing metadata information.
   */
  getMetadata(): Record<string, string>;

  /**
   * Performs a health check to ensure that the evidentiary documents repository is operational.
   *
   * @throws An error if the health check fails or the repository is unavailable.
   * @returns A promise that resolves when the health check completes successfully.
   */
  checkHealth(): Promise<void>;
}

@injectable()
export class MockEvidentiaryDocumentRepository implements EvidentiaryDocumentRepository {
  private readonly log: Logger;

  constructor() {
    this.log = createLogger('MockEvidentiaryDocumentRepository');
  }

  async findEvidentiaryDocuments(findEvidentiaryDocumentsRequest: FindEvidentiaryDocumentsRequest): Promise<ReadonlyArray<EvidentiaryDocumentEntity>> {
    this.log.debug('Fetch evidentiary documents');
    this.log.trace('Fetch evidentiary documents for request [%j]', findEvidentiaryDocumentsRequest);

    // documentTypeId mock source: app/.server/resources\power-platform/evidentiary-document-type.json
    const mockEvidentiaryDocumentEntities: ReadonlyArray<EvidentiaryDocumentEntity> = [
      {
        id: '1',
        fileName: 'test-document.pdf',
        clientID: '123456',
        name: 'Eloise Grimes',
        documentTypeId: '004',
        mscaUploadDate: '2023-10-01T12:00:00Z', // ISO 8601 date string
      },
      {
        id: '2',
        fileName: 'another-document.pdf',
        clientID: '123456',
        name: 'Eloise Grimes',
        documentTypeId: '002',
        mscaUploadDate: '2023-11-01T12:00:00Z', // ISO 8601 date string
        healthCanadaTransferDate: '2023-11-02T12:00:00Z', // ISO 8601 date string
      },
      {
        id: '3',
        fileName: 'third-document.pdf',
        clientID: '112233',
        name: 'Ron Grimes',
        documentTypeId: '003',
        mscaUploadDate: '2023-12-01T12:00:00Z', // ISO 8601 date string
        healthCanadaTransferDate: '2023-12-02T12:00:00Z', // ISO 8601 date string
      },
    ];

    this.log.trace('Returning evidentiary documents [%j]', mockEvidentiaryDocumentEntities);
    return await Promise.resolve(mockEvidentiaryDocumentEntities);
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
