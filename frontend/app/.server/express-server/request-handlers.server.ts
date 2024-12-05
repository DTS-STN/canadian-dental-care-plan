import { createRemixRequest, sendRemixResponse } from '@remix-run/express/dist/server';
import { createRequestHandler } from '@remix-run/node';

import { UTCDate } from '@date-fns/utc';
import type { ErrorRequestHandler, Request, RequestHandler } from 'express';
import path from 'node:path';
import type { ViteDevServer } from 'vite';

import { getAppContainerProvider } from '~/.server/app.container';
import { TYPES } from '~/.server/constants';
import { getLogger } from '~/.server/utils/logging.utils';
import { randomString } from '~/utils/string-utils';

const log = getLogger('request-handlers.server.ts');

export function globalErrorHandler(isProduction: boolean): ErrorRequestHandler {
  return (error, request, response, next) => {
    log.error(error);

    if (response.headersSent) {
      return next(error);
    }

    const errorFile =
      response.statusCode === 403 //
        ? './assets/403.html'
        : './assets/500.html';

    const errorFilePath = path.join(import.meta.dirname, errorFile);

    response.status(response.statusCode).sendFile(errorFilePath, (dispatchError: unknown) => {
      if (dispatchError) {
        log.error(dispatchError);
        response.status(500).send('Internal Server Error');
      }
    });
  };
}

export function remixRequestHandler(mode: string, viteDevServer?: ViteDevServer): RequestHandler {
  /**
   * Returns `true` if session handling should be skipped for the current request.
   * Typically, this rule applies to stateless API endpoints.
   */
  function shouldSkipSessionHandling({ path }: Request) {
    const statelessPaths = ['/api/buildinfo', '/api/health', '/api/readyz', '/.well-known/jwks.json'];
    return statelessPaths.includes(path);
  }

  // dynamically declare the path to avoid static analysis errors 💩
  const remixServerBuild = './app.js';

  const appContainer = getAppContainerProvider();
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  const sessionService = appContainer.get(TYPES.web.services.SessionService);

  const build = viteDevServer //
    ? () => viteDevServer.ssrLoadModule('virtual:remix/server-build')
    : () => import(remixServerBuild);

  return async (request, response, next) => {
    try {
      const session = await sessionService.getSession(request.headers.cookie);

      if (!shouldSkipSessionHandling(request)) {
        log.debug('Initializing server session...');

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
      }

      const remixRequest = createRemixRequest(request, response);
      const remixRequestHandler = createRequestHandler(build, mode);
      const remixResponse = await remixRequestHandler(remixRequest, { appContainer, securityHandler, session });

      if (!shouldSkipSessionHandling(request)) {
        log.debug('Auto-committing session and creating session cookie');
        const sessionCookie = await sessionService.commitSession(session);
        remixResponse.headers.append('Set-Cookie', sessionCookie);
      }

      await sendRemixResponse(response, remixResponse);
    } catch (error) {
      // Express doesn't support async functions,
      // so we have to pass along the error manually using next()
      next(error);
    }
  };
}
