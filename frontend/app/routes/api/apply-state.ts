/**
 * An API route that can be used to perform actions with user's apply state.
 */
import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';

import { z } from 'zod';

import { saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getLogger } from '~/utils/logging.server';

const API_APPLY_STATE_ACTIONS = ['extend'] as const;
export type ApiApplyStateAction = (typeof API_APPLY_STATE_ACTIONS)[number];

export async function action({ context: { configProvider, serviceProvider, session }, request }: ActionFunctionArgs) {
  const log = getLogger('routes/api/apply-state');
  const sessionId = session.id;
  log.debug("Action with with user's apply state; sessionId: [%s]", sessionId);

  if (request.method !== 'POST') {
    log.warn('Invalid method requested [%s]; responding with 405; sessionId: [%s]', request.method, sessionId);
    throw json({ message: 'Method not allowed' }, { status: 405 });
  }

  const bodySchema = z.object({
    action: z.enum(API_APPLY_STATE_ACTIONS),
    id: z.string(),
  });

  const requestBody = await request.json();
  const parsedBody = bodySchema.safeParse(requestBody);

  if (!parsedBody.success) {
    log.debug('Invalid request body [%j]; sessionId: [%s]', requestBody, sessionId);
    return json({ errors: parsedBody.error.flatten().fieldErrors }, { status: 400 });
  }

  const params = { id: parsedBody.data.id };

  switch (parsedBody.data.action) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    case 'extend': {
      log.debug("Extending user's apply state; id: [%s], sessionId: [%s]", params.id, sessionId);
      saveApplyState({ params, session, state: {} });
      return new Response(null, { status: 204 });
    }

    default: {
      throw Error(`Action '${parsedBody.data.action}' not implemented; sessionId: [${sessionId}]`);
    }
  }
}
