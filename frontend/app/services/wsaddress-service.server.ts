import moize from 'moize';
import { z } from 'zod';

import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('wsaddress-service.server');

export interface ParseWSAddressRequestDTO {
  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  language: string;
}

export interface ParseWSAddressResponseDTO {
  responseType?: string;
  addressLine?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  streetNumberSuffix?: string;
  streetDirection?: string;
  unitType?: string;
  unitNumber?: string;
  serviceAreaName?: string;
  serviceAreaType?: string;
  serviceAreaQualifier?: string;
  cityLong?: string;
  cityShort?: string;
  deliveryInformation?: string;
  extraInformation?: string;
  statusCode?: string;
  canadaPostInformation?: string[];
  message?: string;
  addressType?: string;
  streetNumber?: string;
  streetName?: string;
  streetType?: string;
  serviceType?: string;
  serviceNumber?: string;
  country?: string;
  warnings?: string;
  functionalMessages?: { action: string; message: string }[];
}

export interface ValidateWSAddressRequestDTO {
  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  geographicScope: string;
  parseType: string;
  language: string;
}

export interface ValidateWSAddressResponseDTO {
  responseType?: string;
  statusCode?: string;
  functionalMessages?: { action: string; message: string }[];
  message?: string;
  warnings?: string;
}

//TODO: Update validation schema when changing to use Interop's WSAddress endpoint instead of MSW
const ParseWSAddressResponseSchema = z.object({
  responseType: z.string().optional(),
  addressLine: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  streetNumberSuffix: z.string().optional(),
  streetDirection: z.string().optional(),
  unitType: z.string().optional(),
  unitNumber: z.string().optional(),
  serviceAreaName: z.string().optional(),
  serviceAreaType: z.string().optional(),
  serviceAreaQualifier: z.string().optional(),
  cityLong: z.string().optional(),
  cityShort: z.string().optional(),
  deliveryInformation: z.string().optional(),
  extraInformation: z.string().optional(),
  statusCode: z.string().optional(),
  canadaPostInformation: z.array(z.string()).optional(),
  message: z.string().optional(),
  addressType: z.string().optional(),
  streetNumber: z.string().optional(),
  streetName: z.string().optional(),
  streetType: z.string().optional(),
  serviceType: z.string().optional(),
  serviceNumber: z.string().optional(),
  country: z.string().optional(),
  warnings: z.string().optional(),
  functionalMessages: z
    .array(
      z.object({
        action: z.string(),
        message: z.string(),
      }),
    )
    .optional(),
});

//TODO: Update validation schema when changing to use Interop's WSAddress endpoint instead of MSW
const ValidateWSAddressResponseSchema = z.object({
  responseType: z.string().optional(),
  statusCode: z.string().optional(),
  functionalMessages: z
    .array(
      z.object({
        action: z.string(),
        message: z.string(),
      }),
    )
    .optional(),
  message: z.string().optional(),
  warnings: z.string().optional(),
});

export const getWSAddressService = moize.promise(createWSAddressService, { onCacheAdd: () => log.info('Creating new WSAddress service') });

async function createWSAddressService() {
  const { INTEROP_API_BASE_URI } = getEnv();

  async function parseWSAddress(parseRequest: ParseWSAddressRequestDTO) {
    const address: ParseWSAddressRequestDTO = { addressLine: parseRequest.addressLine, city: parseRequest.city, province: parseRequest.province, postalCode: parseRequest.postalCode, country: parseRequest.country, language: parseRequest.language };
    const url = `${INTEROP_API_BASE_URI}/address/parse`;
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(address),
    });

    if (response.ok) {
      const parseData = ParseWSAddressResponseSchema.parse(await response.json());
      const parsedAddress: ParseWSAddressResponseDTO = { ...parseData };
      if (parseData.statusCode === 'Valid') return parsedAddress;
    }

    log.error('%j', {
      message: 'Failed to parse the address',
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseBody: await response.text(),
    });

    throw new Error(`Failed to parse the address. Status: ${response.status}, Status Text: ${response.statusText}`);
  }

  async function validateWSAddress(validateRequest: ValidateWSAddressRequestDTO) {
    const address: ValidateWSAddressRequestDTO = {
      addressLine: validateRequest.addressLine,
      city: validateRequest.city,
      province: validateRequest.province,
      postalCode: validateRequest.postalCode,
      country: validateRequest.country,
      geographicScope: validateRequest.geographicScope,
      parseType: validateRequest.parseType,
      language: validateRequest.language,
    };
    const url = `${INTEROP_API_BASE_URI}/address/validate`;
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(address),
    });

    if (response.ok) {
      const validationData = ValidateWSAddressResponseSchema.parse(await response.json());
      const validatedAddress: ValidateWSAddressResponseDTO = { ...validationData };
      if (validationData.statusCode === 'Valid') return validatedAddress;
    }

    log.error('%j', {
      message: 'Failed to validate the address',
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseBody: await response.text(),
    });

    throw new Error(`Failed to validate the address. Status: ${response.status}, Status Text: ${response.statusText}`);
  }

  return { parseWSAddress, validateWSAddress };
}
