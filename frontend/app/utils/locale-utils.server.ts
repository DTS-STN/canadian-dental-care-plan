import { redirect } from '@remix-run/node';

import type { Namespace } from 'i18next';
import { createInstance } from 'i18next';
import I18NexFsBackend from 'i18next-fs-backend';
import { resolve } from 'node:path';
import { initReactI18next } from 'react-i18next';

import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('locale-utils.server');

/**
 * Returns a t function that defaults to the language resolved through the request.
 * @see https://www.i18next.com/overview/api#getfixedt
 */
export async function getFixedT<N extends Namespace>(localeOrRequest: 'en' | 'fr' | Request, namespaces: N) {
  const locale = typeof localeOrRequest === 'string' ? localeOrRequest : getLocale(localeOrRequest);
  const i18n = await initI18n(locale, namespaces);
  return i18n.getFixedT(locale, namespaces);
}

/**
 * Retrieves the locale using a deterministic lookup algorithm (URL → cookies → 🤷).
 */
export function getLocale(request: Request): AppLocale {
  const url = new URL(request.url);

  if (url.pathname.startsWith('/en')) {
    log.debug('Locale [en] detected in URL');
    return 'en';
  }

  if (url.pathname.startsWith('/fr')) {
    log.debug('Locale [fr] detected in URL');
    return 'fr';
  }

  log.debug('Epic fail: no locale detected in URL search params or cookies; returning default [en]');
  return 'en';
}

/**
 * Initializes the server instance of i18next.
 * @see https://www.i18next.com/overview/api#createinstance
 */
export async function initI18n<N extends Namespace>(locale: string | undefined, namespaces: N) {
  const { I18NEXT_DEBUG } = getEnv();
  const i18n = createInstance();

  await i18n
    .use(initReactI18next)
    .use(I18NexFsBackend)
    .init({
      appendNamespaceToMissingKey: true,
      debug: I18NEXT_DEBUG,
      defaultNS: false,
      backend: {
        loadPath: resolve('./public/locales/{{lng}}/{{ns}}.json'),
      },
      fallbackLng: false,
      interpolation: {
        escapeValue: false,
      },
      lng: locale,
      ns: namespaces,
      preload: ['en', 'fr'],
    });

  log.debug('i18next initialization complete');
  return i18n;
}

export function redirectWithLocale(request: Request, url: string, init?: number | ResponseInit) {
  const locale = getLocale(request);
  return redirect(`/${locale}${url}`, init);
}
