import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { ApplicantRequestDto } from '~/.server/domain/dtos';
import type { ApplicantDtoMapper } from '~/.server/domain/mappers';
import type { ApplicantRepository } from '~/.server/domain/repositories';
import type { AuditService } from '~/.server/domain/services';
import type { LogFactory } from '~/.server/factories';
import type { Logger } from '~/.server/logging';

/**
 * A service that provides access to applicant data.
 */
export interface ApplicantService {
  /**
   * Finds the client number of an applicant by SIN.
   *
   * @param applicantRequestDto The applicant request dto that includes SIN and userId for auditing
   * @returns A Promise that resolves to the client number if found, or `null` otherwise.
   */
  findClientNumberBySin(applicantRequestDto: ApplicantRequestDto): Promise<string | null>;
}

@injectable()
export class DefaultApplicantService implements ApplicantService {
  private readonly log: Logger;
  private readonly applicantDtoMapper: ApplicantDtoMapper;
  private readonly applicantRepository: ApplicantRepository;
  private readonly auditService: AuditService;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.domain.mappers.ApplicantDtoMapper) applicantDtoMapper: ApplicantDtoMapper,
    @inject(TYPES.domain.repositories.ApplicantRepository) applicantRepository: ApplicantRepository,
    @inject(TYPES.domain.services.AuditService) auditService: AuditService,
  ) {
    this.log = logFactory.createLogger('DefaultApplicantService');
    this.applicantDtoMapper = applicantDtoMapper;
    this.applicantRepository = applicantRepository;
    this.auditService = auditService;
    this.init();
  }

  private init(): void {
    this.log.debug('DefaultApplicantService initiated.');
  }

  async findClientNumberBySin({ sin, userId }: ApplicantRequestDto): Promise<string | null> {
    this.log.trace('Finding client number with sin [%s] and userId [%s]', sin, userId);

    this.auditService.createAudit('personal-information.get', { userId });

    const applicantRequestEntity = this.applicantDtoMapper.mapSinToApplicantRequestEntity(sin);
    const applicantResponseEntity = await this.applicantRepository.findApplicantBySin(applicantRequestEntity);
    if (applicantResponseEntity === null) {
      this.log.trace('No applicant found for sin [%s]; Returning null', sin);
      return null;
    }

    const clientNumber = this.applicantDtoMapper.mapApplicantResponseEntityToClientNumber(applicantResponseEntity);
    this.log.trace('Returning client number [%s] for sin [%s]', clientNumber, sin);

    return clientNumber;
  }
}
