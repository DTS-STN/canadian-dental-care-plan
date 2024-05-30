import moize from 'moize';
import { z } from 'zod';

import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('user-service.server');

//export const getSubscriptionService = moize(createSubscriptionService,
//{ onCacheAdd: () => log.info('Creating new subscription service') });

export const getUserService = moize(createUserService, { onCacheAdd: () => log.info('Creating new user service') });

function createUserService() {
  const { CDCP_API_BASE_URI } = getEnv();

  async function getUser(userId: string) {
    const auditService = getAuditService();
    const instrumentationService = getInstrumentationService();
    auditService.audit('alert-subscription.get', { userId });
    const url = new URL(`${CDCP_API_BASE_URI}/api/v1/users/${userId}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const userSchema = z.object({
      id: z.string(),
      email: z.string(),
      emailVerified: z.boolean(),
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
      }),
    });
    instrumentationService.countHttpStatus('http.client.cdcp-api.users.gets', response.status);
    return userSchema.parse(await response.json());
  }

  return { getUser };
}
