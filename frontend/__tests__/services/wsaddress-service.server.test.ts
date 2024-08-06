import { HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getWSAddressService } from '~/services/wsaddress-service.server';

global.fetch = vi.fn();

vi.mock('~/utils/logging.server', () => ({
  getLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
    trace: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock('~/utils/env-utils.server', () => ({
  getEnv: vi.fn().mockReturnValue({ INTEROP_API_BASE_URI: 'https://api.example.com' }),
}));

describe('wsaddress-service.server tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('correctAddress()', () => {
    it('should correct an address successfully', async () => {
      vi.mocked(fetch).mockResolvedValue(
        HttpResponse.json({
          '@context': 'some-context',
          'wsaddr:CorrectionRequest': 'some-correction-request',
          'wsaddr:CorrectionResults': {
            'nc:AddressFullText': '23 CORONATION ST',
            'nc:AddressCityName': "ST. JOHN'S",
            'nc:ProvinceCode': 'NL',
            'nc:AddressPostalCode': 'A1C5B9',
            'nc:CountryCode': 'CAN',
            'wsaddr:StatusCode': 'Corrected',
          },
          'wsaddr:FunctionalMessages': 'some-functional-messages',
          'wsaddr:Messages': 'some-messages',
          'wsaddr:Statistics': 'some-statistics',
        }),
      );

      const wsAddressService = getWSAddressService();
      const result = await wsAddressService.correctAddress({ address: '123 Fake St', city: 'City', country: 'Country', postalCode: 'Postal Code', province: 'Province' });
      expect(result).toStrictEqual({
        status: 'Corrected',
        address: '23 CORONATION ST',
        city: "ST. JOHN'S",
        province: 'NL',
        postalCode: 'A1C5B9',
        country: 'CAN',
      });
    });

    it('should throw error if response is not ok', async () => {
      vi.mocked(fetch).mockResolvedValue(new HttpResponse(null, { status: 500 }));

      const wsAddressService = getWSAddressService();
      await expect(() => wsAddressService.correctAddress({ address: '123 Fake St', city: 'City', country: 'Country', postalCode: 'Postal Code', province: 'Province' })).rejects.toThrowError();
    });
  });

  describe('parseAddress()', () => {
    it('should parse an address successfully', async () => {
      vi.mocked(fetch).mockResolvedValue(
        HttpResponse.json({
          '@context': 'some-context',
          'wsaddr:ParsedRequest': 'some-parsed-request',
          'wsaddr:ParsedResults': {
            'nc:AddressFullText': '123 FAUSSE RUE',
            'nc:AddressCityName': 'QUEBEC',
            'can:ProvinceCode': 'QC',
            'nc:AddressPostalCode': 'G1P4P1',
            'nc:CountryCode': 'CAN',
            'wsaddr:AddressSecondaryUnitNumber': '100',
          },
          'wsaddr:FunctionalMessages': 'some-functional-messages',
          'wsaddr:Messages': 'some-messages',
          'wsaddr:Statistics': 'some-statistics',
        }),
      );

      const wsAddressService = getWSAddressService();
      const result = await wsAddressService.parseAddress({ address: '123 Fake St', city: 'City', country: 'Country', postalCode: 'Postal Code', province: 'Province' });
      expect(result).toStrictEqual({
        apartmentUnitNumber: '100',
        address: '123 FAUSSE RUE',
        city: 'QUEBEC',
        province: 'QC',
        postalCode: 'G1P4P1',
        country: 'CAN',
      });
    });

    it('should throw error if response is not ok', async () => {
      vi.mocked(fetch).mockResolvedValue(new HttpResponse(null, { status: 500 }));

      const wsAddressService = getWSAddressService();
      await expect(() => wsAddressService.parseAddress({ address: '123 Fake St', city: 'City', country: 'Country', postalCode: 'Postal Code', province: 'Province' })).rejects.toThrowError();
    });
  });

  describe('validateAddress()', () => {
    it('should validate an address successfully', async () => {
      vi.mocked(fetch).mockResolvedValue(
        HttpResponse.json({
          '@context': 'some-context',
          'wsaddr:ValidationRequest': 'some-validation-request',
          'wsaddr:ValidationResults': {
            'wsaddr:Information': {
              'wsaddr:StatusCode': 'Valid',
            },
          },
          'wsaddr:FunctionalMessages': 'some-functional-messages',
          'wsaddr:Messages': 'some-messages',
          'wsaddr:Statistics': 'some-statistics',
        }),
      );

      const wsAddressService = getWSAddressService();
      const result = await wsAddressService.validateAddress({ address: '123 Fake St', city: 'City', country: 'Country', postalCode: 'Postal Code', province: 'Province' });
      expect(result).toBe(true);
    });

    it('should throw error if response is not ok', async () => {
      vi.mocked(fetch).mockResolvedValue(new HttpResponse(null, { status: 500 }));

      const wsAddressService = getWSAddressService();
      await expect(() => wsAddressService.validateAddress({ address: '123 Fake St', city: 'City', country: 'Country', postalCode: 'Postal Code', province: 'Province' })).rejects.toThrowError();
    });
  });
});
