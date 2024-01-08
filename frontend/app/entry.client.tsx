/**
 * By default, Remix will handle hydrating your app on the client for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.client
 */
import { StrictMode, startTransition } from 'react';

import { RemixBrowser } from '@remix-run/react';

import { hydrateRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';

import { getNamespaces, initI18n } from '~/utils/locale-utils';

async function hydrate() {
  const routes = Object.values(window.__remixRouteModules);
  const i18n = await initI18n(getNamespaces(routes));

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

if (typeof requestIdleCallback === 'function') {
  requestIdleCallback(hydrate);
} else {
  // Safari doesn't support requestIdleCallback
  // https://caniuse.com/requestidlecallback
  setTimeout(hydrate, 1);
}
