/**
 * By default, Remix will handle generating the HTTP Response for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.server
 */

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

import { getLocale, getNamespaces } from '~/utils/locale-utils';

const ABORT_DELAY = 5_000;

export default async function handleRequest(request: Request, responseStatusCode: number, responseHeaders: Headers, remixContext: EntryContext) {
  await createInstance()
    .use(initReactI18next)
    .use(I18NexFsBackend)
    .init({
      backend: {
        loadPath: resolve('./public/locales/{{lng}}/{{ns}}.json')
      },
      debug: process.env.NODE_ENV === 'development',
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      lng: getLocale(request.url),
      ns: getNamespaces(remixContext.routeModules),
      supportedLngs: ['en', 'fr'],
    });
    
  const handlerFnName = isbot(request.headers.get('user-agent')) ? 'onAllReady' : 'onShellReady';

  return new Promise((resolve, reject) => {
    let shellRendered = false;

    const { pipe, abort } = renderToPipeableStream(
      <RemixServer context={remixContext} url={request.url} abortDelay={ABORT_DELAY} />,
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
