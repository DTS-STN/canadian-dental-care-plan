/**
 * An API route that can be used to perform actions with user's protected renew state.
 */
import type { ActionFunctionArgs } from '@remix-run/node';

import { z } from 'zod';

import { saveProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { getLogger } from '~/.server/utils/logging.utils';

const API_PROTECTED_RENEW_STATE_ACTIONS = ['extend'] as const;
export type ApiProtectedRenewStateAction = (typeof API_PROTECTED_RENEW_STATE_ACTIONS)[number];

export async function action({ context: { appContainer, session }, request }: ActionFunctionArgs) {
  const log = getLogger('routes/api/protected-renew-state');
  const sessionId = session.id;
  log.debug("Action with with user's protected renew state; sessionId: [%s]", sessionId);

  if (request.method !== 'POST') {
    log.warn('Invalid method requested [%s]; responding with 405; sessionId: [%s]', request.method, sessionId);
    throw Response.json({ message: 'Method not allowed' }, { status: 405 });
  }

  const bodySchema = z.object({
    action: z.enum(API_PROTECTED_RENEW_STATE_ACTIONS),
    id: z.string(),
  });

  const requestBody = await request.json();
  const parsedBody = bodySchema.safeParse(requestBody);

  if (!parsedBody.success) {
    log.debug('Invalid request body [%j]; sessionId: [%s]', requestBody, sessionId);
    return Response.json({ errors: parsedBody.error.flatten().fieldErrors }, { status: 400 });
  }

  const params = { id: parsedBody.data.id };

  switch (parsedBody.data.action) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    case 'extend': {
      log.debug("Extending user's protected renew state; id: [%s], sessionId: [%s]", params.id, sessionId);
      saveProtectedRenewState({ params, session, state: {} });
      return Response.json(null, { status: 204 });
    }

    default: {
      throw Error(`Action '${parsedBody.data.action}' not implemented; sessionId: [${sessionId}]`);
    }
  }
}
