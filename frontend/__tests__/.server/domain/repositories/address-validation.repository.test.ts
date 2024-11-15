import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs';
import type { AddressCorrectionRequestEntity, AddressCorrectionResultEntity } from '~/.server/domain/entities';
import { DefaultAddressValidationRepository, MockAddressValidationRepository } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories';
import { instrumentedFetch } from '~/utils/fetch-utils.server';

vi.mock('~/utils/fetch-utils.server', () => ({
  getFetchFn: vi.fn(),
  instrumentedFetch: vi.fn(),
}));

describe('DefaultAddressValidationRepository', () => {
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

      const repository = new DefaultAddressValidationRepository(mockLogFactory, mockServerConfig);

      const result = await repository.getAddressCorrectionResult({ address: '123 Fake Street', city: 'North Pole', provinceCode: 'ON', postalCode: 'H0H 0H0' });
      expect(result).toEqual(mockResponseData);
    });

    it('should throw an error when fetch response is not ok', async () => {
      vi.mocked(instrumentedFetch).mockResolvedValue(Response.json(null, { status: 500 }));

      const mockLogFactory = mock<LogFactory>();
      mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

      const mockServerConfig = mock<ServerConfig>();
      mockServerConfig.INTEROP_API_BASE_URI = 'https://api.example.com';

      const repository = new DefaultAddressValidationRepository(mockLogFactory, mockServerConfig);
      await expect(() => repository.getAddressCorrectionResult({ address: '123 Fake Street', city: 'North Pole', provinceCode: 'ON', postalCode: 'H0H 0H0' })).rejects.toThrowError();
    });
  });
});

describe('MockAddressValidationRepository', () => {
  const mockLogFactory = mock<LogFactory>({ createLogger: () => mock<Logger>() });

  it('should return a mocked address correction result', async () => {
    const addressCorrectionRequest: AddressCorrectionRequestEntity = {
      address: '111 Wellington Street',
      city: 'Ottawa',
      postalCode: 'K1A 0A9',
      provinceCode: 'ON',
    };

    const repository = new MockAddressValidationRepository(mockLogFactory);
    const result = await repository.getAddressCorrectionResult(addressCorrectionRequest);

    expect(result).toEqual({
      'wsaddr:CorrectionResults': {
        'nc:AddressFullText': expect.any(String),
        'nc:AddressCityName': addressCorrectionRequest.city.toUpperCase(),
        'can:ProvinceCode': addressCorrectionRequest.provinceCode.toUpperCase(),
        'nc:AddressPostalCode': addressCorrectionRequest.postalCode.toUpperCase(),
        'wsaddr:Information': {
          'wsaddr:StatusCode': expect.any(String),
        },
      },
    } satisfies AddressCorrectionResultEntity);
  });
});
