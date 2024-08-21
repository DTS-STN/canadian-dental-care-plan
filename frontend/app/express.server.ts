import type { AppLoadContext } from '@remix-run/node';

import { UTCDate } from '@date-fns/utc';
import compression from 'compression';
import type { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import { createExpressApp } from 'remix-create-express-app';

import { getSessionService } from './services/session-service.server';
import { getEnv } from './utils/env-utils.server';
import { randomString } from './utils/string-utils';
import { getLogger } from '~/utils/logging.server';

const { NODE_ENV } = getEnv();

const log = getLogger('express.server');
const logFormat = NODE_ENV === 'development' ? 'dev' : 'tiny';
const sessionService = await getSessionService();

const loggingRequestHandler = morgan(logFormat, {
  skip: (request) => {
    const ignoredUrls = ['/api/readyz'];
    return request.url ? ignoredUrls.includes(request.url) : false;
  },
  stream: {
    write: (str: string) => log.info(str.trim()),
  },
});

// @see: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
function securityHeadersRequestHandler(request: Request, response: Response, next: NextFunction) {
  log.debug('Adding security headers to response');

  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  response.setHeader('Permissions-Policy', 'camera=(), display-capture=(), fullscreen=(), geolocation=(), interest-cohort=(), microphone=(), publickey-credentials-get=(), screen-wake-lock=()');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Server', 'webserver');
  response.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'deny');

  next();
}

async function sessionInitRequestHandler(request: Request, response: Response, next: NextFunction) {
  function shouldSkip({ url: pathname }: Request) {
    const statelessPaths = ['/api/readyz'];
    return statelessPaths.includes(pathname);
  }

  if (shouldSkip(request)) {
    log.debug('Stateless request to [%s] detected; bypassing session init', request.url);
    return;
  }

  log.debug('Initializing server session...');
  const session = await sessionService.getSession(request.headers.cookie);

  // We use session-scoped CSRF tokens to ensure back button and multi-tab navigation still works.
  // @see: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#synchronizer-token-pattern
  if (!session.has('csrfToken')) {
    const csrfToken = randomString(32);
    log.debug('Adding CSRF token [%s] to session', csrfToken);
    session.set('csrfToken', csrfToken);
  }

  log.debug('Setting session.lastAccessTime');
  session.set('lastAccessTime', new UTCDate().toISOString());

  log.debug('Auto-committing session');
  response.appendHeader('Set-Cookie', await sessionService.commitSession(session));

  next();
}

export const expressApp = await createExpressApp({
  configure: (app) => {
    // disable the X-Powered-By header to make it harder to fingerprint the server
    // (GjB :: yes, I acknowledge that this is rather moot, since our application is open source)
    app.disable('x-powered-by');
    // use gzip compression for all responses
    app.use(compression());
    // note: securityRequestHandler must execute before any static-content handlers
    app.use(securityHeadersRequestHandler);
    // log all requests using the loggingRequestHandler
    app.use(loggingRequestHandler);
    // initialize sessions
    app.use(sessionInitRequestHandler);
    // enable X-Forwarded-* header support to build OAuth callback URLs
    app.set('trust proxy', true);
  },
  getLoadContext: async (request: Request, response: Response) => {
    log.debug('Adding session to ApplicationContext');
    return { session: await sessionService.getSession(request.headers.cookie) } as AppLoadContext;
  },
});
