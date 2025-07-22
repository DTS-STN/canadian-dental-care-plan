/**
 * An API route that can be used to perform actions with user's protected renew state.
 */
import { z } from 'zod';

import type { Route } from './+types/protected-renew-state';

import { TYPES } from '~/.server/constants';
import { createLogger } from '~/.server/logging';
import { saveProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import type { ProtectedRenewStateParams } from '~/.server/routes/helpers/protected-renew-route-helpers';

const API_PROTECTED_RENEW_STATE_ACTIONS = ['extend'] as const;
export type ApiProtectedRenewStateAction = (typeof API_PROTECTED_RENEW_STATE_ACTIONS)[number];

export async function action({ context: { appContainer, session }, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateRequestMethod({ request, allowedMethods: ['POST'] });

  const log = createLogger('routes/api/protected-renew-state');
  const sessionId = session.id;
  log.debug("Action with with user's protected renew state; sessionId: [%s]", sessionId);

  const bodySchema = z.object({
    action: z.enum(API_PROTECTED_RENEW_STATE_ACTIONS),
    id: z.string(),
  });

  const requestBody = await request.json();
  const parsedBody = bodySchema.safeParse(requestBody);

  if (!parsedBody.success) {
    log.debug('Invalid request body [%j]; sessionId: [%s]', requestBody, sessionId);
    return Response.json({ errors: z.flattenError(parsedBody.error).fieldErrors }, { status: 400 });
  }

  const params = {
    id: parsedBody.data.id,
    lang: 'en',
  } as const satisfies ProtectedRenewStateParams;

  switch (parsedBody.data.action) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    case 'extend': {
      log.debug("Extending user's protected renew state; id: [%s], sessionId: [%s]", params.id, sessionId);
      saveProtectedRenewState({ params, request, session, state: {} });
      return Response.json({
        status: 'success',
        message: 'Protected renew state extended successfully.',
      });
    }

    default: {
      throw new Error(`Action '${parsedBody.data.action}' not implemented; sessionId: [${sessionId}]`);
    }
  }
}
