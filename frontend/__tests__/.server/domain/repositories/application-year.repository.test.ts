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
        ApplicationYearCollection: [
          {
            TaxYear: '2023',
            ApplicationYearID: 'AYR001',
          },
          {
            TaxYear: undefined,
            ApplicationYearID: 'AYR005',
          },
          {
            TaxYear: '2019',
            ApplicationYearID: undefined,
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

      const result = await repository.listApplicationYears({ currentDate: '2024-11-13' });
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
      await expect(() => repository.listApplicationYears({ currentDate: '2024-11-13' })).rejects.toThrowError();
    });
  });
});
