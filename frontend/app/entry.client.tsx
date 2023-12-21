/* eslint-disable import/no-named-as-default-member */

/**
 * By default, Remix will handle hydrating your app on the client for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.client
 */
import { StrictMode, startTransition } from 'react';

import { RemixBrowser } from '@remix-run/react';

import i18n from 'i18next';
import I18nextBrowserLanguageDetector from 'i18next-browser-languagedetector';
import I18NextHttpBackend from 'i18next-http-backend';
import { hydrateRoot } from 'react-dom/client';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { getLocale, getNamespaces } from '~/utils/locale-utils';

function hydrate() {
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <I18nextProvider i18n={i18n}>
          <RemixBrowser />
        </I18nextProvider>
      </StrictMode>,
    );
  });
}

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .use(I18nextBrowserLanguageDetector)
    .use(I18NextHttpBackend)
    .init({
      detection: { order: ['path'] },
      fallbackLng: getLocale(window.location.href),
      interpolation: { escapeValue: false },
      lng: getLocale(window.location.href),
      ns: getNamespaces(window.__remixRouteModules),
    })
    .then(() => {
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(hydrate);
      } else {
        // Safari doesn't support requestIdleCallback
        // https://caniuse.com/requestidlecallback
        setTimeout(hydrate, 1);
      }
    });
}
