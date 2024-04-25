import { HttpResponse, http } from 'msw';
import { z } from 'zod';

import { db } from './db';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('subscription-api.server');

const subscriptionApiSchema = z.object({
  id: z.string(),
  sin: z.string(),
  email: z.string(),
  subscribed: z.boolean(),
  preferredLanguage: z.string(),
});

const validateSubscriptionSchema = z.object({
  email: z.string(),
  confirmationCode: z.string(),
});

/**
 * Server-side MSW mocks for the subscription API.
 */
export function getSubscriptionApiMockHandlers() {
  log.info('Initializing Subscription API mock handlers');

  return [
    //
    // Handler for GET request to retrieve email alerts decription by sin
    //
    http.get('https://api.example.com/v1/users/:userId/subscriptions', ({ params, request }) => {
      log.debug('Handling request for [%s]', request.url);

      const parsedUserId = z.string().safeParse(params.userId);

      if (!parsedUserId.success) {
        throw new HttpResponse(null, { status: 400 });
      }

      const subscriptionEntities = db.subscription.findMany({
        where: { sin: { equals: parsedUserId.data } },
      });

      return HttpResponse.json(subscriptionEntities);
    }),

    //
    // Handler for PUT request to update email alerts decription
    //
    http.put('https://api.example.com/v1/users/:userId/subscriptions', async ({ params, request }) => {
      log.debug('Handling request for [%s]', request.url);

      const requestBody = await request.json();
      const parsedSubscriptionApi = await subscriptionApiSchema.safeParseAsync(requestBody);

      if (!parsedSubscriptionApi.success) {
        throw new HttpResponse(null, { status: 400 });
      }

      if (parsedSubscriptionApi.data.id === '') {
        db.subscription.create({
          sin: parsedSubscriptionApi.data.sin,
          email: parsedSubscriptionApi.data.email,
          subscribed: parsedSubscriptionApi.data.subscribed,
          preferredLanguage: parsedSubscriptionApi.data.preferredLanguage,
          alertType: 'cdcp',
        });
      } else {
        db.subscription.update({
          where: { id: { equals: parsedSubscriptionApi.data.id } },
          data: {
            email: parsedSubscriptionApi.data.email,
            subscribed: parsedSubscriptionApi.data.subscribed,
            preferredLanguage: parsedSubscriptionApi.data.preferredLanguage,
          },
        });
      }

      return HttpResponse.text(null, { status: 204 });
    }),
    //MOCK TO VALIDATE THE CONFIRMATION CODE VS THE ONE ENTERED BY THE USER
    http.post('https://api.example.com/v1/users/codes/verify', async ({ params, request }) => {
      log.debug('Handling request for [%s]', request.url);
      const timeEntered = new Date();
      const requestBody = await request.json();
      const validateSubscriptionSchemaData = validateSubscriptionSchema.safeParse(requestBody);
      log.debug('validateSubscriptionSchemaData !!! ::: ' + JSON.stringify(validateSubscriptionSchemaData, null, 2));
      if (!validateSubscriptionSchemaData.success) {
        throw new HttpResponse(null, { status: 400 });
      }
      const subscriptionConfirmationCodesEntities = db.subscriptionConfirmationCode.findMany({
        where: { email: { equals: validateSubscriptionSchemaData.data.email } },
      });

      if (subscriptionConfirmationCodesEntities.length == 0) {
        return HttpResponse.text('No confirmation code for this user', { status: 200 });
      }

      const latestConfirmCode = subscriptionConfirmationCodesEntities.reduce((prev, current) => (prev.createdDate > current.createdDate ? prev : current));

      if (latestConfirmCode.confirmationCode == validateSubscriptionSchemaData.data.confirmationCode && timeEntered < latestConfirmCode.expiryDate) {
        return HttpResponse.text('Success', { status: 200 });
      }
      if (latestConfirmCode.confirmationCode == validateSubscriptionSchemaData.data.confirmationCode && timeEntered > latestConfirmCode.expiryDate) {
        //Code expired
        return HttpResponse.text('Code has expired, request a new one', { status: 200 });
      }

      //There is at least 1 confirmation code and the code entered by the user does not match it..
      return HttpResponse.text('No matching code found for this user', { status: 200 });
    }),
  ];
}
