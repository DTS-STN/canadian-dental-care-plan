/**
 * An API route that can be used to perform actions with user's apply state.
 */
import { z } from 'zod';

import type { Route } from './+types/apply-state';

import { TYPES } from '~/.server/constants';
import { saveApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { getLogger } from '~/.server/utils/logging.utils';

const API_APPLY_STATE_ACTIONS = ['extend'] as const;
export type ApiApplyStateAction = (typeof API_APPLY_STATE_ACTIONS)[number];

export async function action({ context: { appContainer, session }, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateRequestMethod({ request, allowedMethods: ['POST'] });

  const log = getLogger('routes/api/apply-state');
  const sessionId = session.id;
  log.debug("Action with with user's apply state; sessionId: [%s]", sessionId);

  const bodySchema = z.object({
    action: z.enum(API_APPLY_STATE_ACTIONS),
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
      log.debug("Extending user's apply state; id: [%s], sessionId: [%s]", params.id, sessionId);
      saveApplyState({ params, session, state: {} });
      return Response.json({
        status: 'success',
        message: 'Apply state extended successfully.',
      });
    }

    default: {
      throw Error(`Action '${parsedBody.data.action}' not implemented; sessionId: [${sessionId}]`);
    }
  }
}
