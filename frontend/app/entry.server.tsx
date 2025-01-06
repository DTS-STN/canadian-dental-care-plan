import type { ActionFunctionArgs, AppLoadContext, EntryContext, LoaderFunctionArgs } from 'react-router';
import { ServerRouter } from 'react-router';

import { createReadableStreamFromReadable } from '@react-router/node';
import { isbot } from 'isbot';
import { PassThrough } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import type { RenderToPipeableStreamOptions } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';

import { TYPES } from '~/.server/constants';
import { generateContentSecurityPolicy } from '~/.server/utils/csp.utils';
import { getLocale, initI18n } from '~/.server/utils/locale.utils';
import { getLogger } from '~/.server/utils/logging.utils';
import { NonceProvider } from '~/components/nonce-context';
import { getNamespaces } from '~/utils/locale-utils';
import { randomHexString } from '~/utils/string-utils';

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
// eslint-disable-next-line @typescript-eslint/require-await
export async function handleDataRequest(response: Response, { context: { appContainer }, request }: LoaderFunctionArgs | ActionFunctionArgs) {
  const log = getLogger('entry.server/handleDataRequest');
  log.debug('Touching session to extend its lifetime');
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);
  instrumentationService.createCounter('http.server.requests').add(1);

  return response;
}

/**
 * Log any errors using the application logger (Remix will log using console.error() by default, which we don't want).
 *
 * @see https://remix.run/docs/en/main/file-conventions/entry.server#handleerror
 */
export function handleError(error: unknown, { context: { appContainer }, request }: LoaderFunctionArgs | ActionFunctionArgs) {
  // note that you generally want to avoid logging when the request was aborted, since remix's
  // cancellation and race-condition handling can cause a lot of requests to be aborted
  const log = getLogger('entry.server/handleError');
  if (!request.signal.aborted) {
    if (error instanceof Error) {
      log.error(error);
    } else {
      log.error('Unexpected server error: [%j]', error);
    }

    const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);
    instrumentationService.createCounter('http.server.requests.failed').add(1);
  }
}

export default async function handleRequest(request: Request, responseStatusCode: number, responseHeaders: Headers, routerContext: EntryContext, { appContainer }: AppLoadContext) {
  const log = getLogger('entry.server/handleRequest');
  const handlerFnName = isbot(request.headers.get('user-agent')) ? 'onAllReady' : 'onShellReady';
  log.debug(`Handling [${request.method}] request to [${request.url}] with handler function [${handlerFnName}]`);
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);
  instrumentationService.createCounter('http.server.requests').add(1);

  const locale = getLocale(request);
  const routes = Object.values(routerContext.routeModules);
  const i18n = await initI18n(locale, getNamespaces(routes));
  const nonce = randomHexString(32);

  return await new Promise((resolve, reject) => {
    const userAgent = request.headers.get('user-agent');

    // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
    // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
    const readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode //
        ? 'onAllReady'
        : 'onShellReady';

    let shellRendered = false;

    const { pipe, abort } = renderToPipeableStream(
      <I18nextProvider i18n={i18n}>
        <NonceProvider nonce={nonce}>
          <ServerRouter context={routerContext} url={request.url} nonce={nonce} />
        </NonceProvider>
      </I18nextProvider>,
      {
        [readyOption]() {
          shellRendered = true;

          // @see: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
          responseHeaders.set('Content-Type', 'text/html');
          responseHeaders.set('Content-Security-Policy', generateContentSecurityPolicy(nonce));

          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          resolve(new Response(stream, { headers: responseHeaders, status: responseStatusCode }));

          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          // eslint-disable-next-line no-param-reassign
          responseStatusCode = 500;

          // Log streaming rendering errors from inside the shell. Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            log.error('Error while rendering react element', error);
          }
        },
        nonce,
      },
    );

    // Abort the streaming render pass after 11 seconds
    // to allow the rejected boundaries to be flushed
    // see: https://reactrouter.com/explanation/special-files#streamtimeout
    setTimeout(abort, 10_000);
  });
}
