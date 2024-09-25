import moize from 'moize';
import { z } from 'zod';

import { getEnv } from '~/utils/env-utils.server';
import { getLogger } from '~/utils/logging.server';

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

export const getWSAddressService = moize(createWSAddressService, {
  onCacheAdd: () => {
    const log = getLogger('wsaddress-service.serve/getWSAddressService');
    log.info('Creating new WSAddress service');
  },
});

function createWSAddressService() {
  const log = getLogger('wsaddress-service.serve/createWSAddressService');
  const { INTEROP_API_BASE_URI } = getEnv();

  async function correctAddress({ address, city, province, postalCode, country }: { address: string; city: string; province?: string; postalCode?: string; country: string }) {
    log.debug('Checking correctness of address [%s], city [%s], province [%s], postal code [%s], country [%s]', address, city, province, postalCode, country);

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

    const data = await response.json();
    log.trace('Checking correctness of address [%s], city [%s], province [%s], postal code [%s], country [%s]: [%j]', address, city, province, postalCode, country, data);
    const correctAddressResponse = correctAddressResponseSchema.parse(data);
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
    log.debug('Parsing address [%s], city [%s], province [%s], postal code [%s], country [%s]', address, city, province, postalCode, country);
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

    const data = await response.json();
    log.trace('Parsed address [%s], city [%s], province [%s], postal code [%s], country [%s]: [%j]', address, city, province, postalCode, country, data);
    const parseAddressResponse = parseAddressResponseSchema.parse(data);
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
    log.debug('Validating address [%s], city [%s], province [%s], postal code [%s], country [%s]', address, city, province, postalCode, country);
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

    const data = await response.json();
    log.trace('Validated address [%s], city [%s], province [%s], postal code [%s], country [%s]: [%j]', address, city, province, postalCode, country, data);
    const validateAddressResponse = validateAddressResponseSchema.parse(data);
    const isValid = 'Valid' === validateAddressResponse['wsaddr:ValidationResults']['wsaddr:Information']['wsaddr:StatusCode'];
    return isValid;
  }

  return { correctAddress, parseAddress, validateAddress };
}
