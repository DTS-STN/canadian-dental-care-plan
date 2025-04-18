import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { ApplicationStatusBasicInfoRequestDto, ApplicationStatusSinRequestDto } from '~/.server/domain/dtos';
import type { ApplicationStatusDtoMapper } from '~/.server/domain/mappers';
import type { ApplicationStatusRepository } from '~/.server/domain/repositories';
import type { AuditService } from '~/.server/domain/services';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';

/**
 * A service that provides access to application status data.
 */
export interface ApplicationStatusService {
  /**
   * Finds the application status id for an applicant by basic info.
   *
   * @param applicationStatusBasicInfoRequestDto The basic info request dto.
   * @returns A Promise that resolves to the application status id if found, or `null` otherwise.
   */
  findApplicationStatusIdByBasicInfo(applicationStatusBasicInfoRequestDto: ApplicationStatusBasicInfoRequestDto): Promise<string | null>;

  /**
   * Finds the application status id for an applicant by SIN.
   *
   * @param applicationStatusSinRequestDto The SIN request dto.
   * @returns A Promise that resolves to the application status id if found, or `null` otherwise.
   */
  findApplicationStatusIdBySin(applicationStatusSinRequestDto: ApplicationStatusSinRequestDto): Promise<string | null>;
}

@injectable()
export class DefaultApplicationStatusService implements ApplicationStatusService {
  private readonly log: Logger;
  private readonly applicationStatusDtoMapper: ApplicationStatusDtoMapper;
  private readonly applicationStatusRepository: ApplicationStatusRepository;
  private readonly auditService: AuditService;

  constructor(
    @inject(TYPES.domain.mappers.ApplicationStatusDtoMapper) applicationStatusDtoMapper: ApplicationStatusDtoMapper,
    @inject(TYPES.domain.repositories.ApplicationStatusRepository) applicationStatusRepository: ApplicationStatusRepository,
    @inject(TYPES.domain.services.AuditService) auditService: AuditService,
  ) {
    this.log = createLogger('DefaultApplicationStatusService');
    this.applicationStatusDtoMapper = applicationStatusDtoMapper;
    this.applicationStatusRepository = applicationStatusRepository;
    this.auditService = auditService;
    this.init();
  }

  private init(): void {
    this.log.debug('DefaultApplicationStatusService initiated.');
  }

  async findApplicationStatusIdByBasicInfo(applicationStatusBasicInfoRequestDto: ApplicationStatusBasicInfoRequestDto): Promise<string | null> {
    this.log.trace('Finding application status id by basic info: [%j]', applicationStatusBasicInfoRequestDto);

    this.auditService.createAudit('application-status.post', { userId: applicationStatusBasicInfoRequestDto.userId });

    const applicationStatusBasicInfoRequestEntity = this.applicationStatusDtoMapper.mapApplicationStatusBasicInfoRequestDtoToApplicationStatusBasicInfoRequestEntity(applicationStatusBasicInfoRequestDto);
    const applicationStatusEntity = await this.applicationStatusRepository.getApplicationStatusByBasicInfo(applicationStatusBasicInfoRequestEntity);
    const applicationStatusId = this.applicationStatusDtoMapper.mapApplicationStatusEntityToApplicationStatusId(applicationStatusEntity);

    this.log.trace('Returning application status id: [%s]', applicationStatusId);
    return applicationStatusId;
  }

  async findApplicationStatusIdBySin(applicationStatusSinRequestDto: ApplicationStatusSinRequestDto): Promise<string | null> {
    this.log.trace('Finding application status id by sin: [%j]', applicationStatusSinRequestDto);

    this.auditService.createAudit('application-status.post', { userId: applicationStatusSinRequestDto.userId });

    const applicationStatusSinRequestEntity = this.applicationStatusDtoMapper.mapApplicationStatusSinRequestDtoToApplicationStatusSinRequestEntity(applicationStatusSinRequestDto);
    const applicationStatusEntity = await this.applicationStatusRepository.getApplicationStatusBySin(applicationStatusSinRequestEntity);
    const applicationStatusId = this.applicationStatusDtoMapper.mapApplicationStatusEntityToApplicationStatusId(applicationStatusEntity);

    this.log.trace('Returning application status id: [%s]', applicationStatusId);
    return applicationStatusId;
  }
}
