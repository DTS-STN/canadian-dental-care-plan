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
];

export const server = setupServer(...handlers);
