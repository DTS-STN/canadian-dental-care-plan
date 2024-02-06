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
 * Retrieves list of letter entities based on the provided user ID.
 *
 * @param userId - The user ID to look up in the database.
 * @returns The letter entity if found, otherwise throws a 404 error.
 */
function getLetterEntities(userId: string | readonly string[]) {
  const parsedUserId = z.string().uuid().safeParse(userId);
  const letterEntity = !parsedUserId.success
    ? undefined
    : db.letter.findMany({
        where: {
          userId: {
            equals: parsedUserId.data,
          },
        },
      });
  if (!letterEntity) {
    throw new HttpResponse('Letter Not found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
  }

  return letterEntity;
}

/**
 * Retrieves a PDF entity based on the provided referenceId ID.
 *
 * @param id - The reference Id to look up in the database.
 * @returns The PDF entity if found, otherwise throws a 404 error.
 */
function getPdfEntity(referenceId: string | readonly string[]) {
  const parsedReferenceId = z.string().safeParse(referenceId);
  const parsedPdfEntity = !parsedReferenceId.success
    ? undefined
    : db.pdf.findFirst({
        where: { id: { equals: parsedReferenceId.data } },
      });

  if (!parsedPdfEntity) {
    throw new HttpResponse('No PDF found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
  }

  return parsedPdfEntity;
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
 * Converts a address entity to a patch document with specific fields.
 *
 * @param addressEntity - The address entity to convert.
 * @returns Patch document containing selected user fields.
 */
function toAddressPatchDocument({ addressApartmentUnitNumber, addressStreet, addressCity, addressProvince, addressPostalZipCode, addressCountry }: ReturnType<typeof getAddressEntity>) {
  return { addressApartmentUnitNumber, addressStreet, addressCity, addressProvince, addressPostalZipCode, addressCountry };
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
   * Handler for PATCH requests to update address
   */
  http.patch('https://api.example.com/users/:userId/addresses/:addressId', async ({ params, request }) => {
    const addressEntity = getAddressEntity(params.userId, params.addressId);
    const document = toAddressPatchDocument(addressEntity);
    const patch = (await request.json()) as Operation[];
    const patchResult = jsonpatch.applyPatch(document, patch, true);
    db.address.update({ where: { id: { equals: String(params.addressId) } }, data: patchResult.newDocument });
    return HttpResponse.text(null, { status: 204 });
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
   * Handler for POST requests to WSAddress parse service
   */
  http.post('https://api.example.com/address/parse', ({ params }) => {
    return HttpResponse.json({
      responseType: 'CA',
      addressLine: '23 CORONATION ST',
      city: 'ST JOHNS',
      province: 'NL',
      postalCode: 'A1C5B9',
      streetNumberSuffix: 'streetNumberSuffix',
      streetDirection: 'streetDirection',
      unitType: 'unitType',
      unitNumber: '000',
      serviceAreaName: 'serviceAreaName',
      serviceAreaType: 'serviceAreaType',
      serviceAreaQualifier: '',
      cityLong: 'cityLong',
      cityShort: 'cityShort',
      deliveryInformation: 'deliveryInformation',
      extraInformation: 'extraInformation',
      statusCode: 'Valid',
      canadaPostInformation: [],
      message: 'message',
      addressType: 'Urban',
      streetNumber: '23',
      streetName: 'CORONATION',
      streetType: 'ST',
      serviceType: 'Unknown',
      serviceNumber: '000',
      country: 'CAN',
      warnings: '',
      functionalMessages: [{ action: 'action', message: 'message' }],
    });
  }),

  /**
   * Handler for POST requests to WSAddress validate service
   */
  http.post('https://api.example.com/address/validate', ({ params }) => {
    return HttpResponse.json({
      responseType: 'CA',
      statusCode: 'Valid',
      functionalMessages: [
        { action: 'OriginalInput', message: '111 WELLINGTON ST   OTTAWA   ON   K1A0A4   CAN' },
        { action: 'Information', message: 'Dept = SENAT   Branch = SENAT   Lang = F' },
      ],
      message: '',
      warnings: '',
    });
  }),

  /**
   * Handler for GET requests to retrieve letters details.
   */
  http.get('https://api.example.com/letters?userId=', ({ params }) => {
    const letterEntities = getLetterEntities(params.userId);

    return HttpResponse.json(
      letterEntities.map((letter) => {
        return {
          dateSent: letter.dateSent,
          subject: letter.letterTypeCd,
          referenceId: letter.referenceId,
        };
      }),
    );
  }),

  /**
   * Handler for GET requests to retrieve pdf
   */
  http.get('https://api.example.com/cct/letters/:referenceId', async ({ params }) => {
    const encoder = new TextEncoder();
    const pdfEntity = getPdfEntity(params.referenceId);
    const stream = new ReadableStream({
      start(controller) {
        // Encode the string chunks using "TextEncoder".
        controller.enqueue(encoder.encode('Gums'));
        controller.enqueue(encoder.encode('n'));
        controller.enqueue(encoder.encode('proses'));
        controller.enqueue(encoder.encode(pdfEntity?.id));
        controller.close();
      },
    });

    // Send the mocked response immediately.
    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }),
];

export const server = setupServer(...handlers);
