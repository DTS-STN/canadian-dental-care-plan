/* eslint @typescript-eslint/no-unused-vars: ["error", { "varsIgnorePattern": "^_" }] */
import { describe, expect, it } from 'vitest';
import { ParseWSAddressResponseDTO } from '~/dtos/parse-address-response-dto.server';
import { ValidateWSAddressResponseDTO } from '~/dtos/validate-address-response-dto.server';

import { WSAddressService } from '~/services/wsaddress-service.server';
import { getEnv } from '~/utils/env.server';

describe('wsaddress-service.server tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('parseWSAddress()', () => {
    it('should validate an address successfully', async () => {
      vi.mocked(getEnv, { partial: true }).mockReturnValue({ INTEROP_API_BASE_URI: 'example.com' });
      const { WSAddressService: _WSAddressService } = await import('~/services/wsaddress-service.server');
      const result = await WSAddressService.validateWSAddress({ addressLine: 'addr 123', city: 'ABC', country: 'CAN', language: 'EN', postalCode: 'A1B2C3', province: 'ON', geographicScope: 'GS', parseType: 'PT' });
      expect(result).toBeInstanceOf(ParseWSAddressResponseDTO);
    });
  });

  describe('validateAddress()', () => {
    it('should parse an address successfully', async () => {
      vi.mocked(getEnv, { partial: true }).mockReturnValue({ INTEROP_API_BASE_URI: 'example.com' });
      const { WSAddressService: _WSAddressService } = await import('~/services/wsaddress-service.server');
      const result = await WSAddressService.parseWSAddress({ addressLine: 'addr 123', city: 'ABC', country: 'CAN', language: 'EN', postalCode: 'A1B2C3', province: 'ON' });
      expect(result).toBeInstanceOf(ValidateWSAddressResponseDTO);
    });
  });
});
