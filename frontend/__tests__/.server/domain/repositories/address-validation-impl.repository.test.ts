import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs';
import { AddressValidationRepositoryImpl } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories';
import { instrumentedFetch } from '~/utils/fetch-utils.server';

vi.mock('~/utils/fetch-utils.server', () => ({
  getFetchFn: vi.fn(),
  instrumentedFetch: vi.fn(),
}));

describe('AddressValidationRepositoryImpl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  describe('getAddressCorrectionResult', () => {
    it('should return address correction results on successful fetch', async () => {
      const mockResponseData = {
        'wsaddr:CorrectionResults': {
          'nc:AddressFullText': '123 Fake St',
          'nc:AddressCityName': 'North Pole',
          'nc:AddressPostalCode': 'H0H 0H0',
          'can:ProvinceCode': 'ON',
          'wsaddr:Information': {
            'wsaddr:StatusCode': 'Corrected',
          },
        },
      };
      vi.mocked(instrumentedFetch).mockResolvedValue(Response.json(mockResponseData));

      const mockLogFactory = mock<LogFactory>();
      mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

      const mockServerConfig = mock<ServerConfig>();
      mockServerConfig.INTEROP_API_BASE_URI = 'https://api.example.com';

      const repository = new AddressValidationRepositoryImpl(mockLogFactory, mockServerConfig);

      const result = await repository.getAddressCorrectionResult({ address: '123 Fake Street', city: 'North Pole', provinceCode: 'ON', postalCode: 'H0H 0H0' });
      expect(result).toEqual(mockResponseData);
    });

    it('should throw an error when fetch response is not ok', async () => {
      vi.mocked(instrumentedFetch).mockResolvedValue(Response.json(null, { status: 500 }));

      const mockLogFactory = mock<LogFactory>();
      mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

      const mockServerConfig = mock<ServerConfig>();
      mockServerConfig.INTEROP_API_BASE_URI = 'https://api.example.com';

      const repository = new AddressValidationRepositoryImpl(mockLogFactory, mockServerConfig);
      await expect(() => repository.getAddressCorrectionResult({ address: '123 Fake Street', city: 'North Pole', provinceCode: 'ON', postalCode: 'H0H 0H0' })).rejects.toThrowError();
    });
  });
});
