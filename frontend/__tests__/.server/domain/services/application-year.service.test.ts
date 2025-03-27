import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ApplicationYearResultDto, IntakeApplicationYearResultDto, RenewalApplicationYearResultDto } from '~/.server/domain/dtos';
import type { ApplicationYearResultEntity } from '~/.server/domain/entities';
import { ApplicationYearNotFoundException } from '~/.server/domain/exceptions/application-year-not-found.exception';
import type { ApplicationYearDtoMapper } from '~/.server/domain/mappers';
import type { ApplicationYearRepository } from '~/.server/domain/repositories';
import { DefaultApplicationYearService } from '~/.server/domain/services';
import type { LogFactory, Logger } from '~/.server/factories';

describe('DefaultApplicationYearService', () => {
  const mockLogFactory = mock<LogFactory>();
  mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

  const mockApplicationYearResultDtos: ApplicationYearResultDto[] = [
    {
      // renewal start and end dates not set
      applicationYear: '2024',
      applicationYearId: '2024',
      taxYear: '2024',
      coverageStartDate: '2024-01-01',
      coverageEndDate: '2024-12-31',
      intakeStartDate: '2024-01-01',
      intakeEndDate: '2024-12-31',
      nextApplicationYearId: '2025',
    },
    // all fields set
    {
      applicationYear: '2025',
      applicationYearId: '2025',
      taxYear: '2025',
      coverageStartDate: '2025-01-01',
      coverageEndDate: '2025-12-31',
      intakeStartDate: '2025-01-01',
      intakeEndDate: '2025-12-31',
      nextApplicationYearId: '2026',
      renewalStartDate: '2025-01-01',
      renewalEndDate: '2025-12-31',
    },
    {
      // optional end dates not set
      applicationYear: '2026',
      applicationYearId: '2026',
      taxYear: '2026',
      coverageStartDate: '2026-01-01',
      coverageEndDate: '2026-12-31',
      intakeStartDate: '2026-01-01',
      renewalStartDate: '2026-01-01',
    },
  ];

  const mockApplicationYearResultEntity: ApplicationYearResultEntity = {
    BenefitApplicationYear: [
      {
        BenefitApplicationYearIdentification: [{ IdentificationID: '1' }],
        BenefitApplicationYearEffectivePeriod: { StartDate: { YearDate: '2024' } },
        BenefitApplicationYearTaxYear: { YearDate: '2024' },
        BenefitApplicationYearIntakePeriod: { StartDate: { date: '2024-01-01' }, EndDate: { date: '2024-12-31' } },
        BenefitApplicationYearRenewalPeriod: { StartDate: { date: '2024-01-01' }, EndDate: { date: '2024-12-31' } },
        BenefitApplicationYearNext: { BenefitApplicationYearIdentification: { IdentificationID: '1' } },
        BenefitApplicationYearCoveragePeriod: { StartDate: { date: '2024-01-01' }, EndDate: { date: '2024-12-31' } },
      },
    ],
  };
  const mockApplicationYearRepository = mock<ApplicationYearRepository>();
  mockApplicationYearRepository.listApplicationYears.mockResolvedValue(mockApplicationYearResultEntity);

  describe('findRenewalApplicationYear', () => {
    const mockRenewalApplicationYearResultDto: RenewalApplicationYearResultDto = { taxYear: '2025', coverageEndDate: '2025-01-01' };
    const mockApplicationYearDtoMapper = mock<ApplicationYearDtoMapper>();
    mockApplicationYearDtoMapper.mapApplicationYearResultEntityToApplicationYearResultDtos.mockReturnValue(mockApplicationYearResultDtos);
    mockApplicationYearDtoMapper.mapApplicationYearResultDtoToRenewalApplicationYearResultDto.mockReturnValue(mockRenewalApplicationYearResultDto);

    it('should return the correct renewal application year if given date is within a renewal period', async () => {
      const mockServerConfig = { APPLICATION_YEAR_REQUEST_DATE: undefined, LOOKUP_SVC_APPLICATION_YEAR_CACHE_TTL_SECONDS: 10 };

      const service = new DefaultApplicationYearService(mockLogFactory, mockApplicationYearDtoMapper, mockApplicationYearRepository, mockServerConfig);
      const result = await service.findRenewalApplicationYear('2025-01-01');

      expect(mockApplicationYearDtoMapper.mapApplicationYearResultDtoToRenewalApplicationYearResultDto).toHaveBeenCalledWith({
        coverageEndDate: '2024-12-31',
        applicationYearResultDto: {
          applicationYear: '2025',
          applicationYearId: '2025',
          taxYear: '2025',
          coverageStartDate: '2025-01-01',
          coverageEndDate: '2025-12-31',
          intakeStartDate: '2025-01-01',
          intakeEndDate: '2025-12-31',
          nextApplicationYearId: '2026',
          renewalStartDate: '2025-01-01',
          renewalEndDate: '2025-12-31',
        },
      });
      expect(result).toEqual(mockRenewalApplicationYearResultDto);
    });

    it('should return the correct renewal application year when the given date is on or after the renewal start date and no renewal end date is provided', async () => {
      const mockServerConfig = { APPLICATION_YEAR_REQUEST_DATE: undefined, LOOKUP_SVC_APPLICATION_YEAR_CACHE_TTL_SECONDS: 10 };

      const service = new DefaultApplicationYearService(mockLogFactory, mockApplicationYearDtoMapper, mockApplicationYearRepository, mockServerConfig);
      const result = await service.findRenewalApplicationYear('2026-01-01');

      expect(mockApplicationYearDtoMapper.mapApplicationYearResultDtoToRenewalApplicationYearResultDto).toHaveBeenCalledWith({
        coverageEndDate: '2025-12-31',
        applicationYearResultDto: { applicationYear: '2026', applicationYearId: '2026', taxYear: '2026', coverageStartDate: '2026-01-01', coverageEndDate: '2026-12-31', intakeStartDate: '2026-01-01', renewalStartDate: '2026-01-01' },
      });
      expect(result).toEqual(mockRenewalApplicationYearResultDto);
    });

    it('should return null if given date is not within any renewal period', async () => {
      const mockServerConfig = { APPLICATION_YEAR_REQUEST_DATE: undefined, LOOKUP_SVC_APPLICATION_YEAR_CACHE_TTL_SECONDS: 10 };

      const service = new DefaultApplicationYearService(mockLogFactory, mockApplicationYearDtoMapper, mockApplicationYearRepository, mockServerConfig);

      const result = await service.findRenewalApplicationYear('2024-01-01');
      expect(result).toEqual(null);
    });
  });

  describe('getIntakeApplicationYear', () => {
    const mockIntakeApplicationYearResultDto: IntakeApplicationYearResultDto = { intakeYearId: '2025', taxYear: '2025', coverageStartDate: '2025-06-01' };
    const mockApplicationYearDtoMapper = mock<ApplicationYearDtoMapper>();
    mockApplicationYearDtoMapper.mapApplicationYearResultEntityToApplicationYearResultDtos.mockReturnValue(mockApplicationYearResultDtos);
    mockApplicationYearDtoMapper.mapApplicationYearResultDtoToIntakeApplicationYearResultDto.mockReturnValue(mockIntakeApplicationYearResultDto);

    it('should return the correct intake application year if given date is within an intake period', async () => {
      const mockServerConfig = { APPLICATION_YEAR_REQUEST_DATE: undefined, LOOKUP_SVC_APPLICATION_YEAR_CACHE_TTL_SECONDS: 10 };

      const service = new DefaultApplicationYearService(mockLogFactory, mockApplicationYearDtoMapper, mockApplicationYearRepository, mockServerConfig);
      const result = await service.getIntakeApplicationYear('2025-01-01');

      expect(mockApplicationYearDtoMapper.mapApplicationYearResultDtoToIntakeApplicationYearResultDto).toHaveBeenCalledWith({
        applicationYear: '2025',
        applicationYearId: '2025',
        taxYear: '2025',
        coverageStartDate: '2025-01-01',
        coverageEndDate: '2025-12-31',
        intakeStartDate: '2025-01-01',
        intakeEndDate: '2025-12-31',
        nextApplicationYearId: '2026',
        renewalStartDate: '2025-01-01',
        renewalEndDate: '2025-12-31',
      });
      expect(result).toEqual(mockIntakeApplicationYearResultDto);
    });

    it('should return the correct intake application year when the given date is on or after the intake start date and no intake end date is provided', async () => {
      const mockServerConfig = { APPLICATION_YEAR_REQUEST_DATE: undefined, LOOKUP_SVC_APPLICATION_YEAR_CACHE_TTL_SECONDS: 10 };

      const service = new DefaultApplicationYearService(mockLogFactory, mockApplicationYearDtoMapper, mockApplicationYearRepository, mockServerConfig);
      const result = await service.getIntakeApplicationYear('2026-01-01');

      expect(mockApplicationYearDtoMapper.mapApplicationYearResultDtoToIntakeApplicationYearResultDto).toHaveBeenCalledWith({
        applicationYear: '2026',
        applicationYearId: '2026',
        taxYear: '2026',
        coverageStartDate: '2026-01-01',
        coverageEndDate: '2026-12-31',
        intakeStartDate: '2026-01-01',
        renewalStartDate: '2026-01-01',
      });
      expect(result).toEqual(mockIntakeApplicationYearResultDto);
    });

    it('should throw if given date is not within any intake period', async () => {
      const mockServerConfig = { APPLICATION_YEAR_REQUEST_DATE: undefined, LOOKUP_SVC_APPLICATION_YEAR_CACHE_TTL_SECONDS: 10 };

      const service = new DefaultApplicationYearService(mockLogFactory, mockApplicationYearDtoMapper, mockApplicationYearRepository, mockServerConfig);

      await expect(async () => await service.getIntakeApplicationYear('2023-01-01')).rejects.toThrow(ApplicationYearNotFoundException);
    });
  });
});
