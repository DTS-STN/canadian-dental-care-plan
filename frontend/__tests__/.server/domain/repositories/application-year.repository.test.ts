import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs';
import type { ApplicationYearResultEntity } from '~/.server/domain/entities';
import { DefaultApplicationYearRepository } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories';
import type { HttpClient } from '~/.server/http';

describe('DefaultApplicationYearRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  describe('getApplicationYearResult', () => {
    it('should return address correction results on successful fetch', async () => {
      const mockResponseData: ApplicationYearResultEntity = {
        BenefitApplicationYear: [
          {
            BenefitApplicationYearIdentification: [
              {
                IdentificationID: '37e5aa05-813c-ef11-a317-000d3af4f3ef',
              },
            ],
            BenefitApplicationYearEffectivePeriod: {
              StartDate: {
                YearDate: '2025',
              },
            },
            BenefitApplicationYearTaxYear: {
              YearDate: '2024',
            },
            BenefitApplicationYearIntakePeriod: {
              StartDate: {
                date: '2025-02-14',
              },
              EndDate: {
                date: '2026-06-30',
              },
            },
            BenefitApplicationYearRenewalPeriod: {
              StartDate: {
                date: '2024-12-01',
              },
              EndDate: {
                date: '2025-06-30',
              },
            },
            BenefitApplicationYearNext: {
              BenefitApplicationYearIdentification: {},
            },
            BenefitApplicationYearCoveragePeriod: {
              StartDate: {
                date: '2025-04-01',
              },
              EndDate: {
                date: '2026-06-30',
              },
            },
          },
        ],
      };

      const mockLogFactory = mock<LogFactory>();
      mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

      const mockServerConfig = mock<ServerConfig>();
      mockServerConfig.INTEROP_API_BASE_URI = 'https://api.example.com';

      const mockHttpClient = mock<HttpClient>();
      mockHttpClient.instrumentedFetch.mockResolvedValue(Response.json(mockResponseData));

      const repository = new DefaultApplicationYearRepository(mockLogFactory, mockServerConfig, mockHttpClient);

      const result = await repository.listApplicationYears('2024-11-13');
      expect(result).toEqual(mockResponseData);
    });

    it('should throw an error when fetch response is not ok', async () => {
      const mockLogFactory = mock<LogFactory>();
      mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

      const mockServerConfig = mock<ServerConfig>();
      mockServerConfig.INTEROP_API_BASE_URI = 'https://api.example.com';

      const mockHttpClient = mock<HttpClient>();
      mockHttpClient.instrumentedFetch.mockResolvedValue(Response.json(null, { status: 500 }));

      const repository = new DefaultApplicationYearRepository(mockLogFactory, mockServerConfig, mockHttpClient);
      await expect(() => repository.listApplicationYears('2024-11-13')).rejects.toThrowError();
    });
  });
});
