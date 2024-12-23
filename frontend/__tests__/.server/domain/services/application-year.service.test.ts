import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ApplicationYearRequestDto, ApplicationYearResultDto, RenewalApplicationYearResultDto } from '~/.server/domain/dtos';
import type { ApplicationYearResultEntity } from '~/.server/domain/entities';
import type { ApplicationYearDtoMapper } from '~/.server/domain/mappers';
import type { ApplicationYearRepository } from '~/.server/domain/repositories';
import { DefaultApplicationYearService } from '~/.server/domain/services';
import type { AuditService } from '~/.server/domain/services';
import type { LogFactory, Logger } from '~/.server/factories';

describe('DefaultApplicationYearService', () => {
  const mockLogFactory = mock<LogFactory>();
  mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

  const mockApplicationYearResultDtos: ApplicationYearResultDto[] = [
    {
      // all fields set
      applicationYear: '2024',
      taxYear: '2024',
      coverageStartDate: '2024-01-01',
      coverageEndDate: '2024-12-31',
      intakeStartDate: '2024-01-01',
      intakeEndDate: '2024-12-31',
      intakeYearId: '2024',
      renewalStartDate: '2024-01-01',
      renewalEndDate: '2024-12-31',
      renewalYearId: '2024',
    },
    {
      // optional dates not set
      applicationYear: '2025',
      taxYear: '2025',
      coverageStartDate: '2025-01-01',
      coverageEndDate: '2025-12-31',
      intakeStartDate: '2025-01-01',
      intakeYearId: '2024',
    },
    {
      // optional end dates not set
      applicationYear: '2026',
      taxYear: '2026',
      coverageStartDate: '2026-01-01',
      coverageEndDate: '2026-12-31',
      intakeStartDate: '2026-01-01',
      intakeYearId: '2024',
      renewalStartDate: '2026-01-01',
    },
  ];

  const mockRenewalApplicationYearResultDto: RenewalApplicationYearResultDto = {
    intakeYearId: '2024',
    taxYear: '2024',
    coverageStartDate: '2024-01-01',
    coverageEndDate: '2024-12-31',
  };
  const mockApplicationYearDtoMapper = mock<ApplicationYearDtoMapper>();
  mockApplicationYearDtoMapper.mapApplicationYearResultEntityToApplicationYearResultDtos.mockReturnValue(mockApplicationYearResultDtos);
  mockApplicationYearDtoMapper.mapApplicationYearResultDtoToRenewalApplicationYearResultDto.mockReturnValue(mockRenewalApplicationYearResultDto);

  const mockApplicationYearResultEntity: ApplicationYearResultEntity = {
    BenefitApplicationYear: [
      {
        BenefitApplicationYearIdentification: [{ IdentificationID: '1' }],
        BenefitApplicationYearEffectivePeriod: {
          StartDate: { YearDate: '2024' },
        },
        BenefitApplicationYearTaxYear: { YearDate: '2024' },
        BenefitApplicationYearIntakePeriod: {
          StartDate: { date: '2024-01-01' },
          EndDate: { date: '2024-12-31' },
        },
        BenefitApplicationYearRenewalPeriod: {
          StartDate: { date: '2024-01-01' },
          EndDate: { date: '2024-12-31' },
        },
        BenefitApplicationYearNext: {
          BenefitApplicationYearIdentification: { IdentificationID: '1' },
        },
        BenefitApplicationYearCoveragePeriod: {
          StartDate: { date: '2024-01-01' },
          EndDate: { date: '2024-12-31' },
        },
      },
    ],
  };
  const mockApplicationYearRepository = mock<ApplicationYearRepository>();
  mockApplicationYearRepository.listApplicationYears.mockResolvedValue(mockApplicationYearResultEntity);

  describe('findRenewalApplicationYear', () => {
    it('should return the correct renewal application year if given date is within a renewal period', async () => {
      const mockAuditService = mock<AuditService>();

      const service = new DefaultApplicationYearService(mockLogFactory, mockApplicationYearDtoMapper, mockApplicationYearRepository, mockAuditService);
      const mockApplicationYearRequestDto: ApplicationYearRequestDto = {
        date: '2024-01-01',
        userId: 'userId',
      };

      const result = await service.findRenewalApplicationYear(mockApplicationYearRequestDto);
      expect(result).toEqual(mockRenewalApplicationYearResultDto);
    });

    it('should return the correct renewal application year when the given date is on or after the renewal start date and no renewal end date is provided', async () => {
      const mockAuditService = mock<AuditService>();

      const service = new DefaultApplicationYearService(mockLogFactory, mockApplicationYearDtoMapper, mockApplicationYearRepository, mockAuditService);
      const mockApplicationYearRequestDto: ApplicationYearRequestDto = {
        date: '2026-01-01',
        userId: 'userId',
      };

      const result = await service.findRenewalApplicationYear(mockApplicationYearRequestDto);
      expect(result).toEqual(mockRenewalApplicationYearResultDto);
    });

    it('should return null if given date is not within any renewal period', async () => {
      const mockAuditService = mock<AuditService>();

      const service = new DefaultApplicationYearService(mockLogFactory, mockApplicationYearDtoMapper, mockApplicationYearRepository, mockAuditService);
      const mockApplicationYearRequestDto: ApplicationYearRequestDto = {
        date: '2025-01-01',
        userId: 'userId',
      };

      const result = await service.findRenewalApplicationYear(mockApplicationYearRequestDto);
      expect(result).toEqual(null);
    });
  });
});
