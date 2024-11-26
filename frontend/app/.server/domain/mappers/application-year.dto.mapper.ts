import { injectable } from 'inversify';

import type { ApplicationYearResultDto } from '~/.server/domain/dtos';
import type { ApplicationYearResultEntity } from '~/.server/domain/entities';

export interface ApplicationYearDtoMapper {
  mapApplicationYearResultEntityToApplicationYearResultDto(applicationYearResultEntity: ApplicationYearResultEntity): ReadonlyArray<ApplicationYearResultDto>;
}

@injectable()
export class DefaultApplicationYearDtoMapper implements ApplicationYearDtoMapper {
  mapApplicationYearResultEntityToApplicationYearResultDto(applicationYearResultEntity: ApplicationYearResultEntity): ReadonlyArray<ApplicationYearResultDto> {
    const applicationYearData = applicationYearResultEntity['ApplicationYearCollection'];

    const simplifiedApplicationYears = applicationYearData.map((entry) => ({
      taxYear: entry.TaxYear,
      applicationYearId: entry.ApplicationYearID,
    }));

    return simplifiedApplicationYears;
  }
}
