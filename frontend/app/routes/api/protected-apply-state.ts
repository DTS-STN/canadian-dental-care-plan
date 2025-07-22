/**
 * An API route that can be used to perform actions with user's protected apply state.
 */
import { z } from 'zod';

import type { Route } from './+types/protected-apply-state';

import { TYPES } from '~/.server/constants';
import { createLogger } from '~/.server/logging';
import { saveProtectedApplyState } from '~/.server/routes/helpers/protected-apply-route-helpers';
import type { ProtectedApplyStateParams } from '~/.server/routes/helpers/protected-apply-route-helpers';

const API_PROTECTED_APPLY_STATE_ACTIONS = ['extend'] as const;
export type ApiProtectedApplyStateAction = (typeof API_PROTECTED_APPLY_STATE_ACTIONS)[number];

export async function action({ context: { appContainer, session }, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateRequestMethod({ request, allowedMethods: ['POST'] });

  const log = createLogger('routes/api/protected-apply-state');
  const sessionId = session.id;
  log.debug("Action with with user's protected apply state; sessionId: [%s]", sessionId);

  const bodySchema = z.object({
    action: z.enum(API_PROTECTED_APPLY_STATE_ACTIONS),
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
  } as const satisfies ProtectedApplyStateParams;

  switch (parsedBody.data.action) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    case 'extend': {
      log.debug("Extending user's protected apply state; id: [%s], sessionId: [%s]", params.id, sessionId);
      saveProtectedApplyState({ params, session, state: {} });
      return Response.json({
        status: 'success',
        message: 'Protected apply state extended successfully.',
      });
    }

    default: {
      throw new Error(`Action '${parsedBody.data.action}' not implemented; sessionId: [${sessionId}]`);
    }
  }
}
