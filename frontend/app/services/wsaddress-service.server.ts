import { z } from 'zod';
import type { ParseWSAddressRequestDTOProps } from '~/dtos/parse-address-request-dto.server';
import { ParseWSAddressRequestDTO } from '~/dtos/parse-address-request-dto.server';
import { ParseWSAddressResponseDTO } from '~/dtos/parse-address-response-dto.server';
import type { ValidateWSAddressRequestDTOProps } from '~/dtos/validate-address-request-dto.server';
import { ValidateWSAddressRequestDTO } from '~/dtos/validate-address-request-dto.server';
import { ValidateWSAddressResponseDTO } from '~/dtos/validate-address-response-dto.server';

import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

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
  functionalMessages: z.array(z.object({
    action: z.string(),
    message: z.string()
    })
  ).optional(),
});

const ValidateWSAddressResponseSchema = z.object({
  responseType: z.string().optional(),
  statusCode: z.string().optional(),
  functionalMessages: z.array(z.object({
      action: z.string(),
      message: z.string()
    })
  ).optional(),
  message: z.string().optional(),
  warnings: z.string().optional(),
});

function createWSAddressService() {
  const log = getLogger('wsaddress-service.server');
  const { INTEROP_API_BASE_URI } = getEnv();

  async function parseWSAddress({addressLine, city, province, postalCode, country, language}: ParseWSAddressRequestDTOProps) {
    const url = `${INTEROP_API_BASE_URI}/address/parse`;
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(new ParseWSAddressRequestDTO(addressLine, city, province, postalCode, country, language)),
    });

    if (response.ok) {
      const parseData = ParseWSAddressResponseSchema.parse(await response.json());
      if(parseData.statusCode === 'Valid') return new ParseWSAddressResponseDTO(
        parseData.responseType,
        parseData.addressLine,
        parseData.city,
        parseData.province,
        parseData.postalCode,
        parseData.streetNumberSuffix,
        parseData.streetDirection,
        parseData.unitType,
        parseData.unitNumber,
        parseData.serviceAreaName,
        parseData.serviceAreaType,
        parseData.serviceAreaQualifier,
        parseData.cityLong,
        parseData.cityShort,
        parseData.deliveryInformation,
        parseData.extraInformation,
        parseData.statusCode,
        parseData.canadaPostInformation,
        parseData.message,
        parseData.addressType,
        parseData.streetNumber,
        parseData.streetName,
        parseData.streetType,
        parseData.serviceType,
        parseData.serviceNumber,
        parseData.country,
        parseData.warnings,
        parseData.functionalMessages,
      );
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

  async function validateWSAddress({addressLine, city, province, postalCode, country, geographicScope, parseType, language}: ValidateWSAddressRequestDTOProps) {
    const url = `${INTEROP_API_BASE_URI}/address/validate`;
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(new ValidateWSAddressRequestDTO(addressLine, city, province, postalCode, country, geographicScope, parseType, language)),
    });

    if (response.ok) {
      const validationData = ValidateWSAddressResponseSchema.parse(await response.json());

      if (validationData.statusCode === 'Valid') return new ValidateWSAddressResponseDTO(
        validationData.responseType,
        validationData.statusCode,
        validationData.functionalMessages,
        validationData.message,
        validationData.warnings
      );
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

export const WSAddressService = createWSAddressService();
