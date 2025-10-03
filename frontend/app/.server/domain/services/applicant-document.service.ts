import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { ApplicantDocumentDto, ListApplicantDocumentsRequest } from '~/.server/domain/dtos';
import type { ApplicantDocumentRepository } from '~/.server/domain/repositories';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';

/**
 * A service that provides access to applicant document data.
 */
export interface ApplicantDocumentService {
  /**
   * Lists applicant documents based on the provided request object.
   *
   * @param listApplicantDocumentsRequestDto The request object containing the SIN and userId for auditing.
   * @returns A promise that resolves to an array of applicant document DTOs.
   */
  listApplicantDocuments(listApplicantDocumentsRequestDto: ListApplicantDocumentsRequest): Promise<ReadonlyArray<ApplicantDocumentDto>>;
}

@injectable()
export class DefaultApplicantDocumentService implements ApplicantDocumentService {
  private readonly applicantDocumentsRepository;
  private readonly log: Logger;

  constructor(@inject(TYPES.ApplicantDocumentRepository) applicantDocumentsRepository: ApplicantDocumentRepository) {
    this.log = createLogger('DefaultApplicantDocumentService');
    this.applicantDocumentsRepository = applicantDocumentsRepository;
  }

  async listApplicantDocuments(listApplicantDocumentsRequest: ListApplicantDocumentsRequest): Promise<ReadonlyArray<ApplicantDocumentDto>> {
    this.log.debug('Get all applicant documents; userId: %s', listApplicantDocumentsRequest.userId);
    this.log.trace('Get all applicant documents for request [%j]', listApplicantDocumentsRequest);

    const findApplicantDocumentsRequest = listApplicantDocumentsRequest;
    const applicantDocumentEntities = await this.applicantDocumentsRepository.findApplicantDocuments(findApplicantDocumentsRequest);

    this.log.trace('Returning applicant documents: [%j]', applicantDocumentEntities);
    return applicantDocumentEntities;
  }
}
