import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs';
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

export type ApplicationYearImpl_ServiceConfig = Pick<ServerConfig, 'LOOKUP_SVC_ALL_YEARS_CACHE_TTL_SECONDS'>;

@injectable()
export class ApplicationYearServiceImpl implements ApplicationYearService {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.domain.mappers.ApplicationYearDtoMapper) private readonly applicationYearDtoMapper: ApplicationYearDtoMapper,
    @inject(TYPES.domain.repositories.ApplicationYearRepository) private readonly applicationYearRepository: ApplicationYearRepository,
    @inject(TYPES.domain.services.AuditService) private readonly auditService: AuditService,
    @inject(TYPES.configs.ServerConfig) private readonly serverConfig: ApplicationYearImpl_ServiceConfig,
  ) {
    this.log = logFactory.createLogger('ApplicationYearServiceImpl');

    // Configure caching for country operations
    this.listApplicationYears.options.maxAge = 1000 * this.serverConfig.LOOKUP_SVC_ALL_YEARS_CACHE_TTL_SECONDS;
  }

  /**
   * Retrieves a list of all possible application year(s).
   *
   * @returns An array of Application Year(s) DTOs.
   */
  listApplicationYears = moize(this.listApplicationYearsImpl, {
    onCacheAdd: () => this.log.info('Creating new listApplicationYears memo'),
  });

  async listApplicationYearsImpl(applicationYearRequestDto: ApplicationYearRequestDto): Promise<ReadonlyArray<ApplicationYearResultDto>> {
    this.log.trace('Getting possible application years results with applicationYearRequest: [%j]', applicationYearRequestDto);

    this.auditService.createAudit('application-year.get-application-year-result', { userId: applicationYearRequestDto.userId });

    const applicationYearResultEntity = await this.applicationYearRepository.listApplicationYears(applicationYearRequestDto);
    const applicationYearResultDto = this.applicationYearDtoMapper.mapApplicationYearResultEntityToApplicationYearResultDto(applicationYearResultEntity);

    this.log.trace('Returning possible application years result: [%j]', applicationYearResultDto);
    return applicationYearResultDto;
  }
}
