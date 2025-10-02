import { injectable } from 'inversify';

import type { ApplicantDocumentEntity, FindApplicantDocumentsRequest } from '~/.server/domain/entities';
import type { Logger } from '~/.server/logging';
import { createLogger } from '~/.server/logging';

/**
 * A repository that provides access to applicant document data.
 */
export interface ApplicantDocumentRepository {
  /**
   * Finds applicant documents based on the provided request object.
   *
   * @param findApplicantDocumentsRequest The request object containing the SIN and userId for auditing.
   * @returns A promise that resolves to an array of applicant document entities.
   */
  findApplicantDocuments(findApplicantDocumentsRequest: FindApplicantDocumentsRequest): Promise<ReadonlyArray<ApplicantDocumentEntity>>;

  /**
   * Retrieves metadata associated with the applicant documents repository.
   *
   * @returns A record where the keys and values are strings representing metadata information.
   */
  getMetadata(): Record<string, string>;

  /**
   * Performs a health check to ensure that the applicant documents repository is operational.
   *
   * @throws An error if the health check fails or the repository is unavailable.
   * @returns A promise that resolves when the health check completes successfully.
   */
  checkHealth(): Promise<void>;
}

@injectable()
export class MockApplicantDocumentRepository implements ApplicantDocumentRepository {
  private readonly log: Logger;

  constructor() {
    this.log = createLogger('MockApplicantDocumentRepository');
  }

  async findApplicantDocuments(findApplicantDocumentsRequest: FindApplicantDocumentsRequest): Promise<ReadonlyArray<ApplicantDocumentEntity>> {
    this.log.debug('Fetch applicant documents', findApplicantDocumentsRequest);
    this.log.trace('Fetch applicant documents for request [%j]', findApplicantDocumentsRequest);

    const mockApplicantDocumentEntities: ReadonlyArray<ApplicantDocumentEntity> = [
      {
        id: '1',
        fileName: 'test-document.pdf',
        clientNumber: '123456',
        firstName: 'Eloise',
        lastName: 'Grimes',
        documentType: '1',
        uploadedAt: '2023-10-01T12:00:00Z', // ISO 8601 date string
        receivedAt: '2023-10-02T12:00:00Z', // ISO 8601 date string
      },
      {
        id: '2',
        fileName: 'another-document.pdf',
        clientNumber: '123456',
        firstName: 'Eloise',
        lastName: 'Grimes',
        documentType: '2',
        uploadedAt: '2023-11-01T12:00:00Z', // ISO 8601 date string
        receivedAt: '2023-11-02T12:00:00Z', // ISO 8601 date string
      },
      {
        id: '3',
        fileName: 'third-document.pdf',
        clientNumber: '112233',
        firstName: 'Ron',
        lastName: 'Grimes',
        documentType: '3',
        uploadedAt: '2023-12-01T12:00:00Z', // ISO 8601 date string
        receivedAt: '2023-12-02T12:00:00Z', // ISO 8601 date string
      },
    ];

    this.log.trace('Returning applicant documents [%j]', mockApplicantDocumentEntities);
    return await Promise.resolve(mockApplicantDocumentEntities);
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
