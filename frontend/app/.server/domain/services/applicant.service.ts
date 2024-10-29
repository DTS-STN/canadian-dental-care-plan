import { inject, injectable } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { ApplicantRequestDto } from '~/.server/domain/dtos';
import type { ApplicantDtoMapper } from '~/.server/domain/mappers';
import type { ApplicantRepository } from '~/.server/domain/repositories';
import type { AuditService } from '~/.server/domain/services';
import type { LogFactory, Logger } from '~/.server/factories';

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
export class ApplicantServiceImpl implements ApplicantService {
  private readonly log: Logger;

  constructor(
    @inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory,
    @inject(SERVICE_IDENTIFIER.APPLICANT_DTO_MAPPER) private readonly applicantDtoMapper: ApplicantDtoMapper,
    @inject(SERVICE_IDENTIFIER.APPLICANT_REPOSITORY) private readonly applicantRepository: ApplicantRepository,
    @inject(SERVICE_IDENTIFIER.AUDIT_SERVICE) private readonly auditService: AuditService,
  ) {
    this.log = logFactory.createLogger('ApplicantServiceImpl');
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