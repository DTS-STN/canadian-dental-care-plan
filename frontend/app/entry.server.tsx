import type { ActionFunctionArgs, EntryContext, LoaderFunctionArgs } from '@remix-run/node';
import { createReadableStreamFromReadable } from '@remix-run/node';
import { RemixServer } from '@remix-run/react';

import { isbot } from 'isbot';
import { PassThrough } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';

import { NonceProvider } from '~/components/nonce-context';
import { server } from '~/mocks/node';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { generateContentSecurityPolicy } from '~/utils/csp-utils.server';
import { getEnv } from '~/utils/env.server';
import { getNamespaces } from '~/utils/locale-utils';
import { getLocale, initI18n } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { randomHexString } from '~/utils/string-utils';

const abortDelay = 5_000;
const log = getLogger('entry.server');

const { ENABLED_MOCKS } = getEnv();
const instrumentationService = getInstrumentationService();

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
 * Extending the session lifetime  update the TTL value of the session data when
 * using Redis as a backing store.
 *
 * @see https://remix.run/docs/en/main/file-conventions/entry.server#handledatarequest
 */
export async function handleDataRequest(response: Response, { request }: LoaderFunctionArgs | ActionFunctionArgs) {
  log.debug('Touching session to extend its lifetime');
  instrumentationService.createCounter('http.server.requests').add(1);

  //
  // TODO :: GjB :: Remove this?
  //
  // const sessionService = await getSessionService();
  // const session = await sessionService.getSession(request);
  // response.headers.append('Set-Cookie', await sessionService.commitSession(session));

  return response;
}

/**
 * Log any errors using the application logger (Remix will log using console.error() by default, which we don't want).
 *
 * @see https://remix.run/docs/en/main/file-conventions/entry.server#handleerror
 */
export function handleError(error: unknown, { request }: LoaderFunctionArgs | ActionFunctionArgs) {
  // note that you generally want to avoid logging when the request was aborted, since remix's
  // cancellation and race-condition handling can cause a lot of requests to be aborted
  if (!request.signal.aborted) {
    if (error instanceof Error) {
      log.error('Unexpected server error:', error);
    } else {
      log.error('Unexpected server error: [%j]', error);
    }

    instrumentationService.createCounter('http.server.requests.failed').add(1);
  }
}

export default async function handleRequest(request: Request, responseStatusCode: number, responseHeaders: Headers, remixContext: EntryContext) {
  const handlerFnName = isbot(request.headers.get('user-agent')) ? 'onAllReady' : 'onShellReady';
  log.debug(`Handling [${request.method}] request to [${request.url}] with handler function [${handlerFnName}]`);
  instrumentationService.createCounter('http.server.requests').add(1);

  const locale = getLocale(request);
  const routes = Object.values(remixContext.routeModules);
  const i18n = await initI18n(locale, getNamespaces(routes));
  const nonce = randomHexString(32);

  // @see: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
  responseHeaders.set('Content-Type', 'text/html; charset=UTF-8');
  responseHeaders.set('Content-Security-Policy', generateContentSecurityPolicy(nonce));

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
