import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expectTypeOf, it, vi } from 'vitest';

import { type CorrectWSAddressResponseDTO, type ParseWSAddressResponseDTO, type ValidateWSAddressResponseDTO, getWSAddressService } from '~/services/wsaddress-service.server';

//TODO: add invalid request tests when changing to use Interop's WSAddress endpoint instead of MSW

const handlers = [
  /**
   * Handler for POST requests to WSAddress correction service
   */
  http.post('https://api.example.com/address/correction', () => {
    return HttpResponse.json({
      responseType: 'CA',
      addressLine: '23 Coronation St',
      city: "St. John's",
      province: 'NL',
      postalCode: 'A1C5B9',
      deliveryInformation: 'deliveryInformation',
      extraInformation: 'extraInformation',
      statusCode: 'Valid',
      country: 'CAN',
      message: '',
      warnings: '',
      functionalMessages: [
        { action: 'OriginalInput', message: '111 WELLINGTON ST   OTTAWA   ON   K1A0A4   CAN' },
        { action: 'Information', message: 'Dept = SENAT   Branch = SENAT   Lang = F' },
      ],
    });
  }),

  /**
   * Handler for POST requests to WSAddress parse service
   */
  http.post('https://api.example.com/address/parse', () => {
    return HttpResponse.json({
      responseType: 'CA',
      addressLine: '23 CORONATION ST',
      city: 'ST JOHNS',
      province: 'NL',
      postalCode: 'A1C5B9',
      streetNumberSuffix: 'streetNumberSuffix',
      streetDirection: 'streetDirection',
      unitType: 'unitType',
      unitNumber: '000',
      serviceAreaName: 'serviceAreaName',
      serviceAreaType: 'serviceAreaType',
      serviceAreaQualifier: '',
      cityLong: 'cityLong',
      cityShort: 'cityShort',
      deliveryInformation: 'deliveryInformation',
      extraInformation: 'extraInformation',
      statusCode: 'Valid',
      canadaPostInformation: [],
      message: 'message',
      addressType: 'Urban',
      streetNumber: '23',
      streetName: 'CORONATION',
      streetType: 'ST',
      serviceType: 'Unknown',
      serviceNumber: '000',
      country: 'CAN',
      warnings: '',
      functionalMessages: [{ action: 'action', message: 'message' }],
    });
  }),

  /**
   * Handler for POST requests to WSAddress validate service
   */
  http.post('https://api.example.com/address/validate', () => {
    return HttpResponse.json({
      responseType: 'CA',
      statusCode: 'Valid',
      functionalMessages: [
        { action: 'OriginalInput', message: '111 WELLINGTON ST   OTTAWA   ON   K1A0A4   CAN' },
        { action: 'Information', message: 'Dept = SENAT   Branch = SENAT   Lang = F' },
      ],
      message: '',
      warnings: '',
    });
  }),
];

const server = setupServer(...handlers);

const wsAddressService = await getWSAddressService();

vi.mock('~/utils/env.server', () => ({
  getEnv: vi.fn().mockReturnValue({ INTEROP_API_BASE_URI: 'https://api.example.com' }),
}));

describe('wsaddress-service.server tests', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  afterAll(() => {
    server.close();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('correctWSAddress()', () => {
    it('should correct an address successfully', async () => {
      const result = await wsAddressService.correctWSAddress({ addressLine: 'addr 123', city: 'ABC', country: 'CAN', language: 'EN', postalCode: 'A1B2C3', province: 'ON', formatResult: true });
      expectTypeOf(result).toMatchTypeOf<CorrectWSAddressResponseDTO>();
    });
  });

  describe('validateWSAddress()', () => {
    it('should validate an address successfully', async () => {
      const result = await wsAddressService.validateWSAddress({ addressLine: 'addr 123', city: 'ABC', country: 'CAN', language: 'EN', postalCode: 'A1B2C3', province: 'ON', geographicScope: 'GS', parseType: 'PT' });
      expectTypeOf(result).toMatchTypeOf<ValidateWSAddressResponseDTO>();
    });
  });

  describe('parseAddress()', () => {
    it('should parse an address successfully', async () => {
      const result = await wsAddressService.parseWSAddress({ addressLine: 'addr 123', city: 'ABC', country: 'CAN', language: 'EN', postalCode: 'A1B2C3', province: 'ON' });
      expectTypeOf(result).toMatchTypeOf<ParseWSAddressResponseDTO>();
    });
  });
});
