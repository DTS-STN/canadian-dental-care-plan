import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { EvidentiaryDocumentDto, ListEvidentiaryDocumentsRequest } from '~/.server/domain/dtos';
import type { EvidentiaryDocumentRepository } from '~/.server/domain/repositories';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';

/**
 * A service that provides access to evidentiary document data.
 */
export interface EvidentiaryDocumentService {
  /**
   * Lists evidentiary documents based on the provided request object.
   *
   * @param listEvidentiaryDocumentsRequestDto The request object containing the SIN and userId for auditing.
   * @returns A promise that resolves to an array of evidentiary document DTOs.
   */
  listEvidentiaryDocuments(listEvidentiaryDocumentsRequestDto: ListEvidentiaryDocumentsRequest): Promise<ReadonlyArray<EvidentiaryDocumentDto>>;
}

@injectable()
export class DefaultEvidentiaryDocumentService implements EvidentiaryDocumentService {
  private readonly evidentiaryDocumentsRepository;
  private readonly log: Logger;

  constructor(@inject(TYPES.EvidentiaryDocumentRepository) evidentiaryDocumentsRepository: EvidentiaryDocumentRepository) {
    this.log = createLogger('DefaultEvidentiaryDocumentService');
    this.evidentiaryDocumentsRepository = evidentiaryDocumentsRepository;
  }

  async listEvidentiaryDocuments(listEvidentiaryDocumentsRequest: ListEvidentiaryDocumentsRequest): Promise<ReadonlyArray<EvidentiaryDocumentDto>> {
    this.log.debug('Get all evidentiary documents; userId: %s', listEvidentiaryDocumentsRequest.userId);
    this.log.trace('Get all evidentiary documents for request [%j]', listEvidentiaryDocumentsRequest);

    const findEvidentiaryDocumentsRequest = listEvidentiaryDocumentsRequest;
    const evidentiaryDocumentEntities = await this.evidentiaryDocumentsRepository.findEvidentiaryDocuments(findEvidentiaryDocumentsRequest);

    this.log.trace('Returning evidentiary documents: [%j]', evidentiaryDocumentEntities);
    return evidentiaryDocumentEntities;
  }
}
