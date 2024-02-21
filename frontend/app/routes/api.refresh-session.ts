/**
 * An API route that can be used to refresh the user's server-side session.
 */
import { LoaderFunctionArgs } from '@remix-run/node';

import { getSessionService } from '~/services/session-service.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('routes/api.refresh-session');

export async function loader({ request }: LoaderFunctionArgs) {
  log.debug('Touching session to extend its lifetime');

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);

  return new Response(null, {
    status: 204,
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  });
}
