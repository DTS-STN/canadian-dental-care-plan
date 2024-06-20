import moize from 'moize';
import { z } from 'zod';

import { getAuditService } from '~/services/audit-service.server';
import { getEnv } from '~/utils/env.server';
import { getFetchFn, instrumentedFetch } from '~/utils/fetch-utils.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('user-service.server');

const userSchema = z.object({
  id: z.string(),
  email: z.string().optional(),
  emailVerified: z.boolean().optional(),
  userAttributes: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
    }),
  ),
  _links: z.object({
    self: z.object({
      href: z.string(),
    }),
    subscriptions: z.object({
      href: z.string(),
    }),
    emailValidations: z.object({
      href: z.string(),
    }),
    confirmationCodes: z.object({
      href: z.string(),
    }),
  }),
});

export const getUserService = moize(createUserService, { onCacheAdd: () => log.info('Creating new user service') });

function createUserService() {
  const { CDCP_API_BASE_URI, HTTP_PROXY_URL } = getEnv();
  const fetchFn = getFetchFn(HTTP_PROXY_URL);

  async function createUser(email: string, userId: string) {
    const auditService = getAuditService();

    auditService.audit('user-service.create', { userId });

    const newUser = {
      email: email,
      userAttributes: [
        {
          name: 'RAOIDC_USER_ID',
          value: userId,
        },
      ],
    };

    const url = new URL(`${CDCP_API_BASE_URI}/api/v1/users`);
    const response = await instrumentedFetch(fetchFn, 'http.client.interop-api.users.posts', url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newUser),
    });

    if (!response.ok) {
      log.error('%j', {
        message: 'Failed creating user',
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });
      throw new Error(`Failed to create user. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    return userSchema.parse(await response.json());
  }

  return { createUser };
}
