import type { EntryContext } from '@remix-run/node';
import { createReadableStreamFromReadable } from '@remix-run/node';
import { RemixServer } from '@remix-run/react';

import { isbot } from 'isbot';
import { PassThrough } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';

import { NonceProvider, generateNonce } from '~/components/nonce-context';
import { generateContentSecurityPolicy } from '~/utils/csp.server';
import { getNamespaces } from '~/utils/locale-utils';
import { createLangCookie, getLocale, initI18n } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';

const abortDelay = 5_000;
const log = getLogger('entry.server');

export default async function handleRequest(request: Request, responseStatusCode: number, responseHeaders: Headers, remixContext: EntryContext) {
  const handlerFnName = isbot(request.headers.get('user-agent')) ? 'onAllReady' : 'onShellReady';
  log.debug(`Handling [${request.method}] request to [${request.url}] with handler function [${handlerFnName}]`);

  const locale = (await getLocale(request)) ?? 'en';
  const langCookie = await createLangCookie().serialize(locale);
  const i18n = await initI18n(locale, getNamespaces(remixContext.routeModules));

  const nonce = generateNonce(32);
  const contentSecurityPolicy = generateContentSecurityPolicy(nonce);

  // @see: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
  responseHeaders.set('Content-Security-Policy', contentSecurityPolicy);
  responseHeaders.set('Content-Type', 'text/html; charset=UTF-8');
  responseHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  responseHeaders.set('Set-Cookie', langCookie);
  responseHeaders.set('X-Content-Type-Options', 'nosniff');
  responseHeaders.set('X-Frame-Options', 'deny');

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
