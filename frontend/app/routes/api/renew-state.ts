/**
 * An API route that can be used to perform actions with user's renew state.
 */
import { z } from 'zod';

import type { Route } from './+types/renew-state';

import { TYPES } from '~/.server/constants';
import { createLogger } from '~/.server/logging';
import { saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import type { RenewStateParams } from '~/.server/routes/helpers/renew-route-helpers';

const API_RENEW_STATE_ACTIONS = ['extend'] as const;
export type ApiRenewStateAction = (typeof API_RENEW_STATE_ACTIONS)[number];

export async function action({ context: { appContainer, session }, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateRequestMethod({ request, allowedMethods: ['POST'] });

  const log = createLogger('routes/api/renew-state');
  const sessionId = session.id;
  log.debug("Action with with user's renew state; sessionId: [%s]", sessionId);

  const bodySchema = z.object({
    action: z.enum(API_RENEW_STATE_ACTIONS),
    id: z.string(),
  });

  const requestBody = await request.json();
  const parsedBody = bodySchema.safeParse(requestBody);

  if (!parsedBody.success) {
    log.debug('Invalid request body [%j]; sessionId: [%s]', requestBody, sessionId);
    return Response.json({ errors: parsedBody.error.flatten().fieldErrors }, { status: 400 });
  }

  const params = {
    id: parsedBody.data.id,
    lang: 'en',
  } as const satisfies RenewStateParams;

  switch (parsedBody.data.action) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    case 'extend': {
      log.debug("Extending user's renew state; id: [%s], sessionId: [%s]", params.id, sessionId);
      saveRenewState({ params, session, state: {} });
      return Response.json({
        status: 'success',
        message: 'Renew state extended successfully.',
      });
    }

    default: {
      throw Error(`Action '${parsedBody.data.action}' not implemented; sessionId: [${sessionId}]`);
    }
  }
}
