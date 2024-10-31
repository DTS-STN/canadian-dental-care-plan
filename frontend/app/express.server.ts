// require by inversify to be the first import
import 'reflect-metadata';

import type { AppLoadContext } from '@remix-run/node';
import { createRequestHandler } from '@remix-run/node';

import { UTCDate } from '@date-fns/utc';
import compression from 'compression';
import type { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import { createExpressApp } from 'remix-create-express-app';
import { createRemixRequest, sendRemixResponse } from 'remix-create-express-app/remix';
import invariant from 'tiny-invariant';

import { getEnv } from './utils/env-utils.server';
import { randomString } from './utils/string-utils';
import { getContainerConfigProvider, getContainerServiceProvider, getContainerWebValidatorProvider } from '~/.server/container';
import { getLogger } from '~/utils/logging.server';

const { NODE_ENV } = getEnv();

const logFormat = NODE_ENV === 'development' ? 'dev' : 'tiny';

const loggingRequestHandler = (() => {
  const log = getLogger('express.server/loggingRequestHandler');
  return morgan(logFormat, {
    skip: (request) => {
      const ignoredUrls = ['/api/readyz'];
      return request.url ? ignoredUrls.includes(request.url) : false;
    },
    stream: {
      write: (str: string) => log.info(str.trim()),
    },
  });
})();

// @see: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
function securityHeadersRequestHandler(request: Request, response: Response, next: NextFunction) {
  const log = getLogger('express.server/securityHeadersRequestHandler');
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

/**
 * Returns `true` if session handling should be skipped for the current request.
 * Typically, this rule applies to stateless API endpoints.
 */
function shouldSkipSessionHandling({ path }: Request) {
  const statelessPaths = ['/api/buildinfo', '/api/health', '/api/readyz'];
  return statelessPaths.includes(path);
}

const expressApp = await createExpressApp({
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
    // enable X-Forwarded-* header support to build OAuth callback URLs
    app.set('trust proxy', true);
  },
  customRequestHandler: () => {
    /**
     * A custom request handler that will auto-commit the session after
     * remix has performed all of its request processing.
     */
    return ({ build, getLoadContext, mode }) => {
      const log = getLogger('express.server/customRequestHandler');
      const remixRequestHandler = createRequestHandler(build, mode);
      return async (request: Request, response: Response, next: NextFunction) => {
        try {
          const loadContext = await getLoadContext?.(request, response);
          invariant(loadContext, 'Expected loadContext to be defined');

          const remixRequest = createRemixRequest(request, response);
          const remixResponse = await remixRequestHandler(remixRequest, loadContext);

          if (!shouldSkipSessionHandling(request)) {
            invariant(loadContext.session, 'Expected loadContext.session to be defined');

            log.debug('Auto-committing session and creating session cookie');
            const sessionService = getContainerServiceProvider().getSessionService();
            const sessionCookie = await sessionService.commitSession(loadContext.session);
            remixResponse.headers.append('Set-Cookie', sessionCookie);
          }

          await sendRemixResponse(response, remixResponse);
        } catch (error: unknown) {
          // express doesn't support async functions,
          // so we have to pass along the error manually using next()
          return next(error);
        }
      };
    };
  },
  getLoadContext: async (request: Request, response: Response) => {
    const log = getLogger('express.server/getLoadContext');

    const appLoadContext: Partial<AppLoadContext> = {
      configProvider: getContainerConfigProvider(),
      serviceProvider: getContainerServiceProvider(),
      webValidatorProvider: getContainerWebValidatorProvider(),
    };

    if (shouldSkipSessionHandling(request)) {
      log.debug('Stateless request to [%s] detected; bypassing session init', request.url);
      return appLoadContext as AppLoadContext;
    }

    log.debug('Initializing server session...');
    const sessionService = getContainerServiceProvider().getSessionService();
    const session = await sessionService.getSession(request.headers.cookie);

    // We use session-scoped CSRF tokens to ensure back button and multi-tab navigation still works.
    // @see: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#synchronizer-token-pattern
    if (!session.has('csrfToken')) {
      const csrfToken = randomString(32);
      log.debug('Adding CSRF token [%s] to session', csrfToken);
      session.set('csrfToken', csrfToken);
    }

    const lastAccessTime = new UTCDate().toISOString();
    log.debug('Setting session.lastAccessTime to [%s]', lastAccessTime);
    session.set('lastAccessTime', lastAccessTime);

    return { ...appLoadContext, session } as AppLoadContext;
  },
});

/**
 * This is the error handler middleware for the express application.
 * It must be added using `app.use` after all other middleware and
 * routes have been defined. Otherwise, it will never be called.
 */
expressApp.use((err: unknown, request: Request, response: Response, next: NextFunction) => {
  const log = getLogger('express.server/errorHandler');
  log.error(err);
  response.status(500).json({
    application: 'Canadian Dental Care Plan',
    error: 'Internal Server Error',
    description: 'An unexpected error occurred while processing your request. Please try again later.',
  });
});

export { expressApp };
