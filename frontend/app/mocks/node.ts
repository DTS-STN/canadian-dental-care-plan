import jsonpatch, { type Operation } from 'fast-json-patch';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { z } from 'zod';

import { db } from '~/mocks/db';

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
 * Retrieves a preferred language entity based on the provided preferred language ID.
 *
 * @param id - The preferred language ID to look up in the database.
 * @returns The preferred language entity if found, otherwise throws a 404 error.
 */
function getPreferredLanguageEntity(id: string | readonly string[]) {
  const parsedPreferredLanguageId = z.string().safeParse(id);
  const parsedPreferredLanguage = !parsedPreferredLanguageId.success
    ? undefined
    : db.preferredLanguage.findFirst({
        where: { id: { equals: parsedPreferredLanguageId.data } },
      });

  if (!parsedPreferredLanguage) {
    throw new HttpResponse('No Preferred Language found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
  }

  return parsedPreferredLanguage;
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

const handlers = [
  /**
   * Handler for GET requests to retrieve user details.
   */
  http.get('https://api.example.com/users/:id', ({ params }) => {
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

  /**
   * Handler for PATCH requests to update user details.
   */
  http.patch('https://api.example.com/users/:id', async ({ params, request }) => {
    const userEntity = getUserEntity(params.id);
    const document = toUserPatchDocument(userEntity);
    const patch = (await request.json()) as Operation[];
    const patchResult = jsonpatch.applyPatch(document, patch, true);
    db.user.update({ where: { id: { equals: userEntity.id } }, data: patchResult.newDocument });
    return HttpResponse.text(null, { status: 204 });
  }),

  /**
   * Handler for GET request to retrieve address by id
   */
  http.get('https://api.example.com/users/:userId/addresses/:addressId', ({ params }) => {
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

  /**
   * Handler for GET request to retrieve all preferred languages
   */
  http.get('https://api.example.com/lookups/preferred-languages', () => {
    const preferredLanguageList = db.preferredLanguage.getAll();
    return HttpResponse.json(preferredLanguageList);
  }),

  /**
   * Handler for GET requests to retrieve preferred languages by id
   */
  http.get('https://api.example.com/lookups/preferred-languages/:id', ({ params }) => {
    const preferredLanguageEntity = getPreferredLanguageEntity(params.id);
    return HttpResponse.json({
      id: preferredLanguageEntity.id,
      nameEn: preferredLanguageEntity.nameEn,
      nameFr: preferredLanguageEntity.nameFr,
    });
  }),

  /**
   * Handler for GET requests to validate address
   */
  http.get('https://api.example.com/address/correct/:address', ({ params }) => {
    return HttpResponse.json({
      isCorrect: true,
    });
  }),
];

export const server = setupServer(...handlers);
