import jsonpatch from 'fast-json-patch';
import { z } from 'zod';

import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const addressSchema = z.object({
  id: z.string().optional(),
  addressApartmentUnitNumber: z.string().optional(),
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressProvince: z.string().optional(),
  addressPostalZipCode: z.string().optional(),
  addressCountry: z.string().optional(),
});

export type AddressInfo = z.infer<typeof addressSchema>;

const addressValidationSchema = z.object({
  isCorrect: z.boolean().optional(),
});

function createAddressService() {
  const logger = getLogger('address-service.server');
  const { INTEROP_API_BASE_URI } = getEnv();

  async function getAddressInfo(userId: string, addressId: string) {
    const url = `${INTEROP_API_BASE_URI}/users/${userId}/addresses/${addressId}`;
    const response = await fetch(url);

    if (response.ok) return addressSchema.parse(await response.json());
    if (response.status === 404) return null;

    logger.error('%j', {
      message: 'Failed to fetch address',
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseBody: await response.text(),
    });

    throw new Error(`Failed to fetch data. address: ${response.status}, Status Text: ${response.statusText}`);
  }

  function formatAddress({ addressApartmentUnitNumber, addressStreet, addressCity, addressProvince, addressPostalZipCode, addressCountry }: AddressInfo): string {
    const lines = [`${addressApartmentUnitNumber ?? ''} ${addressStreet ?? ''}`, `${addressCity ?? ''} ${addressProvince ?? ''}  ${addressPostalZipCode ?? ''}`, `${addressCountry ?? ''}`];
    return lines
      .map((line) => line.trim())
      .filter(Boolean)
      .join('\n');
  }

  async function isValidAddress({ addressApartmentUnitNumber, addressStreet, addressCity, addressProvince, addressPostalZipCode, addressCountry }: AddressInfo) {
    const addressString = formatAddress({ addressApartmentUnitNumber, addressStreet, addressCity, addressProvince, addressPostalZipCode, addressCountry });
    const url = `${INTEROP_API_BASE_URI}/address/correct/${addressString}`;
    const response = await fetch(url);

    if (response.ok) {
      const validationData = addressValidationSchema.parse(await response.json());

      return validationData.isCorrect ?? false;
    }

    logger.error('%j', {
      message: 'Failed to validate the address',
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseBody: await response.text(),
    });

    throw new Error(`Failed to validate the address. Status: ${response.status}, Status Text: ${response.statusText}`);
  }

  async function updateAddressInfo(userId: string, addressId: string, addressInfo: AddressInfo) {
    const curentAddressInfo = await getAddressInfo(userId, addressId);

    if (!curentAddressInfo) return;

    const patch = jsonpatch.compare(curentAddressInfo, { ...curentAddressInfo, ...addressInfo });
    if (patch.length === 0) return;

    const url = `${INTEROP_API_BASE_URI}/users/${userId}/addresses/${addressId}`;
    const response = await fetch(url, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });

    if (!response.ok) {
      logger.error('%j', {
        message: 'Failed to fetch address',
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });

      throw new Error(`Failed to fetch address. Status: ${response.status}, Status Text: ${response.statusText}`);
    }
  }
  return { getAddressInfo, updateAddressInfo, isValidAddress };
}

export const addressService = createAddressService();
