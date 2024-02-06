import { describe, it } from 'vitest';

import { server } from '~/mocks/wsaddress';
import type { ParseWSAddressResponseDTO, ValidateWSAddressResponseDTO } from '~/services/wsaddress-service.server';
import { getWSAddressService } from '~/services/wsaddress-service.server';

//TODO: add invalid request tests when changing to use Interop's WSAddress endpoint instead of MSW

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
