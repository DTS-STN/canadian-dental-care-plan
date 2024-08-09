/**
 * An API route that can be used to perform actions with user's server-side session.
 */
import type { ActionFunctionArgs } from '@remix-run/node';
import { json, redirectDocument } from '@remix-run/node';

import { z } from 'zod';

import { getSessionService } from '~/services/session-service.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('routes/api/session');

export enum ApiSessionAction {
  End = 'end',
  Extend = 'extend',
}

const bodySchema = z.object({
  action: z.nativeEnum(ApiSessionAction),
  redirectTo: z.string().trim().nullable().optional(),
});

export async function action({ context: { session }, request }: ActionFunctionArgs) {
  const sessionId = session.id;
  log.debug("Action with user's server-side session; sessionId: [%s]", sessionId);

  if (request.method !== 'POST') {
    log.warn('Invalid method requested [%s]; responding with 405; sessionId: [%s]', request.method, sessionId);
    throw json({ message: 'Method not allowed' }, { status: 405 });
  }

  const requestBody = await request.json();
  const parsedBody = bodySchema.safeParse(requestBody);

  if (!parsedBody.success) {
    log.debug('Invalid request body [%j]; sessionId: [%s]', requestBody, sessionId);
    return json({ errors: parsedBody.error.flatten().fieldErrors }, { status: 400 });
  }

  const { action, redirectTo } = parsedBody.data;

  switch (action) {
    case ApiSessionAction.End: {
      log.debug("Ending user's server-side session; sessionId: [%s], redirectTo: [%s]", sessionId, redirectTo);
      const sessionService = await getSessionService();
      const headers = { 'Set-Cookie': await sessionService.destroySession(session) };

      if (redirectTo) {
        return redirectDocument(redirectTo, { headers });
      }

      return new Response(null, { headers, status: 204 });
    }

    case ApiSessionAction.Extend: {
      log.debug("Extending user's server-side session lifetime; sessionId: [%s]", sessionId);
      return new Response(null, { status: 204 });
    }

    default: {
      throw Error(`Action '${parsedBody.data.action}' not implemented; sessionId: [${sessionId}]`);
    }
  }
}
