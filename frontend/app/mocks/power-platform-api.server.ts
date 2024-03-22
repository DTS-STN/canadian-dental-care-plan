import jsonpatch from 'fast-json-patch';
import type { Operation } from 'fast-json-patch';
import { HttpResponse, http } from 'msw';
import { z } from 'zod';

import letterTypesJson from './power-platform-data/letter-types.json';
import { db } from '~/mocks/db';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('power-platform-api.server');

const sinIdSchema = z.object({
  Client: z.object({
    PersonSINIdentification: z.object({
      IdentificationID: z.string(),
    }),
  }),
});

/**
 * Server-side MSW mocks for the Power Platform API.
 */
export function getPowerPlatformApiMockHandlers() {
  log.info('Initializing Power Platform mock handlers');

  return [
    //
    // Handler for GET requests to retrieve user details.
    //
    http.get('https://api.example.com/users/:id', ({ params, request }) => {
      log.debug('Handling request for [%s]', request.url);
      const userEntity = getUserEntity(params.id);
      return HttpResponse.json({
        id: userEntity.id,
        firstName: userEntity.firstName,
        homeAddress: userEntity.homeAddress,
        lastName: userEntity.lastName,
        mailingAddress: userEntity.mailingAddress,
        phoneNumber: userEntity.phoneNumber,
        preferredLanguage: userEntity.preferredLanguage,
      });
    }),

    //
    // Handler for PATCH requests to update user details.
    //
    http.patch('https://api.example.com/users/:id', async ({ params, request }) => {
      log.debug('Handling request for [%s]', request.url);
      const userEntity = getUserEntity(params.id);
      const document = toUserPatchDocument(userEntity);
      const patch = (await request.json()) as Operation[];
      const patchResult = jsonpatch.applyPatch(document, patch, true);
      db.user.update({ where: { id: { equals: userEntity.id } }, data: patchResult.newDocument });
      return HttpResponse.text(null, { status: 204 });
    }),

    //
    // Retrieve personal details information (using POST instead of GET due the sin params logging with GET)
    //
    http.post('https://api.example.com/personal-information/', async ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      const parsedSinId = sinIdSchema.parse(await request.json()).Client.PersonSINIdentification.IdentificationID;
      const peronalInformationEntity = getPersonalInformation(parsedSinId);

      if (!peronalInformationEntity) {
        throw new HttpResponse('Client Not found', { status: 204, headers: { 'Content-Type': 'text/plain' } });
      }

      const listOfClientId = [{ IdentificationID: peronalInformationEntity.clientIdentificationID, IdentificationCategoryText: peronalInformationEntity.clientIdentificationCategory }];
      const nameInfoList = [{ PersonSurName: [peronalInformationEntity.lastName], PersonGivenName: [peronalInformationEntity.firstName] }];
      const addressList = [
        {
          AddressCategoryCode: {
            ReferenceDataName: peronalInformationEntity.addressCategoryCode,
          },
          AddressStreet: {
            StreetName: peronalInformationEntity.addressStreet,
          },
          AddressSecondaryUnitText: peronalInformationEntity.addressSecondaryUnitText,
          AddressCityName: peronalInformationEntity.addressCityName,
          AddressProvince: {
            ProvinceName: peronalInformationEntity.addressProvince,
          },
          AddressCountry: {
            CountryName: peronalInformationEntity.addressCountryName,
          },
          AddressPostalCode: peronalInformationEntity.addressPostalCode,
        },
      ];

      return HttpResponse.json({
        Client: {
          ClientIdentification: listOfClientId,
          PersonName: nameInfoList,
          PersonContactInformation: {
            EmailAddress: {
              EmailAddressID: peronalInformationEntity.emailAddressId,
            },
            TelephoneNumber: {
              FullTelephoneNumber: peronalInformationEntity.fullTelephoneNumber,
            },
            Address: addressList,
          },
          PersonLanguage: {
            LanguageCode: {
              ReferenceDataName: peronalInformationEntity.languageCode,
            },
            PreferredIndicator: peronalInformationEntity.languagePreferredIndicator,
          },
          PersonSINIdentification: {
            IdentificationID: peronalInformationEntity.sinIdentification,
          },
        },
      });
    }),

    //
    // Handler for GET request to retrieve address by id
    //
    http.get('https://api.example.com/users/:userId/addresses/:addressId', ({ params, request }) => {
      log.debug('Handling request for [%s]', request.url);
      const addressEntity = getAddressEntity(params.userId, params.addressId);
      return HttpResponse.json({
        id: addressEntity.id,
        addressApartmentUnitNumber: addressEntity.addressApartmentUnitNumber,
        addressStreet: addressEntity.addressStreet,
        addressCity: addressEntity.addressCity,
        addressProvince: addressEntity.addressProvince,

        addressPostalZipCode: addressEntity.addressPostalZipCode,
        addressCountry: addressEntity.addressCountry,
      });
    }),

    //
    // Handler for PATCH requests to update address
    //
    http.patch('https://api.example.com/users/:userId/addresses/:addressId', async ({ params, request }) => {
      const addressEntity = getAddressEntity(params.userId, params.addressId);
      const document = toAddressPatchDocument(addressEntity);
      const patch = (await request.json()) as Operation[];
      const patchResult = jsonpatch.applyPatch(document, patch, true);
      db.address.update({ where: { id: { equals: String(params.addressId) } }, data: patchResult.newDocument });
      return HttpResponse.text(null, { status: 204 });
    }),

    /**
     * Handler for GET requests to retrieve letters types.
     */
    http.get('https://api.example.com/letter-types', () => {
      return HttpResponse.json(letterTypesJson);
    }),
  ];
}

/**
 * Retrieves an address entity based on the provided user ID and address ID.
 *
 * @param userId - The user ID to look up in the database.
 * @param addressId - The address ID to look up in the database.
 * @returns The address entity if found, otherwise throws a 404 error.
 */
function getAddressEntity(userId: string | readonly string[], addressId: string | readonly string[]) {
  const userEntity = getUserEntity(userId);
  const parsedAddressId = z.string().safeParse(addressId);

  if (!parsedAddressId.success || ![userEntity.homeAddress, userEntity.mailingAddress].includes(parsedAddressId.data)) {
    throw new HttpResponse('No address found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
  }
  const parsedAddress = db.address.findFirst({
    where: { id: { equals: parsedAddressId.data } },
  });

  if (!parsedAddress) {
    throw new HttpResponse('No address found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
  }

  return parsedAddress;
}

/**
 * Retrieves a user entity based on the provided user ID.
 *
 * @param id - The user ID to look up in the database.
 * @returns The user entity if found, otherwise throws a 404 error.
 */
function getUserEntity(id: string | readonly string[]) {
  const parsedUserId = z.string().uuid().safeParse(id);
  const userEntity = !parsedUserId.success
    ? undefined
    : db.user.findFirst({
        where: { id: { equals: parsedUserId.data } },
      });

  if (!userEntity) {
    throw new HttpResponse('User Not found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
  }

  return userEntity;
}

/**
 * Converts a address entity to a patch document with specific fields.
 *
 * @param addressEntity - The address entity to convert.
 * @returns Patch document containing selected user fields.
 */
function toAddressPatchDocument({ addressApartmentUnitNumber, addressStreet, addressCity, addressProvince, addressPostalZipCode, addressCountry }: ReturnType<typeof getAddressEntity>) {
  return { addressApartmentUnitNumber, addressStreet, addressCity, addressProvince, addressPostalZipCode, addressCountry };
}

/**
 * Converts a user entity to a patch document with specific fields.
 *
 * @param userEntity - The user entity to convert.
 * @returns Patch document containing selected user fields.
 */
function toUserPatchDocument({ homeAddress, mailingAddress, phoneNumber, preferredLanguage }: ReturnType<typeof getUserEntity>) {
  return { homeAddress, mailingAddress, phoneNumber, preferredLanguage };
}

/**
 * Retrieves a user entity based on the provided user ID.
 *
 * @param personalSinId - Sin to look up in the database.
 * @returns The user entity if found, otherwise throws a 404 error.
 */
function getPersonalInformation(personalSinId: string) {
  return !personalSinId
    ? undefined
    : db.personalInformation.findFirst({
        where: { sinIdentification: { equals: personalSinId } },
      });
}
