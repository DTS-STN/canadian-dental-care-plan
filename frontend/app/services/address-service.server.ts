import jsonpatch from 'fast-json-patch';
import { z } from 'zod';

import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('address-service.server');

const addressDtoSchema = z.object({
  addressApartmentUnitNumber: z.string().optional(),
  addressStreet: z.string(),
  addressCity: z.string(),
  addressProvince: z.string().optional(),
  addressPostalZipCode: z.string().optional(),
  addressCountry: z.string(),
});

type AddressDto = z.infer<typeof addressDtoSchema>;

const addressInfoSchema = z.object({
  address: z.string(),
  city: z.string(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string(),
});

export type AddressInfo = z.infer<typeof addressInfoSchema>;

let addressServiceSingleton: ReturnType<typeof createAddressService> | undefined = undefined;

/**
 * Return a singleton instance (by means of memomization) of the address service.
 */
export function getAddressService() {
  if (!addressServiceSingleton) {
    log.info('Creating new address service');
    addressServiceSingleton = createAddressService();
    log.info('New address service created');
  }
  return addressServiceSingleton;
}

function createAddressService() {
  const { INTEROP_API_BASE_URI } = getEnv();

  async function getAddressInfo(userId: string, addressId: string) {
    const url = `${INTEROP_API_BASE_URI}/users/${userId}/addresses/${addressId}`;
    const response = await fetch(url);

    if (response.ok) {
      return toAddressInfo(addressDtoSchema.parse(await response.json()));
    }

    if (response.status === 404) {
      return null;
    }

    log.error('%j', {
      message: 'Failed to fetch address',
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseBody: await response.text(),
    });

    throw new Error(`Failed to fetch data. address: ${response.status}, Status Text: ${response.statusText}`);
  }

  async function updateAddressInfo(userId: string, addressId: string, addressInfo: AddressInfo) {
    const currentAddressInfo = await getAddressInfo(userId, addressId);

    if (!currentAddressInfo) {
      return;
    }
    const currentAddressDto = toAddressDto(currentAddressInfo);
    const addressDto = toAddressDto(addressInfo);

    const patch = jsonpatch.compare(currentAddressDto, { ...currentAddressDto, ...addressDto });

    if (patch.length === 0) {
      return;
    }

    const url = `${INTEROP_API_BASE_URI}/users/${userId}/addresses/${addressId}`;
    const response = await fetch(url, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });

    if (!response.ok) {
      log.error('%j', {
        message: 'Failed to fetch address',
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });

      throw new Error(`Failed to fetch address. Status: ${response.status}, Status Text: ${response.statusText}`);
    }
  }

  return { getAddressInfo, updateAddressInfo };
}

function toAddressDto(addressForm: AddressInfo): AddressDto {
  return {
    addressApartmentUnitNumber: String(addressForm.address?.match(/[\d|-]+/)),
    addressStreet: addressForm.address?.substring(addressForm.address?.indexOf(' ') + 1),
    addressCity: addressForm.city,
    addressProvince: addressForm.province ?? '',
    addressPostalZipCode: addressForm.postalCode ?? '',
    addressCountry: addressForm.country,
  };
}

function toAddressInfo(addressDto: AddressDto): AddressInfo {
  return {
    address: addressDto.addressApartmentUnitNumber ? `${addressDto.addressApartmentUnitNumber} ${addressDto.addressStreet}` : addressDto.addressStreet,
    city: addressDto.addressCity,
    province: addressDto.addressProvince,
    postalCode: addressDto.addressPostalZipCode,
    country: addressDto.addressCountry,
  };
}
