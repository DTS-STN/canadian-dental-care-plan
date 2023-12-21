/**
 * By default, Remix will handle generating the HTTP Response for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.server
 */

import * as crypto from 'node:crypto';
import { resolve } from 'node:path';
import { PassThrough } from 'node:stream';

import type { EntryContext } from '@remix-run/node';
import { createReadableStreamFromReadable } from '@remix-run/node';
import { RemixServer } from '@remix-run/react';
import isbot from 'isbot';
import { renderToPipeableStream } from 'react-dom/server';

import { createInstance } from 'i18next';
import I18NexFsBackend from 'i18next-fs-backend';
import { initReactI18next } from 'react-i18next';

import { NonceContext } from '~/components/nonce-context';
import { getLocale, getNamespaces } from '~/utils/locale-utils';

const ABORT_DELAY = 5_000;

/**
 * Generate a strict CSP.
 *
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
 */
function generateContentSecurityPolicy(nonce: string) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return [
    `base-uri 'none'`,
    `default-src 'none'`,
    `connect-src 'self'` + (isDevelopment && ' ws://localhost:3001'),
    `script-src 'strict-dynamic' 'nonce-${nonce}'`,
    `style-src 'self'`,
  ].join('; ');
}

export default async function handleRequest(request: Request, responseStatusCode: number, responseHeaders: Headers, remixContext: EntryContext) {
  await createInstance()
    .use(initReactI18next)
    .use(I18NexFsBackend)
    .init({
      backend: { loadPath: resolve('./public/locales/{{lng}}/{{ns}}.json') },
      fallbackLng: getLocale(request.url),
      interpolation: { escapeValue: false },
      lng: getLocale(request.url),
      ns: getNamespaces(remixContext.routeModules),
    });
    
  const handlerFnName = isbot(request.headers.get('user-agent')) ? 'onAllReady' : 'onShellReady';
  const nonce = crypto.randomBytes(32).toString('hex');

  // @see: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
  responseHeaders.set('Content-Security-Policy', generateContentSecurityPolicy(nonce));
  responseHeaders.set('Content-Type', 'text/html; charset=UTF-8');  
  responseHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  responseHeaders.set('X-Content-Type-Options', 'nosniff');
  responseHeaders.set('X-Frame-Options', 'deny');

  return new Promise((resolve, reject) => {
    let shellRendered = false;

    const { pipe, abort } = renderToPipeableStream(
      <NonceContext.Provider value={{ nonce }}>
        <RemixServer context={remixContext} url={request.url} abortDelay={ABORT_DELAY} />
      </NonceContext.Provider>,
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
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
