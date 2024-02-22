import moize from 'moize';
import { z } from 'zod';

import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('wsaddress-service.server');

const correctAddressResponseSchema = z.object({
  'wsaddr:CorrectionResults': z.object({
    'nc:AddressFullText': z.string().optional(),
    'nc:AddressCityName': z.string().optional(),
    'nc:ProvinceCode': z.string().optional(),
    'nc:AddressPostalCode': z.string().optional(),
    'nc:CountryCode': z.string().optional(),
    'wsaddr:StatusCode': z.string(),
  }),
});

const parseAddressResponseSchema = z.object({
  'wsaddr:ParsedResults': z.object({
    'nc:AddressFullText': z.string(),
    'nc:AddressCityName': z.string(),
    'can:ProvinceCode': z.string().optional(),
    'nc:AddressPostalCode': z.string().optional(),
    'nc:CountryCode': z.string(),
    'wsaddr:AddressSecondaryUnitNumber': z.string().optional(),
  }),
});

const validateAddressResponseSchema = z.object({
  'wsaddr:ValidationResults': z.object({
    'wsaddr:Information': z.object({
      'wsaddr:StatusCode': z.string(),
    }),
  }),
});

export const getWSAddressService = moize.promise(createWSAddressService, { onCacheAdd: () => log.info('Creating new WSAddress service') });

async function createWSAddressService() {
  const { INTEROP_API_BASE_URI } = getEnv();

  async function correctAddress({ address, city, province, postalCode, country }: { address: string; city: string; province?: string; postalCode?: string; country: string }) {
    const searchParams = new URLSearchParams({
      addressLine: address,
      city,
      ...(province && { province }),
      ...(postalCode && { postalCode }),
      country,
      formatResult: 'true',
      language: 'English', // TODO confirm that we should always have this as "English"
    });
    const url = `${INTEROP_API_BASE_URI}/CAN/correct?${searchParams}`;
    const response = await fetch(url);

    if (!response.ok) {
      log.error('%j', {
        message: 'Failed to correct the address',
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });

      throw new Error(`Failed to correct the address. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    const correctAddressResponse = correctAddressResponseSchema.parse(await response.json());
    const correctionResults = correctAddressResponse['wsaddr:CorrectionResults'];
    return {
      status: correctionResults['wsaddr:StatusCode'],
      address: correctionResults['nc:AddressFullText'],
      city: correctionResults['nc:AddressCityName'],
      province: correctionResults['nc:ProvinceCode'],
      postalCode: correctionResults['nc:AddressPostalCode'],
      country: correctionResults['nc:CountryCode'],
    };
  }

  async function parseAddress({ address, city, province, postalCode, country }: { address: string; city: string; province: string; postalCode: string; country: string }) {
    const searchParams = new URLSearchParams({
      addressLine: address,
      city,
      province,
      postalCode,
      country,
      geographicScope: 'Canada', // TODO figure out a way to map this - value can also be "Foreign"
      parseType: 'parseOnly', // only parse the address - do not correct or validate it
      language: 'English', // TODO confirm that we should always have this as "English"
    });
    const url = `${INTEROP_API_BASE_URI}/CAN/parse?${searchParams}`;
    const response = await fetch(url);

    if (!response.ok) {
      log.error('%j', {
        message: 'Failed to parse the address',
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });

      throw new Error(`Failed to parse the address. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    const parseAddressResponse = parseAddressResponseSchema.parse(await response.json());
    const parsedResults = parseAddressResponse['wsaddr:ParsedResults'];
    return {
      apartmentUnitNumber: parsedResults['wsaddr:AddressSecondaryUnitNumber'],
      address: parsedResults['nc:AddressFullText'],
      city: parsedResults['nc:AddressCityName'],
      province: parsedResults['can:ProvinceCode'],
      postalCode: parsedResults['nc:AddressPostalCode'],
      country: parsedResults['nc:CountryCode'],
    };
  }

  async function validateAddress({ address, city, province, postalCode, country }: { address: string; city: string; province: string; postalCode: string; country: string }) {
    const searchParams = new URLSearchParams({
      addressLine: address,
      city,
      province,
      postalCode,
      country,
      language: 'English', // TODO confirm that we should always have this as "English"
    });
    const url = `${INTEROP_API_BASE_URI}/CAN/validate?${searchParams}`;
    const response = await fetch(url);

    if (!response.ok) {
      log.error('%j', {
        message: 'Failed to validate the address',
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });

      throw new Error(`Failed to validate the address. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    const validateAddressResponse = validateAddressResponseSchema.parse(await response.json());
    const isValid = 'Valid' === validateAddressResponse['wsaddr:ValidationResults']['wsaddr:Information']['wsaddr:StatusCode'];
    return isValid;
  }

  return { correctAddress, parseAddress, validateAddress };
}
