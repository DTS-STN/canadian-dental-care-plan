import type { ActionFunctionArgs, EntryContext, LoaderFunctionArgs } from '@remix-run/node';
import { createReadableStreamFromReadable } from '@remix-run/node';
import { RemixServer } from '@remix-run/react';

import { isbot } from 'isbot';
import { PassThrough } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';

import { NonceProvider, generateNonce } from '~/components/nonce-context';
import { server } from '~/mocks/node';
import { getSessionService } from '~/services/session-service.server';
import { generateContentSecurityPolicy } from '~/utils/csp-utils.server';
import { getEnv } from '~/utils/env.server';
import { getNamespaces } from '~/utils/locale-utils';
import { createLangCookie, getLocale, initI18n } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';

const abortDelay = 5_000;
const log = getLogger('entry.server');

const { ENABLED_MOCKS } = getEnv();

if (ENABLED_MOCKS.length > 0) {
  server.listen({ onUnhandledRequest: 'bypass' });
  log.info('‼️ Mock Service Worker has been enabled with the following mocks: %s', ENABLED_MOCKS);
}

/**
 * We need to extend the server-side session lifetime whenever a client-side
 * navigation happens. Since all client-side navigation will make a data request
 * for the root loader, we can use the handleDataRequest function to effectively
 * 'touch' the session, extending it by the default session lifetime.
 *
 * Extending the session lifetime will update the expires/maxage field of the
 * session cookie, and will also update the TTL value of the session data when
 * using Redis as a backing store.
 *
 * @see https://remix.run/docs/en/main/file-conventions/entry.server#handledatarequest
 */
export async function handleDataRequest(response: Response, { request }: LoaderFunctionArgs | ActionFunctionArgs) {
  log.debug('Touching session to extend its lifetime');

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);
  response.headers.append('Set-Cookie', await sessionService.commitSession(session));

  return response;
}

export default async function handleRequest(request: Request, responseStatusCode: number, responseHeaders: Headers, remixContext: EntryContext) {
  const handlerFnName = isbot(request.headers.get('user-agent')) ? 'onAllReady' : 'onShellReady';
  log.debug(`Handling [${request.method}] request to [${request.url}] with handler function [${handlerFnName}]`);

  const routes = Object.values(remixContext.routeModules);
  const locale = await getLocale(request);
  const langCookie = await createLangCookie().serialize(locale);
  const i18n = await initI18n(locale, getNamespaces(routes));

  const nonce = generateNonce(32);
  const contentSecurityPolicy = generateContentSecurityPolicy(nonce);

  // @see: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
  responseHeaders.set('Content-Security-Policy', contentSecurityPolicy);
  responseHeaders.set('Content-Type', 'text/html; charset=UTF-8');
  responseHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  responseHeaders.set('X-Content-Type-Options', 'nosniff');
  responseHeaders.set('X-Frame-Options', 'deny');
  // .append() because there can be more than one cookie in a response
  responseHeaders.append('Set-Cookie', langCookie);

  return new Promise((resolve, reject) => {
    let shellRendered = false;

    const { pipe, abort } = renderToPipeableStream(
      <I18nextProvider i18n={i18n}>
        <NonceProvider nonce={nonce}>
          <RemixServer context={remixContext} url={request.url} abortDelay={abortDelay} />
        </NonceProvider>
      </I18nextProvider>,
      {
        [handlerFnName]() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          resolve(new Response(stream, { headers: responseHeaders, status: responseStatusCode }));
          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error);
          }
        },
      },
    );

    setTimeout(abort, abortDelay);
  });
}
