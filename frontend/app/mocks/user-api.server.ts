import { HttpResponse, http } from 'msw';
import { z } from 'zod';

import { db } from './db';
import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('subscription-api.server');

const { CDCP_API_BASE_URI } = getEnv();

const userSubmittedApiSchema = z.object({
  id: z.string().optional(),
  email: z.string().optional(),
  emailVerified: z.boolean().optional(),
  userAttributes: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
    }),
  ),
});

export function getUserApiMockHandlers() {
  log.info('Initializing User API mock handlers');

  return [
    http.post(`${CDCP_API_BASE_URI}/api/v1/users`, async ({ params, request }) => {
      log.debug('Handling request for [%s]', request.url);

      const parsedUserId = z.string().safeParse(params.userId);
      if (!parsedUserId.success) {
        throw new HttpResponse(null, { status: 400 });
      }

      const requestBody = await request.json();
      const parsedUserToCreate = userSubmittedApiSchema.safeParse(requestBody);
      if (!parsedUserToCreate.success) {
        throw new HttpResponse(null, { status: 400 });
      }

      const userAttributesList = parsedUserToCreate.data.userAttributes.map((element) => db.userAttributes.create(element));

      db.user.create({
        email: parsedUserToCreate.data.email,
        userAttributes: userAttributesList,
      });
    }),
  ];
}
