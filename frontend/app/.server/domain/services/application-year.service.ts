import { inject, injectable } from 'inversify';
import moize from 'moize';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { ApplicationYearResultDto, IntakeApplicationYearResultDto, RenewalApplicationYearResultDto } from '~/.server/domain/dtos';
import { ApplicationYearNotFoundException } from '~/.server/domain/exceptions/application-year-not-found.exception';
import type { ApplicationYearDtoMapper } from '~/.server/domain/mappers';
import type { ApplicationYearRepository } from '~/.server/domain/repositories';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';

export interface ApplicationYearService {
  /**
   * Fetches the intake application year DTO for a given date
   *
   * @param date The date sent to get the intake application year result in ISO 8601 format (e.g., "2024-12-25").
   * @returns A promise that resolves to an `IntakeApplicationYearResultDto` object containing the intake application year result DTO
   * @throws {ApplicationYearNotFoundException} If no matching intake application year is found for the given date
   */
  getIntakeApplicationYear(date: string): Promise<IntakeApplicationYearResultDto>;

  /**
   * Fetches the renewal application year DTO for a given date
   *
   * @param date The date sent to get the renewal application year result in ISO 8601 format (e.g., "2024-12-25").
   * @returns A promise that resolves to an `RenewalApplicationYearResultDto` object containing the renewal application year result DTO
   *   or `null` if no matching renewal application year is found.
   */
  findRenewalApplicationYear(date: string): Promise<RenewalApplicationYearResultDto | null>;

  /**
   * Fetches possible application years for a given date
   *
   * @param date The date sent to get the application years in ISO 8601 format (e.g., "2024-12-25").
   * @returns A promise that resolves to an `ApplicationYearResultDto` object containing possible application year results
   */
  listApplicationYears(date: string): Promise<ReadonlyArray<ApplicationYearResultDto>>;
}

@injectable()
export class DefaultApplicationYearService implements ApplicationYearService {
  private readonly log: Logger;
  private readonly applicationYearDtoMapper: ApplicationYearDtoMapper;
  private readonly applicationYearRepository: ApplicationYearRepository;
  private readonly serverConfig: Pick<ServerConfig, 'APPLICATION_CURRENT_DATE' | 'LOOKUP_SVC_APPLICATION_YEAR_CACHE_TTL_SECONDS'>;

  constructor(
    @inject(TYPES.domain.mappers.ApplicationYearDtoMapper) applicationYearDtoMapper: ApplicationYearDtoMapper,
    @inject(TYPES.domain.repositories.ApplicationYearRepository) applicationYearRepository: ApplicationYearRepository,
    @inject(TYPES.configs.ServerConfig) serverConfig: Pick<ServerConfig, 'APPLICATION_CURRENT_DATE' | 'LOOKUP_SVC_APPLICATION_YEAR_CACHE_TTL_SECONDS'>,
  ) {
    this.log = createLogger('DefaultApplicationYearService');
    this.applicationYearDtoMapper = applicationYearDtoMapper;
    this.applicationYearRepository = applicationYearRepository;
    this.serverConfig = serverConfig;
    this.init();
  }

  private init(): void {
    this.log.debug('Cache TTL value: %d ms', 1000 * this.serverConfig.LOOKUP_SVC_APPLICATION_YEAR_CACHE_TTL_SECONDS);

    this.getIntakeApplicationYear = moize(this.getIntakeApplicationYear, {
      matchesKey: (cacheKey, key) => cacheKey.every((item, idx) => item.date === key[idx].date),
      maxAge: this.serverConfig.LOOKUP_SVC_APPLICATION_YEAR_CACHE_TTL_SECONDS * 1000,
      maxSize: Infinity,
      isPromise: true,
      onCacheAdd: () => this.log.info('Creating new getIntakeApplicationYear memo'),
    });

    this.findRenewalApplicationYear = moize(this.findRenewalApplicationYear, {
      matchesKey: (cacheKey, key) => cacheKey.every((item, idx) => item.date === key[idx].date),
      maxAge: this.serverConfig.LOOKUP_SVC_APPLICATION_YEAR_CACHE_TTL_SECONDS * 1000,
      maxSize: Infinity,
      isPromise: true,
      onCacheAdd: () => this.log.info('Creating new findRenewalApplicationYear memo'),
    });

    this.listApplicationYears = moize(this.listApplicationYears, {
      matchesKey: (cacheKey, key) => cacheKey.every((item, idx) => item.date === key[idx].date),
      maxAge: this.serverConfig.LOOKUP_SVC_APPLICATION_YEAR_CACHE_TTL_SECONDS * 1000,
      maxSize: Infinity,
      isPromise: true,
      onCacheAdd: () => this.log.info('Creating new listApplicationYears memo'),
    });

    this.log.debug('DefaultApplicationYearService initiated.');
  }

  async getIntakeApplicationYear(date: string): Promise<IntakeApplicationYearResultDto> {
    this.log.trace('Finding intake application year results with date: [%s]', date);

    const applicationYearRequestDate = this.serverConfig.APPLICATION_CURRENT_DATE ?? date;
    this.log.debug('Using application year request date [%s]', applicationYearRequestDate);

    const applicationYearResultDtos = await this.listApplicationYears(date);

    const matchingIntakeApplicationYear = applicationYearResultDtos.find((applicationYear) => {
      const { intakeStartDate, intakeEndDate } = applicationYear;
      const requestDate = new Date(applicationYearRequestDate);

      const startDate = new Date(intakeStartDate);
      const endDate = intakeEndDate ? new Date(intakeEndDate) : null;

      // Determine if the request date falls within the intake period;
      // Treat end date as open-ended (they represent an indefinite period)
      return requestDate >= startDate && (!endDate || requestDate <= endDate);
    });

    if (!matchingIntakeApplicationYear) {
      this.log.error('No matching intake application year found for date: [%s]', applicationYearRequestDate);
      throw new ApplicationYearNotFoundException(`No matching intake application year found for date: [${applicationYearRequestDate}]`);
    }

    const intakeApplicationYearResultDto = this.applicationYearDtoMapper.mapApplicationYearResultDtoToIntakeApplicationYearResultDto(matchingIntakeApplicationYear);

    this.log.trace('Returning intake application year result: [%j]', intakeApplicationYearResultDto);
    return intakeApplicationYearResultDto;
  }

  async findRenewalApplicationYear(date: string): Promise<RenewalApplicationYearResultDto | null> {
    this.log.trace('Finding renewal application year results with date: [%s]', date);

    const applicationYearRequestDate = this.serverConfig.APPLICATION_CURRENT_DATE ?? date;
    this.log.debug('Using application year request date [%s]', applicationYearRequestDate);

    const applicationYearResultDtos = await this.listApplicationYears(date);

    const matchingRenewalApplicationYear = applicationYearResultDtos.find((applicationYear) => {
      const { renewalStartDate, renewalEndDate } = applicationYear;
      const requestDate = new Date(applicationYearRequestDate);

      const startDate = renewalStartDate ? new Date(renewalStartDate) : null;
      const endDate = renewalEndDate ? new Date(renewalEndDate) : null;

      // Determine if the request date falls within the renewal period;
      // Treat end date as open-ended (they represent an indefinite period)
      if (!startDate) return false;
      return requestDate >= startDate && (!endDate || requestDate <= endDate);
    });

    if (!matchingRenewalApplicationYear) {
      this.log.info('No matching renewal application year found for date: [%s]', applicationYearRequestDate);
      return null;
    }

    // Find the intake year corresponding to the matching renewal application year.
    // This happens when the `nextApplicationYearId` of an application year matches the `applicationYearId` of the matching renewal application year.
    const intakeYear = applicationYearResultDtos.find((applicationYear) => {
      return applicationYear.nextApplicationYearId === matchingRenewalApplicationYear.applicationYearId;
    });

    // Use the intake year's coverage end date if found;
    // Otherwise, use the matching renewal application year's coverage end date.
    const coverageEndDate = intakeYear ? intakeYear.coverageEndDate : matchingRenewalApplicationYear.coverageEndDate;

    const renewalApplicationYearResultDto = this.applicationYearDtoMapper.mapApplicationYearResultDtoToRenewalApplicationYearResultDto({ coverageEndDate, applicationYearResultDto: matchingRenewalApplicationYear });

    this.log.trace('Returning renewal application year result: [%j]', renewalApplicationYearResultDto);
    return renewalApplicationYearResultDto;
  }

  async listApplicationYears(date: string): Promise<ReadonlyArray<ApplicationYearResultDto>> {
    this.log.trace('Getting possible application years results with date: [%j]', date);

    const applicationYearRequestDate = this.serverConfig.APPLICATION_CURRENT_DATE ?? date;
    const applicationYearResultEntity = await this.applicationYearRepository.listApplicationYears(applicationYearRequestDate);
    const applicationYearResultDto = this.applicationYearDtoMapper.mapApplicationYearResultEntityToApplicationYearResultDtos(applicationYearResultEntity);

    this.log.trace('Returning possible application years result: [%j]', applicationYearResultDto);
    return applicationYearResultDto;
  }
}
