import { createRequestHandler } from '@react-router/express';
import type { AppLoadContext } from 'react-router';

import { UTCDate } from '@date-fns/utc';
import type { ErrorRequestHandler, Request, RequestHandler, Response } from 'express';
import path from 'node:path';
import type { ViteDevServer } from 'vite';

import { getAppContainerProvider } from '~/.server/app.container';
import { initServerBuild } from '~/.server/express-server/server-build.server';
import { createLogger } from '~/.server/logging';
import { ExpressSession, NoopSession } from '~/.server/web/session';
import { randomString } from '~/utils/string-utils';

const log = createLogger('request-handlers.server.ts');

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

export function rrRequestHandler(mode: string, viteDevServer?: ViteDevServer): RequestHandler {
  return createRequestHandler({
    mode,
    build: async () => {
      return await initServerBuild(viteDevServer);
    },
    getLoadContext,
  });
}

function getLoadContext(request: Request, response: Response): AppLoadContext {
  const appContainer = getAppContainerProvider();

  // `request.session` may be undefined if session middleware is not applied,
  // so a fallback `NoopSession` is used in that case.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const session = request.session ? new ExpressSession(request) : new NoopSession();

  if (session instanceof ExpressSession) {
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

  return { appContainer, session };
}
