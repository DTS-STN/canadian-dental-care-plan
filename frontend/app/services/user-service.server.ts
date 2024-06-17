import moize from 'moize';

import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('user-service.server');

export const getUserService = moize(createUserService, { onCacheAdd: () => log.info('Creating new user service') });

function createUserService() {
  const { CDCP_API_BASE_URI } = getEnv();

  async function createUser(email: string, userId: string) {
    const auditService = getAuditService();
    const instrumentationService = getInstrumentationService();
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
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newUser),
    });

    instrumentationService.countHttpStatus('http.client.cdcp-api.users.posts', response.status);

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
    return response.status;
  }

  return { createUser };
}
