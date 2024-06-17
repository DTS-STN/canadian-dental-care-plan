import moize from 'moize';
import { z } from 'zod';

import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('user-service.server');

const userCreateInfoSchema = z.object({
  email: z.string(),
  userAttributes: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
    }),
  ),
});
type UserCreateInfo = z.infer<typeof userCreateInfoSchema>;

export const getUserService = moize(createUserService, { onCacheAdd: () => log.info('Creating new user service') });

function createUserService() {
  const { CDCP_API_BASE_URI } = getEnv();

  async function createUserWithAttributesAndEmail(user: UserCreateInfo, userId: string) {
    const auditService = getAuditService();
    const instrumentationService = getInstrumentationService();
    auditService.audit('user-service.create', { userId });

    const url = new URL(`${CDCP_API_BASE_URI}/api/v1/users`);
    console.debug('API URL ::: ' + url);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });

    instrumentationService.countHttpStatus('http.client.cdcp-api.users.create', response.status);

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
  }

  return { createUserWithAttributesAndEmail };
}
