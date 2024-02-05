/* eslint @typescript-eslint/no-unused-vars: ["error", { "varsIgnorePattern": "^_" }] */
import { describe, expect, it } from 'vitest';
import { ParseWSAddressResponseDTO } from '~/dtos/parse-address-response-dto.server';
import { ValidateWSAddressResponseDTO } from '~/dtos/validate-address-response-dto.server';
import { server } from '~/mocks/node';
import { getWSAddressService } from '~/services/wsaddress-service.server';

const WSAddressService = await getWSAddressService();

vi.mock('~/utils/env.server', () => ({
  getEnv: vi.fn().mockReturnValue({ INTEROP_API_BASE_URI: 'https://api.example.com' }),
}));

describe('wsaddress-service.server tests', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('validateWSAddress()', () => {
    it('should validate an address successfully', async () => {
      const result = await WSAddressService.validateWSAddress({ addressLine: 'addr 123', city: 'ABC', country: 'CAN', language: 'EN', postalCode: 'A1B2C3', province: 'ON', geographicScope: 'GS', parseType: 'PT' });
      expect(result).toBeInstanceOf(ValidateWSAddressResponseDTO);
    });
  });

  describe('parseAddress()', () => {
    it('should parse an address successfully', async () => {
      const result = await WSAddressService.parseWSAddress({ addressLine: 'addr 123', city: 'ABC', country: 'CAN', language: 'EN', postalCode: 'A1B2C3', province: 'ON' });
      expect(result).toBeInstanceOf(ParseWSAddressResponseDTO);
    });
  });
});
