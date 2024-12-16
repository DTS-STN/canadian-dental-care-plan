import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { ApplicationYearRequestDto, ApplicationYearResultDto } from '~/.server/domain/dtos';
import type { ApplicationYearDtoMapper } from '~/.server/domain/mappers';
import type { ApplicationYearRepository } from '~/.server/domain/repositories';
import type { AuditService } from '~/.server/domain/services';
import type { LogFactory, Logger } from '~/.server/factories';

export interface ApplicationYearService {
  /**
   * fetches possible application year(s) using the data passed in the `ApplicationYearRequest` object.
   *
   * @param applicationYearRequestDto The request DTO object containing the current date and user id
   * @returns A promise that resolves to a `ApplicationYearResultDto` object containing possible application years results
   */
  listApplicationYears(applicationYearRequestDto: ApplicationYearRequestDto): Promise<ReadonlyArray<ApplicationYearResultDto>>;
}

@injectable()
export class DefaultApplicationYearService implements ApplicationYearService {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.domain.mappers.ApplicationYearDtoMapper) private readonly applicationYearDtoMapper: ApplicationYearDtoMapper,
    @inject(TYPES.domain.repositories.ApplicationYearRepository) private readonly applicationYearRepository: ApplicationYearRepository,
    @inject(TYPES.domain.services.AuditService) private readonly auditService: AuditService,
  ) {
    this.log = logFactory.createLogger('DefaultApplicationYearService');
    this.init();
  }

  private init(): void {
    this.log.debug('DefaultApplicationYearService initiated.');
  }

  async listApplicationYears(applicationYearRequestDto: ApplicationYearRequestDto): Promise<ReadonlyArray<ApplicationYearResultDto>> {
    this.log.trace('Getting possible application years results with applicationYearRequest: [%j]', applicationYearRequestDto);

    this.auditService.createAudit('application-year.get-application-year-result', { userId: applicationYearRequestDto.userId });

    const applicationYearResultEntity = await this.applicationYearRepository.listApplicationYears(applicationYearRequestDto.date);
    const applicationYearResultDto = this.applicationYearDtoMapper.mapApplicationYearResultEntityToApplicationYearResultDto(applicationYearResultEntity);

    this.log.trace('Returning possible application years result: [%j]', applicationYearResultDto);
    return applicationYearResultDto;
  }
}
