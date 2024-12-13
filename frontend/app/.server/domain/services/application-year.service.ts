import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { ApplicationYearRequestDto, ApplicationYearResultDto, RenewalApplicationYearResultDto } from '~/.server/domain/dtos';
import type { ApplicationYearDtoMapper } from '~/.server/domain/mappers';
import type { ApplicationYearRepository } from '~/.server/domain/repositories';
import type { AuditService } from '~/.server/domain/services';
import type { LogFactory, Logger } from '~/.server/factories';

export interface ApplicationYearService {
  /**
   * Fetches the renewal application year DTO using the data passed in the `ApplicationYearRequest` object.
   *
   * @param applicationYearRequestDto The request DTO object containing the current date and user id
   * @returns A promise that resolves to a `RenewalApplicationYearResultDto` object containing the renewal application year result DTO
   *   or `null` if no matching renewal application year is found.
   */
  findRenewalApplicationYear(applicationYearRequestDto: ApplicationYearRequestDto): Promise<RenewalApplicationYearResultDto | null>;

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
  }

  async findRenewalApplicationYear(applicationYearRequestDto: ApplicationYearRequestDto): Promise<RenewalApplicationYearResultDto | null> {
    this.log.trace('Finding renewal application year results with applicationYearRequest: [%j]', applicationYearRequestDto);

    this.auditService.createAudit('application-year.find-renewal-application-year', { userId: applicationYearRequestDto.userId });

    const applicationYearResultDtos = await this.listApplicationYears(applicationYearRequestDto);

    const matchingRenewalApplicationYear = applicationYearResultDtos.find((applicationYear) => {
      const { renewalStartDate, renewalEndDate } = applicationYear;
      const requestDate = new Date(applicationYearRequestDto.date);

      const startDate = renewalStartDate ? new Date(renewalStartDate) : null;
      const endDate = renewalEndDate ? new Date(renewalEndDate) : null;

      // Determine if the request date falls within the renewal period;
      // Treat end date as open-ended (they represent an indefinite period)
      if (!startDate) return false;
      return requestDate >= startDate && (!endDate || requestDate <= endDate);
    });

    if (!matchingRenewalApplicationYear) {
      this.log.info('No matching renewal application year found for date: [%s]', applicationYearRequestDto.date);
      return null;
    }

    const renewalApplicationYearResultDto = this.applicationYearDtoMapper.mapApplicationYearResultDtoToRenewalApplicationYearResultDto(matchingRenewalApplicationYear);

    this.log.trace('Returning renewal application year result: [%j]', renewalApplicationYearResultDto);
    return renewalApplicationYearResultDto;
  }

  async listApplicationYears(applicationYearRequestDto: ApplicationYearRequestDto): Promise<ReadonlyArray<ApplicationYearResultDto>> {
    this.log.trace('Getting possible application years results with applicationYearRequest: [%j]', applicationYearRequestDto);

    this.auditService.createAudit('application-year.get-application-year-result', { userId: applicationYearRequestDto.userId });

    const applicationYearResultEntity = await this.applicationYearRepository.listApplicationYears(applicationYearRequestDto.date);
    const applicationYearResultDto = this.applicationYearDtoMapper.mapApplicationYearResultEntityToApplicationYearResultDtos(applicationYearResultEntity);

    this.log.trace('Returning possible application years result: [%j]', applicationYearResultDto);
    return applicationYearResultDto;
  }
}
