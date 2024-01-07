import type { EntryContext } from '@remix-run/node';
import { createReadableStreamFromReadable } from '@remix-run/node';
import { RemixServer } from '@remix-run/react';

import { createInstance } from 'i18next';
import I18NexFsBackend from 'i18next-fs-backend';
import { isbot } from 'isbot';
import crypto from 'node:crypto';
import { resolve } from 'node:path';
import { PassThrough } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { NonceProvider } from '~/components/nonce-context';
import { getNamespaces } from '~/utils/locale-utils';
import { createLangCookie, getLocale } from '~/utils/locale-utils.server';

const ABORT_DELAY = 5_000;

/**
 * Generate a strict CSP.
 *
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
 */
function generateContentSecurityPolicy(nonce: string) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return [
    // prettier-ignore
    `base-uri 'none'`,
    `default-src 'none'`,
    `connect-src 'self'` + (isDevelopment ? ' ws://localhost:3001' : ''),
    `font-src 'self' fonts.gstatic.com`,
    `img-src 'self'`,
    `script-src 'strict-dynamic' 'nonce-${nonce}'`,
    `style-src 'self'`,
  ].join('; ');
}

export default async function handleRequest(request: Request, responseStatusCode: number, responseHeaders: Headers, remixContext: EntryContext) {
  const handlerFnName = isbot(request.headers.get('user-agent')) ? 'onAllReady' : 'onShellReady';
  const i18n = createInstance();
  const langCookie = createLangCookie();
  const locale = (await getLocale(request)) ?? 'en';
  const nonce = crypto.randomBytes(32).toString('hex');

  await i18n
    .use(initReactI18next)
    .use(I18NexFsBackend)
    .init({
      backend: { loadPath: resolve('./public/locales/{{lng}}/{{ns}}.json') },
      fallbackLng: false,
      interpolation: { escapeValue: false },
      lng: locale,
      ns: getNamespaces(remixContext.routeModules),
    });

  // @see: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
  responseHeaders.set('Content-Security-Policy', generateContentSecurityPolicy(nonce));
  responseHeaders.set('Content-Type', 'text/html; charset=UTF-8');
  responseHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  responseHeaders.set('Set-Cookie', await langCookie.serialize(locale));
  responseHeaders.set('X-Content-Type-Options', 'nosniff');
  responseHeaders.set('X-Frame-Options', 'deny');

  return new Promise((resolve, reject) => {
    let shellRendered = false;

    const { pipe, abort } = renderToPipeableStream(
      <I18nextProvider i18n={i18n}>
        <NonceProvider nonce={nonce}>
          <RemixServer context={remixContext} url={request.url} abortDelay={ABORT_DELAY} />
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

    setTimeout(abort, ABORT_DELAY);
  });
}
