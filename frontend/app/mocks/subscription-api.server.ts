import jsonpatch from 'fast-json-patch';
import type { Operation } from 'fast-json-patch';
import { HttpResponse, http } from 'msw';
import { z } from 'zod';

import { db } from './db';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('subscription-api.server');

const subscriptionApiSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  msLanguageCode: z.string(),
  alertTypeCode: z.string(),
});

const confirmationCodeApiSchema = z.object({
  confirmationCode: z.string(),
});

/**
 * Server-side MSW mocks for the subscription API.
 */
export function getSubscriptionApiMockHandlers() {
  log.info('Initializing Subscription API mock handlers');

  return [
    //
    // Handler for GET request to retrieve user by raoidc user id
    //
    http.get('https://api.cdcp.example.com/api/v1/users', ({ request }) => {
      log.debug('Handling request for [%s]', request.url);

      const url = new URL(request.url);
      const raoidcUserId = url.searchParams.get('raoidcUserId');

      const parsedRaoidUserId = z.string().safeParse(raoidcUserId);

      if (!parsedRaoidUserId.success) {
        throw new HttpResponse(null, { status: 400 });
      }

      const userEntity = db.user.findFirst({
        where: { userAttributes: { value: { equals: parsedRaoidUserId.data } } },
      });

      return HttpResponse.json({
        _embedded: {
          users: [
            {
              ...userEntity,
              _links: {
                self: {
                  href: `https://api.cdcp.example.com/api/v1/users/${userEntity?.id}`,
                },
                subscriptions: {
                  href: `https://api.cdcp.example.com/api/v1/users/${userEntity?.id}/subscriptions`,
                },
                emailValidations: {
                  href: `https://api.cdcp.example.com/api/v1/users/${userEntity?.id}/email-validations`,
                },
                confirmationCodes: {
                  href: `https://api.cdcp.example.com/api/v1/users/${userEntity?.id}/confirmation-codes`,
                },
              },
            },
          ],
        },
        _links: {
          self: {
            href: `https://api.cdcp.example.com/api/v1/users?raoidcUserId=${raoidcUserId}`,
          },
        },
      });
    }),

    //
    // Handler for GET request to retrieve user by userId
    //
    http.get('https://api.cdcp.example.com/api/v1/users/:userId', ({ params, request }) => {
      log.debug('Handling request for [%s]', request.url);

      const parsedUserId = z.string().safeParse(params.userId);

      if (!parsedUserId.success) {
        throw new HttpResponse(null, { status: 400 });
      }

      const userEntity = db.user.findFirst({
        where: { id: { equals: parsedUserId.data } },
      });

      return HttpResponse.json({
        ...userEntity,
        _links: {
          self: {
            href: `https://api.cdcp.example.com/api/v1/users/${parsedUserId.data}`,
          },
          subscriptions: {
            href: `https://api.cdcp.example.com/api/v1/users/${parsedUserId.data}/subscriptions`,
          },
          emailValidations: {
            href: `https://api.cdcp.example.com/api/v1/users/${parsedUserId.data}/email-validations`,
          },
          confirmationCodes: {
            href: `https://api.cdcp.example.com/api/v1/users/${parsedUserId.data}/confirmation-codes`,
          },
        },
      });
    }),

    //
    // Handler for patch request to update user by userId
    //
    http.patch('https://api.cdcp.example.com/api/v1/users/:userId', async ({ params, request }) => {
      log.debug('Handling PATCH request for [%s]', request.url);

      const userEntity = getUserEntity(params.userId);
      console.log('---------------------------------------------------');
      console.log(userEntity);
      const document = toUserPatchDocument(userEntity);
      console.log(document);
      const patch = (await request.json()) as Operation[];
      console.log(patch);
      const patchResult = jsonpatch.applyPatch(document, patch, true);
      console.log(patchResult);
      db.user.update({ where: { id: { equals: userEntity.id } }, data: { ...patchResult.newDocument, emailVerified: false } });

      return HttpResponse.text(null, { status: 204 });
    }),

    //
    // Handler for GET request to retrieve subscriptions by userId
    //
    http.get('https://api.cdcp.example.com/api/v1/users/:userId/subscriptions', ({ params, request }) => {
      log.debug('Handling request for [%s]', request.url);

      const parsedUserId = z.string().safeParse(params.userId);

      if (!parsedUserId.success) {
        throw new HttpResponse(null, { status: 400 });
      }

      const subscriptionEntities = db.subscription.findMany({
        where: { userId: { equals: parsedUserId.data } },
      });

      const subscriptions = subscriptionEntities.map((subscriptionEntity) => ({
        id: subscriptionEntity.id,
        msLanguageCode: subscriptionEntity.msLanguageCode,
        alertTypeCode: subscriptionEntity.alertTypeCode,
        _links: {
          self: {
            href: `https://api.cdcp.example.com/api/v1/users/${subscriptionEntity.userId}/subscriptions/${subscriptionEntity.id}`,
          },
        },
      }));

      return HttpResponse.json({
        _embedded: {
          subscriptions: subscriptions,
        },
        _links: {
          self: {
            href: `https://api.cdcp.example.com/api/v1/users/${parsedUserId.data}/subscriptions`,
          },
        },
      });
    }),

    //
    // Handler for Delete subscriptions by subscriptionId
    //
    http.delete('https://api.cdcp.example.com/api/v1/users/:userId/subscriptions/:subscriptionId', ({ params, request }) => {
      log.debug('Handling request for [%s]', request.url);

      const parsedUserId = z.string().safeParse(params.userId);

      if (!parsedUserId.success) {
        throw new HttpResponse(null, { status: 400 });
      }

      const parsedSubscriptionId = z.string().safeParse(params.subscriptionId);

      if (!parsedSubscriptionId.success) {
        throw new HttpResponse(null, { status: 400 });
      }

      db.subscription.delete({
        where: { id: { equals: parsedSubscriptionId.data } },
      });

      return HttpResponse.text(null, { status: 204 });
    }),

    //
    // Handler for POST request to create email alerts decription
    //
    http.post('https://api.cdcp.example.com/api/v1/users/:userId/subscriptions', async ({ params, request }) => {
      log.debug('Handling POST request for [%s]', request.url);

      const parsedUserId = z.string().safeParse(params.userId);

      if (!parsedUserId.success) {
        throw new HttpResponse(null, { status: 400 });
      }

      const requestBody = await request.json();
      const parsedSubscriptionApi = await subscriptionApiSchema.safeParseAsync(requestBody);

      if (!parsedSubscriptionApi.success) {
        throw new HttpResponse(null, { status: 400 });
      }

      const newSubscription = db.subscription.create({
        userId: parsedUserId.data,
        msLanguageCode: parsedSubscriptionApi.data.msLanguageCode,
        alertTypeCode: 'CDCP',
      });

      return HttpResponse.json({
        id: newSubscription.id,
        msLanguageCode: newSubscription.msLanguageCode,
        alertTypeCode: newSubscription.alertTypeCode,
        _links: {
          self: {
            href: `https://api.cdcp.example.com/api/v1/users/${parsedUserId.data}/subscriptions/${newSubscription.id}`,
          },
        },
      });
    }),

    //
    // Handler for PUT request to update email alerts decription
    //
    http.put('https://api.cdcp.example.com/v1/users/:userId/subscriptions', async ({ params, request }) => {
      log.debug('Handling request for [%s]', request.url);

      const requestBody = await request.json();
      const parsedSubscriptionApi = await subscriptionApiSchema.safeParseAsync(requestBody);

      if (!parsedSubscriptionApi.success) {
        throw new HttpResponse(null, { status: 400 });
      }

      if (parsedSubscriptionApi.data.id === '') {
        db.subscription.create({
          userId: parsedSubscriptionApi.data.userId,
          msLanguageCode: parsedSubscriptionApi.data.msLanguageCode,
          alertTypeCode: 'CDCP',
        });
      } else {
        db.subscription.update({
          where: { id: { equals: parsedSubscriptionApi.data.id } },
          data: {
            msLanguageCode: parsedSubscriptionApi.data.msLanguageCode,
          },
        });
      }

      return HttpResponse.text(null, { status: 204 });
    }),

    http.post('https://api.cdcp.example.com/api/v1/users/:userId/email-validations', async ({ params, request }) => {
      log.debug('Handling request for [%s]', request.url);
      const timeEntered = new Date();

      const parsedUserId = z.string().safeParse(params.userId);
      if (!parsedUserId.success) {
        throw new HttpResponse(null, { status: 400 });
      }

      const requestBody = await request.json();
      const parsedConfirmationCode = confirmationCodeApiSchema.safeParse(requestBody);
      if (!parsedConfirmationCode.success) {
        throw new HttpResponse(null, { status: 400 });
      }

      const subscriptionConfirmationCodesEntities = db.subscriptionConfirmationCode.findMany({
        where: { userId: { equals: parsedUserId.data }, code: { equals: parsedConfirmationCode.data.confirmationCode } },
      });

      if (subscriptionConfirmationCodesEntities.length === 0) {
        return HttpResponse.json({ status: 400 });
      }

      const latestConfirmCode = subscriptionConfirmationCodesEntities.reduce((prev, current) => (prev.createdDate > current.createdDate ? prev : current));

      if (latestConfirmCode.code === parsedConfirmationCode.data.confirmationCode && timeEntered < latestConfirmCode.expiryDate) {
        db.user.update({
          where: { id: { equals: parsedUserId.data } },
          data: {
            emailVerified: true,
          },
        });
        return HttpResponse.json({ status: 202 });
      }

      return HttpResponse.json({ status: 400 });
    }),

    http.post('https://api.cdcp.example.com/api/v1/users/:userId/confirmation-codes', ({ params, request }) => {
      log.debug('Handling request for [%s]', request.url);
      const timeEntered = new Date();

      const parsedUserId = z.string().safeParse(params.userId);
      if (!parsedUserId.success) {
        throw new HttpResponse(null, { status: 400 });
      }

      db.subscriptionConfirmationCode.create({
        code: '0101',
        userId: parsedUserId.data,
        createdDate: timeEntered,
        expiryDate: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000), // current date date + 2 days
      });

      return HttpResponse.json({ confirmCodeStatus: 'No Content' }, { status: 204 });
    }),
  ];
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
 * Converts a user entity to a patch document with specific fields.
 *
 * @param userEntity - The user entity to convert.
 * @returns Patch document containing selected user fields.
 */
function toUserPatchDocument({ email }: ReturnType<typeof getUserEntity>) {
  return { email };
}
