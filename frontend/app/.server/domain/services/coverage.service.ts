import { injectable } from 'inversify';

import type { CoverageDto } from '~/.server/domain/dtos';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';

/**
 * Service interface for managing coverage information.
 * Provides methods to retrieve coverage details for specific dates or the current period.
 */
export interface CoverageService {
  /**
   * Retrieves coverage information for a specific date.
   * @param date - The date for which to retrieve coverage information
   * @returns Coverage details for the specified date
   */
  getCoverage(date: Date): CoverageDto;

  /**
   * Retrieves the current coverage information.
   * @returns Coverage details for the current period
   */
  getCurrentCoverage(): CoverageDto;
}

@injectable()
export class DefaultCoverageService implements CoverageService {
  private readonly log: Logger;

  constructor() {
    this.log = createLogger('DefaultCoverageService');
  }

  getCoverage(date: Date): CoverageDto {
    this.log.trace('Finding coverage with date: [%s]', date.toISOString());
    // Substract one year if month is less than July
    const year = date.getFullYear() - (date.getMonth() < 6 ? 1 : 0);
    return {
      year,
      taxationYear: year - 1,
      startDate: `${year}-07-01T00:00:00.000Z`,
      endDate: `${year + 1}-06-30T23:59:59.999Z`,
    };
  }

  getCurrentCoverage(): CoverageDto {
    this.log.trace('Finding current coverage');
    return this.getCoverage(new Date());
  }
}
