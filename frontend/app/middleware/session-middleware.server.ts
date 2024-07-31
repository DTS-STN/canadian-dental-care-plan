import { UTCDate } from '@date-fns/utc';
import type { MiddlewareFunctionArgs } from 'remix-create-express-app/middleware';

import { getSessionService } from '~/services/session-service.server';
import { getLogger } from '~/utils/logging.server';
import { randomString } from '~/utils/string-utils';

const log = getLogger('session-middleware.server');

function shouldSkip({ url: pathname }: Request) {
  const statelessPaths = ['/api/readyz'];
  return statelessPaths.includes(pathname);
}

export async function sessionMiddleware({ request, context, next }: MiddlewareFunctionArgs) {
  if (shouldSkip(request)) {
    log.debug('Stateless request to [%s] detected; bypassing session init', request.url);
    return next();
  }

  log.debug('Initializing server session...');
  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request.headers.get('Cookie'));

  // We use session-scoped CSRF tokens to ensure back button and multi-tab navigation still works.
  // @see: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#synchronizer-token-pattern
  if (!session.has('csrfToken')) {
    const csrfToken = randomString(32);
    log.debug('Adding CSRF token [%s] to session', csrfToken);
    session.set('csrfToken', csrfToken);
  }

  log.debug('Setting session.lastAccessTime');
  session.set('lastAccessTime', new UTCDate().toISOString());

  //
  // TODO :: GjB :: eventually switch to ServerContext#set(..);
  // ie: context.set(createContext<Session>(), session);
  //
  log.debug('Adding session to ApplicationContext');
  context.session = session;

  log.debug('Auto-committing session');
  const response = await next();
  response.headers.append('Set-Cookie', await sessionService.commitSession(session));

  return response;
}
